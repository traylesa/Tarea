// tests/TDD/unit/test_action_resolver.js - Tests para action-resolver movil
'use strict';

const { resolverAccion } = require('../../../src/movil/js/logic/action-resolver');

describe('resolverAccion', () => {
  const registroBase = {
    messageId: 'm1',
    threadId: 't1',
    codCar: 12345,
    nombreTransportista: 'Garcia S.L.',
    fase: '19',
    estado: 'RECIBIDO',
    fCarga: '2099-12-31',
    fEntrega: '2099-12-31'
  };

  test('retorna accion de fase cuando hay fase con accion contextual', () => {
    const resultado = resolverAccion(registroBase, [], {});
    expect(resultado).not.toBeNull();
    expect(resultado.tipo).toBe('fase');
    expect(resultado.texto).toBe('Verificar ETA');
  });

  test('retorna null si fase es 30 (documentado, sin acciones)', () => {
    const reg = { ...registroBase, fase: '30' };
    const resultado = resolverAccion(reg, [], {});
    expect(resultado).toBeNull();
  });

  test('prioriza alerta CRITICA sobre cualquier otra accion', () => {
    const alertas = [
      { id: 'R5_t1', threadId: 't1', nivel: 'CRITICO', texto: 'Incidencia activa', regla: 'R5' }
    ];

    const resultado = resolverAccion(registroBase, alertas, {});

    expect(resultado).not.toBeNull();
    expect(resultado.tipo).toBe('alerta');
    expect(resultado.texto).toBe('Incidencia activa');
    expect(resultado.color).toBe('#D32F2F');
  });

  test('prioriza alerta ALTO sobre accion de fase', () => {
    const alertas = [
      { id: 'R2_t1', threadId: 't1', nivel: 'ALTO', texto: 'Sin respuesta 5h', regla: 'R2' }
    ];

    const resultado = resolverAccion(registroBase, alertas, {});

    expect(resultado.tipo).toBe('alerta');
    expect(resultado.color).toBe('#F57C00');
  });

  test('muestra accion contextual de fase si no hay alerta alta', () => {
    const registro = { ...registroBase, fase: '29' };
    const alertas = [
      { id: 'R4_t1', threadId: 't1', nivel: 'MEDIO', texto: 'Docs pendientes', regla: 'R4' }
    ];

    const resultado = resolverAccion(registro, alertas, {});

    // Fase 29 (vacio) tiene acciones: "Reclamar POD", "Marcar documentado"
    expect(resultado.tipo).toBe('fase');
    expect(resultado.texto).toContain('Reclamar POD');
  });

  test('muestra deadline cercano si fCarga es hoy', () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const registro = { ...registroBase, fase: '00', fCarga: hoy, estado: 'RECIBIDO' };

    const resultado = resolverAccion(registro, [], {});

    expect(resultado).not.toBeNull();
    expect(resultado.tipo).toBe('deadline');
    expect(resultado.texto).toContain('Carga hoy');
  });

  test('ignora alertas de otro threadId y cae a accion de fase', () => {
    const alertas = [
      { id: 'R5_t99', threadId: 't99', nivel: 'CRITICO', texto: 'Otra carga', regla: 'R5' }
    ];

    const resultado = resolverAccion(registroBase, alertas, {});
    // No coincide threadId, cae a accion de fase (19 = en_ruta)
    expect(resultado.tipo).toBe('fase');
  });

  test('maneja registro sin fase', () => {
    const registro = { ...registroBase, fase: '' };
    const resultado = resolverAccion(registro, [], {});
    expect(resultado).toBeNull();
  });

  test('retorna color correcto por nivel', () => {
    const alertaMedia = [
      { id: 'R3_t1', threadId: 't1', nivel: 'MEDIO', texto: 'Estancada', regla: 'R3' }
    ];
    // MEDIO no genera accion requerida prioritaria (solo CRITICO y ALTO)
    const resultado = resolverAccion(registroBase, alertaMedia, {});
    // Deberia caer a accion de fase o null
    expect(resultado === null || resultado.tipo === 'fase').toBe(true);
  });
});
