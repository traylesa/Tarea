# Skill: Envios Programados

**Proposito**: Guia para el sistema de cola de envios programados: creacion, edicion, envio manual/automatico, horario laboral y sincronizacion con GAS.

**Version**: 1.1.0 | **Ultima actualizacion**: 2026-02-21

---

## Contexto del Proyecto

TareaLog permite programar envios de email para una fecha/hora futura. Los envios se almacenan en hoja PROGRAMADOS de Google Sheets y se procesan automaticamente por un trigger GAS cada 5 minutos (solo en horario laboral).

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/scheduled.js` | Logica pura: estados, filtrado, ordenacion, validacion (sin DOM) |
| `src/extension/panel-programados.js` | UI: panel colapsable, tabla, botones accion, horario |
| `src/extension/panel.js` | Integra boton programados + icono en columna tabla |
| `src/gas/Codigo.js` | Endpoints: programarEnvio, cancelar, editar, enviarAhora, getProgramados |
| `src/gas/AdaptadorHojas.js` | CRUD hoja PROGRAMADOS (guardar, leer, actualizar) |
| `src/gas/Configuracion.js` | HEADERS_PROGRAMADOS, HOJA_PROGRAMADOS, horario laboral |
| `tests/TDD/unit/test_scheduled.js` | Tests unitarios logica pura |

### Referencia: `docs/DICCIONARIO_DOMINIO.md`

Consultar seccion **programados** para campos y estados.

---

## Implementacion Principal

### Ciclo de Vida de un Envio Programado

```
PENDIENTE → ENVIADO   (trigger automatico o "Enviar ahora")
PENDIENTE → CANCELADO (usuario cancela)
PENDIENTE → ERROR     (fallo de envio)
```

Solo los `PENDIENTE` son editables y cancelables.

### Estructura de Registro (hoja PROGRAMADOS)

```javascript
// Configuracion.js
const HEADERS_PROGRAMADOS = [
  'id', 'threadId', 'interlocutor', 'asunto', 'cuerpo',
  'cc', 'bcc', 'fechaProgramada', 'estado',
  'fechaEnvio', 'errorDetalle', 'creadoPor', 'creadoAt'
];
```

### Endpoints GAS

| Metodo | Action | Descripcion |
|--------|--------|-------------|
| GET | `getProgramados` | Lista todos los programados |
| GET | `getHorarioLaboral` | Horario laboral actual |
| POST | `programarEnvio` | Crea nuevo programado |
| POST | `cancelarProgramado` | Cancela (solo PENDIENTE) |
| POST | `actualizarProgramadoCampos` | Edita campos (solo PENDIENTE) |
| POST | `enviarProgramadoAhora` | Envio inmediato (solo PENDIENTE) |
| POST | `guardarHorarioLaboral` | Configura dias y horas |
| POST | `configurarEstadoInicial` | Configura estado para emails nuevos |

### Horario Laboral

```javascript
// Solo se procesan envios automaticos dentro del horario
var HORARIO_LABORAL_DEFAULT = {
  dias: [1, 2, 3, 4, 5],  // lunes=1 a viernes=5
  horaInicio: 7,
  horaFin: 21
};
```

El trigger `ejecutarBarridoProgramado` (cada 5 min) llama a `_procesarColaProgramados()` que verifica `estaEnHorarioLaboral()` antes de enviar.

---

## Patrones Recomendados

### Patron 1: Logica Pura en scheduled.js

```javascript
// Toda la logica de filtrado/validacion es pura (sin DOM, sin fetch)
function validarEdicionProgramado(cambios) {
  var claves = Object.keys(cambios);
  for (var i = 0; i < claves.length; i++) {
    if (CAMPOS_EDITABLES_PROG.indexOf(claves[i]) === -1) {
      return { valido: false, error: 'Campo no editable: ' + claves[i] };
    }
  }
  return { valido: true };
}
// CAMPOS_EDITABLES_PROG = ['asunto', 'cuerpo', 'cc', 'bcc', 'fechaProgramada']
```

### Patron 2: Rate Limiting en Cola

```javascript
// Codigo.js — _procesarColaProgramados respeta rate limit
var epm = parseInt(props.getProperty('EMAILS_POR_MINUTO') || '10', 10);
var pausaMs = Math.ceil(60000 / Math.min(Math.max(epm, 1), 30));
// Pausa entre envios + limite de 20 por ejecucion
```

### Patron 3: Creacion desde Reglas

Las reglas con `tipo: 'PRESELECCIONAR_PLANTILLA'` pueden incluir `programarEnvio: true` en params para que el envio se programe en vez de enviarse inmediatamente:

```javascript
// Regla default_solicitar_docs:
{ tipo: 'PRESELECCIONAR_PLANTILLA', params: {
  nombrePlantilla: 'Solicitud docs descarga',
  programarEnvio: true,
  horaDefault: '09:00'
}}
```

---

## Errores Comunes a Evitar

### Error 1: Enviar fuera de horario

El trigger procesa la cola solo en horario laboral. Si necesitas envio inmediato fuera de horario, usa "Enviar ahora" (endpoint `enviarProgramadoAhora`), que NO verifica horario.

### Error 2: Editar programado ya enviado

```javascript
// Siempre verificar estado antes de editar/cancelar
if (prog.estado !== 'PENDIENTE') {
  return respuestaError('Solo se pueden editar envios PENDIENTE');
}
```

---

## Consideraciones para Agentes

1. **Antes de modificar**: Leer `scheduled.js` + `panel-programados.js` + endpoints en `Codigo.js`
2. **Durante implementacion**: Mantener dual-compat en `scheduled.js`, DOM solo en `panel-programados.js`
3. **Despues de cambios**: Ejecutar `npx jest tests/TDD/unit/test_scheduled.js`
4. **Precauciones**: No modificar `HEADERS_PROGRAMADOS` sin considerar auto-sync de headers en hoja

---

## Tests

```bash
npx jest tests/TDD/unit/test_scheduled.js --no-coverage
```

Cubren: estados, filtrado, ordenacion, validacion edicion, busqueda por thread.

---

## Referencias

- **Deploy GAS**: `.claude/skills/gas-deploy.md` (clasp push/deploy)
- **Sheets CRUD**: `.claude/skills/sheets-database.md` (AdaptadorHojas, auto-sync headers)
- **Reglas**: `.claude/skills/motor-reglas-acciones.md` (PRESELECCIONAR_PLANTILLA con programarEnvio)
- **Config horario**: `.claude/skills/sistema-configuracion.md` (sincronizacion GAS)

---

**Generada automaticamente por /genera-skills**
