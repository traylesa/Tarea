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

function _generarIdEntidad() {
  return 'ent_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

/**
 * Crea entidad. Auto-genera ID si no viene.
 * Rechaza duplicado por CIF si se proporciona.
 */
function crearEntidad(datos) {
  if (!datos.nombre) throw new Error('nombre es requerido');

  // Validar CIF unico si viene
  if (datos.cif) {
    var existente = buscarEntidadPorCif(datos.cif);
    if (existente) throw new Error('Ya existe entidad con CIF: ' + datos.cif);
  }

  var hoja = _obtenerHojaEntidades();
  var ahora = new Date().toISOString();
  var fila = [
    datos.id || _generarIdEntidad(),
    datos.nombre,
    datos.tipo || '',
    datos.cif || '',
    datos.direccion || '',
    datos.activa !== undefined ? datos.activa : true,
    ahora
  ];
  hoja.appendRow(fila);
  return _filaAEntidad(fila);
}

function leerEntidades() {
  var hoja = _obtenerHojaEntidades();
  if (!hoja) return [];
  var filas = hoja.getDataRange().getValues();
  return filas.slice(1).map(_filaAEntidad);
}

function obtenerEntidad(id) {
  var filas = _obtenerHojaEntidades().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === id) return _filaAEntidad(filas[i]);
  }
  return null;
}

/**
 * Busca entidad por CIF (case-insensitive, sin guiones).
 */
function buscarEntidadPorCif(cif) {
  if (!cif) return null;
  var limpio = cif.replace(/[-\s]/g, '').toUpperCase();
  var filas = _obtenerHojaEntidades().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    var cifFila = String(filas[i][3] || '').replace(/[-\s]/g, '').toUpperCase();
    if (cifFila && cifFila === limpio) return _filaAEntidad(filas[i]);
  }
  return null;
}

/**
 * Busca entidades por nombre parcial (case-insensitive).
 */
function buscarEntidades(texto) {
  var lower = texto.toLowerCase();
  var filas = _obtenerHojaEntidades().getDataRange().getValues();
  return filas.slice(1)
    .filter(function(f) { return String(f[1]).toLowerCase().indexOf(lower) !== -1; })
    .map(_filaAEntidad);
}

if (typeof module !== 'undefined') {
  module.exports = {
    crearEntidad, leerEntidades, obtenerEntidad,
    buscarEntidadPorCif, buscarEntidades, _generarIdEntidad
  };
}
