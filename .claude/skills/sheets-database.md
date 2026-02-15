# Skill: Google Sheets como Base de Datos

**Proposito**: Patrones CRUD sobre Google Sheets via GAS, incluyendo auto-sync de headers, hojas dinamicas y consultas por fila.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-15

---

## Contexto del Proyecto

TareaLog usa 3 hojas de Google Sheets como backend:
- **SEGUIMIENTO**: Registros principales (28 columnas, ~500 filas/mes)
- **DB_HILOS**: Cache threadId→codCar (3 columnas)
- **PROGRAMADOS**: Cola de envios programados (13 columnas)

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

  // Seleccionar headers segun hoja
  var headersEsperados = HEADERS_SEGUIMIENTO;
  if (nombre === HOJA_HILOS) headersEsperados = HEADERS_HILOS;
  else if (nombre === HOJA_PROGRAMADOS) headersEsperados = HEADERS_PROGRAMADOS;

  // Auto-crear hoja si no existe
  if (!hoja) {
    var nueva = ss.insertSheet(nombre);
    nueva.getRange(1, 1, 1, headersEsperados.length).setValues([headersEsperados]);
    return nueva;
  }

  // Auto-sync: anadir columnas nuevas sin perder datos
  _sincronizarHeaders(hoja, headersEsperados);
  return hoja;
}
```

**Ventajas**:
- Hoja se crea automaticamente al primer acceso
- Columnas nuevas se anaden sin romper datos existentes
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

### READ con filtro + numero de fila

```javascript
// Para actualizaciones posteriores, incluir _fila
function leerProgramadosPendientes() {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var datos = hoja.getDataRange().getValues();
  var pendientes = [];

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colEstado] !== 'PENDIENTE') continue;
    var obj = { _fila: i + 1 };  // +1 por header
    headers.forEach(function(h, j) { obj[h] = datos[i][j]; });
    pendientes.push(obj);
  }
  return pendientes;
}
```

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
  'zona', 'zDest', 'procesadoAt'
];

const HOJA_PROGRAMADOS = 'PROGRAMADOS';
const HEADERS_PROGRAMADOS = [
  'id', 'threadId', 'interlocutor', 'asunto', 'cuerpo',
  'cc', 'bcc', 'fechaProgramada', 'estado',
  'fechaEnvio', 'errorDetalle', 'creadoPor', 'creadoAt'
];
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

---

## Referencias

- **Diccionario dominio**: `docs/DICCIONARIO_DOMINIO.md` §Hojas, §Campos
- **Arquitectura**: `docs/ARCHITECTURE.md` §Backend GAS
- **Quotas GAS**: https://developers.google.com/apps-script/guides/services/quotas

---

**Generada por /genera-skills**
