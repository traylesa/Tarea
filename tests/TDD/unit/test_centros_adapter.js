/**
 * test_centros_adapter.js - Tests para CentrosAdapter (Fase B: Datos Maestros)
 */

let mockCentrosData = [];
let mockAppendedRows = [];

const mockCentrosSheet = {
  getDataRange: () => ({
    getValues: () => [
      ['id', 'nombre', 'entidadId', 'direccion', 'activo', 'creadoAt'],
      ...mockCentrosData
    ]
  }),
  appendRow: (row) => { mockAppendedRows.push(row); }
};

const SpreadsheetApp = {
  openById: () => ({
    getSheetByName: (nombre) => {
      if (nombre === 'CENTROS_TRABAJO') return mockCentrosSheet;
      return null;
    }
  })
};

let mockProperties = {};
const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => mockProperties[key] || null
  })
};

global.SpreadsheetApp = SpreadsheetApp;
global.PropertiesService = PropertiesService;

const {
  crearCentro, leerCentros, obtenerCentro,
  centrosPorEntidad, _generarIdCentro
} = require('../../../src/gas/CentrosAdapter');

describe('CentrosAdapter', () => {
  beforeEach(() => {
    mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };
    mockCentrosData = [];
    mockAppendedRows = [];
  });

  // --- _generarIdCentro ---
  describe('_generarIdCentro', () => {
    test('genera ID con prefijo ctr_', () => {
      var id = _generarIdCentro();
      expect(id).toMatch(/^ctr_\d+_[a-z0-9]+$/);
    });
  });

  // --- crearCentro ---
  describe('crearCentro', () => {
    test('crea centro con ID auto-generado', () => {
      var centro = crearCentro({ nombre: 'Nave Norte' });

      expect(mockAppendedRows).toHaveLength(1);
      expect(mockAppendedRows[0][0]).toMatch(/^ctr_/);
      expect(mockAppendedRows[0][1]).toBe('Nave Norte');
      expect(centro.nombre).toBe('Nave Norte');
      expect(centro.activo).toBe(true);
    });

    test('usa ID proporcionado si viene', () => {
      crearCentro({ id: 'custom-ctr', nombre: 'Test' });
      expect(mockAppendedRows[0][0]).toBe('custom-ctr');
    });

    test('lanza error si no viene nombre', () => {
      expect(() => crearCentro({})).toThrow('nombre es requerido');
    });

    test('vincula a entidad si se proporciona', () => {
      crearCentro({
        nombre: 'Almacen Sur',
        entidadId: 'ent_1',
        direccion: 'Poligono Industrial'
      });

      var fila = mockAppendedRows[0];
      expect(fila[2]).toBe('ent_1');
      expect(fila[3]).toBe('Poligono Industrial');
    });
  });

  // --- leerCentros ---
  describe('leerCentros', () => {
    test('retorna todos los centros', () => {
      mockCentrosData = [
        ['ctr_1', 'Nave Norte', 'ent_1', 'Dir1', true, '2026-01-01'],
        ['ctr_2', 'Nave Sur', 'ent_1', 'Dir2', true, '2026-01-02']
      ];

      var todos = leerCentros();

      expect(todos).toHaveLength(2);
      expect(todos[0].nombre).toBe('Nave Norte');
      expect(todos[1].entidadId).toBe('ent_1');
    });
  });

  // --- obtenerCentro ---
  describe('obtenerCentro', () => {
    test('encuentra por ID', () => {
      mockCentrosData = [
        ['ctr_1', 'Nave Norte', 'ent_1', 'Dir1', true, '2026-01-01']
      ];

      var centro = obtenerCentro('ctr_1');

      expect(centro).not.toBeNull();
      expect(centro.nombre).toBe('Nave Norte');
    });

    test('retorna null si no existe', () => {
      mockCentrosData = [];
      expect(obtenerCentro('no-existe')).toBeNull();
    });
  });

  // --- centrosPorEntidad ---
  describe('centrosPorEntidad', () => {
    test('filtra centros por entidadId', () => {
      mockCentrosData = [
        ['ctr_1', 'Nave Norte', 'ent_1', '', true, ''],
        ['ctr_2', 'Nave Sur', 'ent_2', '', true, ''],
        ['ctr_3', 'Oficina', 'ent_1', '', true, '']
      ];

      var centros = centrosPorEntidad('ent_1');

      expect(centros).toHaveLength(2);
      expect(centros[0].nombre).toBe('Nave Norte');
      expect(centros[1].nombre).toBe('Oficina');
    });

    test('retorna vacio si no hay entidadId', () => {
      expect(centrosPorEntidad('')).toEqual([]);
      expect(centrosPorEntidad(null)).toEqual([]);
    });

    test('retorna vacio si no coincide ninguno', () => {
      mockCentrosData = [
        ['ctr_1', 'Nave', 'ent_99', '', true, '']
      ];

      expect(centrosPorEntidad('ent_1')).toEqual([]);
    });
  });
});
