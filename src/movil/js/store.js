// store.js - Estado local con localStorage
'use strict';

var DEFAULTS_CONFIG = {
  gasUrl: '',
  estadoInicial: 'NUEVO',
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
    var registros = this._leerJSON('registros', []);
    return registros.map(this._normalizarRegistro);
  },

  guardarRegistros: function(registros) {
    this._guardarJSON('registros', registros.map(this._normalizarRegistro));
  },

  _normalizarRegistro: function(r) {
    // Fase: siempre string con padding 2 digitos ("00", "05", "19")
    if (r.fase !== undefined && r.fase !== '') {
      r.fase = String(r.fase).padStart(2, '0');
    }
    return r;
  },

  obtenerRegistrosPorCarga: function(codCar) {
    var buscar = String(codCar);
    return this.obtenerRegistros().filter(function(r) {
      return String(r.codCar) === buscar;
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

  // --- Tareas ---
  obtenerTareas: function() {
    return this._leerJSON('tarealog_tareas', []);
  },

  guardarTareas: function(tareas) {
    this._guardarJSON('tarealog_tareas', tareas);
  },

  // --- Contactos ---
  obtenerContactos: function() {
    return this._leerJSON('tarealog_contactos_maestro', []);
  },

  guardarContactos: function(contactos) {
    this._guardarJSON('tarealog_contactos_maestro', contactos);
  },

  // --- Entidades ---
  obtenerEntidades: function() {
    return this._leerJSON('tarealog_entidades', []);
  },

  guardarEntidades: function(entidades) {
    this._guardarJSON('tarealog_entidades', entidades);
  },

  // --- Centros ---
  obtenerCentros: function() {
    return this._leerJSON('tarealog_centros', []);
  },

  guardarCentros: function(centros) {
    this._guardarJSON('tarealog_centros', centros);
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
