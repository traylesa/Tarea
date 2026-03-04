// === TareaLog — AuthService (Fase A: Autenticación multiusuario) ===

// Mapa de permisos por rol
var PERMISOS_POR_ROL = {
  admin: ['gestionar_usuarios', 'leer', 'escribir', 'configurar'],
  operador: ['leer', 'escribir'],
  visor: ['leer']
};

/**
 * Verifica un idToken de Firebase contra la API REST.
 * Retorna {uid, email, nombre} o null si falla.
 */
function verificarToken(idToken) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('AUTH_API_KEY');
  if (!apiKey) return null;

  try {
    var url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey;
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) return null;

    var body = JSON.parse(resp.getContentText());
    var u = body.users && body.users[0];
    if (!u) return null;
    return { uid: u.localId, email: u.email, nombre: u.displayName || '' };
  } catch (_) {
    return null;
  }
}

/**
 * Busca el rol del usuario en la hoja USUARIOS.
 * Retorna string (rol) o null si no existe.
 */
function obtenerRolUsuario(uid) {
  var ss = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
  );
  var hoja = ss.getSheetByName('USUARIOS');
  if (!hoja) return null;

  var filas = hoja.getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === uid) return filas[i][3];
  }
  return null;
}

/**
 * Middleware: valida token, verifica registro, inyecta _usuario.
 * Retorna {status, ...} si falla, o el resultado del handler.
 */
function middlewareAuth(params, handler) {
  if (!params.token) return { status: 401, error: 'Token requerido' };

  var usuario = verificarToken(params.token);
  if (!usuario) return { status: 401, error: 'Token invalido' };

  var rol = obtenerRolUsuario(usuario.uid);
  if (!rol) return { status: 403, error: 'Usuario no registrado' };

  params._usuario = {
    uid: usuario.uid,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: rol
  };
  return handler(params);
}

/**
 * Verifica si un rol tiene permiso para una acción.
 */
function tienePermiso(rol, accion) {
  var permisos = PERMISOS_POR_ROL[rol];
  if (!permisos) return false;
  return permisos.indexOf(accion) !== -1;
}

if (typeof module !== 'undefined') {
  module.exports = { verificarToken, obtenerRolUsuario, middlewareAuth, tienePermiso };
}
