/**
 * test_usuarios_adapter.js - Tests para UsuariosAdapter (Fase A: Autenticación)
 */

// Mock de hoja USUARIOS
let mockUsuariosData = [];
let mockAppendedRows = [];
let mockSheetValues = [];

const mockUsuariosSheet = {
  getDataRange: () => ({
    getValues: () => [
      ['uid', 'nombre', 'email', 'rol', 'fechaAlta', 'activo'],
      ...mockUsuariosData
    ]
  }),
  appendRow: (row) => { mockAppendedRows.push(row); },
  getRange: jest.fn((fila, col) => ({
    setValue: (val) => {
      mockSheetValues.push({ fila, col, val });
      // Actualizar mockUsuariosData para reflejar cambio
      if (mockUsuariosData[fila - 2]) {
        mockUsuariosData[fila - 2][col - 1] = val;
      }
    }
  }))
};

const SpreadsheetApp = {
  openById: () => ({
    getSheetByName: (nombre) => {
      if (nombre === 'USUARIOS') return mockUsuariosSheet;
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
  crearUsuario,
  obtenerUsuarios,
  actualizarRol,
  desactivarUsuario
} = require('../../../src/gas/UsuariosAdapter');

describe('UsuariosAdapter', () => {
  beforeEach(() => {
    mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };
    mockUsuariosData = [];
    mockAppendedRows = [];
    mockSheetValues = [];
    mockUsuariosSheet.getRange.mockClear();
  });

  // --- crearUsuario ---
  describe('crearUsuario', () => {
    test('crea registro en USUARIOS', () => {
      const usuario = { uid: 'uid-new', nombre: 'Maria', email: 'maria@test.com', rol: 'operador' };

      crearUsuario(usuario);

      expect(mockAppendedRows).toHaveLength(1);
      expect(mockAppendedRows[0][0]).toBe('uid-new');
      expect(mockAppendedRows[0][1]).toBe('Maria');
      expect(mockAppendedRows[0][3]).toBe('operador');
      expect(mockAppendedRows[0][5]).toBe(true); // activo por defecto
    });

    test('rechaza uid duplicado', () => {
      mockUsuariosData = [
        ['uid-existente', 'Juan', 'juan@test.com', 'admin', '2026-01-01', true]
      ];

      expect(() => crearUsuario({
        uid: 'uid-existente',
        nombre: 'Otro',
        email: 'otro@test.com',
        rol: 'visor'
      })).toThrow('duplicado');
    });
  });

  // --- obtenerUsuarios ---
  describe('obtenerUsuarios', () => {
    test('retorna lista de usuarios', () => {
      mockUsuariosData = [
        ['uid1', 'Juan', 'juan@test.com', 'admin', '2026-01-01', true],
        ['uid2', 'Ana', 'ana@test.com', 'operador', '2026-01-02', true]
      ];

      const usuarios = obtenerUsuarios();

      expect(usuarios).toHaveLength(2);
      expect(usuarios[0].uid).toBe('uid1');
      expect(usuarios[0].rol).toBe('admin');
      expect(usuarios[1].nombre).toBe('Ana');
    });
  });

  // --- actualizarRol ---
  describe('actualizarRol', () => {
    test('cambia rol de usuario existente', () => {
      mockUsuariosData = [
        ['uid1', 'Juan', 'juan@test.com', 'visor', '2026-01-01', true]
      ];

      actualizarRol('uid1', 'admin');

      // getRange(fila 2 = primera data, col 4 = rol)
      expect(mockUsuariosSheet.getRange).toHaveBeenCalledWith(2, 4);
      expect(mockSheetValues[0].val).toBe('admin');
    });
  });

  // --- desactivarUsuario ---
  describe('desactivarUsuario', () => {
    test('pone activo=false', () => {
      mockUsuariosData = [
        ['uid1', 'Juan', 'juan@test.com', 'admin', '2026-01-01', true]
      ];

      desactivarUsuario('uid1');

      // getRange(fila 2, col 6 = activo)
      expect(mockUsuariosSheet.getRange).toHaveBeenCalledWith(2, 6);
      expect(mockSheetValues[0].val).toBe(false);
    });
  });
});
