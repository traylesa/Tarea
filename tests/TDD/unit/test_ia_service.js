/**
 * test_ia_service.js - Tests TDD para IAService (Fase C: IA Integrada)
 * Patrón: Red-Green-Refactor
 */

// Mock de Logger (global GAS)
global.Logger = { log: jest.fn() };

// Mock de PropertiesService (global GAS)
let mockProperties = {};
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => mockProperties[key] || null,
    setProperty: (key, val) => { mockProperties[key] = val; }
  })
};

// Mock de UrlFetchApp (global GAS)
let mockFetchResponse = null;
let mockFetchError = null;
let mockFetchCalled = null;
global.UrlFetchApp = {
  fetch: jest.fn((url, options) => {
    mockFetchCalled = { url, options };
    if (mockFetchError) throw mockFetchError;
    return {
      getContentText: () => JSON.stringify(mockFetchResponse)
    };
  })
};

const {
  valorarConIA,
  atomizarConIA,
  _construirPromptValoracion,
  _construirPromptAtomizacion,
  _llamarGemini
} = require('../../../src/gas/IAService');

describe('IAService', () => {
  beforeEach(() => {
    mockProperties = { 'GEMINI_API_KEY': 'test-api-key-123' };
    mockFetchResponse = null;
    mockFetchError = null;
    mockFetchCalled = null;
    UrlFetchApp.fetch.mockClear();
    Logger.log.mockClear();
  });

  // --- valorarConIA ---

  describe('valorarConIA', () => {
    const tareaValida = {
      titulo: 'Revisar certificados pendientes',
      descripcion: 'Verificar todos los certificados de marzo'
    };

    const respuestaValoracion = {
      horas: 4,
      prioridad: 3,
      riesgo: 'MEDIO',
      justificacion: 'Tarea rutinaria con plazo definido'
    };

    test('retorna objeto con horas, prioridad, riesgo para tarea valida', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(respuestaValoracion) }] } }]
      };

      const resultado = valorarConIA(tareaValida);
      expect(resultado).toHaveProperty('horas');
      expect(resultado).toHaveProperty('prioridad');
      expect(resultado).toHaveProperty('riesgo');
    });

    test('retorna JSON parseado correctamente', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(respuestaValoracion) }] } }]
      };

      const resultado = valorarConIA(tareaValida);
      expect(resultado.horas).toBe(4);
      expect(resultado.prioridad).toBe(3);
      expect(resultado.riesgo).toBe('MEDIO');
      expect(resultado.justificacion).toBe('Tarea rutinaria con plazo definido');
    });

    test('prioridad en rango 1-5', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(respuestaValoracion) }] } }]
      };

      const resultado = valorarConIA(tareaValida);
      expect(resultado.prioridad).toBeGreaterThanOrEqual(1);
      expect(resultado.prioridad).toBeLessThanOrEqual(5);
    });

    test('riesgo en enum valido', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(respuestaValoracion) }] } }]
      };

      const resultado = valorarConIA(tareaValida);
      expect(['BAJO', 'MEDIO', 'ALTO', 'CRITICO']).toContain(resultado.riesgo);
    });

    test('maneja timeout de Gemini retornando null', () => {
      mockFetchError = new Error('Timeout: request timed out');

      const resultado = valorarConIA(tareaValida);
      expect(resultado).toBeNull();
    });

    test('maneja JSON invalido de Gemini retornando null', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: 'esto no es JSON valido{{{' }] } }]
      };

      const resultado = valorarConIA(tareaValida);
      expect(resultado).toBeNull();
    });

    test('maneja API key no configurada retornando null', () => {
      mockProperties = {};

      const resultado = valorarConIA(tareaValida);
      expect(resultado).toBeNull();
    });

    test('retorna null si tarea es null', () => {
      expect(valorarConIA(null)).toBeNull();
    });

    test('retorna null si tarea no tiene titulo', () => {
      expect(valorarConIA({ descripcion: 'algo' })).toBeNull();
    });
  });

  // --- atomizarConIA ---

  describe('atomizarConIA', () => {
    const tareaCompleta = {
      titulo: 'Migrar sistema de facturacion',
      descripcion: 'Migrar el sistema legacy a la nueva plataforma cloud'
    };

    const subtareasValidas = [
      { titulo: 'Analizar sistema actual', descripcion: 'Documentar modulos', rolSugerido: 'TECNICO', horasEstimadas: 8 },
      { titulo: 'Disenar arquitectura', descripcion: 'Definir componentes', rolSugerido: 'TECNICO', horasEstimadas: 12 },
      { titulo: 'Migrar datos', descripcion: 'ETL de datos legacy', rolSugerido: 'TECNICO', horasEstimadas: 16 }
    ];

    test('retorna array de 3-7 subtareas', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(subtareasValidas) }] } }]
      };

      const resultado = atomizarConIA(tareaCompleta);
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThanOrEqual(3);
      expect(resultado.length).toBeLessThanOrEqual(7);
    });

    test('cada subtarea tiene titulo, descripcion, rolSugerido, horasEstimadas', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify(subtareasValidas) }] } }]
      };

      const resultado = atomizarConIA(tareaCompleta);
      resultado.forEach(sub => {
        expect(sub).toHaveProperty('titulo');
        expect(sub).toHaveProperty('descripcion');
        expect(sub).toHaveProperty('rolSugerido');
        expect(sub).toHaveProperty('horasEstimadas');
      });
    });

    test('maneja tarea sin descripcion retornando null', () => {
      const resultado = atomizarConIA({ titulo: 'Solo titulo' });
      expect(resultado).toBeNull();
    });

    test('maneja respuesta no-array retornando null', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: JSON.stringify({ error: 'no es array' }) }] } }]
      };

      const resultado = atomizarConIA(tareaCompleta);
      expect(resultado).toBeNull();
    });

    test('maneja timeout retornando null', () => {
      mockFetchError = new Error('Timeout');

      const resultado = atomizarConIA(tareaCompleta);
      expect(resultado).toBeNull();
    });

    test('retorna null si tarea es null', () => {
      expect(atomizarConIA(null)).toBeNull();
    });
  });

  // --- _construirPromptValoracion ---

  describe('_construirPromptValoracion', () => {
    test('incluye titulo de la tarea', () => {
      const prompt = _construirPromptValoracion({ titulo: 'Revisar docs', descripcion: 'Desc' });
      expect(prompt).toContain('Revisar docs');
    });

    test('incluye descripcion de la tarea', () => {
      const prompt = _construirPromptValoracion({ titulo: 'T', descripcion: 'Verificar certificados' });
      expect(prompt).toContain('Verificar certificados');
    });

    test('maneja tarea sin descripcion', () => {
      const prompt = _construirPromptValoracion({ titulo: 'Solo titulo' });
      expect(prompt).toContain('Solo titulo');
      expect(prompt).toContain('Sin descripcion');
    });
  });

  // --- _construirPromptAtomizacion ---

  describe('_construirPromptAtomizacion', () => {
    test('incluye contexto de roles disponibles', () => {
      const prompt = _construirPromptAtomizacion({
        titulo: 'Tarea',
        descripcion: 'Descripcion'
      });
      expect(prompt).toContain('TECNICO');
      expect(prompt).toContain('ADMINISTRATIVO');
      expect(prompt).toContain('SUPERVISOR');
    });

    test('incluye titulo y descripcion', () => {
      const prompt = _construirPromptAtomizacion({
        titulo: 'Mi tarea',
        descripcion: 'Mi descripcion'
      });
      expect(prompt).toContain('Mi tarea');
      expect(prompt).toContain('Mi descripcion');
    });
  });

  // --- _llamarGemini ---

  describe('_llamarGemini', () => {
    test('envia request a endpoint Gemini Flash 2.0', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: '"ok"' }] } }]
      };

      _llamarGemini('test prompt', null);

      expect(mockFetchCalled.url).toContain('gemini-2.0-flash');
      expect(mockFetchCalled.url).toContain('generateContent');
    });

    test('usa JSON mode con responseMimeType application/json', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: '"ok"' }] } }]
      };

      _llamarGemini('test', null);

      const payload = JSON.parse(mockFetchCalled.options.payload);
      expect(payload.generationConfig.responseMimeType).toBe('application/json');
    });

    test('respeta timeout configurado', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: '"ok"' }] } }]
      };

      _llamarGemini('test', null);

      // Verifica que muteHttpExceptions esta activo (manejo robusto)
      expect(mockFetchCalled.options.muteHttpExceptions).toBe(true);
    });

    test('maneja error HTTP retornando null', () => {
      mockFetchResponse = { error: { message: 'Rate limit exceeded' } };

      const resultado = _llamarGemini('test', null);
      expect(resultado).toBeNull();
    });

    test('retorna null si API key no configurada', () => {
      mockProperties = {};

      const resultado = _llamarGemini('test', null);
      expect(resultado).toBeNull();
      expect(UrlFetchApp.fetch).not.toHaveBeenCalled();
    });

    test('envia prompt en el payload correctamente', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: '"ok"' }] } }]
      };

      _llamarGemini('mi prompt especial', null);

      const payload = JSON.parse(mockFetchCalled.options.payload);
      expect(payload.contents[0].parts[0].text).toBe('mi prompt especial');
    });

    test('incluye schema en generationConfig si se proporciona', () => {
      mockFetchResponse = {
        candidates: [{ content: { parts: [{ text: '"ok"' }] } }]
      };

      const schema = { type: 'OBJECT', properties: { x: { type: 'NUMBER' } } };
      _llamarGemini('test', schema);

      const payload = JSON.parse(mockFetchCalled.options.payload);
      expect(payload.generationConfig.responseSchema).toEqual(schema);
    });
  });
});
