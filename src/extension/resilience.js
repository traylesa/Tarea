/**
 * resilience.js - Modulo de robustez (logica pura)
 * Funciones para timeout, lotes, retry y tandas.
 * Sin DOM ni chrome.* — testeable en Node (Jest).
 */

var DEFAULTS_ROBUSTEZ = {
  timeoutBarridoMs: 300000,
  limiteLoteProcesamiento: 50,
  tamanoTandaEnvio: 15
};

function dividirEnTandas(items, tamano) {
  if (!items || items.length === 0) return [];
  var resultado = [];
  for (var i = 0; i < items.length; i += tamano) {
    resultado.push(items.slice(i, i + tamano));
  }
  return resultado;
}

function limitarMensajes(mensajes, limite) {
  if (!mensajes || mensajes.length === 0) {
    return { lote: [], hayMas: false };
  }
  var hayMas = mensajes.length > limite;
  var lote = hayMas ? mensajes.slice(0, limite) : mensajes;
  return { lote: lote, hayMas: hayMas };
}

async function ejecutarConRetry(fn, maxIntentos) {
  var ultimoError = null;
  for (var i = 0; i < maxIntentos; i++) {
    try {
      return await fn();
    } catch (err) {
      ultimoError = err;
    }
  }
  return { ok: false, error: ultimoError ? ultimoError.message : 'Error desconocido' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dividirEnTandas: dividirEnTandas,
    limitarMensajes: limitarMensajes,
    ejecutarConRetry: ejecutarConRetry,
    DEFAULTS_ROBUSTEZ: DEFAULTS_ROBUSTEZ
  };
}
