/**
 * date-utils.js - Utilidades centralizadas de fecha/hora
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 *
 * CONVENCION: Todas las comparaciones de "mismo dia", "hoy", "hora"
 * usan HORA LOCAL del navegador (zona horaria del usuario).
 * Los timestamps y duraciones usan getTime() (timezone-agnostic).
 * El almacenamiento usa toISOString() (UTC).
 */

// Importar constantes en entorno Node (Jest)
if (typeof module !== 'undefined' && typeof require === 'function') {
  var constants = require('./constants.js');
  var MS_POR_HORA = constants.MS_POR_HORA;
  var MS_POR_MINUTO = constants.MS_POR_MINUTO;
  var HORA_MANANA_DEFAULT = constants.HORA_MANANA_DEFAULT;
}
// En navegador, las constantes vienen de constants.js via <script>

/**
 * Compara si dos fechas caen en el mismo dia LOCAL.
 * Acepta Date, string ISO, o timestamp.
 */
function esMismoDia(fecha1, fecha2) {
  if (!fecha1 || !fecha2) return false;
  var d1 = new Date(fecha1);
  var d2 = new Date(fecha2);
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

/**
 * Retorna string YYYY-MM-DD en hora LOCAL.
 */
function obtenerFechaLocal(fecha) {
  var d = new Date(fecha);
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var dia = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dia;
}

/**
 * Retorna un Date con hora 00:00:00.000 LOCAL.
 */
function inicioDelDia(fecha) {
  var d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calcula horas transcurridas entre dos fechas (timezone-agnostic).
 */
function horasTranscurridas(desde, hasta) {
  return (new Date(hasta).getTime() - new Date(desde).getTime()) / MS_POR_HORA;
}

/**
 * Suma minutos a una fecha. Retorna nuevo Date.
 */
function sumarMinutos(fecha, minutos) {
  return new Date(new Date(fecha).getTime() + minutos * MS_POR_MINUTO);
}

/**
 * Retorna Date para "manana a las 9:00" en hora LOCAL.
 */
function mananaPorLaManana(ahora) {
  var d = new Date(ahora);
  d.setDate(d.getDate() + 1);
  d.setHours(HORA_MANANA_DEFAULT, 0, 0, 0);
  return d;
}

/**
 * Crea Date con hora LOCAL especifica (HH:MM) sobre la fecha dada.
 * Util para comparar hora de carga/matutino.
 */
function crearHoraLocal(fecha, horaStr) {
  var partes = horaStr.split(':');
  var d = new Date(fecha);
  d.setHours(parseInt(partes[0], 10), parseInt(partes[1] || '0', 10), 0, 0);
  return d;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esMismoDia: esMismoDia,
    obtenerFechaLocal: obtenerFechaLocal,
    inicioDelDia: inicioDelDia,
    horasTranscurridas: horasTranscurridas,
    sumarMinutos: sumarMinutos,
    mananaPorLaManana: mananaPorLaManana,
    crearHoraLocal: crearHoraLocal
  };
}
