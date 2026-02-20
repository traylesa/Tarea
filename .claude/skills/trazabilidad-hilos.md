# Skill: Trazabilidad de Hilos (threadId → codCar)

**Proposito**: Documentar el sistema de vinculacion entre hilos de Gmail y codigos de carga, incluyendo cache en memoria, persistencia en Sheets y los 3 flujos de vinculacion.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-16

---

## Contexto del Proyecto

TareaLog procesa emails de Gmail para gestion logistica. Cada hilo (threadId) puede contener multiples mensajes sobre la misma carga (codCar). Sin vinculacion, los mensajes posteriores del mismo hilo pierden trazabilidad y quedan como SIN_VINCULAR.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/gas/ThreadManager.js` | Cache en memoria (Map threadId→codCar) |
| `src/gas/Main.js` | processMessage: logica vinculacion automatica/hilo |
| `src/gas/EmailParser.js` | extractMetadata: extrae codCar de adjuntos |
| `src/gas/Codigo.js` | accionProcesarCorreos, accionVincularManual |
| `src/gas/AdaptadorHojas.js` | leerHilos, guardarHilo, actualizarCodCarPorThread |

---

## ThreadManager (Cache en Memoria)

```javascript
// Patron factory, dual-compat GAS/Node
function createThreadManager() {
  const cache = new Map();
  return {
    mapThreadToLoad(threadId, codCar) { cache.set(threadId, codCar); },
    getLoadFromThread(threadId)       { return threadId ? (cache.get(threadId) ?? null) : null; },
    hasThread(threadId)               { return cache.has(threadId); },
    getAllMappings()                   { return Array.from(cache.entries()).map(([threadId, codCar]) => ({ threadId, codCar })); }
  };
}
```

**Caracteristicas clave**:
- Map() en memoria, se pierde al terminar ejecucion GAS (cada trigger = nueva instancia)
- Se precarga con datos de DB_HILOS al inicio de cada barrido
- getAllMappings() permite detectar vinculaciones nuevas vs existentes

---

## DB_HILOS (Persistencia en Sheets)

Hoja con 3 columnas: `threadId | codCar | timestamp`

| Funcion | Operacion |
|---------|-----------|
| `leerHilos()` | Lee toda la hoja → mapa `{threadId: codCar}` |
| `guardarHilo(threadId, codCar)` | Upsert: actualiza si existe, insert si no |

```javascript
// guardarHilo hace upsert
function guardarHilo(threadId, codCar) {
  var hoja = obtenerHoja(HOJA_HILOS);
  var datos = hoja.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][0] === threadId) {
      hoja.getRange(i + 1, 2).setValue(codCar);  // Update
      hoja.getRange(i + 1, 3).setValue(new Date().toISOString());
      return;
    }
  }
  hoja.appendRow([threadId, codCar, new Date().toISOString()]);  // Insert
}
```

---

## Tipos de Vinculacion

| Tipo | Origen | Cuando |
|------|--------|--------|
| `AUTOMATICA` | Adjunto `Carga_XXXXX.pdf` | extractMetadata encuentra codCar en filename |
| `HILO` | Cache threadManager | Mensaje sin adjunto pero threadId ya mapeado |
| `MANUAL` | Usuario desde UI | accionVincularManual asigna codCar a threadId |
| `SIN_VINCULAR` | Ninguno | No hay adjunto ni threadId conocido |

---

## Flujo 1: Vinculacion Automatica (Barrido)

```
accionProcesarCorreos(body)
  1. hilosMap = leerHilos()                    // DB_HILOS → objeto plano
  2. threadManager = createThreadManager()     // Cache vacio
  3. Precargar cache con hilosMap              // Cache = DB_HILOS
  4. mensajes = obtenerMensajesNuevos()
  5. Por cada mensaje:
     └─ processMessage(msg, threadManager)
        ├─ extractMetadata → codCar de adjunto?
        │  ├─ SI: vinculacion='AUTOMATICA', cache.set(threadId, codCar)
        │  └─ NO: getLoadFromThread(threadId)
        │     ├─ Encontrado: vinculacion='HILO', codCar heredado
        │     └─ No: vinculacion='SIN_VINCULAR'
        └─ guardarRegistro(resultado)          // → SEGUIMIENTO
  6. Persistir vinculaciones NUEVAS:
     vinculacionesNuevas = threadManager.getAllMappings()
     Solo las que NO estaban en hilosMap → guardarHilo()
```

**Paso 6 es CRITICO**: Sin el, las vinculaciones automaticas se pierden entre barridos y mensajes futuros del mismo hilo quedan SIN_VINCULAR.

---

## Flujo 2: Heredancia por Hilo

Ocurre dentro de processMessage cuando el mensaje NO tiene adjunto con codCar:

```javascript
// Main.js — fragmento de processMessage
let codCar = metadata.codCar;               // De adjunto
let vinculacion = codCar ? 'AUTOMATICA' : 'SIN_VINCULAR';

if (codCar) {
  threadManager.mapThreadToLoad(message.threadId, codCar);
} else {
  const cachedCodCar = threadManager.getLoadFromThread(message.threadId);
  if (cachedCodCar) {
    codCar = cachedCodCar;
    vinculacion = 'HILO';                    // Heredado del hilo
  }
}
```

La heredancia funciona tanto intra-barrido (mismo ciclo) como inter-barrido (gracias a la precarga desde DB_HILOS).

---

## Flujo 3: Vinculacion Manual (Usuario)

```
Panel UI → POST ?action=vincularManual {threadId, codCar}
  └─ accionVincularManual(body)
     1. guardarHilo(threadId, codCar)              // DB_HILOS (upsert)
     2. actualizarCodCarPorThread(threadId, codCar) // SEGUIMIENTO (batch)
```

`actualizarCodCarPorThread` recorre TODAS las filas de SEGUIMIENTO con ese threadId:
- Actualiza codCar al nuevo valor
- Si vinculacion era `SIN_VINCULAR`, cambia a `MANUAL`
- Registros con vinculacion `AUTOMATICA` o `HILO` mantienen su tipo

---

## Extraccion de codCar (EmailParser.js)

```javascript
const CARGA_REGEX = /carga_0*(\d+)\.pdf/i;

function extractCodCarFromFilename(filename) {
  var match = filename.match(CARGA_REGEX);
  return match ? parseInt(match[1], 10) : null;
}
```

Ejemplos: `Carga_00012345.pdf` → `12345`, `carga_789.pdf` → `789`

---

## Bug Historico Corregido

**Problema**: Antes de la correccion, `accionProcesarCorreos` NO ejecutaba el paso 6 (persistir vinculaciones nuevas). Las vinculaciones AUTOMATICAS se guardaban en cache pero nunca llegaban a DB_HILOS.

**Consecuencia**: En el siguiente barrido, el cache arrancaba sin esas vinculaciones. Mensajes nuevos del mismo hilo (sin adjunto) no heredaban codCar y quedaban SIN_VINCULAR.

**Solucion**: Agregar comparacion `getAllMappings()` vs `hilosMap` y persistir las diferencias con `guardarHilo()` (lineas 98-104 de Codigo.js).

---

## Consideraciones para Agentes

1. **Nunca modificar ThreadManager** sin actualizar tambien el flujo de persistencia en Codigo.js
2. **DB_HILOS crece monotonamente**: no hay limpieza automatica (evaluar si >10K filas)
3. **Un threadId → un codCar**: si un hilo tiene multiples cargas, solo la ultima gana
4. **Tests**: ThreadManager tiene tests en `tests/TDD/unit/` (dual-compat)
5. **Diccionario**: Los campos `threadId`, `codCar`, `vinculacion` estan en `docs/DICCIONARIO_DOMINIO.md`

---

## Referencias

- **Diccionario dominio**: `docs/DICCIONARIO_DOMINIO.md` §Campos, §Estados
- **Sheets como DB**: `.claude/skills/sheets-database.md`
- **Dual-compat**: `.claude/skills/dual-compat-modules.md`
- **Arquitectura**: `docs/ARCHITECTURE.md` §Backend GAS

---

**Generada manualmente | Skill critica para trazabilidad**
