/**
 * Tests unitarios para fases-config.js
 * Ejecutar con: node tests/TDD/unit/test_fases_config.js
 */

const assert = require('assert');

const {
  getDefaultFases,
  validarFases,
  obtenerFasePorCodigo,
  obtenerClaseCSS,
  esFaseCritica,
  obtenerFasesOrdenadas,
  fasesAMapaLegacy,
  CLASES_CSS_VALIDAS
} = require('../../../src/extension/fases-config.js');

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
  console.log('\n=== Tests fases-config.js ===\n');

  // --- getDefaultFases ---

  console.log('getDefaultFases():');

  test('retorna array de 13 fases', () => {
    const fases = getDefaultFases();
    assert.ok(Array.isArray(fases));
    assert.strictEqual(fases.length, 13);
  });

  test('cada fase tiene campos requeridos', () => {
    const fases = getDefaultFases();
    fases.forEach(f => {
      assert.strictEqual(typeof f.codigo, 'string');
      assert.strictEqual(typeof f.nombre, 'string');
      assert.strictEqual(typeof f.orden, 'number');
      assert.strictEqual(typeof f.es_critica, 'boolean');
      assert.strictEqual(typeof f.clase_css, 'string');
      assert.strictEqual(typeof f.activa, 'boolean');
    });
  });

  test('codigos son unicos', () => {
    const fases = getDefaultFases();
    const codigos = fases.map(f => f.codigo);
    assert.strictEqual(new Set(codigos).size, codigos.length);
  });

  test('incluye fase vacia como primera', () => {
    const fases = getDefaultFases();
    const primera = fases.find(f => f.orden === 0);
    assert.ok(primera);
    assert.strictEqual(primera.codigo, '');
    assert.strictEqual(primera.nombre, '--');
  });

  // --- validarFases ---

  console.log('\nvalidarFases():');

  test('acepta fases validas (defaults)', () => {
    const resultado = validarFases(getDefaultFases());
    assert.strictEqual(resultado.valido, true);
    assert.strictEqual(resultado.errores.length, 0);
  });

  test('rechaza codigo duplicado', () => {
    const fases = [
      { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
      { codigo: '00', nombre: 'B', orden: 2, es_critica: false, clase_css: '', activa: true }
    ];
    const resultado = validarFases(fases);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('duplicado') || e.includes('unico')));
  });

  test('rechaza orden duplicado', () => {
    const fases = [
      { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
      { codigo: '01', nombre: 'B', orden: 1, es_critica: false, clase_css: '', activa: true }
    ];
    const resultado = validarFases(fases);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('orden')));
  });

  test('rechaza clase_css invalida', () => {
    const fases = [
      { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: 'clase-inventada', activa: true }
    ];
    const resultado = validarFases(fases);
    assert.strictEqual(resultado.valido, false);
    assert.ok(resultado.errores.some(e => e.includes('clase')));
  });

  test('acepta clase_css vacia', () => {
    const fases = [
      { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true }
    ];
    const resultado = validarFases(fases);
    assert.strictEqual(resultado.valido, true);
  });

  test('rechaza array vacio', () => {
    const resultado = validarFases([]);
    assert.strictEqual(resultado.valido, false);
  });

  // --- obtenerFasePorCodigo ---

  console.log('\nobtenerFasePorCodigo():');

  test('retorna fase correcta por codigo', () => {
    const fases = getDefaultFases();
    const fase = obtenerFasePorCodigo(fases, '05');
    assert.ok(fase);
    assert.strictEqual(fase.codigo, '05');
    assert.ok(fase.nombre.includes('Incidencia'));
  });

  test('retorna null para codigo inexistente', () => {
    const fases = getDefaultFases();
    const fase = obtenerFasePorCodigo(fases, '99');
    assert.strictEqual(fase, null);
  });

  // --- obtenerClaseCSS ---

  console.log('\nobtenerClaseCSS():');

  test('retorna clase correcta para fase con clase', () => {
    const fases = getDefaultFases();
    const clase = obtenerClaseCSS(fases, '05');
    assert.strictEqual(clase, 'fase-incidencia');
  });

  test('retorna string vacio para fase sin clase especial', () => {
    const fases = getDefaultFases();
    const clase = obtenerClaseCSS(fases, '00');
    assert.strictEqual(clase, '');
  });

  // --- esFaseCritica ---

  console.log('\nesFaseCritica():');

  test('identifica fases criticas correctamente', () => {
    const fases = getDefaultFases();
    assert.strictEqual(esFaseCritica(fases, '05'), true);
    assert.strictEqual(esFaseCritica(fases, '25'), true);
  });

  test('retorna false para fases no criticas', () => {
    const fases = getDefaultFases();
    assert.strictEqual(esFaseCritica(fases, '00'), false);
    assert.strictEqual(esFaseCritica(fases, '19'), false);
  });

  // --- obtenerFasesOrdenadas ---

  console.log('\nobtenerFasesOrdenadas():');

  test('ordena por campo orden ascendente', () => {
    const fases = [
      { codigo: 'B', nombre: 'B', orden: 3, es_critica: false, clase_css: '', activa: true },
      { codigo: 'A', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
      { codigo: 'C', nombre: 'C', orden: 2, es_critica: false, clase_css: '', activa: true }
    ];
    const ordenadas = obtenerFasesOrdenadas(fases);
    assert.strictEqual(ordenadas[0].codigo, 'A');
    assert.strictEqual(ordenadas[1].codigo, 'C');
    assert.strictEqual(ordenadas[2].codigo, 'B');
  });

  // --- fasesAMapaLegacy ---

  console.log('\nfasesAMapaLegacy():');

  test('genera objeto compatible {codigo: label}', () => {
    const fases = getDefaultFases();
    const mapa = fasesAMapaLegacy(fases);
    assert.strictEqual(typeof mapa, 'object');
    assert.strictEqual(mapa[''], '--');
    assert.strictEqual(mapa['00'], '00 Espera');
    assert.strictEqual(mapa['05'], '05 Incidencia');
  });

  test('solo incluye fases activas', () => {
    const fases = [
      { codigo: '00', nombre: 'Espera', orden: 1, es_critica: false, clase_css: '', activa: true },
      { codigo: '01', nombre: 'Inactiva', orden: 2, es_critica: false, clase_css: '', activa: false }
    ];
    const mapa = fasesAMapaLegacy(fases);
    assert.ok('00' in mapa);
    assert.ok(!('01' in mapa));
  });

  // --- Resultado ---

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

ejecutarTests();
