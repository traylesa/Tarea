/**
 * Tests unitarios para estados-config.js
 */

const {
  getDefaultEstados,
  validarEstados,
  obtenerEstadoPorCodigo,
  obtenerEstadosOrdenados,
  estadosAMapaEditor,
  estadosAListaHeaderFilter,
  CLASES_CSS_ESTADOS_VALIDAS
} = require('../../../src/extension/estados-config.js');

describe('estados-config', () => {
  describe('getDefaultEstados', () => {
    test('retorna array de 7 estados', () => {
      const estados = getDefaultEstados();
      expect(Array.isArray(estados)).toBe(true);
      expect(estados).toHaveLength(7);
    });

    test('cada estado tiene campos requeridos', () => {
      getDefaultEstados().forEach(e => {
        expect(typeof e.codigo).toBe('string');
        expect(typeof e.nombre).toBe('string');
        expect(typeof e.icono).toBe('string');
        expect(typeof e.abreviatura).toBe('string');
        expect(typeof e.clase_css).toBe('string');
        expect(typeof e.orden).toBe('number');
        expect(typeof e.activo).toBe('boolean');
      });
    });

    test('codigos son unicos', () => {
      const codigos = getDefaultEstados().map(e => e.codigo);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    test('incluye los 7 estados del negocio', () => {
      const codigos = getDefaultEstados().map(e => e.codigo);
      expect(codigos).toContain('NUEVO');
      expect(codigos).toContain('ENVIADO');
      expect(codigos).toContain('RECIBIDO');
      expect(codigos).toContain('PENDIENTE');
      expect(codigos).toContain('GESTIONADO');
      expect(codigos).toContain('ALERTA');
      expect(codigos).toContain('CERRADO');
    });

    test('todos estan activos por defecto', () => {
      getDefaultEstados().forEach(e => {
        expect(e.activo).toBe(true);
      });
    });

    test('cada estado tiene icono unico (accesibilidad)', () => {
      const iconos = getDefaultEstados().map(e => e.icono);
      expect(new Set(iconos).size).toBe(iconos.length);
    });

    test('abreviaturas son de 3 caracteres', () => {
      getDefaultEstados().forEach(e => {
        expect(e.abreviatura).toHaveLength(3);
      });
    });

    test('abreviaturas son unicas', () => {
      const abrevs = getDefaultEstados().map(e => e.abreviatura);
      expect(new Set(abrevs).size).toBe(abrevs.length);
    });

    test('cada estado tiene clase CSS propia', () => {
      const clases = getDefaultEstados().map(e => e.clase_css);
      expect(new Set(clases).size).toBe(clases.length);
    });
  });

  describe('validarEstados', () => {
    test('acepta estados validos (defaults)', () => {
      const resultado = validarEstados(getDefaultEstados());
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('rechaza array vacio', () => {
      const resultado = validarEstados([]);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores[0]).toContain('al menos');
    });

    test('rechaza null', () => {
      const resultado = validarEstados(null);
      expect(resultado.valido).toBe(false);
    });

    test('rechaza codigo duplicado', () => {
      const estados = [
        { codigo: 'X', nombre: 'A', icono: '', clase_css: '', orden: 1, activo: true },
        { codigo: 'X', nombre: 'B', icono: '', clase_css: '', orden: 2, activo: true }
      ];
      const resultado = validarEstados(estados);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('duplicado'))).toBe(true);
    });

    test('rechaza orden duplicado', () => {
      const estados = [
        { codigo: 'A', nombre: 'A', icono: '', clase_css: '', orden: 1, activo: true },
        { codigo: 'B', nombre: 'B', icono: '', clase_css: '', orden: 1, activo: true }
      ];
      const resultado = validarEstados(estados);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('orden') || e.includes('Orden'))).toBe(true);
    });

    test('rechaza clase_css invalida', () => {
      const estados = [
        { codigo: 'X', nombre: 'X', icono: '', clase_css: 'clase-inventada', orden: 1, activo: true }
      ];
      const resultado = validarEstados(estados);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('clase') || e.includes('CSS'))).toBe(true);
    });

    test('acepta todas las clases CSS validas', () => {
      CLASES_CSS_ESTADOS_VALIDAS.forEach((clase, i) => {
        const estados = [
          { codigo: 'T' + i, nombre: 'Test', icono: '', clase_css: clase, orden: i, activo: true }
        ];
        expect(validarEstados(estados).valido).toBe(true);
      });
    });

    test('rechaza codigo vacio', () => {
      const estados = [
        { codigo: '', nombre: 'X', icono: '', clase_css: '', orden: 1, activo: true }
      ];
      const resultado = validarEstados(estados);
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.includes('codigo') || e.includes('obligatorio'))).toBe(true);
    });
  });

  describe('obtenerEstadoPorCodigo', () => {
    test('retorna estado correcto', () => {
      const estado = obtenerEstadoPorCodigo(getDefaultEstados(), 'ALERTA');
      expect(estado).toBeDefined();
      expect(estado.codigo).toBe('ALERTA');
      expect(estado.nombre).toBe('Alerta');
    });

    test('retorna NUEVO correctamente', () => {
      const estado = obtenerEstadoPorCodigo(getDefaultEstados(), 'NUEVO');
      expect(estado.abreviatura).toBe('NUE');
      expect(estado.clase_css).toBe('estado-nuevo');
    });

    test('retorna PENDIENTE correctamente', () => {
      const estado = obtenerEstadoPorCodigo(getDefaultEstados(), 'PENDIENTE');
      expect(estado.abreviatura).toBe('PEN');
      expect(estado.clase_css).toBe('estado-pendiente');
    });

    test('retorna CERRADO correctamente', () => {
      const estado = obtenerEstadoPorCodigo(getDefaultEstados(), 'CERRADO');
      expect(estado.abreviatura).toBe('CER');
      expect(estado.clase_css).toBe('estado-cerrado');
    });

    test('retorna null para codigo inexistente', () => {
      expect(obtenerEstadoPorCodigo(getDefaultEstados(), 'NOEXISTE')).toBeNull();
    });
  });

  describe('obtenerEstadosOrdenados', () => {
    test('ordena por campo orden ascendente', () => {
      const estados = [
        { codigo: 'C', nombre: 'C', icono: '', clase_css: '', orden: 3, activo: true },
        { codigo: 'A', nombre: 'A', icono: '', clase_css: '', orden: 1, activo: true },
        { codigo: 'B', nombre: 'B', icono: '', clase_css: '', orden: 2, activo: true }
      ];
      const ordenados = obtenerEstadosOrdenados(estados);
      expect(ordenados[0].codigo).toBe('A');
      expect(ordenados[1].codigo).toBe('B');
      expect(ordenados[2].codigo).toBe('C');
    });

    test('no muta el array original', () => {
      const estados = [
        { codigo: 'B', nombre: 'B', icono: '', clase_css: '', orden: 2, activo: true },
        { codigo: 'A', nombre: 'A', icono: '', clase_css: '', orden: 1, activo: true }
      ];
      obtenerEstadosOrdenados(estados);
      expect(estados[0].codigo).toBe('B');
    });

    test('defaults quedan en orden NUEVO-ENVIADO-RECIBIDO-PENDIENTE-GESTIONADO-ALERTA-CERRADO', () => {
      const ordenados = obtenerEstadosOrdenados(getDefaultEstados());
      expect(ordenados.map(e => e.codigo)).toEqual([
        'NUEVO', 'ENVIADO', 'RECIBIDO', 'PENDIENTE', 'GESTIONADO', 'ALERTA', 'CERRADO'
      ]);
    });
  });

  describe('estadosAMapaEditor', () => {
    test('genera mapa {codigo: icono + nombre}', () => {
      const mapa = estadosAMapaEditor(getDefaultEstados());
      expect(typeof mapa).toBe('object');
      expect(mapa['ALERTA']).toContain('Alerta');
    });

    test('incluye los 7 estados activos', () => {
      const mapa = estadosAMapaEditor(getDefaultEstados());
      expect(Object.keys(mapa)).toHaveLength(7);
    });

    test('solo incluye estados activos', () => {
      const estados = [
        { codigo: 'A', nombre: 'Act', icono: 'x', clase_css: '', orden: 1, activo: true },
        { codigo: 'I', nombre: 'Inact', icono: 'y', clase_css: '', orden: 2, activo: false }
      ];
      const mapa = estadosAMapaEditor(estados);
      expect('A' in mapa).toBe(true);
      expect('I' in mapa).toBe(false);
    });
  });

  describe('estadosAListaHeaderFilter', () => {
    test('retorna array con string vacio como primer elemento', () => {
      const lista = estadosAListaHeaderFilter(getDefaultEstados());
      expect(Array.isArray(lista)).toBe(true);
      expect(lista[0]).toBe('');
    });

    test('incluye codigos de estados activos', () => {
      const lista = estadosAListaHeaderFilter(getDefaultEstados());
      expect(lista).toContain('ENVIADO');
      expect(lista).toContain('ALERTA');
      expect(lista).toContain('NUEVO');
      expect(lista).toContain('PENDIENTE');
      expect(lista).toContain('CERRADO');
    });

    test('excluye estados inactivos', () => {
      const estados = [
        { codigo: 'A', nombre: 'A', icono: '', clase_css: '', orden: 1, activo: true },
        { codigo: 'I', nombre: 'I', icono: '', clase_css: '', orden: 2, activo: false }
      ];
      const lista = estadosAListaHeaderFilter(estados);
      expect(lista).toContain('A');
      expect(lista).not.toContain('I');
    });
  });

  describe('CLASES_CSS_ESTADOS_VALIDAS', () => {
    test('es array con string vacio incluido', () => {
      expect(Array.isArray(CLASES_CSS_ESTADOS_VALIDAS)).toBe(true);
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('');
    });

    test('incluye las 7 clases de estado', () => {
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-nuevo');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-enviado');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-recibido');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-pendiente');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-gestionado');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-alerta');
      expect(CLASES_CSS_ESTADOS_VALIDAS).toContain('estado-cerrado');
    });

    test('tiene 8 entradas (vacia + 7 estados)', () => {
      expect(CLASES_CSS_ESTADOS_VALIDAS).toHaveLength(8);
    });
  });
});
