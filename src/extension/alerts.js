/**
 * alerts.js - Motor de alertas proactivas
 * Logica pura: evalua reglas sobre registros, sin DOM ni Chrome API.
 */

var NIVEL = {
  CRITICO: 'CRITICO',
  ALTO: 'ALTO',
  MEDIO: 'MEDIO',
  BAJO: 'BAJO'
};

var COLORES_BADGE = {
  CRITICO: '#FF0000',
  ALTO: '#FF8C00',
  MEDIO: '#2196F3',
  BAJO: '#4CAF50'
};

var PRIORIDAD_NIVEL = { CRITICO: 3, ALTO: 2, MEDIO: 1, BAJO: 0 };

// --- Funcion principal ---

function evaluarAlertas(registros, config, alertasPrevias, ahora) {
  if (!registros || !Array.isArray(registros) || registros.length === 0) return [];
  if (!config || !config.alertas || !config.alertas.activado) return [];

  var alertas = [];
  var cfg = config.alertas;

  alertas = alertas.concat(_reglaR2(registros, cfg, ahora));
  alertas = alertas.concat(_reglaR3(registros, cfg, ahora));
  alertas = alertas.concat(_reglaR4(registros, cfg, ahora));
  alertas = alertas.concat(_reglaR5(registros));
  alertas = alertas.concat(_reglaR6(registros, ahora));

  return deduplicar(alertas, alertasPrevias || [], cfg.cooldownMs || MS_POR_HORA);
}

// --- R2: Silencio transportista ---

function _reglaR2(registros, cfg, ahora) {
  var umbralMs = (cfg.silencioUmbralH || UMBRAL_SILENCIO_HORAS) * MS_POR_HORA;
  var enviados = registros.filter(function(r) { return r.estado === 'ENVIADO'; });
  var alertas = [];

  enviados.forEach(function(reg) {
    if (!reg.fechaCorreo || !reg.threadId) return;

    var tiempoMs = ahora.getTime() - new Date(reg.fechaCorreo).getTime();
    if (tiempoMs < umbralMs) return;

    // Verificar si hay RECIBIDO en mismo thread
    var tieneRespuesta = registros.some(function(r) {
      return r.threadId === reg.threadId && r.estado === 'RECIBIDO';
    });
    if (tieneRespuesta) return;

    alertas.push({
      id: 'R2_' + reg.threadId,
      regla: 'R2',
      nivel: NIVEL.ALTO,
      titulo: 'Sin respuesta',
      mensaje: 'Transportista no responde — Carga ' + (reg.codCar || '?'),
      codCar: reg.codCar || null,
      threadId: reg.threadId,
      timestamp: ahora.toISOString()
    });
  });

  return alertas;
}

// --- R3: Fase estancada ---

function _reglaR3(registros, cfg, ahora) {
  var maxH = cfg.estancamientoMaxH || {};
  var alertas = [];

  registros.forEach(function(reg) {
    if (!reg.fase || !reg.fechaCorreo) return;
    var limiteH = maxH[reg.fase];
    if (!limiteH) return;

    var horasTranscurridas = (ahora.getTime() - new Date(reg.fechaCorreo).getTime()) / MS_POR_HORA;
    if (horasTranscurridas <= limiteH) return;

    var nivel = horasTranscurridas > limiteH * 2 ? NIVEL.ALTO : NIVEL.MEDIO;

    alertas.push({
      id: 'R3_' + (reg.codCar || reg.threadId),
      regla: 'R3',
      nivel: nivel,
      titulo: 'Fase estancada',
      mensaje: 'Carga ' + (reg.codCar || '?') + ' lleva ' + Math.round(horasTranscurridas) + 'h en fase ' + reg.fase,
      codCar: reg.codCar || null,
      threadId: reg.threadId || null,
      timestamp: ahora.toISOString()
    });
  });

  return alertas;
}

// --- R4: Docs pendientes ---

function _reglaR4(registros, cfg, ahora) {
  var umbralDias = cfg.docsUmbralDias || 2;
  var umbralMs = umbralDias * MS_POR_DIA;
  var alertas = [];

  registros.forEach(function(reg) {
    if (reg.fase !== '29') return;

    var fechaRef = reg.fEntrega || reg.fechaCorreo;
    if (!fechaRef) return;

    var diasTranscurridos = (ahora.getTime() - new Date(fechaRef).getTime()) / MS_POR_DIA;
    if (diasTranscurridos <= umbralDias) return;

    var nivel = diasTranscurridos > 5 ? NIVEL.ALTO : NIVEL.MEDIO;

    alertas.push({
      id: 'R4_' + (reg.codCar || reg.threadId),
      regla: 'R4',
      nivel: nivel,
      titulo: 'Documentacion pendiente',
      mensaje: 'Carga ' + (reg.codCar || '?') + ' sin documentar (' + Math.round(diasTranscurridos) + ' dias)',
      codCar: reg.codCar || null,
      threadId: reg.threadId || null,
      timestamp: ahora.toISOString()
    });
  });

  return alertas;
}

// --- R5: Incidencia activa ---

function _reglaR5(registros) {
  var alertas = [];

  registros.forEach(function(reg) {
    if (reg.fase !== '05' && reg.fase !== '25') return;

    alertas.push({
      id: 'R5_' + (reg.codCar || reg.threadId),
      regla: 'R5',
      nivel: NIVEL.CRITICO,
      titulo: 'INCIDENCIA',
      mensaje: 'Carga ' + (reg.codCar || '?') + ' — ' + (reg.nombreTransportista || 'Incidencia') + ' (fase ' + reg.fase + ')',
      codCar: reg.codCar || null,
      threadId: reg.threadId || null,
      timestamp: new Date().toISOString()
    });
  });

  return alertas;
}

// --- R6: Carga HOY sin orden ---

function _reglaR6(registros, ahora) {
  var hoyStr = obtenerFechaLocal(ahora);
  var alertas = [];

  // Agrupar por codCar para verificar si alguno tiene ENVIADO
  var cargasHoy = {};
  registros.forEach(function(reg) {
    if (!reg.fCarga || !reg.codCar) return;
    var fCargaStr = reg.fCarga.slice(0, 10);
    if (fCargaStr !== hoyStr) return;

    if (!cargasHoy[reg.codCar]) {
      cargasHoy[reg.codCar] = { regs: [], tieneEnviado: false, hCarga: null };
    }
    cargasHoy[reg.codCar].regs.push(reg);
    if (reg.estado === 'ENVIADO') cargasHoy[reg.codCar].tieneEnviado = true;
    if (reg.hCarga) cargasHoy[reg.codCar].hCarga = reg.hCarga;
  });

  Object.keys(cargasHoy).forEach(function(codCar) {
    var info = cargasHoy[codCar];
    if (info.tieneEnviado) return;

    var nivel = NIVEL.ALTO;
    if (info.hCarga) {
      var horaCarga = crearHoraLocal(ahora, info.hCarga);
      var horasRestantes = (horaCarga.getTime() - ahora.getTime()) / MS_POR_HORA;
      if (horasRestantes < 3) nivel = NIVEL.CRITICO;
    }

    alertas.push({
      id: 'R6_' + codCar,
      regla: 'R6',
      nivel: nivel,
      titulo: 'Carga HOY sin orden',
      mensaje: 'Carga ' + codCar + ' sale hoy sin orden enviada',
      codCar: parseInt(codCar, 10),
      threadId: info.regs[0].threadId || null,
      timestamp: ahora.toISOString()
    });
  });

  return alertas;
}

// --- Deduplicacion ---

function deduplicar(nuevas, previas, cooldownMs) {
  if (!nuevas || nuevas.length === 0) return [];
  if (!previas || previas.length === 0) return nuevas;

  var mapaTimestamp = {};
  previas.forEach(function(p) {
    mapaTimestamp[p.id] = new Date(p.timestamp).getTime();
  });

  return nuevas.filter(function(alerta) {
    var tsPrev = mapaTimestamp[alerta.id];
    if (!tsPrev) return true;
    var tsNueva = new Date(alerta.timestamp).getTime();
    return (tsNueva - tsPrev) >= cooldownMs;
  });
}

// --- Badge ---

function calcularBadge(alertas) {
  if (!alertas || alertas.length === 0) {
    return { texto: '', color: '#4CAF50' };
  }

  var maxNivel = NIVEL.BAJO;
  alertas.forEach(function(a) {
    if (PRIORIDAD_NIVEL[a.nivel] > PRIORIDAD_NIVEL[maxNivel]) {
      maxNivel = a.nivel;
    }
  });

  return {
    texto: String(alertas.length),
    color: COLORES_BADGE[maxNivel] || '#4CAF50'
  };
}

// --- Notificaciones ---

function generarNotificaciones(alertas) {
  if (!alertas || alertas.length === 0) return [];

  return alertas
    .filter(function(a) {
      return a.nivel === NIVEL.CRITICO || a.nivel === NIVEL.ALTO;
    })
    .map(function(a) {
      return {
        id: a.id,
        opciones: {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: a.titulo,
          message: a.mensaje,
          priority: a.nivel === NIVEL.CRITICO ? 2 : 1
        }
      };
    });
}

// --- Exportar ---

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    evaluarAlertas: evaluarAlertas,
    deduplicar: deduplicar,
    calcularBadge: calcularBadge,
    generarNotificaciones: generarNotificaciones,
    NIVEL: NIVEL,
    COLORES_BADGE: COLORES_BADGE
  };
}
