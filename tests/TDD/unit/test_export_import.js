/**
 * Tests unitarios para export/import de configuracion
 */

// Importar constantes primero (deben estar en scope global)
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
  exportarConfigCompleta,
  validarImportacion,
  CONFIG_VERSION
} = require('../../../src/extension/config.js');

describe('export/import configuracion', () => {
  describe('exportarConfigCompleta', () => {
    test('incluye version', () => {
      const exportado = exportarConfigCompleta(getDefaults());
      expect(exportado.version).toBe(CONFIG_VERSION);
    });

    test('incluye fecha_exportacion como ISO string', () => {
      const exportado = exportarConfigCompleta(getDefaults());
      expect(typeof exportado.fecha_exportacion).toBe('string');
      expect(isNaN(Date.parse(exportado.fecha_exportacion))).toBe(false);
    });

    test('incluye config completa', () => {
      const config = getDefaults();
      config.gasUrl = 'https://test.com';
      const exportado = exportarConfigCompleta(config);
      expect(exportado.config).toEqual(config);
    });

    test('exportado es serializable a JSON', () => {
      const exportado = exportarConfigCompleta(getDefaults());
      const json = JSON.stringify(exportado);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(CONFIG_VERSION);
      expect(parsed.config).toBeDefined();
    });
  });

  describe('validarImportacion', () => {
    test('acepta export valido', () => {
      const exportado = exportarConfigCompleta(getDefaults());
      const resultado = validarImportacion(exportado);
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('rechaza null', () => {
      expect(validarImportacion(null).valido).toBe(false);
    });

    test('rechaza sin version', () => {
      const resultado = validarImportacion({ config: getDefaults() });
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('version'))).toBe(true);
    });

    test('rechaza sin config', () => {
      const resultado = validarImportacion({ version: '1.0.0' });
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('config'))).toBe(true);
    });

    test('rechaza config con datos invalidos', () => {
      const config = getDefaults();
      config.intervaloMinutos = -5;
      const resultado = validarImportacion({ version: '1.0.0', config });
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('intervalo'))).toBe(true);
    });

    test('roundtrip export->import es valido', () => {
      const config = getDefaults();
      config.gasUrl = 'https://mi-servicio.com/exec';
      config.intervaloMinutos = 30;
      const json = JSON.stringify(exportarConfigCompleta(config));
      const resultado = validarImportacion(JSON.parse(json));
      expect(resultado.valido).toBe(true);
    });
  });

  describe('extras en exportacion', () => {
    test('incluye preferenciasRejilla si se proporcionan', () => {
      const prefs = {
        columnas: [
          { field: 'fase', width: 80, visible: true },
          { field: 'estado', width: 60, visible: false }
        ],
        sorters: [{ column: 'fecha', dir: 'desc' }]
      };
      const exportado = exportarConfigCompleta(getDefaults(), { preferenciasRejilla: prefs });
      expect(exportado.preferenciasRejilla).toEqual(prefs);
      expect(exportado.preferenciasRejilla.columnas).toHaveLength(2);
      expect(exportado.preferenciasRejilla.sorters).toHaveLength(1);
    });

    test('no incluye preferenciasRejilla si no se proporcionan', () => {
      const exportado = exportarConfigCompleta(getDefaults(), {});
      expect(exportado.preferenciasRejilla).toBeUndefined();
    });

    test('incluye todos los extras simultaneamente', () => {
      const extras = {
        servicios: [{ nombre: 'test', url: 'https://test.com' }],
        gmailQuery: 'in:inbox',
        spreadsheet: { id: 'abc123' },
        pieComun: 'Firma test',
        preferenciasRejilla: { columnas: [{ field: 'fase', width: 80, visible: true }], sorters: [] }
      };
      const exportado = exportarConfigCompleta(getDefaults(), extras);
      expect(exportado.servicios).toBeDefined();
      expect(exportado.gmailQuery).toBe('in:inbox');
      expect(exportado.spreadsheet).toBeDefined();
      expect(exportado.pieComun).toBe('Firma test');
      expect(exportado.preferenciasRejilla).toBeDefined();
    });
  });

  describe('reglasAcciones en roundtrip', () => {
    test('config con reglasAcciones pasa validacion', () => {
      const config = getDefaults();
      expect(config.reglasAcciones).toBeDefined();
      expect(Array.isArray(config.reglasAcciones)).toBe(true);
      expect(config.reglasAcciones.length).toBe(7);

      const exportado = exportarConfigCompleta(config);
      const resultado = validarImportacion(exportado);
      expect(resultado.valido).toBe(true);
    });

    test('config con reglas custom pasa validacion', () => {
      const config = getDefaults();
      config.reglasAcciones.push({
        id: 'custom_1', nombre: 'Mi regla', activa: true,
        condicion: { campo: 'fase', valor: '11', faseOrigen: null },
        acciones: [{ tipo: 'MOSTRAR_AVISO', params: { mensaje: 'Test' } }],
        orden: 50, origen: 'usuario'
      });

      const json = JSON.stringify(exportarConfigCompleta(config));
      const parsed = JSON.parse(json);
      const resultado = validarImportacion(parsed);
      expect(resultado.valido).toBe(true);
      expect(parsed.config.reglasAcciones).toHaveLength(8);
    });

    test('config con regla invalida falla validacion', () => {
      const config = getDefaults();
      config.reglasAcciones.push({
        id: 'bad', nombre: '', activa: true,
        condicion: { campo: 'invalido' },
        acciones: [{ tipo: 'INEXISTENTE' }],
        orden: 99, origen: 'usuario'
      });

      const exportado = exportarConfigCompleta(config);
      const resultado = validarImportacion(exportado);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('Regla 8'))).toBe(true);
    });

    test('preferencias rejilla sobrevive roundtrip JSON', () => {
      const prefs = {
        columnas: [
          { field: 'codCar', width: 70, visible: true },
          { field: 'fase', width: 80, visible: true },
          { field: 'threadId', width: 100, visible: false }
        ],
        sorters: [{ column: 'fecha', dir: 'desc' }]
      };
      const exportado = exportarConfigCompleta(getDefaults(), { preferenciasRejilla: prefs });
      const json = JSON.stringify(exportado);
      const parsed = JSON.parse(json);

      expect(parsed.preferenciasRejilla.columnas).toHaveLength(3);
      expect(parsed.preferenciasRejilla.columnas[2].visible).toBe(false);
      expect(parsed.preferenciasRejilla.sorters[0].dir).toBe('desc');
    });
  });
});
