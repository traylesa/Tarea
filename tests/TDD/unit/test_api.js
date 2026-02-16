// tests/TDD/unit/test_api.js - Tests para API wrapper movil
'use strict';

const { API } = require('../../../src/movil/js/api');

// Mock fetch global
let mockFetch;

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch;
  API.baseUrl = 'https://script.google.com/macros/s/TEST/exec';
});

afterEach(() => {
  delete global.fetch;
});

describe('API.configurar', () => {
  test('establece baseUrl', () => {
    API.configurar('https://ejemplo.com');
    expect(API.baseUrl).toBe('https://ejemplo.com');
  });
});

describe('API.get', () => {
  test('construye URL con action como query param', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: true, registros: [] })
    });

    await API.get('getRegistros');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/TEST/exec?action=getRegistros'
    );
  });

  test('retorna datos cuando ok=true', async () => {
    const datos = { ok: true, registros: [{ codCar: 123 }] };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(datos) });

    const resultado = await API.get('getRegistros');

    expect(resultado.registros).toEqual([{ codCar: 123 }]);
  });

  test('lanza error cuando ok=false', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: false, error: 'Sin permisos' })
    });

    await expect(API.get('getRegistros')).rejects.toThrow('Sin permisos');
  });

  test('lanza error cuando fetch falla', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(API.get('getRegistros')).rejects.toThrow('Network error');
  });
});

describe('API.post', () => {
  test('envia POST con body JSON y action en query', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: true })
    });

    await API.post('actualizarCampo', { messageId: 'abc', campo: 'fase', valor: '19' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/TEST/exec?action=actualizarCampo',
      {
        method: 'POST',
        body: JSON.stringify({ messageId: 'abc', campo: 'fase', valor: '19' })
      }
    );
  });

  test('retorna datos cuando ok=true', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: true, id: 'prog_123' })
    });

    const resultado = await API.post('programarEnvio', { threadId: 't1' });

    expect(resultado.id).toBe('prog_123');
  });

  test('lanza error cuando ok=false', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: false, error: 'Campo invalido' })
    });

    await expect(API.post('actualizarCampo', {})).rejects.toThrow('Campo invalido');
  });
});

describe('API.procesarCorreos', () => {
  test('envia POST con limite', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: true, procesados: 5, hayMas: false, registros: [] })
    });

    const resultado = await API.post('procesarCorreos', { limite: 50 });

    expect(resultado.procesados).toBe(5);
    expect(resultado.hayMas).toBe(false);
  });
});
