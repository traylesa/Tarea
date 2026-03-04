// === TareaLog — EntidadesAdapter (Fase B: Datos Maestros) ===

function _obtenerHojaEntidades() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName('ENTIDADES');
}

function _filaAEntidad(fila) {
  return {
    id: fila[0], nombre: fila[1], tipo: fila[2],
    cif: fila[3], direccion: fila[4], activa: fila[5],
    creadoAt: fila[6]
  };
}

function crearEntidad(datos) {
  var hoja = _obtenerHojaEntidades();
  var ahora = new Date().toISOString();
  var fila = [
    datos.id, datos.nombre, datos.tipo || '',
    datos.cif || '', datos.direccion || '', true, ahora
  ];
  hoja.appendRow(fila);
  return _filaAEntidad(fila);
}

function leerEntidades() {
  var filas = _obtenerHojaEntidades().getDataRange().getValues();
  return filas.slice(1).map(_filaAEntidad);
}

function obtenerEntidad(id) {
  var filas = _obtenerHojaEntidades().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === id) return _filaAEntidad(filas[i]);
  }
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { crearEntidad, leerEntidades, obtenerEntidad };
}
