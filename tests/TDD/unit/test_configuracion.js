/**
 * test_configuracion.js - Tests para obtenerSpreadsheetId sin fallback
 */

// Simular PropertiesService de GAS
let mockProperties = {};

const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => mockProperties[key] || null,
    setProperty: (key, val) => { mockProperties[key] = val; }
  })
};

// Reimplementar funcion como debería quedar (sin fallback)
function obtenerSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (!id || !id.trim()) {
    throw new Error('SPREADSHEET_ID no configurado. Vaya a Configuracion > Hoja de Calculo Destino en la extension para configurarlo.');
  }
  return id;
}

describe('obtenerSpreadsheetId', () => {
  beforeEach(() => {
    mockProperties = {};
  });

  test('retorna ID si esta configurado', () => {
    mockProperties['SPREADSHEET_ID'] = 'abc123def456';
    expect(obtenerSpreadsheetId()).toBe('abc123def456');
  });

  test('lanza error si no hay ID configurado', () => {
    expect(() => obtenerSpreadsheetId()).toThrow('SPREADSHEET_ID no configurado');
  });

  test('lanza error si ID es string vacio', () => {
    mockProperties['SPREADSHEET_ID'] = '';
    expect(() => obtenerSpreadsheetId()).toThrow('SPREADSHEET_ID no configurado');
  });

  test('lanza error si ID es solo espacios', () => {
    mockProperties['SPREADSHEET_ID'] = '   ';
    expect(() => obtenerSpreadsheetId()).toThrow('SPREADSHEET_ID no configurado');
  });

  test('mensaje de error incluye instrucciones', () => {
    expect(() => obtenerSpreadsheetId()).toThrow('Configuracion');
  });
});
