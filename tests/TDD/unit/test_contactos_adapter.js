/**
 * test_contactos_adapter.js - Tests para ContactosAdapter (Fase B: Datos Maestros)
 */

// Mock de hoja CONTACTOS
let mockContactosData = [];
let mockAppendedRows = [];

const mockContactosSheet = {
  getDataRange: () => ({
    getValues: () => [
      ['telefono', 'nombre', 'email', 'entidadId', 'centroId', 'notas', 'creadoPor', 'creadoAt'],
      ...mockContactosData
    ]
  }),
  appendRow: (row) => { mockAppendedRows.push(row); }
};

const SpreadsheetApp = {
  openById: () => ({
    getSheetByName: (nombre) => {
      if (nombre === 'CONTACTOS') return mockContactosSheet;
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
  normalizarTelefono,
  crearContacto,
  buscarPorTelefono,
  buscarContactos,
  leerContactos
} = require('../../../src/gas/ContactosAdapter');

describe('ContactosAdapter', () => {
  beforeEach(() => {
    mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };
    mockContactosData = [];
    mockAppendedRows = [];
  });

  // --- normalizarTelefono ---
  describe('normalizarTelefono', () => {
    test('añade +34 a 9 digitos', () => {
      expect(normalizarTelefono('612345678')).toBe('+34612345678');
    });

    test('mantiene +34 si ya tiene', () => {
      expect(normalizarTelefono('+34612345678')).toBe('+34612345678');
    });

    test('rechaza longitud incorrecta', () => {
      expect(() => normalizarTelefono('123')).toThrow();
    });
  });

  // --- crearContacto ---
  describe('crearContacto', () => {
    test('crea registro en hoja CONTACTOS', () => {
      const contacto = {
        telefono: '612345678',
        nombre: 'Pedro',
        email: 'pedro@test.com',
        creadoPor: 'uid-admin'
      };

      const resultado = crearContacto(contacto);

      expect(mockAppendedRows).toHaveLength(1);
      expect(mockAppendedRows[0][0]).toBe('+34612345678');
      expect(mockAppendedRows[0][1]).toBe('Pedro');
      expect(resultado.telefono).toBe('+34612345678');
    });

    test('rechaza duplicado por telefono', () => {
      mockContactosData = [
        ['+34612345678', 'Pedro', 'pedro@test.com', '', '', '', 'uid1', '2026-01-01']
      ];

      expect(() => crearContacto({
        telefono: '612345678',
        nombre: 'Otro Pedro',
        creadoPor: 'uid2'
      })).toThrow('duplicado');
    });

    test('incluye creadoPor y creadoAt', () => {
      const contacto = {
        telefono: '698765432',
        nombre: 'Ana',
        creadoPor: 'uid-admin'
      };

      crearContacto(contacto);

      const fila = mockAppendedRows[0];
      expect(fila[6]).toBe('uid-admin'); // creadoPor
      expect(fila[7]).toBeTruthy(); // creadoAt no vacio
    });
  });

  // --- buscarPorTelefono ---
  describe('buscarPorTelefono', () => {
    test('encuentra contacto existente', () => {
      mockContactosData = [
        ['+34612345678', 'Pedro', 'pedro@test.com', 'ent1', 'cen1', 'notas', 'uid1', '2026-01-01']
      ];

      const contacto = buscarPorTelefono('612345678');

      expect(contacto).not.toBeNull();
      expect(contacto.nombre).toBe('Pedro');
      expect(contacto.telefono).toBe('+34612345678');
    });

    test('retorna null si no existe', () => {
      mockContactosData = [];

      expect(buscarPorTelefono('600000000')).toBeNull();
    });
  });

  // --- buscarContactos ---
  describe('buscarContactos', () => {
    test('filtra por nombre parcial', () => {
      mockContactosData = [
        ['+34611111111', 'Pedro Garcia', '', '', '', '', '', ''],
        ['+34622222222', 'Ana Lopez', '', '', '', '', '', ''],
        ['+34633333333', 'Pedro Martinez', '', '', '', '', '', '']
      ];

      const resultados = buscarContactos('Pedro');

      expect(resultados).toHaveLength(2);
      expect(resultados[0].nombre).toBe('Pedro Garcia');
      expect(resultados[1].nombre).toBe('Pedro Martinez');
    });
  });

  // --- leerContactos ---
  describe('leerContactos', () => {
    test('retorna todos los contactos', () => {
      mockContactosData = [
        ['+34611111111', 'Pedro', '', '', '', '', '', ''],
        ['+34622222222', 'Ana', '', '', '', '', '', '']
      ];

      const todos = leerContactos();

      expect(todos).toHaveLength(2);
      expect(todos[0].telefono).toBe('+34611111111');
      expect(todos[1].nombre).toBe('Ana');
    });
  });
});
