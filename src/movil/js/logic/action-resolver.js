// action-resolver.js - Calcula "accion requerida" por carga
'use strict';

var COLORES_NIVEL = {
  CRITICO: '#D32F2F',
  ALTO: '#F57C00',
  MEDIO: '#1565C0',
  BAJO: '#2E7D32'
};

// Acciones por grupo de fase (reutiliza logica de action-bar.js)
var ACCIONES_RAPIDAS = {
  espera: 'Confirmar hora carga',
  carga: 'Solicitar posicion',
  en_ruta: 'Verificar ETA',
  descarga: 'Confirmar descarga',
  vacio: 'Reclamar POD',
  incidencia: 'Solicitar detalle'
};

var MAPA_FASE_GRUPO = {
  '00': 'espera', '01': 'espera', '02': 'espera',
  '05': 'incidencia',
  '11': 'carga', '12': 'carga',
  '19': 'en_ruta',
  '21': 'descarga', '22': 'descarga',
  '25': 'incidencia',
  '29': 'vacio'
};

function resolverAccion(registro, alertas, config) {
  if (!registro) return null;

  // Buscar alertas de este threadId
  var misAlertas = alertas.filter(function(a) {
    return a.threadId === registro.threadId;
  });

  // Prioridad 1: Alerta CRITICA
  var critica = misAlertas.find(function(a) { return a.nivel === 'CRITICO'; });
  if (critica) {
    return { tipo: 'alerta', texto: critica.texto, color: COLORES_NIVEL.CRITICO, accion: critica };
  }

  // Prioridad 2: Alerta ALTO
  var alta = misAlertas.find(function(a) { return a.nivel === 'ALTO'; });
  if (alta) {
    return { tipo: 'alerta', texto: alta.texto, color: COLORES_NIVEL.ALTO, accion: alta };
  }

  // Prioridad 3: Deadline cercano (fCarga hoy)
  if (registro.fCarga) {
    var hoy = new Date().toISOString().slice(0, 10);
    if (registro.fCarga === hoy && registro.estado !== 'ENVIADO') {
      return { tipo: 'deadline', texto: 'Carga hoy', color: COLORES_NIVEL.ALTO, accion: null };
    }
  }

  // Prioridad 4: Accion contextual de fase
  var grupo = MAPA_FASE_GRUPO[registro.fase];
  if (grupo && ACCIONES_RAPIDAS[grupo]) {
    return { tipo: 'fase', texto: ACCIONES_RAPIDAS[grupo], color: COLORES_NIVEL.MEDIO, accion: null };
  }

  return null;
}

if (typeof module !== 'undefined') module.exports = { resolverAccion, COLORES_NIVEL, ACCIONES_RAPIDAS };
