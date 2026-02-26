# Skill: Google Sheets como Base de Datos

**Proposito**: Patrones CRUD sobre Google Sheets via GAS, incluyendo auto-sync de headers, hojas dinamicas y consultas por fila.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

TareaLog usa 6 hojas de Google Sheets como backend:
- **SEGUIMIENTO**: Registros principales (29 columnas, ~500 filas/mes)
- **DB_HILOS**: Cache threadId→codCar (3 columnas)
- **PROGRAMADOS**: Cola de envios programados (13 columnas)
- **NOTAS**: Notas rapidas por carga (5 columnas)
- **RECORDATORIOS**: Recordatorios con snooze (8 columnas)
- **HISTORIAL**: Historial de acciones por carga (5 columnas)

La hoja se selecciona dinamicamente desde la extension (PropertiesService).

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/gas/AdaptadorHojas.js` | CRUD sobre Sheets (unico punto de acceso) |
| `src/gas/Configuracion.js` | Headers, nombres de hojas, constantes |

---

## Patron Central: obtenerHoja con Auto-Sync

```javascript
function obtenerHoja(nombre) {
  var ss = SpreadsheetApp.openById(obtenerSpreadsheetId());
  var hoja = ss.getSheetByName(nombre);

  var headersEsperados = HEADERS_SEGUIMIENTO;
  if (nombre === HOJA_HILOS) headersEsperados = HEADERS_HILOS;
  else if (nombre === HOJA_PROGRAMADOS) headersEsperados = HEADERS_PROGRAMADOS;

  if (!hoja) {
    var nueva = ss.insertSheet(nombre);
    nueva.getRange(1, 1, 1, headersEsperados.length).setValues([headersEsperados]);
    return nueva;
  }

  _sincronizarHeaders(hoja, headersEsperados);
  return hoja;
}
```

**Ventajas**:
- Hoja se crea automaticamente al primer acceso
- `_sincronizarHeaders` anade columnas nuevas sin perder datos existentes
- Un unico punto de acceso garantiza consistencia

---

## Operaciones CRUD

### CREATE: appendRow

```javascript
function guardarRegistro(registro) {
  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var fila = HEADERS_SEGUIMIENTO.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
}
```

### READ: getDataRange → objetos

```javascript
function leerRegistros() {
  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  var headers = datos[0];
  return datos.slice(1).map(function(fila) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = fila[i]; });
    return obj;
  });
}
```

### UPDATE: celda individual por fila

```javascript
function actualizarCampo(messageId, campo, valor) {
  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var datos = hoja.getDataRange().getValues();
  var colId = datos[0].indexOf('messageId');
  var colCampo = datos[0].indexOf(campo);

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === messageId) {
      hoja.getRange(i + 1, colCampo + 1).setValue(valor);
      return;
    }
  }
}
```

### UPDATE generico por ID (PROGRAMADOS)

```javascript
function actualizarProgramadoPorId(id, campos) {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var datos = hoja.getDataRange().getValues();
  var headers = datos[0];
  var colId = headers.indexOf('id');

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === id) {
      Object.keys(campos).forEach(function(campo) {
        var col = headers.indexOf(campo);
        if (col !== -1) hoja.getRange(i + 1, col + 1).setValue(campos[campo]);
      });
      return true;
    }
  }
  return false;
}
```

Acepta cualquier campo que exista en headers, incluyendo `estado` (usado para reactivar ERROR→PENDIENTE).

---

## Definicion de Hojas (Configuracion.js)

```javascript
const HOJA_SEGUIMIENTO = 'SEGUIMIENTO';
const HEADERS_SEGUIMIENTO = [
  'messageId', 'threadId', 'mensajesEnHilo', 'codCar', 'codTra',
  'nombreTransportista', 'emailRemitente', 'emailErp', 'asunto',
  'fechaCorreo', 'tipoTarea', 'estado', 'fase', 'alerta',
  'vinculacion', 'referencia', 'para', 'cc', 'cco', 'interlocutor',
  'cuerpo', 'fCarga', 'hCarga', 'fEntrega', 'hEntrega',
  'zona', 'zDest', 'bandeja', 'procesadoAt'
];
// 29 columnas — incluye bandeja (etiquetas Gmail) y procesadoAt

const HOJA_PROGRAMADOS = 'PROGRAMADOS';
const HEADERS_PROGRAMADOS = [
  'id', 'threadId', 'interlocutor', 'asunto', 'cuerpo',
  'cc', 'bcc', 'fechaProgramada', 'estado',
  'fechaEnvio', 'errorDetalle', 'creadoPor', 'creadoAt'
];
// 13 columnas — errorDetalle guarda motivo del fallo

const HOJA_HILOS = 'DB_HILOS';
const HEADERS_HILOS = ['threadId', 'codCar', 'fechaActualizacion'];

const HOJA_NOTAS = 'NOTAS';
const HEADERS_NOTAS = ['clave', 'id', 'texto', 'fechaCreacion', 'tipo'];

const HOJA_RECORDATORIOS = 'RECORDATORIOS';
const HEADERS_RECORDATORIOS = ['id', 'clave', 'texto', 'asunto', 'fechaDisparo', 'preset', 'origen', 'estado'];

const HOJA_HISTORIAL = 'HISTORIAL';
const HEADERS_HISTORIAL = ['id', 'clave', 'tipo', 'descripcion', 'fechaCreacion'];
```

---

## Limitaciones y Mitigaciones

| Limitacion | Impacto | Mitigacion |
|---|---|---|
| Lectura completa (getDataRange) | Lento con >10K filas | Aceptable para ~500/mes |
| Sin indices | Busqueda lineal O(n) | OK para tamano actual |
| Escritura celda a celda | 1 API call por celda | Agrupar con setValues si masivo |
| Concurrencia | Race conditions | LockService para operaciones criticas |
| Quota | 20K lecturas/dia | Trigger cada 5 min = ~288/dia |

---

## Consideraciones para Agentes

1. **Nueva hoja**: Anadir constantes en `Configuracion.js`, actualizar `obtenerHoja()` en `AdaptadorHojas.js`
2. **Nuevas columnas**: Anadir al array HEADERS; `_sincronizarHeaders` las crea automaticamente
3. **Consultas**: Siempre leer con `getDataRange().getValues()`, nunca con formulas
4. **Concurrencia**: Usar `LockService.getScriptLock()` para operaciones que modifican multiples celdas
5. **Diccionario**: Consultar `docs/DICCIONARIO_DOMINIO.md` antes de crear nombres de columnas
6. **Desplegar**: `clasp push && clasp deploy -i <id>` tras cambiar headers

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Desplegar cambios GAS | `gas-deploy.md` |
| Trazabilidad hilos DB_HILOS | `trazabilidad-hilos.md` |
| Cola PROGRAMADOS | `envios-programados.md` |
| Auto-sync en extension | `chrome-extension-mv3.md` (storage) |
| Diccionario campos | `docs/DICCIONARIO_DOMINIO.md` |

---

**Actualizada**: 2026-02-25 (v1.2.0: HEADERS completos, UPDATE generico PROGRAMADOS)
