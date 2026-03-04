/**
 * test_entidades_adapter.js - Tests para EntidadesAdapter (Fase B: Datos Maestros)
 */

let mockEntidadesData = [];
let mockAppendedRows = [];

const mockEntidadesSheet = {
  getDataRange: () => ({
    getValues: () => [
      ['id', 'nombre', 'tipo', 'cif', 'direccion', 'activa', 'creadoAt'],
      ...mockEntidadesData
    ]
  }),
  appendRow: (row) => { mockAppendedRows.push(row); }
};

const SpreadsheetApp = {
  openById: () => ({
    getSheetByName: (nombre) => {
      if (nombre === 'ENTIDADES') return mockEntidadesSheet;
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
  crearEntidad, leerEntidades, obtenerEntidad,
  buscarEntidadPorCif, buscarEntidades, _generarIdEntidad
} = require('../../../src/gas/EntidadesAdapter');

describe('EntidadesAdapter', () => {
  beforeEach(() => {
    mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };
    mockEntidadesData = [];
    mockAppendedRows = [];
  });

  // --- _generarIdEntidad ---
  describe('_generarIdEntidad', () => {
    test('genera ID con prefijo ent_', () => {
      var id = _generarIdEntidad();
      expect(id).toMatch(/^ent_\d+_[a-z0-9]+$/);
    });

    test('genera IDs unicos', () => {
      var id1 = _generarIdEntidad();
      var id2 = _generarIdEntidad();
      expect(id1).not.toBe(id2);
    });
  });

  // --- crearEntidad ---
  describe('crearEntidad', () => {
    test('crea entidad con ID auto-generado', () => {
      var entidad = crearEntidad({ nombre: 'Transportes Garcia' });

      expect(mockAppendedRows).toHaveLength(1);
      expect(mockAppendedRows[0][0]).toMatch(/^ent_/);
      expect(mockAppendedRows[0][1]).toBe('Transportes Garcia');
      expect(entidad.nombre).toBe('Transportes Garcia');
      expect(entidad.activa).toBe(true);
    });

    test('usa ID proporcionado si viene', () => {
      crearEntidad({ id: 'custom-id', nombre: 'Test' });
      expect(mockAppendedRows[0][0]).toBe('custom-id');
    });

    test('lanza error si no viene nombre', () => {
      expect(() => crearEntidad({})).toThrow('nombre es requerido');
    });

    test('rechaza CIF duplicado', () => {
      mockEntidadesData = [
        ['ent_1', 'Empresa A', 'Cliente', 'B12345678', '', true, '2026-01-01']
      ];

      expect(() => crearEntidad({
        nombre: 'Otra Empresa',
        cif: 'B12345678'
      })).toThrow('Ya existe entidad con CIF');
    });

    test('asigna tipo y campos opcionales', () => {
      crearEntidad({
        nombre: 'Test',
        tipo: 'Transportista',
        cif: 'A99999999',
        direccion: 'Calle Falsa 123'
      });

      var fila = mockAppendedRows[0];
      expect(fila[2]).toBe('Transportista');
      expect(fila[3]).toBe('A99999999');
      expect(fila[4]).toBe('Calle Falsa 123');
    });
  });

  // --- leerEntidades ---
  describe('leerEntidades', () => {
    test('retorna todas las entidades', () => {
      mockEntidadesData = [
        ['ent_1', 'Empresa A', 'Cliente', 'B11', '', true, '2026-01-01'],
        ['ent_2', 'Empresa B', 'Proveedor', 'B22', '', true, '2026-01-02']
      ];

      var todas = leerEntidades();

      expect(todas).toHaveLength(2);
      expect(todas[0].nombre).toBe('Empresa A');
      expect(todas[1].tipo).toBe('Proveedor');
    });
  });

  // --- obtenerEntidad ---
  describe('obtenerEntidad', () => {
    test('encuentra por ID', () => {
      mockEntidadesData = [
        ['ent_1', 'Empresa A', 'Cliente', 'B11', 'Dir1', true, '2026-01-01']
      ];

      var entidad = obtenerEntidad('ent_1');

      expect(entidad).not.toBeNull();
      expect(entidad.nombre).toBe('Empresa A');
      expect(entidad.cif).toBe('B11');
    });

    test('retorna null si no existe', () => {
      mockEntidadesData = [];
      expect(obtenerEntidad('no-existe')).toBeNull();
    });
  });

  // --- buscarEntidadPorCif ---
  describe('buscarEntidadPorCif', () => {
    test('encuentra por CIF exacto', () => {
      mockEntidadesData = [
        ['ent_1', 'Empresa A', '', 'B12345678', '', true, '']
      ];

      var entidad = buscarEntidadPorCif('B12345678');
      expect(entidad).not.toBeNull();
      expect(entidad.nombre).toBe('Empresa A');
    });

    test('busca case-insensitive sin guiones', () => {
      mockEntidadesData = [
        ['ent_1', 'Empresa A', '', 'B-1234-5678', '', true, '']
      ];

      var entidad = buscarEntidadPorCif('b12345678');
      expect(entidad).not.toBeNull();
    });

    test('retorna null si no viene CIF', () => {
      expect(buscarEntidadPorCif(null)).toBeNull();
      expect(buscarEntidadPorCif('')).toBeNull();
    });
  });

  // --- buscarEntidades ---
  describe('buscarEntidades', () => {
    test('filtra por nombre parcial', () => {
      mockEntidadesData = [
        ['ent_1', 'Transportes Garcia', '', '', '', true, ''],
        ['ent_2', 'Logistica Lopez', '', '', '', true, ''],
        ['ent_3', 'Garcia e Hijos', '', '', '', true, '']
      ];

      var resultados = buscarEntidades('Garcia');

      expect(resultados).toHaveLength(2);
      expect(resultados[0].nombre).toBe('Transportes Garcia');
      expect(resultados[1].nombre).toBe('Garcia e Hijos');
    });
  });
});
