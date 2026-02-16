// store.js - Estado local con localStorage
'use strict';

var DEFAULTS_CONFIG = {
  gasUrl: '',
  intervaloMinutos: 15,
  emailsPorMinuto: 10,
  patrones: {
    codcarAdjunto: 'Carga_0*(\\d+)\\.pdf',
    keywordsAdmin: 'certificado|hacienda|347|aeat|factura'
  }
};

var Store = {
  // --- Registros ---
  obtenerRegistros: function() {
    return this._leerJSON('registros', []);
  },

  guardarRegistros: function(registros) {
    this._guardarJSON('registros', registros);
  },

  obtenerRegistrosPorCarga: function(codCar) {
    return this.obtenerRegistros().filter(function(r) {
      return r.codCar === codCar;
    });
  },

  // --- Config ---
  obtenerConfig: function() {
    var guardada = this._leerJSON('tarealog_config', {});
    return Object.assign({}, DEFAULTS_CONFIG, guardada);
  },

  guardarConfig: function(config) {
    this._guardarJSON('tarealog_config', config);
  },

  // --- Plantillas ---
  obtenerPlantillas: function() {
    return this._leerJSON('tarealog_plantillas', []);
  },

  guardarPlantillas: function(plantillas) {
    this._guardarJSON('tarealog_plantillas', plantillas);
  },

  // --- Alertas ---
  obtenerAlertas: function() {
    return this._leerJSON('tarealog_alertas', []);
  },

  guardarAlertas: function(alertas) {
    this._guardarJSON('tarealog_alertas', alertas);
  },

  // --- Pie comun ---
  obtenerPieComun: function() {
    return localStorage.getItem('tarealog_pie_comun') || '';
  },

  guardarPieComun: function(html) {
    localStorage.setItem('tarealog_pie_comun', html);
  },

  // --- Ultimo barrido ---
  obtenerUltimoBarrido: function() {
    return localStorage.getItem('ultimoBarrido') || null;
  },

  guardarUltimoBarrido: function(iso) {
    localStorage.setItem('ultimoBarrido', iso);
  },

  // --- Helpers internos ---
  _leerJSON: function(clave, defaultVal) {
    var raw = localStorage.getItem(clave);
    if (!raw) return defaultVal;
    try { return JSON.parse(raw); }
    catch(e) { return defaultVal; }
  },

  _guardarJSON: function(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }
};

if (typeof module !== 'undefined') module.exports = { Store, DEFAULTS_CONFIG };
