/**
 * sequences.js - Modulo de secuencias automaticas de acciones
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 5: Secuencias programadas por carga/hilo
 */

// Importar constantes en entorno Node (Jest)
if (typeof module !== 'undefined' && typeof require === 'function') {
  var constants = require('./constants.js');
  var MAX_PASOS_SECUENCIA = constants.MAX_PASOS_SECUENCIA;
  var MS_POR_HORA = constants.MS_POR_HORA;
}
// En navegador, MAX_PASOS_SECUENCIA y MS_POR_HORA vienen de constants.js via <script>

var ESTADOS_SECUENCIA = {
  ACTIVA: 'ACTIVA',
  COMPLETADA: 'COMPLETADA',
  DETENIDA: 'DETENIDA',
  CANCELADA: 'CANCELADA'
};

var ESTADOS_PASO = {
  PENDIENTE: 'PENDIENTE',
  EJECUTADO: 'EJECUTADO',
  DETENIDO: 'DETENIDO',
  CANCELADO: 'CANCELADO'
};

var SECUENCIAS_PREDEFINIDAS = {
  'Reclamar POD': {
    pasos: [
      { orden: 1, plantilla: 'Solicitud docs descarga', horasEspera: 0 },
      { orden: 2, plantilla: 'Recordatorio docs pendientes', horasEspera: 72 },
      { orden: 3, plantilla: 'Escalado responsable', horasEspera: 168 }
    ]
  },
  'Confirmar carga': {
    pasos: [
      { orden: 1, plantilla: 'Consulta hora carga', horasEspera: 0 },
      { orden: 2, plantilla: 'Recordatorio carga', horasEspera: 24 },
      { orden: 3, plantilla: 'Urgente: confirmar carga', horasEspera: 48 }
    ]
  },
  'Seguimiento incidencia': {
    pasos: [
      { orden: 1, plantilla: 'Solicitar detalle incidencia', horasEspera: 0 },
      { orden: 2, plantilla: 'Recordatorio incidencia', horasEspera: 24 },
      { orden: 3, plantilla: 'Escalar incidencia', horasEspera: 72 }
    ]
  }
};

function _generarId() {
  return 'seq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function _clonarPaso(paso) {
  return {
    orden: paso.orden,
    plantilla: paso.plantilla,
    horasEspera: paso.horasEspera,
    estado: paso.estado,
    fechaProgramada: paso.fechaProgramada
  };
}

function crearSecuencia(codCar, threadId, nombre, pasos, ahora) {
  if (!codCar || !/^\d+$/.test(String(codCar))) {
    throw new Error('codCar debe ser numerico');
  }
  if (!threadId || !String(threadId).trim()) {
    throw new Error('threadId es obligatorio');
  }
  if (!pasos || pasos.length === 0) {
    throw new Error('Se requiere al menos un paso en pasos');
  }
  if (pasos.length > MAX_PASOS_SECUENCIA) {
    throw new Error('Se permite un maximo de ' + MAX_PASOS_SECUENCIA + ' pasos');
  }

  var tsBase = ahora.getTime();
  var pasosCreados = pasos.map(function (p) {
    return {
      orden: p.orden,
      plantilla: p.plantilla,
      horasEspera: p.horasEspera,
      estado: ESTADOS_PASO.PENDIENTE,
      fechaProgramada: new Date(tsBase + p.horasEspera * MS_POR_HORA).toISOString()
    };
  });

  return {
    id: _generarId(),
    codCar: String(codCar),
    threadId: String(threadId),
    nombre: nombre,
    estado: ESTADOS_SECUENCIA.ACTIVA,
    fechaCreacion: ahora.toISOString(),
    pasos: pasosCreados
  };
}

function evaluarPasos(almacen, ahora) {
  if (!almacen || !Array.isArray(almacen)) return [];
  var tsAhora = ahora.getTime();
  var listos = [];

  almacen.forEach(function (seq) {
    if (seq.estado !== ESTADOS_SECUENCIA.ACTIVA) return;
    seq.pasos.forEach(function (paso) {
      if (paso.estado !== ESTADOS_PASO.PENDIENTE) return;
      if (new Date(paso.fechaProgramada).getTime() <= tsAhora) {
        listos.push({
          secuenciaId: seq.id,
          codCar: seq.codCar,
          threadId: seq.threadId,
          paso: _clonarPaso(paso)
        });
      }
    });
  });

  return listos;
}

function _cambiarEstadoSecuencia(seq, nuevoEstado, estadoPaso) {
  var nuevosPasos = seq.pasos.map(function (p) {
    var clon = _clonarPaso(p);
    if (clon.estado === ESTADOS_PASO.PENDIENTE) {
      clon.estado = estadoPaso;
    }
    return clon;
  });

  return {
    id: seq.id,
    codCar: seq.codCar,
    threadId: seq.threadId,
    nombre: seq.nombre,
    estado: nuevoEstado,
    fechaCreacion: seq.fechaCreacion,
    pasos: nuevosPasos
  };
}

function detenerSecuencia(seq) {
  return _cambiarEstadoSecuencia(seq, ESTADOS_SECUENCIA.DETENIDA, ESTADOS_PASO.DETENIDO);
}

function cancelarSecuencia(seq) {
  return _cambiarEstadoSecuencia(seq, ESTADOS_SECUENCIA.CANCELADA, ESTADOS_PASO.CANCELADO);
}

function obtenerSecuenciasActivas(almacen) {
  if (!almacen || !Array.isArray(almacen)) return [];
  return almacen.filter(function (seq) {
    return seq.estado === ESTADOS_SECUENCIA.ACTIVA;
  });
}

function obtenerPredefinida(nombre) {
  var config = SECUENCIAS_PREDEFINIDAS[nombre];
  if (!config) return null;
  return {
    pasos: config.pasos.map(function (p) {
      return { orden: p.orden, plantilla: p.plantilla, horasEspera: p.horasEspera };
    })
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearSecuencia: crearSecuencia,
    evaluarPasos: evaluarPasos,
    detenerSecuencia: detenerSecuencia,
    cancelarSecuencia: cancelarSecuencia,
    obtenerSecuenciasActivas: obtenerSecuenciasActivas,
    obtenerPredefinida: obtenerPredefinida,
    MAX_PASOS: MAX_PASOS_SECUENCIA, // Alias para compatibilidad con tests
    ESTADOS_SECUENCIA: ESTADOS_SECUENCIA,
    ESTADOS_PASO: ESTADOS_PASO,
    SECUENCIAS_PREDEFINIDAS: SECUENCIAS_PREDEFINIDAS
  };
}
