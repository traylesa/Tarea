/**
 * test_alert_summary.js - Tests unitarios para resumen de alertas
 * TDD: Estos tests se escriben ANTES del codigo (fase RED)
 */

const {
  categorizarAlertas,
  calcularKPIs,
  debeMostrarMatutino,
  crearFlagMostrado,
  filtroParaCategoria
} = require('../../../src/extension/alert-summary.js');

// --- Tests categorizarAlertas ---

describe('categorizarAlertas', () => {
  test('retorna categorias vacias con array vacio', () => {
    const result = categorizarAlertas([]);
    expect(result).toEqual({
      urgente: [],
      sinRespuesta: [],
      documentacion: [],
      estancadas: []
    });
  });

  test('retorna categorias vacias con null', () => {
    const result = categorizarAlertas(null);
    expect(result).toEqual({
      urgente: [],
      sinRespuesta: [],
      documentacion: [],
      estancadas: []
    });
  });

  test('agrupa R5 (incidencia) y R6 (carga HOY) en urgente', () => {
    const alertas = [
      { id: 'R5_100', regla: 'R5', nivel: 'CRITICO', titulo: 'INCIDENCIA' },
      { id: 'R6_200', regla: 'R6', nivel: 'ALTO', titulo: 'Carga HOY' }
    ];
    const result = categorizarAlertas(alertas);
    expect(result.urgente).toHaveLength(2);
    expect(result.sinRespuesta).toHaveLength(0);
  });

  test('agrupa R2 (silencio transportista) en sinRespuesta', () => {
    const alertas = [
      { id: 'R2_t1', regla: 'R2', nivel: 'ALTO', titulo: 'Sin respuesta' }
    ];
    const result = categorizarAlertas(alertas);
    expect(result.sinRespuesta).toHaveLength(1);
    expect(result.urgente).toHaveLength(0);
  });

  test('agrupa R4 (docs pendientes) en documentacion', () => {
    const alertas = [
      { id: 'R4_100', regla: 'R4', nivel: 'MEDIO', titulo: 'Docs pendientes' }
    ];
    const result = categorizarAlertas(alertas);
    expect(result.documentacion).toHaveLength(1);
  });

  test('agrupa R3 (fase estancada) en estancadas', () => {
    const alertas = [
      { id: 'R3_100', regla: 'R3', nivel: 'MEDIO', titulo: 'Fase estancada' }
    ];
    const result = categorizarAlertas(alertas);
    expect(result.estancadas).toHaveLength(1);
  });

  test('distribuye alertas mixtas correctamente', () => {
    const alertas = [
      { id: 'R5_1', regla: 'R5' },
      { id: 'R2_1', regla: 'R2' },
      { id: 'R4_1', regla: 'R4' },
      { id: 'R3_1', regla: 'R3' },
      { id: 'R6_1', regla: 'R6' },
      { id: 'R2_2', regla: 'R2' }
    ];
    const result = categorizarAlertas(alertas);
    expect(result.urgente).toHaveLength(2);
    expect(result.sinRespuesta).toHaveLength(2);
    expect(result.documentacion).toHaveLength(1);
    expect(result.estancadas).toHaveLength(1);
  });
});

// --- Tests calcularKPIs ---

describe('calcularKPIs', () => {
  test('retorna KPIs en 0 con registros y alertas vacios', () => {
    const result = calcularKPIs([], []);
    expect(result).toEqual({
      activas: 0,
      hoy: 0,
      totalAlertas: 0,
      sinRespuesta: 0,
      sinDocs: 0
    });
  });

  test('cuenta cargas activas como codCar unicos', () => {
    const registros = [
      { codCar: 100, estado: 'ENVIADO' },
      { codCar: 100, estado: 'RECIBIDO' },
      { codCar: 200, estado: 'ENVIADO' },
      { codCar: null, estado: 'ENVIADO' }
    ];
    const result = calcularKPIs(registros, []);
    expect(result.activas).toBe(2);
  });

  test('cuenta registros de hoy', () => {
    const hoy = new Date('2026-02-15T10:00:00Z');
    const registros = [
      { codCar: 100, fCarga: '2026-02-15' },
      { codCar: 200, fCarga: '2026-02-15' },
      { codCar: 300, fCarga: '2026-02-14' }
    ];
    const result = calcularKPIs(registros, [], hoy);
    expect(result.hoy).toBe(2);
  });

  test('cuenta total alertas', () => {
    const alertas = [
      { id: 'R2_1', regla: 'R2' },
      { id: 'R5_1', regla: 'R5' },
      { id: 'R4_1', regla: 'R4' }
    ];
    const result = calcularKPIs([], alertas);
    expect(result.totalAlertas).toBe(3);
  });

  test('cuenta alertas R2 como sinRespuesta', () => {
    const alertas = [
      { id: 'R2_1', regla: 'R2' },
      { id: 'R2_2', regla: 'R2' },
      { id: 'R5_1', regla: 'R5' }
    ];
    const result = calcularKPIs([], alertas);
    expect(result.sinRespuesta).toBe(2);
  });

  test('cuenta alertas R4 como sinDocs', () => {
    const alertas = [
      { id: 'R4_1', regla: 'R4' },
      { id: 'R4_2', regla: 'R4' },
      { id: 'R3_1', regla: 'R3' }
    ];
    const result = calcularKPIs([], alertas);
    expect(result.sinDocs).toBe(2);
  });
});

// --- Tests debeMostrarMatutino ---

describe('debeMostrarMatutino', () => {
  const ahora = new Date('2026-02-15T10:00:00Z');
  const configActivo = { activado: true, hora: '08:00' };

  test('retorna true sin flag (primera vez)', () => {
    const result = debeMostrarMatutino(null, configActivo, ahora);
    expect(result).toBe(true);
  });

  test('retorna false si flag es de hoy', () => {
    const flag = { fecha: '2026-02-15', pospuestoHasta: null };
    const result = debeMostrarMatutino(flag, configActivo, ahora);
    expect(result).toBe(false);
  });

  test('retorna true si flag es de ayer', () => {
    const flag = { fecha: '2026-02-14', pospuestoHasta: null };
    const result = debeMostrarMatutino(flag, configActivo, ahora);
    expect(result).toBe(true);
  });

  test('retorna false si pospuesto hasta hora futura', () => {
    const flag = { fecha: '2026-02-15', pospuestoHasta: '2026-02-15T11:00:00Z' };
    const result = debeMostrarMatutino(flag, configActivo, ahora);
    expect(result).toBe(false);
  });

  test('retorna true si pospuesto pero hora ya paso', () => {
    const flag = { fecha: '2026-02-15', pospuestoHasta: '2026-02-15T09:00:00Z' };
    const result = debeMostrarMatutino(flag, configActivo, ahora);
    expect(result).toBe(true);
  });

  test('retorna false si config desactivado', () => {
    const configOff = { activado: false, hora: '08:00' };
    const result = debeMostrarMatutino(null, configOff, ahora);
    expect(result).toBe(false);
  });

  test('retorna false si hora actual es antes de hora configurada', () => {
    const temprano = new Date('2026-02-15T06:00:00Z');
    const result = debeMostrarMatutino(null, configActivo, temprano);
    expect(result).toBe(false);
  });
});

// --- Tests crearFlagMostrado ---

describe('crearFlagMostrado', () => {
  const ahora = new Date('2026-02-15T10:00:00Z');

  test('crea flag con fecha de hoy sin posponer', () => {
    const result = crearFlagMostrado(ahora);
    expect(result.fecha).toBe('2026-02-15');
    expect(result.pospuestoHasta).toBeNull();
  });

  test('crea flag pospuesto con minutos', () => {
    const result = crearFlagMostrado(ahora, 60);
    expect(result.fecha).toBe('2026-02-15');
    expect(result.pospuestoHasta).toBe('2026-02-15T11:00:00.000Z');
  });

  test('crea flag pospuesto con 0 minutos equivale a sin posponer', () => {
    const result = crearFlagMostrado(ahora, 0);
    expect(result.pospuestoHasta).toBeNull();
  });
});

// --- Tests filtroParaCategoria ---

describe('filtroParaCategoria', () => {
  test('categoria urgente genera filtro con codCar de alertas R5/R6', () => {
    const alertas = [
      { id: 'R5_100', regla: 'R5', codCar: 100 },
      { id: 'R6_200', regla: 'R6', codCar: 200 }
    ];
    const result = filtroParaCategoria('urgente', alertas);
    expect(result).toEqual([
      { field: 'codCar', type: 'in', value: [100, 200] }
    ]);
  });

  test('categoria sinRespuesta genera filtro estado=ENVIADO', () => {
    const alertas = [
      { id: 'R2_t1', regla: 'R2', threadId: 't1' }
    ];
    const result = filtroParaCategoria('sinRespuesta', alertas);
    expect(result).toEqual([
      { field: 'estado', type: '=', value: 'ENVIADO' }
    ]);
  });

  test('categoria documentacion genera filtro fase=29', () => {
    const alertas = [
      { id: 'R4_100', regla: 'R4', codCar: 100 }
    ];
    const result = filtroParaCategoria('documentacion', alertas);
    expect(result).toEqual([
      { field: 'fase', type: '=', value: '29' }
    ]);
  });

  test('categoria estancadas genera filtro con codCar de alertas R3', () => {
    const alertas = [
      { id: 'R3_100', regla: 'R3', codCar: 100 },
      { id: 'R3_200', regla: 'R3', codCar: 200 }
    ];
    const result = filtroParaCategoria('estancadas', alertas);
    expect(result).toEqual([
      { field: 'codCar', type: 'in', value: [100, 200] }
    ]);
  });

  test('categoria desconocida retorna array vacio', () => {
    const result = filtroParaCategoria('inexistente', []);
    expect(result).toEqual([]);
  });
});
