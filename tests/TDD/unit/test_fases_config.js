/**
 * Tests unitarios para fases-config.js
 */

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

describe('fases-config', () => {
  describe('getDefaultFases', () => {
    test('retorna array de 13 fases', () => {
      const fases = getDefaultFases();
      expect(Array.isArray(fases)).toBe(true);
      expect(fases).toHaveLength(13);
    });

    test('cada fase tiene campos requeridos', () => {
      getDefaultFases().forEach(f => {
        expect(typeof f.codigo).toBe('string');
        expect(typeof f.nombre).toBe('string');
        expect(typeof f.orden).toBe('number');
        expect(typeof f.es_critica).toBe('boolean');
        expect(typeof f.clase_css).toBe('string');
        expect(typeof f.activa).toBe('boolean');
      });
    });

    test('codigos son unicos', () => {
      const codigos = getDefaultFases().map(f => f.codigo);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    test('incluye fase vacia como primera', () => {
      const primera = getDefaultFases().find(f => f.orden === 0);
      expect(primera).toBeDefined();
      expect(primera.codigo).toBe('');
      expect(primera.nombre).toBe('--');
    });
  });

  describe('validarFases', () => {
    test('acepta fases validas (defaults)', () => {
      const resultado = validarFases(getDefaultFases());
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('rechaza codigo duplicado', () => {
      const fases = [
        { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
        { codigo: '00', nombre: 'B', orden: 2, es_critica: false, clase_css: '', activa: true }
      ];
      const resultado = validarFases(fases);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('duplicado') || e.includes('unico'))).toBe(true);
    });

    test('rechaza orden duplicado', () => {
      const fases = [
        { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
        { codigo: '01', nombre: 'B', orden: 1, es_critica: false, clase_css: '', activa: true }
      ];
      const resultado = validarFases(fases);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('orden'))).toBe(true);
    });

    test('rechaza clase_css invalida', () => {
      const fases = [
        { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: 'clase-inventada', activa: true }
      ];
      const resultado = validarFases(fases);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('clase'))).toBe(true);
    });

    test('acepta clase_css vacia', () => {
      const fases = [
        { codigo: '00', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true }
      ];
      expect(validarFases(fases).valido).toBe(true);
    });

    test('rechaza array vacio', () => {
      expect(validarFases([]).valido).toBe(false);
    });
  });

  describe('obtenerFasePorCodigo', () => {
    test('retorna fase correcta por codigo', () => {
      const fase = obtenerFasePorCodigo(getDefaultFases(), '05');
      expect(fase).toBeDefined();
      expect(fase.codigo).toBe('05');
      expect(fase.nombre).toContain('Incidencia');
    });

    test('retorna null para codigo inexistente', () => {
      expect(obtenerFasePorCodigo(getDefaultFases(), '99')).toBeNull();
    });
  });

  describe('obtenerClaseCSS', () => {
    test('retorna clase correcta para fase con clase', () => {
      expect(obtenerClaseCSS(getDefaultFases(), '05')).toBe('fase-incidencia');
    });

    test('retorna string vacio para fase sin clase especial', () => {
      expect(obtenerClaseCSS(getDefaultFases(), '00')).toBe('');
    });
  });

  describe('esFaseCritica', () => {
    test('identifica fases criticas correctamente', () => {
      const fases = getDefaultFases();
      expect(esFaseCritica(fases, '05')).toBe(true);
      expect(esFaseCritica(fases, '25')).toBe(true);
    });

    test('retorna false para fases no criticas', () => {
      const fases = getDefaultFases();
      expect(esFaseCritica(fases, '00')).toBe(false);
      expect(esFaseCritica(fases, '19')).toBe(false);
    });
  });

  describe('obtenerFasesOrdenadas', () => {
    test('ordena por campo orden ascendente', () => {
      const fases = [
        { codigo: 'B', nombre: 'B', orden: 3, es_critica: false, clase_css: '', activa: true },
        { codigo: 'A', nombre: 'A', orden: 1, es_critica: false, clase_css: '', activa: true },
        { codigo: 'C', nombre: 'C', orden: 2, es_critica: false, clase_css: '', activa: true }
      ];
      const ordenadas = obtenerFasesOrdenadas(fases);
      expect(ordenadas[0].codigo).toBe('A');
      expect(ordenadas[1].codigo).toBe('C');
      expect(ordenadas[2].codigo).toBe('B');
    });
  });

  describe('fasesAMapaLegacy', () => {
    test('genera objeto compatible {codigo: label}', () => {
      const mapa = fasesAMapaLegacy(getDefaultFases());
      expect(typeof mapa).toBe('object');
      expect(mapa['']).toBe('--');
      expect(mapa['00']).toBe('00 Espera');
      expect(mapa['05']).toBe('05 Incidencia');
    });

    test('solo incluye fases activas', () => {
      const fases = [
        { codigo: '00', nombre: 'Espera', orden: 1, es_critica: false, clase_css: '', activa: true },
        { codigo: '01', nombre: 'Inactiva', orden: 2, es_critica: false, clase_css: '', activa: false }
      ];
      const mapa = fasesAMapaLegacy(fases);
      expect('00' in mapa).toBe(true);
      expect('01' in mapa).toBe(false);
    });
  });
});
