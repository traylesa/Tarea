// === TareaLog — Configuracion GAS ===

// ID de la hoja de calculo (configurable desde la extension via PropertiesService)
function obtenerSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SPREADSHEET_ID') || '1cLslY9zsd06zQthBnPQpSFTY6KLkopB0xSEIDx5KN-c';
}

function guardarSpreadsheetId(id) {
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
}

// Nombres de hojas
const HOJA_SEGUIMIENTO = 'SEGUIMIENTO';
const HOJA_HILOS = 'DB_HILOS';

// Headers SEGUIMIENTO (orden de columnas)
const HEADERS_SEGUIMIENTO = [
  'messageId', 'threadId', 'mensajesEnHilo', 'codCar', 'codTra', 'nombreTransportista',
  'emailRemitente', 'emailErp', 'asunto', 'fechaCorreo',
  'tipoTarea', 'estado', 'fase', 'alerta', 'vinculacion', 'referencia',
  'para', 'cc', 'cco', 'interlocutor', 'cuerpo',
  'fCarga', 'hCarga', 'fEntrega', 'hEntrega', 'zona', 'zDest',
  'procesadoAt'
];

// Headers DB_HILOS
const HEADERS_HILOS = ['threadId', 'codCar', 'actualizadoAt'];

// Hoja PROGRAMADOS (cola de envios programados)
const HOJA_PROGRAMADOS = 'PROGRAMADOS';
const HEADERS_PROGRAMADOS = [
  'id', 'threadId', 'interlocutor', 'asunto', 'cuerpo',
  'cc', 'bcc', 'fechaProgramada', 'estado',
  'fechaEnvio', 'errorDetalle', 'creadoPor', 'creadoAt'
];

// Email propio: cuenta que despliega el script (funciona en Web App)
function obtenerEmailPropio() {
  return Session.getEffectiveUser().getEmail().toLowerCase();
}

// Todos los emails del usuario: cuenta principal + aliases (dominios custom)
function obtenerEmailsPropios() {
  var emails = {};
  emails[Session.getEffectiveUser().getEmail().toLowerCase()] = true;
  try {
    var aliases = GmailApp.getAliases();
    aliases.forEach(function(a) { emails[a.toLowerCase()] = true; });
  } catch (e) {
    Logger.log('No se pudieron obtener aliases: ' + e.message);
  }
  return emails;
}

// Query Gmail configurable desde la extension
const GMAIL_QUERY_DEFAULT = '(in:inbox OR in:sent) newer_than:7d';

function obtenerGmailQuery() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('GMAIL_QUERY') || GMAIL_QUERY_DEFAULT;
}

function guardarGmailQuery(query) {
  PropertiesService.getScriptProperties().setProperty('GMAIL_QUERY', query);
}

// Horario laboral para el trigger de envios programados
var HORARIO_LABORAL_DEFAULT = {
  dias: [1, 2, 3, 4, 5],  // lunes=1 a viernes=5
  horaInicio: 7,
  horaFin: 21
};

function obtenerHorarioLaboral() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('HORARIO_LABORAL');
  if (!raw) return HORARIO_LABORAL_DEFAULT;
  try { return JSON.parse(raw); } catch (e) { return HORARIO_LABORAL_DEFAULT; }
}

function guardarHorarioLaboral(horario) {
  PropertiesService.getScriptProperties().setProperty('HORARIO_LABORAL', JSON.stringify(horario));
}

function estaEnHorarioLaboral() {
  var horario = obtenerHorarioLaboral();
  var ahora = new Date();
  var dia = ahora.getDay(); // 0=domingo, 1=lunes...
  var hora = ahora.getHours();
  if (horario.dias.indexOf(dia) === -1) return false;
  return hora >= horario.horaInicio && hora < horario.horaFin;
}
