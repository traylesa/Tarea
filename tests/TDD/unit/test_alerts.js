/**
 * test_alerts.js - Tests unitarios para motor de alertas proactivas
 * TDD: Estos tests se escriben ANTES del codigo (fase RED)
 */

// Importar constantes primero (deben estar en scope global antes de alerts.js)
const constants = require('../../../src/extension/constants.js');
Object.assign(global, constants);

const {
  evaluarAlertas,
  deduplicar,
  calcularBadge,
  generarNotificaciones,
  NIVEL
} = require('../../../src/extension/alerts.js');

// Helper: crear fecha relativa a "ahora"
function horasAtras(h, ahora) {
  return new Date(ahora.getTime() - h * 3600000).toISOString();
}

function diasAtras(d, ahora) {
  return new Date(ahora.getTime() - d * 86400000).toISOString();
}

function horasAdelante(h, ahora) {
  return new Date(ahora.getTime() + h * 3600000).toISOString();
}

function hoy(ahora) {
  return ahora.toISOString().slice(0, 10);
}

const CONFIG_BASE = {
  alertas: {
    activado: true,
    silencioUmbralH: 4,
    estancamientoMaxH: { '12': 3, '19': 24, '22': 3 },
    docsUmbralDias: 2,
    cooldownMs: 3600000
  }
};

// --- Tests entrada vacia ---

describe('evaluarAlertas', () => {
  const ahora = new Date('2026-02-15T10:00:00Z');

  test('retorna array vacio sin registros', () => {
    const result = evaluarAlertas([], CONFIG_BASE, [], ahora);
    expect(result).toEqual([]);
  });

  test('retorna array vacio con null', () => {
    const result = evaluarAlertas(null, CONFIG_BASE, [], ahora);
    expect(result).toEqual([]);
  });

  test('retorna array vacio si alertas desactivadas', () => {
    const config = { alertas: { activado: false } };
    const registros = [{ codCar: 100, fCarga: hoy(ahora), estado: '' }];
    const result = evaluarAlertas(registros, config, [], ahora);
    expect(result).toEqual([]);
  });
});

// --- R1/R6: Carga HOY sin orden ---

describe('R1/R6: cargaHoySinOrden', () => {
  const ahora = new Date('2026-02-15T10:00:00Z');

  test('genera alerta ALTO si fCarga=HOY sin ENVIADO y > 3h', () => {
    const registros = [{
      codCar: 168400, fCarga: hoy(ahora), hCarga: '16:00',
      estado: 'RECIBIDO', threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R6' && a.codCar === 168400);
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.ALTO);
  });

  test('genera alerta CRITICO si fCarga=HOY sin ENVIADO y < 3h', () => {
    const registros = [{
      codCar: 168400, fCarga: hoy(ahora), hCarga: '12:00',
      estado: 'RECIBIDO', threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R6' && a.codCar === 168400);
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.CRITICO);
  });

  test('NO genera alerta si tiene estado ENVIADO', () => {
    const registros = [
      { codCar: 168400, fCarga: hoy(ahora), hCarga: '12:00', estado: 'RECIBIDO', threadId: 't1' },
      { codCar: 168400, fCarga: hoy(ahora), hCarga: '12:00', estado: 'ENVIADO', threadId: 't2' }
    ];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R6' && a.codCar === 168400);
    expect(alerta).toBeUndefined();
  });

  test('NO genera alerta sin fCarga', () => {
    const registros = [{ codCar: 168400, estado: 'RECIBIDO', threadId: 't1' }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R6');
    expect(alerta).toBeUndefined();
  });
});

// --- R2: Silencio transportista ---

describe('R2: silencioTransportista', () => {
  const ahora = new Date('2026-02-15T14:00:00Z');

  test('genera alerta ALTO si ENVIADO > umbralH sin RECIBIDO', () => {
    const registros = [{
      codCar: 168300, estado: 'ENVIADO', threadId: 't1',
      fechaCorreo: horasAtras(5, ahora)
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R2');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.ALTO);
  });

  test('NO genera alerta si hay RECIBIDO en mismo thread', () => {
    const registros = [
      { codCar: 168300, estado: 'ENVIADO', threadId: 't1', fechaCorreo: horasAtras(5, ahora) },
      { codCar: 168300, estado: 'RECIBIDO', threadId: 't1', fechaCorreo: horasAtras(1, ahora) }
    ];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R2' && a.threadId === 't1');
    expect(alerta).toBeUndefined();
  });

  test('NO genera alerta si ENVIADO < umbralH', () => {
    const registros = [{
      codCar: 168300, estado: 'ENVIADO', threadId: 't1',
      fechaCorreo: horasAtras(2, ahora)
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R2');
    expect(alerta).toBeUndefined();
  });
});

// --- R3: Fase estancada ---

describe('R3: faseEstancada', () => {
  const ahora = new Date('2026-02-15T14:00:00Z');

  test('genera alerta MEDIO si fase > tiempoMax', () => {
    const registros = [{
      codCar: 168200, fase: '12', fechaCorreo: horasAtras(4, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R3');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.MEDIO);
  });

  test('genera alerta ALTO si fase > 2x tiempoMax', () => {
    const registros = [{
      codCar: 168200, fase: '12', fechaCorreo: horasAtras(7, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R3');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.ALTO);
  });

  test('NO genera alerta si fase sin tiempoMax configurado', () => {
    const registros = [{
      codCar: 168200, fase: '00', fechaCorreo: horasAtras(100, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R3');
    expect(alerta).toBeUndefined();
  });

  test('NO genera alerta sin fase', () => {
    const registros = [{
      codCar: 168200, fechaCorreo: horasAtras(100, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R3');
    expect(alerta).toBeUndefined();
  });
});

// --- R4: Docs pendientes ---

describe('R4: docsPendientes', () => {
  const ahora = new Date('2026-02-15T14:00:00Z');

  test('genera alerta MEDIO si fase=29 y > umbralDias', () => {
    const registros = [{
      codCar: 168100, fase: '29', fEntrega: diasAtras(3, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R4');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.MEDIO);
  });

  test('genera alerta ALTO si fase=29 y > 5 dias', () => {
    const registros = [{
      codCar: 168100, fase: '29', fEntrega: diasAtras(6, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R4');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.ALTO);
  });

  test('usa fechaCorreo como fallback si no hay fEntrega', () => {
    const registros = [{
      codCar: 168100, fase: '29', fechaCorreo: diasAtras(3, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R4');
    expect(alerta).toBeDefined();
  });

  test('NO genera si fase=30 (documentado)', () => {
    const registros = [{
      codCar: 168100, fase: '30', fEntrega: diasAtras(10, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R4');
    expect(alerta).toBeUndefined();
  });
});

// --- R5: Incidencia activa ---

describe('R5: incidenciaActiva', () => {
  const ahora = new Date('2026-02-15T14:00:00Z');

  test('genera alerta CRITICO si fase=05', () => {
    const registros = [{
      codCar: 168500, fase: '05', threadId: 't1',
      nombreTransportista: 'Garcia'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R5');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.CRITICO);
  });

  test('genera alerta CRITICO si fase=25', () => {
    const registros = [{
      codCar: 168500, fase: '25', threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R5');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.CRITICO);
  });

  test('agrupa multiples incidencias', () => {
    const registros = [
      { codCar: 168500, fase: '05', threadId: 't1' },
      { codCar: 168501, fase: '25', threadId: 't2' },
      { codCar: 168502, fase: '05', threadId: 't3' }
    ];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alertas = result.filter(a => a.regla === 'R5');
    expect(alertas.length).toBe(3);
  });
});

// --- Deduplicacion ---

describe('deduplicar', () => {
  const ahora = new Date('2026-02-15T14:00:00Z');

  test('filtra alertas repetidas dentro del cooldown', () => {
    const nuevas = [
      { id: 'R5_168500', regla: 'R5', timestamp: ahora.toISOString() }
    ];
    const previas = [
      { id: 'R5_168500', regla: 'R5', timestamp: horasAtras(0.5, ahora) }
    ];
    const result = deduplicar(nuevas, previas, 3600000);
    expect(result).toHaveLength(0);
  });

  test('permite alertas fuera del cooldown', () => {
    const nuevas = [
      { id: 'R5_168500', regla: 'R5', timestamp: ahora.toISOString() }
    ];
    const previas = [
      { id: 'R5_168500', regla: 'R5', timestamp: horasAtras(2, ahora) }
    ];
    const result = deduplicar(nuevas, previas, 3600000);
    expect(result).toHaveLength(1);
  });

  test('permite alertas sin previas', () => {
    const nuevas = [
      { id: 'R5_168500', regla: 'R5', timestamp: ahora.toISOString() }
    ];
    const result = deduplicar(nuevas, [], 3600000);
    expect(result).toHaveLength(1);
  });
});

// --- Badge ---

describe('calcularBadge', () => {
  test('retorna vacio si sin alertas', () => {
    const result = calcularBadge([]);
    expect(result.texto).toBe('');
  });

  test('retorna rojo si hay CRITICO', () => {
    const alertas = [
      { nivel: NIVEL.CRITICO },
      { nivel: NIVEL.ALTO }
    ];
    const result = calcularBadge(alertas);
    expect(result.texto).toBe('2');
    expect(result.color).toBe('#FF0000');
  });

  test('retorna naranja si max es ALTO', () => {
    const alertas = [
      { nivel: NIVEL.ALTO },
      { nivel: NIVEL.MEDIO }
    ];
    const result = calcularBadge(alertas);
    expect(result.texto).toBe('2');
    expect(result.color).toBe('#FF8C00');
  });

  test('retorna azul si max es MEDIO', () => {
    const alertas = [{ nivel: NIVEL.MEDIO }];
    const result = calcularBadge(alertas);
    expect(result.texto).toBe('1');
    expect(result.color).toBe('#2196F3');
  });
});

// --- Notificaciones ---

describe('generarNotificaciones', () => {
  test('genera notificacion para CRITICO', () => {
    const alertas = [{
      id: 'R5_168500', nivel: NIVEL.CRITICO,
      titulo: 'INCIDENCIA', mensaje: 'Carga 168500'
    }];
    const result = generarNotificaciones(alertas);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('R5_168500');
    expect(result[0].opciones.priority).toBe(2);
  });

  test('genera notificacion para ALTO', () => {
    const alertas = [{
      id: 'R2_t1', nivel: NIVEL.ALTO,
      titulo: 'Sin respuesta', mensaje: 'Transportista no responde'
    }];
    const result = generarNotificaciones(alertas);
    expect(result).toHaveLength(1);
    expect(result[0].opciones.priority).toBe(1);
  });

  test('NO genera notificacion para MEDIO ni BAJO', () => {
    const alertas = [
      { id: 'R3_168200', nivel: NIVEL.MEDIO, titulo: 'Estancado', mensaje: '' },
      { id: 'R4_168100', nivel: NIVEL.BAJO, titulo: 'Docs', mensaje: '' }
    ];
    const result = generarNotificaciones(alertas);
    expect(result).toHaveLength(0);
  });

  test('retorna array vacio si sin alertas', () => {
    expect(generarNotificaciones([])).toEqual([]);
  });

  test('retorna array vacio con null', () => {
    expect(generarNotificaciones(null)).toEqual([]);
  });
});

// --- Cobertura adicional branches ---

describe('branches adicionales', () => {
  const ahora = new Date('2026-02-15T10:00:00Z');

  test('R2 ignora registro sin threadId', () => {
    const registros = [{
      codCar: 100, estado: 'ENVIADO', fechaCorreo: horasAtras(5, ahora)
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    expect(result.filter(a => a.regla === 'R2')).toHaveLength(0);
  });

  test('R3 con codCar en registro', () => {
    const registros = [{
      codCar: 200, fase: '22', fechaCorreo: horasAtras(4, ahora), threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R3');
    expect(alerta).toBeDefined();
    expect(alerta.codCar).toBe(200);
  });

  test('R4 sin codCar usa threadId en id', () => {
    const registros = [{
      fase: '29', fEntrega: diasAtras(3, ahora), threadId: 't99'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R4');
    expect(alerta).toBeDefined();
    expect(alerta.id).toBe('R4_t99');
  });

  test('R6 sin hCarga usa nivel ALTO por defecto', () => {
    const registros = [{
      codCar: 300, fCarga: hoy(ahora), estado: 'RECIBIDO', threadId: 't1'
    }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R6');
    expect(alerta).toBeDefined();
    expect(alerta.nivel).toBe(NIVEL.ALTO);
  });

  test('deduplicar con null previas', () => {
    const nuevas = [{ id: 'R5_1', timestamp: ahora.toISOString() }];
    const result = deduplicar(nuevas, null, 3600000);
    expect(result).toHaveLength(1);
  });

  test('deduplicar con null nuevas', () => {
    expect(deduplicar(null, [], 3600000)).toEqual([]);
  });

  test('calcularBadge con null', () => {
    const result = calcularBadge(null);
    expect(result.texto).toBe('');
  });

  test('config sin alertas retorna vacio', () => {
    const result = evaluarAlertas([{ codCar: 1 }], {}, [], ahora);
    expect(result).toEqual([]);
  });

  test('R5 sin codCar ni nombreTransportista', () => {
    const registros = [{ fase: '25', threadId: 'tx' }];
    const result = evaluarAlertas(registros, CONFIG_BASE, [], ahora);
    const alerta = result.find(a => a.regla === 'R5');
    expect(alerta.codCar).toBeNull();
    expect(alerta.mensaje).toContain('Incidencia');
  });
});
