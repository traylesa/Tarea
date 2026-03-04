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

function _generarIdCentro() {
  return 'ctr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

/**
 * Crea centro de trabajo. Auto-genera ID si no viene.
 */
function crearCentro(datos) {
  if (!datos.nombre) throw new Error('nombre es requerido');

  var hoja = _obtenerHojaCentros();
  var ahora = new Date().toISOString();
  var fila = [
    datos.id || _generarIdCentro(),
    datos.nombre,
    datos.entidadId || '',
    datos.direccion || '',
    datos.activo !== undefined ? datos.activo : true,
    ahora
  ];
  hoja.appendRow(fila);
  return _filaACentro(fila);
}

function leerCentros() {
  var hoja = _obtenerHojaCentros();
  if (!hoja) return [];
  var filas = hoja.getDataRange().getValues();
  return filas.slice(1).map(_filaACentro);
}

function obtenerCentro(id) {
  var filas = _obtenerHojaCentros().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === id) return _filaACentro(filas[i]);
  }
  return null;
}

/**
 * Retorna centros filtrados por entidadId.
 */
function centrosPorEntidad(entidadId) {
  if (!entidadId) return [];
  var filas = _obtenerHojaCentros().getDataRange().getValues();
  return filas.slice(1)
    .filter(function(f) { return f[2] === entidadId; })
    .map(_filaACentro);
}

if (typeof module !== 'undefined') {
  module.exports = {
    crearCentro, leerCentros, obtenerCentro,
    centrosPorEntidad, _generarIdCentro
  };
}
