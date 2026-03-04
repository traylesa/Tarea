/**
 * test_auth_service.js - Tests para AuthService (Fase A: Autenticación multiusuario)
 * Patrón: Mock de globals GAS + dual-compat import
 */

// Mock de globals GAS
let mockProperties = {};
const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => mockProperties[key] || null,
    setProperty: (key, val) => { mockProperties[key] = val; }
  })
};

let mockFetchResponse = {};
const UrlFetchApp = {
  fetch: jest.fn(() => ({
    getResponseCode: () => mockFetchResponse.code || 200,
    getContentText: () => JSON.stringify(mockFetchResponse.body || {})
  }))
};

// Mock de hoja USUARIOS
let mockUsuariosData = [];
const mockUsuariosSheet = {
  getDataRange: () => ({
    getValues: () => [
      ['uid', 'nombre', 'email', 'rol', 'fechaAlta', 'activo'],
      ...mockUsuariosData
    ]
  })
};

const SpreadsheetApp = {
  openById: () => ({
    getSheetByName: (nombre) => {
      if (nombre === 'USUARIOS') return mockUsuariosSheet;
      return null;
    }
  })
};

// Inyectar globals antes del require
global.PropertiesService = PropertiesService;
global.UrlFetchApp = UrlFetchApp;
global.SpreadsheetApp = SpreadsheetApp;

const {
  verificarToken,
  obtenerRolUsuario,
  middlewareAuth,
  tienePermiso
} = require('../../../src/gas/AuthService');

describe('AuthService', () => {
  beforeEach(() => {
    mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };
    mockFetchResponse = {};
    mockUsuariosData = [];
    UrlFetchApp.fetch.mockReset();
    UrlFetchApp.fetch.mockImplementation(() => ({
      getResponseCode: () => mockFetchResponse.code || 200,
      getContentText: () => JSON.stringify(mockFetchResponse.body || {})
    }));
  });

  // --- verificarToken ---
  describe('verificarToken', () => {
    test('retorna usuario si token valido', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      mockFetchResponse = {
        code: 200,
        body: { users: [{ localId: 'uid123', email: 'user@test.com', displayName: 'Juan' }] }
      };

      const usuario = verificarToken('token-valido');

      expect(usuario).toEqual({ uid: 'uid123', email: 'user@test.com', nombre: 'Juan' });
    });

    test('retorna null si token invalido', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      mockFetchResponse = { code: 400, body: { error: { message: 'INVALID_ID_TOKEN' } } };

      const resultado = verificarToken('token-malo');

      expect(resultado).toBeNull();
    });

    test('retorna null si API devuelve error', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      UrlFetchApp.fetch.mockImplementation(() => { throw new Error('Network error'); });

      const resultado = verificarToken('cualquier-token');

      expect(resultado).toBeNull();
    });

    test('retorna null si no hay API_KEY configurada', () => {
      mockProperties = { SPREADSHEET_ID: 'test-sheet-id' };

      const resultado = verificarToken('cualquier-token');

      expect(resultado).toBeNull();
    });
  });

  // --- obtenerRolUsuario ---
  describe('obtenerRolUsuario', () => {
    test('retorna rol si usuario existe en USUARIOS', () => {
      mockUsuariosData = [
        ['uid123', 'Juan', 'juan@test.com', 'admin', '2026-01-01', true]
      ];

      const rol = obtenerRolUsuario('uid123');

      expect(rol).toBe('admin');
    });

    test('retorna null si usuario no existe', () => {
      mockUsuariosData = [
        ['uid999', 'Otro', 'otro@test.com', 'visor', '2026-01-01', true]
      ];

      const rol = obtenerRolUsuario('uid-inexistente');

      expect(rol).toBeNull();
    });
  });

  // --- middlewareAuth ---
  describe('middlewareAuth', () => {
    test('rechaza peticion sin token con 401', () => {
      const params = { token: '' };
      const handler = jest.fn();

      const resultado = middlewareAuth(params, handler);

      expect(resultado.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    test('rechaza token invalido con 401', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      mockFetchResponse = { code: 400, body: { error: { message: 'INVALID' } } };
      const params = { token: 'token-malo' };
      const handler = jest.fn();

      const resultado = middlewareAuth(params, handler);

      expect(resultado.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    test('rechaza usuario no registrado con 403', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      mockFetchResponse = {
        code: 200,
        body: { users: [{ localId: 'uid-no-reg', email: 'x@test.com', displayName: 'X' }] }
      };
      mockUsuariosData = []; // Sin usuarios registrados
      const params = { token: 'token-ok' };
      const handler = jest.fn();

      const resultado = middlewareAuth(params, handler);

      expect(resultado.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    test('inyecta _usuario y pasa al handler si OK', () => {
      mockProperties['AUTH_API_KEY'] = 'clave-api';
      mockFetchResponse = {
        code: 200,
        body: { users: [{ localId: 'uid123', email: 'juan@test.com', displayName: 'Juan' }] }
      };
      mockUsuariosData = [
        ['uid123', 'Juan', 'juan@test.com', 'admin', '2026-01-01', true]
      ];
      const params = { token: 'token-ok', accion: 'leer' };
      const handler = jest.fn(() => ({ status: 200, data: 'ok' }));

      const resultado = middlewareAuth(params, handler);

      expect(handler).toHaveBeenCalledTimes(1);
      const argsRecibidos = handler.mock.calls[0][0];
      expect(argsRecibidos._usuario).toEqual({
        uid: 'uid123', email: 'juan@test.com', nombre: 'Juan', rol: 'admin'
      });
      expect(resultado).toEqual({ status: 200, data: 'ok' });
    });
  });

  // --- tienePermiso ---
  describe('tienePermiso', () => {
    test('permite accion para rol autorizado', () => {
      expect(tienePermiso('admin', 'gestionar_usuarios')).toBe(true);
    });

    test('rechaza accion para rol no autorizado', () => {
      expect(tienePermiso('visor', 'gestionar_usuarios')).toBe(false);
    });
  });
});
