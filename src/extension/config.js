/**
 * config.js - Modulo de configuracion parametrizable
 * Logica pura sin dependencias DOM. Testeable unitariamente.
 */

const STORAGE_KEY_CONFIG = 'tarealog_config';
const MIN_INTERVALO = 1;
const MAX_INTERVALO = 1440;
const MIN_EMAILS_POR_MINUTO = 1;
const MAX_EMAILS_POR_MINUTO = 30;
const CONFIG_VERSION = '1.2.0';

// Importar constantes en entorno Node (Jest)
let _constants;
if (typeof module !== 'undefined' && typeof require === 'function') {
  try { _constants = require('./constants.js'); } catch { _constants = null; }
}

// Importar action-rules si estamos en Node (tests)
let _actionRules;
if (typeof require !== 'undefined') {
  try { _actionRules = require('./action-rules.js'); } catch { _actionRules = null; }
}

// Importar fases/estados si estamos en Node (tests)
let _fasesConfig;
let _estadosConfig;
if (typeof require !== 'undefined') {
  try { _fasesConfig = require('./fases-config.js'); } catch { _fasesConfig = null; }
  try { _estadosConfig = require('./estados-config.js'); } catch { _estadosConfig = null; }
}

// Helpers para obtener constantes (navegador vs Node)
function _getConstant(name, fallback) {
  if (_constants) return _constants[name];
  if (typeof window !== 'undefined' && window[name] !== undefined) return window[name];
  return fallback;
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

function _getDefaultEstados() {
  if (_estadosConfig) return _estadosConfig.getDefaultEstados();
  if (typeof getDefaultEstados === 'function') return getDefaultEstados();
  return [];
}

function _generarReglasDefault() {
  if (_actionRules) return _actionRules.generarReglasDefault();
  if (typeof generarReglasDefault === 'function') return generarReglasDefault();
  return [];
}

function _validarReglaAccion(regla) {
  if (_actionRules) return _actionRules.validarRegla(regla);
  if (typeof validarRegla === 'function') return validarRegla(regla);
  return { valido: true, errores: [] };
}

function _validarEstados(estados) {
  if (_estadosConfig) return _estadosConfig.validarEstados(estados);
  if (typeof validarEstados === 'function') return validarEstados(estados);
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
    emailsPorMinuto: 10,
    fases: _getDefaultFases(),
    estados: _getDefaultEstados(),
    alertas: {
      activado: true,
      silencioUmbralH: _getConstant('UMBRAL_SILENCIO_HORAS', 12),
      estancamientoMaxH: _getConstant('UMBRAL_ESTANCAMIENTO_HORAS', 48),
      docsUmbralDias: _getConstant('UMBRAL_DOCS_DIAS', 3),
      cooldownMs: _getConstant('COOLDOWN_ALERTA_MS', 3600000)
    },
    resumenMatutino: {
      activado: true,
      hora: _getConstant('HORA_MATUTINO_DEFAULT', '08:00')
    },
    recordatorios: {
      sugerenciasActivadas: true
    },
    secuencias: {
      activado: true,
      evaluacionMinutos: _getConstant('INTERVALO_VERIFICACION_SECUENCIAS_MS', 900000) / _getConstant('MS_POR_MINUTO', 60000)
    },
    reporteTurno: {
      activado: true,
      hora: _getConstant('HORA_REPORTE_DEFAULT', '18:00')
    },
    robustez: {
      timeoutBarridoMs: _getConstant('TIMEOUT_BARRIDO_MS', 300000),
      limiteLoteProcesamiento: _getConstant('LIMITE_LOTE_PROCESAMIENTO', 50),
      tamanoTandaEnvio: _getConstant('TAMANO_TANDA_ENVIO', 15)
    },
    reglasAcciones: _generarReglasDefault()
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

  if (config.emailsPorMinuto !== undefined) {
    const epm = config.emailsPorMinuto;
    if (!Number.isInteger(epm) || epm < MIN_EMAILS_POR_MINUTO || epm > MAX_EMAILS_POR_MINUTO) {
      errores.push(`Emails/minuto debe ser entero entre ${MIN_EMAILS_POR_MINUTO} y ${MAX_EMAILS_POR_MINUTO}`);
    }
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

  if (config.estados) {
    const resEstados = _validarEstados(config.estados);
    if (!resEstados.valido) {
      errores.push(...resEstados.errores);
    }
  }

  if (config.reglasAcciones) {
    if (!Array.isArray(config.reglasAcciones)) {
      errores.push('reglasAcciones debe ser un array');
    } else {
      config.reglasAcciones.forEach(function(regla, i) {
        var resRegla = _validarReglaAccion(regla);
        if (!resRegla.valido) {
          resRegla.errores.forEach(function(e) {
            errores.push('Regla ' + (i + 1) + ': ' + e);
          });
        }
      });
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

  // Auto-migracion: inyectar defaults si no existen en guardada
  if (!guardada.fases) config.fases = defaults.fases;
  if (!guardada.estados) config.estados = defaults.estados;
  if (!guardada.alertas) {
    config.alertas = defaults.alertas;
  } else {
    config.alertas = { ...defaults.alertas, ...guardada.alertas };
  }

  if (!guardada.resumenMatutino) {
    config.resumenMatutino = defaults.resumenMatutino;
  } else {
    config.resumenMatutino = { ...defaults.resumenMatutino, ...guardada.resumenMatutino };
  }

  if (!guardada.recordatorios) {
    config.recordatorios = defaults.recordatorios;
  } else {
    config.recordatorios = { ...defaults.recordatorios, ...guardada.recordatorios };
  }

  if (!guardada.secuencias) {
    config.secuencias = defaults.secuencias;
  } else {
    config.secuencias = { ...defaults.secuencias, ...guardada.secuencias };
  }

  if (!guardada.reporteTurno) {
    config.reporteTurno = defaults.reporteTurno;
  } else {
    config.reporteTurno = { ...defaults.reporteTurno, ...guardada.reporteTurno };
  }

  if (!guardada.robustez) {
    config.robustez = defaults.robustez;
  } else {
    config.robustez = { ...defaults.robustez, ...guardada.robustez };
  }

  if (!guardada.reglasAcciones) {
    config.reglasAcciones = defaults.reglasAcciones;
  }

  return config;
}

async function guardar(config) {
  await chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: config });
}

function exportarConfigCompleta(config, extras) {
  var exportado = {
    version: CONFIG_VERSION,
    fecha_exportacion: new Date().toISOString(),
    config: config
  };

  if (extras) {
    if (extras.servicios) exportado.servicios = extras.servicios;
    if (extras.gmailQuery) exportado.gmailQuery = extras.gmailQuery;
    if (extras.spreadsheet) exportado.spreadsheet = extras.spreadsheet;
    if (extras.pieComun) exportado.pieComun = extras.pieComun;
    if (extras.preferenciasRejilla) exportado.preferenciasRejilla = extras.preferenciasRejilla;
  }

  return exportado;
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
    STORAGE_KEY_CONFIG, MIN_INTERVALO, MAX_INTERVALO,
    MIN_EMAILS_POR_MINUTO, MAX_EMAILS_POR_MINUTO, CONFIG_VERSION
  };
}
