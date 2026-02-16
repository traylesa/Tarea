// feedback.js - Vibracion, toasts, feedback haptico
'use strict';

var PATRONES_VIBRACION = {
  corto: 50,
  doble: [100, 50, 100],
  largo: 200,
  error: [50, 30, 50, 30, 50]
};

var Feedback = {
  vibrar: function(tipo) {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    var patron = PATRONES_VIBRACION[tipo] || 50;
    navigator.vibrate(patron);
  },

  toast: function(mensaje, opciones) {
    opciones = opciones || {};
    var duracion = opciones.duracion || 3000;
    var tipo = opciones.tipo || 'info';
    var deshacer = opciones.deshacer || null;

    return {
      mensaje: mensaje,
      tipo: tipo,
      duracion: duracion,
      deshacer: deshacer
    };
  },

  eliminarToast: function(id) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById(id);
    if (el) el.remove();
  }
};

if (typeof module !== 'undefined') module.exports = { Feedback, PATRONES_VIBRACION };
