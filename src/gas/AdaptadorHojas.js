// === TareaLog — AdaptadorHojas (CRUD sobre Google Sheets) ===

function obtenerHoja(nombre) {
  const ss = SpreadsheetApp.openById(obtenerSpreadsheetId());
  const hoja = ss.getSheetByName(nombre);
  var headersEsperados = HEADERS_SEGUIMIENTO;
  if (nombre === HOJA_HILOS) headersEsperados = HEADERS_HILOS;
  else if (nombre === HOJA_PROGRAMADOS) headersEsperados = HEADERS_PROGRAMADOS;

  if (!hoja) {
    const nueva = ss.insertSheet(nombre);
    nueva.getRange(1, 1, 1, headersEsperados.length).setValues([headersEsperados]);
    return nueva;
  }

  _sincronizarHeaders(hoja, headersEsperados);
  return hoja;
}

function _sincronizarHeaders(hoja, headersEsperados) {
  const primeraFila = hoja.getRange(1, 1, 1, hoja.getLastColumn() || 1).getValues()[0];
  const actuales = primeraFila.filter(function(h) { return h !== ''; });

  if (actuales.length === 0) {
    hoja.getRange(1, 1, 1, headersEsperados.length).setValues([headersEsperados]);
    return;
  }

  if (actuales.length >= headersEsperados.length) return;

  var nuevos = headersEsperados.filter(function(h) { return actuales.indexOf(h) === -1; });
  if (nuevos.length === 0) return;

  var col = actuales.length + 1;
  hoja.getRange(1, col, 1, nuevos.length).setValues([nuevos]);
}

function leerRegistros() {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  const datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  const headers = datos[0];
  return datos.slice(1).map(function(fila) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = fila[i]; });
    return obj;
  });
}

function guardarRegistro(registro) {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  const fila = HEADERS_SEGUIMIENTO.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
}

function actualizarCampo(messageId, campo, valor) {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  const datos = hoja.getDataRange().getValues();
  const colId = datos[0].indexOf('messageId');
  const colCampo = datos[0].indexOf(campo);
  if (colId === -1 || colCampo === -1) return;

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === messageId) {
      hoja.getRange(i + 1, colCampo + 1).setValue(valor);
      return;
    }
  }
}

function leerHilos() {
  const hoja = obtenerHoja(HOJA_HILOS);
  const datos = hoja.getDataRange().getValues();
  const mapa = {};

  for (var i = 1; i < datos.length; i++) {
    mapa[datos[i][0]] = datos[i][1];
  }
  return mapa;
}

function obtenerIdsYaProcesados() {
  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  var colId = datos[0].indexOf('messageId');
  if (colId === -1) return [];

  var ids = [];
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId]) ids.push(String(datos[i][colId]));
  }
  return ids;
}

function guardarHilo(threadId, codCar) {
  const hoja = obtenerHoja(HOJA_HILOS);
  const datos = hoja.getDataRange().getValues();
  const ahora = new Date().toISOString();

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][0] === threadId) {
      hoja.getRange(i + 1, 2).setValue(codCar);
      hoja.getRange(i + 1, 3).setValue(ahora);
      return;
    }
  }
  hoja.appendRow([threadId, codCar, ahora]);
}

// --- CRUD Programados ---

function guardarProgramado(registro) {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var fila = HEADERS_PROGRAMADOS.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
}

function leerProgramadosPendientes() {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  var headers = datos[0];
  var colEstado = headers.indexOf('estado');
  var colFecha = headers.indexOf('fechaProgramada');
  var ahora = new Date();
  var pendientes = [];

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colEstado] !== 'PENDIENTE') continue;
    var fechaProg = new Date(datos[i][colFecha]);
    if (fechaProg > ahora) continue;

    var obj = { _fila: i + 1 };
    headers.forEach(function(h, j) { obj[h] = datos[i][j]; });
    pendientes.push(obj);
  }
  return pendientes;
}

function actualizarProgramado(fila, campo, valor) {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var col = HEADERS_PROGRAMADOS.indexOf(campo);
  if (col === -1) return;
  hoja.getRange(fila, col + 1).setValue(valor);
}

function leerTodosProgramados() {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  var headers = datos[0];
  return datos.slice(1).map(function(fila) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = fila[i]; });
    return obj;
  });
}
