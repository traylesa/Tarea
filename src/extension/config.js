/**
 * config.js - Modulo de configuracion parametrizable
 * Logica pura sin dependencias DOM. Testeable unitariamente.
 */

const STORAGE_KEY_CONFIG = 'logitask_config';
const MIN_INTERVALO = 1;
const MAX_INTERVALO = 1440;
const CONFIG_VERSION = '1.0.0';

// Importar fases si estamos en Node (tests)
let _fasesConfig;
if (typeof require !== 'undefined') {
  try { _fasesConfig = require('./fases-config.js'); } catch { _fasesConfig = null; }
}

function _getDefaultFases() {
  if (_fasesConfig) return _fasesConfig.getDefaultFases();
  if (typeof getDefaultFases === 'function') return getDefaultFases();
  return [];
}

function _validarFases(fases) {
  if (_fasesConfig) return _fasesConfig.validarFases(fases);
  if (typeof validarFases === 'function') return validarFases(fases);
  return { valido: true, errores: [] };
}

function getDefaults() {
  return {
    gasUrl: '',
    intervaloMinutos: 15,
    rutaCsvErp: '',
    patrones: {
      codcarAdjunto: 'Carga_0*(\\d+)\\.pdf',
      keywordsAdmin: 'certificado|hacienda|347|aeat|factura'
    },
    ventana: {
      width: 800,
      height: 600,
      left: null,
      top: null
    },
    fases: _getDefaultFases()
  };
}

function validar(config) {
  const errores = [];

  if (config.gasUrl && !config.gasUrl.startsWith('https://')) {
    errores.push('URL del servicio debe comenzar con https://');
  }

  const intervalo = config.intervaloMinutos;
  if (!Number.isInteger(intervalo) || intervalo < MIN_INTERVALO || intervalo > MAX_INTERVALO) {
    errores.push(`El intervalo debe ser entero entre ${MIN_INTERVALO} y ${MAX_INTERVALO} minutos`);
  }

  if (config.patrones) {
    for (const [nombre, patron] of Object.entries(config.patrones)) {
      try {
        new RegExp(patron);
      } catch {
        errores.push(`El patron "${nombre}" no es una regex valida`);
      }
    }
  }

  if (config.fases) {
    const resFases = _validarFases(config.fases);
    if (!resFases.valido) {
      errores.push(...resFases.errores);
    }
  }

  return { valido: errores.length === 0, errores };
}

async function cargar() {
  const defaults = getDefaults();
  const result = await chrome.storage.local.get(STORAGE_KEY_CONFIG);
  const guardada = result[STORAGE_KEY_CONFIG];

  if (!guardada) return defaults;

  const config = {
    ...defaults,
    ...guardada,
    patrones: { ...defaults.patrones, ...(guardada.patrones || {}) },
    ventana: { ...defaults.ventana, ...(guardada.ventana || {}) }
  };

  // Auto-migracion: si config guardada no tiene fases, inyectar defaults
  if (!guardada.fases) {
    config.fases = defaults.fases;
  }

  return config;
}

async function guardar(config) {
  await chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: config });
}

function exportarConfigCompleta(config) {
  return {
    version: CONFIG_VERSION,
    fecha_exportacion: new Date().toISOString(),
    config
  };
}

function validarImportacion(data) {
  const errores = [];

  if (!data || typeof data !== 'object') {
    return { valido: false, errores: ['Formato invalido: se esperaba un objeto JSON'] };
  }

  if (!data.version) {
    errores.push('Falta campo "version" en el archivo importado');
  }

  if (!data.config || typeof data.config !== 'object') {
    errores.push('Falta campo "config" en el archivo importado');
  }

  if (data.config) {
    const resConfig = validar(data.config);
    if (!resConfig.valido) {
      errores.push(...resConfig.errores);
    }
  }

  return { valido: errores.length === 0, errores };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDefaults, validar, cargar, guardar,
    exportarConfigCompleta, validarImportacion,
    STORAGE_KEY_CONFIG, MIN_INTERVALO, MAX_INTERVALO, CONFIG_VERSION
  };
}
