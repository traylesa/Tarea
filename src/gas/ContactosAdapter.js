// === TareaLog — ContactosAdapter (Fase B: Datos Maestros) ===

var HEADERS_CONTACTOS_IDX = {
  telefono: 0, nombre: 1, email: 2, entidadId: 3,
  centroId: 4, notas: 5, creadoPor: 6, creadoAt: 7
};

/**
 * Normaliza teléfono español: 9 dígitos → +34XXXXXXXXX
 * Lanza error si longitud incorrecta.
 */
function normalizarTelefono(tel) {
  var limpio = String(tel).replace(/\s/g, '');
  if (limpio.startsWith('+34')) {
    if (limpio.length !== 12) throw new Error('Telefono longitud incorrecta');
    return limpio;
  }
  if (limpio.length !== 9) throw new Error('Telefono longitud incorrecta');
  return '+34' + limpio;
}

function _obtenerHojaContactos() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName('CONTACTOS');
}

function _leerFilas() {
  var hoja = _obtenerHojaContactos();
  var todas = hoja.getDataRange().getValues();
  return todas.slice(1); // Sin headers
}

function _filaAObjeto(fila) {
  return {
    telefono: fila[0], nombre: fila[1], email: fila[2],
    entidadId: fila[3], centroId: fila[4], notas: fila[5],
    creadoPor: fila[6], creadoAt: fila[7]
  };
}

/**
 * Crea contacto. Rechaza duplicado por teléfono.
 */
function crearContacto(datos) {
  var tel = normalizarTelefono(datos.telefono);
  var existente = buscarPorTelefono(datos.telefono);
  if (existente) throw new Error('Contacto duplicado por telefono');

  var ahora = new Date().toISOString();
  var fila = [
    tel, datos.nombre || '', datos.email || '',
    datos.entidadId || '', datos.centroId || '',
    datos.notas || '', datos.creadoPor || '', ahora
  ];
  _obtenerHojaContactos().appendRow(fila);
  return _filaAObjeto(fila);
}

/**
 * Busca contacto por teléfono (normaliza antes).
 */
function buscarPorTelefono(tel) {
  var normalizado = normalizarTelefono(tel);
  var filas = _leerFilas();
  for (var i = 0; i < filas.length; i++) {
    if (filas[i][0] === normalizado) return _filaAObjeto(filas[i]);
  }
  return null;
}

/**
 * Busca contactos por nombre parcial (case-insensitive).
 */
function buscarContactos(texto) {
  var lower = texto.toLowerCase();
  return _leerFilas()
    .filter(function(f) { return String(f[1]).toLowerCase().indexOf(lower) !== -1; })
    .map(_filaAObjeto);
}

/**
 * Retorna todos los contactos.
 */
function leerContactos() {
  return _leerFilas().map(_filaAObjeto);
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalizarTelefono, crearContacto, buscarPorTelefono,
    buscarContactos, leerContactos
  };
}
