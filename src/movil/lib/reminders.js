/**
 * reminders.js - Modulo de recordatorios con snooze
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 3: HU-07 (manuales) + HU-08 (sugerencias automaticas)
 */

var PRESETS = {
  '15min': PRESET_15_MIN,
  '30min': PRESET_30_MIN,
  '1h': PRESET_1_HORA,
  '2h': PRESET_2_HORAS,
  '4h': PRESET_4_HORAS,
  'manana': -1
};

var SUGERENCIAS_POR_FASE = {
  '19': { texto: 'Verificar descarga', horasAntes: 8 },
  '29': { texto: 'Reclamar POD', horasAntes: 24 }
};

function _generarId() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function calcularFechaDisparo(preset, ahora) {
  var minutos = PRESETS[preset];

  if (preset === 'manana') {
    var manana = mananaPorLaManana(ahora);
    return manana.toISOString();
  }

  if (!minutos || minutos < 0) minutos = 60;
  return new Date(ahora.getTime() + minutos * MS_POR_MINUTO).toISOString();
}

function crearRecordatorio(texto, codCar, preset, ahora, listaExistente, asunto) {
  if (!texto || !texto.trim()) {
    throw new Error('El texto del recordatorio es obligatorio');
  }

  if (listaExistente && listaExistente.length >= MAX_RECORDATORIOS) {
    throw new Error('Se ha alcanzado el limite de ' + MAX_RECORDATORIOS + ' recordatorios');
  }

  return {
    id: _generarId(),
    codCar: codCar !== undefined ? codCar : null,
    asunto: asunto || null,
    texto: texto.trim(),
    fechaCreacion: ahora.toISOString(),
    fechaDisparo: calcularFechaDisparo(preset, ahora),
    snoozeCount: 0,
    origen: 'manual'
  };
}

function eliminarRecordatorio(id, lista) {
  if (!lista) return [];
  return lista.filter(function(r) { return r.id !== id; });
}

function completarRecordatorio(id, lista) {
  return eliminarRecordatorio(id, lista);
}

function obtenerActivos(lista, ahora) {
  if (!lista || !Array.isArray(lista)) return [];
  var tsAhora = ahora.getTime();

  return lista
    .filter(function(r) { return new Date(r.fechaDisparo).getTime() > tsAhora; })
    .sort(function(a, b) {
      return new Date(a.fechaDisparo).getTime() - new Date(b.fechaDisparo).getTime();
    });
}

function aplicarSnooze(id, preset, lista, ahora) {
  if (!lista) return [];
  return lista.map(function(r) {
    if (r.id !== id) return r;
    return {
      id: r.id,
      codCar: r.codCar,
      asunto: r.asunto || null,
      texto: r.texto,
      fechaCreacion: r.fechaCreacion,
      fechaDisparo: calcularFechaDisparo(preset, ahora),
      snoozeCount: (r.snoozeCount || 0) + 1,
      origen: r.origen
    };
  });
}

function evaluarPendientes(lista, ahora) {
  if (!lista || !Array.isArray(lista)) return [];
  var tsAhora = ahora.getTime();

  return lista.filter(function(r) {
    return new Date(r.fechaDisparo).getTime() <= tsAhora;
  });
}

function generarSugerencia(fase, config) {
  if (!config || !config.recordatorios) return null;
  if (!config.recordatorios.sugerenciasActivadas) return null;

  var sug = SUGERENCIAS_POR_FASE[fase];
  if (!sug) return null;

  return { texto: sug.texto, horasAntes: sug.horasAntes };
}

function aceptarSugerencia(sugerencia, codCar, ahora, asunto) {
  return {
    id: _generarId(),
    codCar: codCar !== undefined ? codCar : null,
    asunto: asunto || null,
    texto: sugerencia.texto,
    fechaCreacion: ahora.toISOString(),
    fechaDisparo: new Date(ahora.getTime() + sugerencia.horasAntes * MS_POR_HORA).toISOString(),
    snoozeCount: 0,
    origen: 'sugerido'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearRecordatorio: crearRecordatorio,
    eliminarRecordatorio: eliminarRecordatorio,
    completarRecordatorio: completarRecordatorio,
    obtenerActivos: obtenerActivos,
    aplicarSnooze: aplicarSnooze,
    calcularFechaDisparo: calcularFechaDisparo,
    evaluarPendientes: evaluarPendientes,
    generarSugerencia: generarSugerencia,
    aceptarSugerencia: aceptarSugerencia,
    PRESETS: PRESETS,
    MAX_RECORDATORIOS: MAX_RECORDATORIOS,
    SUGERENCIAS_POR_FASE: SUGERENCIAS_POR_FASE
  };
}
