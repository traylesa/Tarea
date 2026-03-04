// === TareaLog — Configuracion GAS ===

// ID de la hoja de calculo (configurable desde la extension via PropertiesService)
function obtenerSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (!id || !id.trim()) {
    throw new Error('SPREADSHEET_ID no configurado. Vaya a Configuracion > Hoja de Calculo Destino en la extension para configurarlo.');
  }
  return id;
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
  'bandeja', 'procesadoAt'
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

// Hojas de datos operativos
const HOJA_NOTAS = 'NOTAS';
const HEADERS_NOTAS = ['clave', 'id', 'texto', 'fechaCreacion', 'tipo'];

const HOJA_RECORDATORIOS = 'RECORDATORIOS';
const HEADERS_RECORDATORIOS = ['id', 'clave', 'texto', 'asunto', 'fechaDisparo', 'preset', 'origen', 'estado'];

const HOJA_HISTORIAL = 'HISTORIAL';
const HEADERS_HISTORIAL = ['id', 'clave', 'tipo', 'descripcion', 'fechaCreacion'];

// Hojas IA (Fase C: Multiusuario)
const HOJA_TAREAS = 'TAREAS';
const HEADERS_TAREAS = [
  'id', 'titulo', 'descripcion', 'referencia', 'contactoTel',
  'entidadId', 'centroId', 'usuarioAsignado', 'creadoPor',
  'estado', 'fase', 'prioridadIa', 'horasIa', 'riesgoIa',
  'justificacionIa', 'subtareasJson', 'creadoAt', 'actualizadoAt'
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

function obtenerEstadoInicial() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('ESTADO_INICIAL') || 'NUEVO';
}

function guardarEstadoInicial(estado) {
  PropertiesService.getScriptProperties().setProperty('ESTADO_INICIAL', estado);
}

function estaEnHorarioLaboral() {
  var horario = obtenerHorarioLaboral();
  var ahora = new Date();
  var dia = ahora.getDay(); // 0=domingo, 1=lunes...
  var hora = ahora.getHours();
  if (horario.dias.indexOf(dia) === -1) return false;
  return hora >= horario.horaInicio && hora < horario.horaFin;
}

// Timezone del proyecto (debe coincidir con appsscript.json)
var TIMEZONE = 'Europe/Madrid';

// Fecha/hora local como ISO string con offset (ej: "2026-02-25T14:30:00+01:00")
// Usar SIEMPRE en vez de new Date().toISOString() para timestamps visibles al usuario
function ahoraLocalISO() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

// Convertir cualquier Date a ISO local con offset
function fechaLocalISO(date) {
  return Utilities.formatDate(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

// Setup inicial (ejecutar UNA VEZ desde editor GAS: Run > setupInicial)
function setupInicial() {
  guardarSpreadsheetId('12NH1UZJbGqa2QOYHudegL0rt4VTqN_sEdgl_DVm9aEg');
  Logger.log('SPREADSHEET_ID configurado: 12NH1UZJbGqa2QOYHudegL0rt4VTqN_sEdgl_DVm9aEg');
}

// Hojas multiusuario (Fase A)
const HOJA_USUARIOS = 'USUARIOS';
const HEADERS_USUARIOS = ['uid', 'nombre', 'email', 'rol', 'fechaAlta', 'activo'];

// Hojas datos maestros (Fase B)
const HOJA_CONTACTOS = 'CONTACTOS';
const HEADERS_CONTACTOS = ['telefono', 'nombre', 'email', 'entidadId', 'centroId', 'notas', 'creadoPor', 'creadoAt'];

const HOJA_ENTIDADES = 'ENTIDADES';
const HEADERS_ENTIDADES = ['id', 'nombre', 'tipo', 'cif', 'direccion', 'activa', 'creadoAt'];

const HOJA_CENTROS = 'CENTROS_TRABAJO';
const HEADERS_CENTROS = ['id', 'nombre', 'entidadId', 'direccion', 'activo', 'creadoAt'];
