// tests/TDD/unit/test_store.js - Tests para Store movil
'use strict';

const { Store } = require('../../../src/movil/js/store');

// Mock localStorage
let storage;

beforeEach(() => {
  storage = {};
  global.localStorage = {
    getItem: jest.fn(k => storage[k] || null),
    setItem: jest.fn((k, v) => { storage[k] = v; }),
    removeItem: jest.fn(k => { delete storage[k]; })
  };
});

afterEach(() => {
  delete global.localStorage;
});

describe('Store.registros', () => {
  test('obtenerRegistros retorna array vacio sin datos', () => {
    expect(Store.obtenerRegistros()).toEqual([]);
  });

  test('guardarRegistros persiste y obtenerRegistros lo recupera', () => {
    const registros = [{ messageId: 'm1', codCar: 123 }];
    Store.guardarRegistros(registros);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'registros',
      JSON.stringify(registros)
    );
    expect(Store.obtenerRegistros()).toEqual(registros);
  });

  test('obtenerRegistrosPorCarga filtra por codCar', () => {
    const registros = [
      { messageId: 'm1', codCar: 123 },
      { messageId: 'm2', codCar: 456 },
      { messageId: 'm3', codCar: 123 }
    ];
    Store.guardarRegistros(registros);

    expect(Store.obtenerRegistrosPorCarga(123)).toEqual([
      { messageId: 'm1', codCar: 123 },
      { messageId: 'm3', codCar: 123 }
    ]);
  });

  test('obtenerRegistrosPorCarga retorna vacio si no hay coincidencias', () => {
    Store.guardarRegistros([{ messageId: 'm1', codCar: 123 }]);
    expect(Store.obtenerRegistrosPorCarga(999)).toEqual([]);
  });
});

describe('Store.config', () => {
  test('obtenerConfig retorna defaults sin datos previos', () => {
    const config = Store.obtenerConfig();

    expect(config.gasUrl).toBe('');
    expect(config.intervaloMinutos).toBe(15);
    expect(config.emailsPorMinuto).toBe(10);
  });

  test('guardarConfig persiste y obtenerConfig lo recupera', () => {
    const config = { gasUrl: 'https://test.com', intervaloMinutos: 30 };
    Store.guardarConfig(config);

    const recuperada = Store.obtenerConfig();
    expect(recuperada.gasUrl).toBe('https://test.com');
    expect(recuperada.intervaloMinutos).toBe(30);
  });

  test('obtenerConfig fusiona defaults con datos guardados', () => {
    Store.guardarConfig({ gasUrl: 'https://test.com' });
    const config = Store.obtenerConfig();

    expect(config.gasUrl).toBe('https://test.com');
    expect(config.emailsPorMinuto).toBe(10);
  });
});

describe('Store.plantillas', () => {
  test('obtenerPlantillas retorna array vacio sin datos', () => {
    expect(Store.obtenerPlantillas()).toEqual([]);
  });

  test('guardarPlantillas persiste y recupera', () => {
    const plantillas = [{ id: 'tpl_1', alias: 'Test' }];
    Store.guardarPlantillas(plantillas);
    expect(Store.obtenerPlantillas()).toEqual(plantillas);
  });
});

describe('Store.alertas', () => {
  test('obtenerAlertas retorna array vacio sin datos', () => {
    expect(Store.obtenerAlertas()).toEqual([]);
  });

  test('guardarAlertas persiste y recupera', () => {
    const alertas = [{ id: 'R2_t1', nivel: 'ALTO' }];
    Store.guardarAlertas(alertas);
    expect(Store.obtenerAlertas()).toEqual(alertas);
  });
});

describe('Store.pieComun', () => {
  test('obtenerPieComun retorna string vacio sin datos', () => {
    expect(Store.obtenerPieComun()).toBe('');
  });

  test('guardarPieComun persiste y recupera', () => {
    Store.guardarPieComun('<p>Firma</p>');
    expect(Store.obtenerPieComun()).toBe('<p>Firma</p>');
  });
});

describe('Store.ultimoBarrido', () => {
  test('obtenerUltimoBarrido retorna null sin datos', () => {
    expect(Store.obtenerUltimoBarrido()).toBeNull();
  });

  test('guardarUltimoBarrido persiste y recupera', () => {
    Store.guardarUltimoBarrido('2026-02-16T10:00:00.000Z');
    expect(Store.obtenerUltimoBarrido()).toBe('2026-02-16T10:00:00.000Z');
  });
});
