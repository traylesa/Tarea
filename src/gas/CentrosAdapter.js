// === TareaLog — CentrosAdapter (Fase B: Datos Maestros) ===

function _obtenerHojaCentros() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName('CENTROS_TRABAJO');
}

function _filaACentro(fila) {
  return {
    id: fila[0], nombre: fila[1], entidadId: fila[2],
    direccion: fila[3], activo: fila[4], creadoAt: fila[5]
  };
}

function crearCentro(datos) {
  var hoja = _obtenerHojaCentros();
  var ahora = new Date().toISOString();
  var fila = [
    datos.id, datos.nombre, datos.entidadId || '',
    datos.direccion || '', true, ahora
  ];
  hoja.appendRow(fila);
  return _filaACentro(fila);
}

function leerCentros() {
  var filas = _obtenerHojaCentros().getDataRange().getValues();
  return filas.slice(1).map(_filaACentro);
}

function obtenerCentro(id) {
  var filas = _obtenerHojaCentros().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === id) return _filaACentro(filas[i]);
  }
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { crearCentro, leerCentros, obtenerCentro };
}
