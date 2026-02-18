// === TareaLog — AdaptadorHojas (CRUD sobre Google Sheets) ===

function obtenerHoja(nombre) {
  const ss = SpreadsheetApp.openById(obtenerSpreadsheetId());
  const hoja = ss.getSheetByName(nombre);
  var headersEsperados = HEADERS_SEGUIMIENTO;
  if (nombre === HOJA_HILOS) headersEsperados = HEADERS_HILOS;
  else if (nombre === HOJA_PROGRAMADOS) headersEsperados = HEADERS_PROGRAMADOS;
  else if (nombre === HOJA_NOTAS) headersEsperados = HEADERS_NOTAS;
  else if (nombre === HOJA_RECORDATORIOS) headersEsperados = HEADERS_RECORDATORIOS;
  else if (nombre === HOJA_HISTORIAL) headersEsperados = HEADERS_HISTORIAL;

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
    // Normalizar fase: Sheets puede convertir "00" en numero 0
    if (obj.fase !== undefined && obj.fase !== '') {
      obj.fase = String(obj.fase).padStart(2, '0');
    }
    return obj;
  });
}

/**
 * Normaliza valores antes de grabar en Sheets.
 * Fase debe ser string con padding 2 digitos (ej: "00", "05").
 */
function _normalizarValorCampo(campo, valor) {
  if (campo === 'fase' && valor !== undefined && valor !== '') {
    return String(valor).padStart(2, '0');
  }
  return valor;
}

function guardarRegistro(registro) {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  // Normalizar fase antes de grabar
  if (registro.fase !== undefined && registro.fase !== '') {
    registro.fase = String(registro.fase).padStart(2, '0');
  }
  const fila = HEADERS_SEGUIMIENTO.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
  // Forzar formato texto en columna fase de la fila recien añadida
  var idxFase = HEADERS_SEGUIMIENTO.indexOf('fase');
  if (idxFase !== -1) {
    var ultimaFila = hoja.getLastRow();
    hoja.getRange(ultimaFila, idxFase + 1).setNumberFormat('@');
  }
}

function actualizarCampo(messageId, campo, valor) {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  const datos = hoja.getDataRange().getValues();
  const colId = datos[0].indexOf('messageId');
  const colCampo = datos[0].indexOf(campo);
  if (colId === -1 || colCampo === -1) return;

  var valorNormalizado = _normalizarValorCampo(campo, valor);
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === messageId) {
      var celda = hoja.getRange(i + 1, colCampo + 1);
      celda.setNumberFormat('@');
      celda.setValue(valorNormalizado);
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

// --- CRUD Notas ---

function _leerHojaGenerica(nombreHoja, headersRef) {
  var hoja = obtenerHoja(nombreHoja);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];
  var headers = datos[0];
  return datos.slice(1).map(function(fila) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = fila[i]; });
    return obj;
  });
}

function _guardarFilaGenerica(nombreHoja, headersRef, registro) {
  var hoja = obtenerHoja(nombreHoja);
  var fila = headersRef.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
}

function _eliminarFilaPorId(nombreHoja, id) {
  var hoja = obtenerHoja(nombreHoja);
  var datos = hoja.getDataRange().getValues();
  var colId = datos[0].indexOf('id');
  if (colId === -1) return false;
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]) === String(id)) {
      hoja.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function leerNotas() {
  return _leerHojaGenerica(HOJA_NOTAS, HEADERS_NOTAS);
}

function guardarNota(registro) {
  _guardarFilaGenerica(HOJA_NOTAS, HEADERS_NOTAS, registro);
}

function eliminarNotaGAS(id) {
  return _eliminarFilaPorId(HOJA_NOTAS, id);
}

// --- CRUD Recordatorios ---

function leerRecordatoriosGAS() {
  return _leerHojaGenerica(HOJA_RECORDATORIOS, HEADERS_RECORDATORIOS);
}

function guardarRecordatorioGAS(registro) {
  _guardarFilaGenerica(HOJA_RECORDATORIOS, HEADERS_RECORDATORIOS, registro);
}

function eliminarRecordatorioGAS(id) {
  return _eliminarFilaPorId(HOJA_RECORDATORIOS, id);
}

function actualizarRecordatorioEstado(id, nuevoEstado) {
  var hoja = obtenerHoja(HOJA_RECORDATORIOS);
  var datos = hoja.getDataRange().getValues();
  var colId = datos[0].indexOf('id');
  var colEstado = datos[0].indexOf('estado');
  if (colId === -1 || colEstado === -1) return false;
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]) === String(id)) {
      hoja.getRange(i + 1, colEstado + 1).setValue(nuevoEstado);
      return true;
    }
  }
  return false;
}

// --- CRUD Historial ---

function leerHistorial() {
  return _leerHojaGenerica(HOJA_HISTORIAL, HEADERS_HISTORIAL);
}

function guardarEntradaHistorial(registro) {
  _guardarFilaGenerica(HOJA_HISTORIAL, HEADERS_HISTORIAL, registro);
}

/**
 * Actualiza el codCar de todas las filas en SEGUIMIENTO que pertenecen a un threadId.
 * Usado al vincular manualmente para reflejar el cambio inmediatamente en la tabla.
 */
function actualizarCodCarPorThread(threadId, codCar) {
  const hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  const datos = hoja.getDataRange().getValues();
  const headers = datos[0];

  const idxThread = headers.indexOf('threadId');
  const idxCodCar = headers.indexOf('codCar');
  const idxVinc = headers.indexOf('vinculacion');

  if (idxThread === -1 || idxCodCar === -1 || idxVinc === -1) {
    throw new Error('Headers threadId/codCar/vinculacion no encontrados en SEGUIMIENTO');
  }

  var filasActualizadas = 0;
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][idxThread] === threadId) {
      hoja.getRange(i + 1, idxCodCar + 1).setValue(codCar);
      if (datos[i][idxVinc] === 'SIN_VINCULAR') {
        hoja.getRange(i + 1, idxVinc + 1).setValue('MANUAL');
      }
      filasActualizadas++;
    }
  }

  Logger.log('actualizarCodCarPorThread: ' + filasActualizadas + ' filas actualizadas');
}

/**
 * Actualiza un campo en todas las filas de SEGUIMIENTO que pertenecen a un threadId.
 * Usado para propagar cambios de fase/estado a todo el hilo.
 */
function actualizarCampoPorThread(threadId, campo, valor) {
  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var datos = hoja.getDataRange().getValues();
  var headers = datos[0];

  var idxThread = headers.indexOf('threadId');
  var idxCampo = headers.indexOf(campo);

  if (idxThread === -1 || idxCampo === -1) {
    throw new Error('Header threadId o ' + campo + ' no encontrado en SEGUIMIENTO');
  }

  var valorNormalizado = _normalizarValorCampo(campo, valor);
  var filasActualizadas = 0;
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][idxThread] === threadId) {
      var celda = hoja.getRange(i + 1, idxCampo + 1);
      celda.setNumberFormat('@');
      celda.setValue(valorNormalizado);
      filasActualizadas++;
    }
  }
  Logger.log('actualizarCampoPorThread(' + campo + '): ' + filasActualizadas + ' filas');
}
