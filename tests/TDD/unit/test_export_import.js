/**
 * Tests unitarios para export/import de configuracion
 * Ejecutar con: node tests/TDD/unit/test_export_import.js
 */

const assert = require('assert');

// Mock chrome.storage.local
const mockStorage = {};
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

const {
  getDefaults,
  validar,
  exportarConfigCompleta,
  validarImportacion,
  CONFIG_VERSION
} = require('../../../src/extension/config.js');

let passed = 0;
let failed = 0;

function test(nombre, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${nombre}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL: ${nombre}`);
    console.log(`        ${e.message}`);
  }
}

async function ejecutarTests() {
  console.log('\n=== Tests export/import ===\n');

  // --- exportarConfigCompleta ---

  console.log('exportarConfigCompleta():');

  test('incluye version', () => {
    const config = getDefaults();
    const exportado = exportarConfigCompleta(config);
    assert.strictEqual(exportado.version, CONFIG_VERSION);
  });

  test('incluye fecha_exportacion como ISO string', () => {
    const config = getDefaults();
    const exportado = exportarConfigCompleta(config);
    assert.strictEqual(typeof exportado.fecha_exportacion, 'string');
    assert.ok(!isNaN(Date.parse(exportado.fecha_exportacion)));
  });

  test('incluye config completa', () => {
    const config = getDefaults();
    config.gasUrl = 'https://test.com';
    const exportado = exportarConfigCompleta(config);
    assert.deepStrictEqual(exportado.config, config);
  });

  test('exportado es serializable a JSON', () => {
    const config = getDefaults();
    const exportado = exportarConfigCompleta(config);
    const json = JSON.stringify(exportado);
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.version, CONFIG_VERSION);
    assert.ok(parsed.config);
  });

  // --- validarImportacion ---

  console.log('\nvalidarImportacion():');

  test('acepta export valido', () => {
    const config = getDefaults();
    const exportado = exportarConfigCompleta(config);
    const resultado = validarImportacion(exportado);
    assert.strictEqual(resultado.valido, true);
    assert.strictEqual(resultado.errores.length, 0);
  });

  test('rechaza null', () => {
    const resultado = validarImportacion(null);
    assert.strictEqual(resultado.valido, false);
  });

  test('rechaza sin version', () => {
    const data = { config: getDefaults() };
    const resultado = validarImportacion(data);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('version')));
  });

  test('rechaza sin config', () => {
    const data = { version: '1.0.0' };
    const resultado = validarImportacion(data);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('config')));
  });

  test('rechaza config con datos invalidos', () => {
    const config = getDefaults();
    config.intervaloMinutos = -5;
    const data = { version: '1.0.0', config };
    const resultado = validarImportacion(data);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('intervalo')));
  });

  test('roundtrip export->import es valido', () => {
    const config = getDefaults();
    config.gasUrl = 'https://mi-servicio.com/exec';
    config.intervaloMinutos = 30;
    const exportado = exportarConfigCompleta(config);
    const json = JSON.stringify(exportado);
    const importado = JSON.parse(json);
    const resultado = validarImportacion(importado);
    assert.strictEqual(resultado.valido, true);
  });

  // --- Resultado ---

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

ejecutarTests();
