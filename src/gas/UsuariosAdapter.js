// === TareaLog — UsuariosAdapter (Fase A: Autenticación) ===

function _obtenerHojaUsuarios() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName('USUARIOS');
}

function _filaAUsuario(fila) {
  return {
    uid: fila[0], nombre: fila[1], email: fila[2],
    rol: fila[3], fechaAlta: fila[4], activo: fila[5]
  };
}

/**
 * Crea usuario. Rechaza uid duplicado.
 */
function crearUsuario(datos) {
  var hoja = _obtenerHojaUsuarios();
  var filas = hoja.getDataRange().getValues();

  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === datos.uid) throw new Error('Usuario duplicado por uid');
  }

  var ahora = new Date().toISOString();
  hoja.appendRow([
    datos.uid, datos.nombre, datos.email,
    datos.rol, ahora, true
  ]);
}

/**
 * Retorna lista de todos los usuarios.
 */
function obtenerUsuarios() {
  var filas = _obtenerHojaUsuarios().getDataRange().getValues();
  return filas.slice(1).map(_filaAUsuario);
}

/**
 * Actualiza el rol de un usuario por uid.
 */
function actualizarRol(uid, nuevoRol) {
  var hoja = _obtenerHojaUsuarios();
  var filas = hoja.getDataRange().getValues();

  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === uid) {
      hoja.getRange(i + 1, 4).setValue(nuevoRol);
      return;
    }
  }
}

/**
 * Desactiva usuario (activo=false).
 */
function desactivarUsuario(uid) {
  var hoja = _obtenerHojaUsuarios();
  var filas = hoja.getDataRange().getValues();

  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === uid) {
      hoja.getRange(i + 1, 6).setValue(false);
      return;
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = { crearUsuario, obtenerUsuarios, actualizarRol, desactivarUsuario };
}
