/**
 * Tests unitarios para config.js
 */

// Importar constantes primero (deben estar en scope global antes de config.js)
const constants = require('../../../src/extension/constants.js');
Object.assign(global, constants);

const mockStorage = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  global.chrome = {
    storage: {
      local: {
        get: async (key) => {
          const result = {};
          if (typeof key === 'string') result[key] = mockStorage[key] || undefined;
          return result;
        },
        set: async (data) => { Object.assign(mockStorage, data); }
      }
    }
  };
});

const {
  getDefaults,
  validar,
  cargar,
  guardar,
  STORAGE_KEY_CONFIG,
  MIN_INTERVALO,
  MAX_INTERVALO
} = require('../../../src/extension/config.js');

describe('config', () => {
  describe('getDefaults', () => {
    test('retorna objeto con gasUrl string', () => {
      expect(typeof getDefaults().gasUrl).toBe('string');
    });

    test('retorna intervaloMinutos 15 por defecto', () => {
      expect(getDefaults().intervaloMinutos).toBe(15);
    });

    test('retorna rutaCsvErp string', () => {
      expect(typeof getDefaults().rutaCsvErp).toBe('string');
    });

    test('retorna patrones con codcarAdjunto y keywordsAdmin', () => {
      const d = getDefaults();
      expect(d.patrones).toBeDefined();
      expect(typeof d.patrones.codcarAdjunto).toBe('string');
      expect(typeof d.patrones.keywordsAdmin).toBe('string');
    });

    test('retorna ventana con width y height', () => {
      const d = getDefaults();
      expect(d.ventana).toBeDefined();
      expect(d.ventana.width).toBe(800);
      expect(d.ventana.height).toBe(600);
    });

    test('incluye fases como array', () => {
      const d = getDefaults();
      expect(Array.isArray(d.fases)).toBe(true);
      expect(d.fases.length).toBeGreaterThan(0);
    });
  });

  describe('validar', () => {
    test('config valida retorna valido=true, errores vacios', () => {
      const config = getDefaults();
      config.gasUrl = 'https://script.google.com/macros/s/abc/exec';
      const result = validar(config);
      expect(result.valido).toBe(true);
      expect(result.errores).toHaveLength(0);
    });

    test('gasUrl vacio es valido (opcional)', () => {
      const config = getDefaults();
      config.gasUrl = '';
      expect(validar(config).valido).toBe(true);
    });

    test('gasUrl sin https falla', () => {
      const config = getDefaults();
      config.gasUrl = 'http://inseguro.com';
      const result = validar(config);
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('URL'))).toBe(true);
    });

    test('gasUrl con texto random falla', () => {
      const config = getDefaults();
      config.gasUrl = 'no-es-url';
      expect(validar(config).valido).toBe(false);
    });

    test('intervalo menor a MIN_INTERVALO falla', () => {
      const config = getDefaults();
      config.intervaloMinutos = 0;
      const result = validar(config);
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('intervalo'))).toBe(true);
    });

    test('intervalo mayor a MAX_INTERVALO falla', () => {
      const config = getDefaults();
      config.intervaloMinutos = 1441;
      expect(validar(config).valido).toBe(false);
    });

    test('intervalo decimal falla', () => {
      const config = getDefaults();
      config.intervaloMinutos = 15.5;
      expect(validar(config).valido).toBe(false);
    });

    test('regex valida pasa', () => {
      const config = getDefaults();
      config.patrones.codcarAdjunto = 'Carga_\\d+\\.pdf';
      expect(validar(config).valido).toBe(true);
    });

    test('regex invalida falla', () => {
      const config = getDefaults();
      config.patrones.codcarAdjunto = '[invalid(';
      const result = validar(config);
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('regex') || e.includes('patron'))).toBe(true);
    });

    test('keywordsAdmin regex invalida falla', () => {
      const config = getDefaults();
      config.patrones.keywordsAdmin = '(unclosed';
      expect(validar(config).valido).toBe(false);
    });

    test('valida seccion fases con duplicados', () => {
      const config = getDefaults();
      config.fases = [
        { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
        { codigo: '00', nombre: 'B', orden: 2, es_critica: false, clase_css: '', activa: true }
      ];
      const result = validar(config);
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => e.includes('duplicado') || e.includes('unico'))).toBe(true);
    });
  });

  describe('cargar / guardar', () => {
    test('cargar sin datos previos retorna defaults', async () => {
      const config = await cargar();
      expect(config.intervaloMinutos).toBe(15);
      expect(config.ventana.width).toBe(800);
    });

    test('guardar y cargar persiste datos', async () => {
      const config = getDefaults();
      config.gasUrl = 'https://test.com/exec';
      config.intervaloMinutos = 30;
      await guardar(config);

      const cargada = await cargar();
      expect(cargada.gasUrl).toBe('https://test.com/exec');
      expect(cargada.intervaloMinutos).toBe(30);
    });

    test('cargar mergea config parcial con defaults', async () => {
      mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: 'https://parcial.com' };
      const config = await cargar();
      expect(config.gasUrl).toBe('https://parcial.com');
      expect(config.intervaloMinutos).toBe(15);
      expect(config.patrones).toBeDefined();
      expect(config.ventana).toBeDefined();
    });

    test('cargar auto-migra config sin fases', async () => {
      mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: 'https://test.com', intervaloMinutos: 20 };
      const config = await cargar();
      expect(Array.isArray(config.fases)).toBe(true);
      expect(config.fases.length).toBeGreaterThan(0);
      expect(config.intervaloMinutos).toBe(20);
    });

    test('cargar preserva fases guardadas', async () => {
      const fasesCustom = [
        { codigo: '', nombre: '--', orden: 0, es_critica: false, clase_css: '', activa: true },
        { codigo: '99', nombre: '99 Custom', orden: 1, es_critica: true, clase_css: 'fase-incidencia', activa: true }
      ];
      mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: '', intervaloMinutos: 15, fases: fasesCustom };
      const config = await cargar();
      expect(config.fases).toHaveLength(2);
      expect(config.fases[1].codigo).toBe('99');
    });
  });

  describe('constantes', () => {
    test('STORAGE_KEY_CONFIG es string no vacio', () => {
      expect(typeof STORAGE_KEY_CONFIG).toBe('string');
      expect(STORAGE_KEY_CONFIG.length).toBeGreaterThan(0);
    });

    test('MIN_INTERVALO es 1', () => {
      expect(MIN_INTERVALO).toBe(1);
    });

    test('MAX_INTERVALO es 1440', () => {
      expect(MAX_INTERVALO).toBe(1440);
    });
  });
});
