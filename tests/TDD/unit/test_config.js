/**
 * Tests unitarios para config.js
 * Ejecutar con: node tests/TDD/unit/test_config.js
 *
 * Framework: assert nativo de Node.js (sin dependencias externas)
 */

const assert = require('assert');

// Mock de chrome.storage.local para tests
const mockStorage = {};
const chrome = {
  storage: {
    local: {
      get: async (key) => {
        const result = {};
        if (typeof key === 'string') {
          result[key] = mockStorage[key] || undefined;
        }
        return result;
      },
      set: async (data) => {
        Object.assign(mockStorage, data);
      }
    }
  }
};
global.chrome = chrome;

// Importar modulo bajo test
const {
  getDefaults,
  validar,
  cargar,
  guardar,
  STORAGE_KEY_CONFIG,
  MIN_INTERVALO,
  MAX_INTERVALO
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

async function testAsync(nombre, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${nombre}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL: ${nombre}`);
    console.log(`        ${e.message}`);
  }
}

async function ejecutarTests() {
  console.log('\n=== Tests config.js ===\n');

  // --- getDefaults ---

  console.log('getDefaults():');

  test('retorna objeto con gasUrl string', () => {
    const d = getDefaults();
    assert.strictEqual(typeof d.gasUrl, 'string');
  });

  test('retorna intervaloMinutos 15 por defecto', () => {
    const d = getDefaults();
    assert.strictEqual(d.intervaloMinutos, 15);
  });

  test('retorna rutaCsvErp string', () => {
    const d = getDefaults();
    assert.strictEqual(typeof d.rutaCsvErp, 'string');
  });

  test('retorna patrones con codcarAdjunto y keywordsAdmin', () => {
    const d = getDefaults();
    assert.ok(d.patrones);
    assert.strictEqual(typeof d.patrones.codcarAdjunto, 'string');
    assert.strictEqual(typeof d.patrones.keywordsAdmin, 'string');
  });

  test('retorna ventana con width y height', () => {
    const d = getDefaults();
    assert.ok(d.ventana);
    assert.strictEqual(d.ventana.width, 800);
    assert.strictEqual(d.ventana.height, 600);
  });

  // --- validar ---

  console.log('\nvalidar():');

  test('config valida retorna valido=true, errores vacios', () => {
    const config = getDefaults();
    config.gasUrl = 'https://script.google.com/macros/s/abc/exec';
    const result = validar(config);
    assert.strictEqual(result.valido, true);
    assert.strictEqual(result.errores.length, 0);
  });

  test('gasUrl vacio es valido (opcional)', () => {
    const config = getDefaults();
    config.gasUrl = '';
    const result = validar(config);
    assert.strictEqual(result.valido, true);
  });

  test('gasUrl sin https falla', () => {
    const config = getDefaults();
    config.gasUrl = 'http://inseguro.com';
    const result = validar(config);
    assert.strictEqual(result.valido, false);
    assert.ok(result.errores.some(e => e.includes('URL')));
  });

  test('gasUrl con texto random falla', () => {
    const config = getDefaults();
    config.gasUrl = 'no-es-url';
    const result = validar(config);
    assert.strictEqual(result.valido, false);
  });

  test('intervalo menor a MIN_INTERVALO falla', () => {
    const config = getDefaults();
    config.intervaloMinutos = 0;
    const result = validar(config);
    assert.strictEqual(result.valido, false);
    assert.ok(result.errores.some(e => e.includes('intervalo')));
  });

  test('intervalo mayor a MAX_INTERVALO falla', () => {
    const config = getDefaults();
    config.intervaloMinutos = 1441;
    const result = validar(config);
    assert.strictEqual(result.valido, false);
  });

  test('intervalo decimal falla', () => {
    const config = getDefaults();
    config.intervaloMinutos = 15.5;
    const result = validar(config);
    assert.strictEqual(result.valido, false);
  });

  test('regex valida pasa', () => {
    const config = getDefaults();
    config.patrones.codcarAdjunto = 'Carga_\\d+\\.pdf';
    const result = validar(config);
    assert.strictEqual(result.valido, true);
  });

  test('regex invalida falla', () => {
    const config = getDefaults();
    config.patrones.codcarAdjunto = '[invalid(';
    const result = validar(config);
    assert.strictEqual(result.valido, false);
    assert.ok(result.errores.some(e => e.includes('regex') || e.includes('patron')));
  });

  test('keywordsAdmin regex invalida falla', () => {
    const config = getDefaults();
    config.patrones.keywordsAdmin = '(unclosed';
    const result = validar(config);
    assert.strictEqual(result.valido, false);
  });

  // --- cargar / guardar ---

  console.log('\ncargar() / guardar():');

  await testAsync('cargar sin datos previos retorna defaults', async () => {
    delete mockStorage[STORAGE_KEY_CONFIG];
    const config = await cargar();
    assert.strictEqual(config.intervaloMinutos, 15);
    assert.strictEqual(config.ventana.width, 800);
  });

  await testAsync('guardar y cargar persiste datos', async () => {
    const config = getDefaults();
    config.gasUrl = 'https://test.com/exec';
    config.intervaloMinutos = 30;
    await guardar(config);

    const cargada = await cargar();
    assert.strictEqual(cargada.gasUrl, 'https://test.com/exec');
    assert.strictEqual(cargada.intervaloMinutos, 30);
  });

  await testAsync('cargar mergea config parcial con defaults', async () => {
    mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: 'https://parcial.com' };
    const config = await cargar();
    assert.strictEqual(config.gasUrl, 'https://parcial.com');
    assert.strictEqual(config.intervaloMinutos, 15);
    assert.ok(config.patrones);
    assert.ok(config.ventana);
  });

  // --- Fases en config ---

  console.log('\nFases en config:');

  test('getDefaults incluye fases como array', () => {
    const d = getDefaults();
    assert.ok(Array.isArray(d.fases));
    assert.ok(d.fases.length > 0);
  });

  test('validar valida seccion fases', () => {
    const config = getDefaults();
    config.fases = [
      { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
      { codigo: '00', nombre: 'B', orden: 2, es_critica: false, clase_css: '', activa: true }
    ];
    const result = validar(config);
    assert.strictEqual(result.valido, false);
    assert.ok(result.errores.some(e => e.includes('duplicado') || e.includes('unico')));
  });

  await testAsync('cargar auto-migra config sin fases', async () => {
    mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: 'https://test.com', intervaloMinutos: 20 };
    const config = await cargar();
    assert.ok(Array.isArray(config.fases));
    assert.ok(config.fases.length > 0);
    assert.strictEqual(config.intervaloMinutos, 20);
  });

  await testAsync('cargar preserva fases guardadas', async () => {
    const fasesCustom = [
      { codigo: '', nombre: '--', orden: 0, es_critica: false, clase_css: '', activa: true },
      { codigo: '99', nombre: '99 Custom', orden: 1, es_critica: true, clase_css: 'fase-incidencia', activa: true }
    ];
    mockStorage[STORAGE_KEY_CONFIG] = { gasUrl: '', intervaloMinutos: 15, fases: fasesCustom };
    const config = await cargar();
    assert.strictEqual(config.fases.length, 2);
    assert.strictEqual(config.fases[1].codigo, '99');
  });

  // --- Constantes ---

  console.log('\nConstantes:');

  test('STORAGE_KEY_CONFIG es string no vacio', () => {
    assert.strictEqual(typeof STORAGE_KEY_CONFIG, 'string');
    assert.ok(STORAGE_KEY_CONFIG.length > 0);
  });

  test('MIN_INTERVALO es 1', () => {
    assert.strictEqual(MIN_INTERVALO, 1);
  });

  test('MAX_INTERVALO es 1440', () => {
    assert.strictEqual(MAX_INTERVALO, 1440);
  });

  // --- Resultado ---

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

ejecutarTests();
