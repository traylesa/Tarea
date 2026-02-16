// tests/TDD/unit/test_feedback.js - Tests para Feedback movil
'use strict';

const { Feedback } = require('../../../src/movil/js/feedback');

// Mock navigator.vibrate
let vibrateMock;

beforeEach(() => {
  vibrateMock = jest.fn();
  global.navigator = { vibrate: vibrateMock };
  global.document = {
    createElement: jest.fn(() => ({
      className: '',
      textContent: '',
      innerHTML: '',
      style: {},
      appendChild: jest.fn(),
      remove: jest.fn(),
      addEventListener: jest.fn()
    })),
    body: {
      appendChild: jest.fn(),
      querySelector: jest.fn(() => null)
    },
    getElementById: jest.fn(() => null)
  };
});

afterEach(() => {
  delete global.navigator;
  delete global.document;
  jest.restoreAllMocks();
});

describe('Feedback.vibrar', () => {
  test('vibracion corta (50ms)', () => {
    Feedback.vibrar('corto');
    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  test('vibracion doble (100ms + pausa + 100ms)', () => {
    Feedback.vibrar('doble');
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
  });

  test('vibracion larga (200ms)', () => {
    Feedback.vibrar('largo');
    expect(vibrateMock).toHaveBeenCalledWith(200);
  });

  test('vibracion triple para error', () => {
    Feedback.vibrar('error');
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
  });

  test('no falla si vibrate no disponible', () => {
    global.navigator = {};
    expect(() => Feedback.vibrar('corto')).not.toThrow();
  });
});

describe('Feedback.toast', () => {
  test('crea toast con mensaje', () => {
    const resultado = Feedback.toast('Fase actualizada');
    expect(resultado).toBeDefined();
    expect(resultado.mensaje).toBe('Fase actualizada');
  });

  test('toast con tipo exito usa clase correcta', () => {
    const resultado = Feedback.toast('OK', { tipo: 'exito' });
    expect(resultado.tipo).toBe('exito');
  });

  test('toast con tipo error', () => {
    const resultado = Feedback.toast('Fallo', { tipo: 'error' });
    expect(resultado.tipo).toBe('error');
  });

  test('toast con duracion personalizada', () => {
    const resultado = Feedback.toast('Msg', { duracion: 5000 });
    expect(resultado.duracion).toBe(5000);
  });

  test('toast con callback deshacer', () => {
    const deshacer = jest.fn();
    const resultado = Feedback.toast('Eliminado', { deshacer });
    expect(resultado.deshacer).toBe(deshacer);
  });

  test('duracion default es 3000ms', () => {
    const resultado = Feedback.toast('Test');
    expect(resultado.duracion).toBe(3000);
  });
});
