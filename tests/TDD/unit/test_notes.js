/**
 * test_notes.js - Tests TDD para modulo de notas rapidas por carga
 * Sprint 4: HU-12 (Notas rapidas)
 */

const {
  crearNota,
  obtenerNotas,
  eliminarNota,
  contarNotas,
  tieneNotas,
  MAX_NOTAS_POR_CARGA
} = require('../../../src/extension/notes.js');

const AHORA = new Date('2026-02-15T10:00:00.000Z');

describe('notes.js', () => {

  // --- crearNota ---

  describe('crearNota', () => {
    test('crea nota con todos los campos', () => {
      var resultado = crearNota('Conductor avisa retraso', 168345, {}, AHORA);
      expect(resultado.nota.id).toMatch(/^nota_/);
      expect(resultado.nota.texto).toBe('Conductor avisa retraso');
      expect(resultado.nota.fechaCreacion).toBe(AHORA.toISOString());
    });

    test('almacena nota en almacen bajo codCar', () => {
      var resultado = crearNota('Test', 168345, {}, AHORA);
      expect(resultado.almacen['168345']).toBeDefined();
      expect(resultado.almacen['168345'].length).toBe(1);
    });

    test('agrega nota a almacen existente', () => {
      var almacen = { '168345': [{ id: 'nota_x', texto: 'Vieja', fechaCreacion: '2026-02-14T10:00:00.000Z' }] };
      var resultado = crearNota('Nueva', 168345, almacen, AHORA);
      expect(resultado.almacen['168345'].length).toBe(2);
    });

    test('genera id unico en cada llamada', () => {
      var r1 = crearNota('Test 1', 100, {}, AHORA);
      var r2 = crearNota('Test 2', 100, {}, AHORA);
      expect(r1.nota.id).not.toBe(r2.nota.id);
    });

    test('lanza error si texto vacio', () => {
      expect(function() { crearNota('', 168345, {}, AHORA); })
        .toThrow('El texto de la nota es obligatorio');
    });

    test('lanza error si texto solo espacios', () => {
      expect(function() { crearNota('   ', 168345, {}, AHORA); })
        .toThrow('El texto de la nota es obligatorio');
    });

    test('lanza error si texto null', () => {
      expect(function() { crearNota(null, 168345, {}, AHORA); })
        .toThrow('El texto de la nota es obligatorio');
    });

    test('lanza error si limite alcanzado', () => {
      var notas = [];
      for (var i = 0; i < MAX_NOTAS_POR_CARGA; i++) {
        notas.push({ id: 'nota_' + i, texto: 'Nota ' + i, fechaCreacion: AHORA.toISOString() });
      }
      var almacen = { '168345': notas };
      expect(function() { crearNota('Una mas', 168345, almacen, AHORA); })
        .toThrow('limite');
    });

    test('permite crear si codCar diferente tiene 50 notas', () => {
      var notas = [];
      for (var i = 0; i < MAX_NOTAS_POR_CARGA; i++) {
        notas.push({ id: 'nota_' + i, texto: 'Nota ' + i, fechaCreacion: AHORA.toISOString() });
      }
      var almacen = { '999': notas };
      expect(function() { crearNota('Ok', 168345, almacen, AHORA); }).not.toThrow();
    });

    test('recorta espacios del texto', () => {
      var resultado = crearNota('  Retraso 30min  ', 168345, {}, AHORA);
      expect(resultado.nota.texto).toBe('Retraso 30min');
    });

    test('no modifica almacen original', () => {
      var almacen = {};
      crearNota('Test', 168345, almacen, AHORA);
      expect(almacen['168345']).toBeUndefined();
    });

    test('convierte codCar numerico a string como clave', () => {
      var resultado = crearNota('Test', 168345, {}, AHORA);
      expect(resultado.almacen['168345']).toBeDefined();
    });
  });

  // --- obtenerNotas ---

  describe('obtenerNotas', () => {
    test('retorna notas de un codCar', () => {
      var almacen = {
        '168345': [
          { id: 'nota_1', texto: 'Primera', fechaCreacion: '2026-02-15T09:00:00.000Z' },
          { id: 'nota_2', texto: 'Segunda', fechaCreacion: '2026-02-15T10:00:00.000Z' }
        ]
      };
      var notas = obtenerNotas(168345, almacen);
      expect(notas.length).toBe(2);
    });

    test('ordena recientes primero', () => {
      var almacen = {
        '168345': [
          { id: 'nota_1', texto: 'Vieja', fechaCreacion: '2026-02-14T10:00:00.000Z' },
          { id: 'nota_2', texto: 'Nueva', fechaCreacion: '2026-02-15T10:00:00.000Z' },
          { id: 'nota_3', texto: 'Media', fechaCreacion: '2026-02-14T18:00:00.000Z' }
        ]
      };
      var notas = obtenerNotas(168345, almacen);
      expect(notas[0].texto).toBe('Nueva');
      expect(notas[1].texto).toBe('Media');
      expect(notas[2].texto).toBe('Vieja');
    });

    test('retorna array vacio si codCar no tiene notas', () => {
      expect(obtenerNotas(168345, {})).toEqual([]);
    });

    test('retorna array vacio si almacen null', () => {
      expect(obtenerNotas(168345, null)).toEqual([]);
    });

    test('retorna array vacio si almacen undefined', () => {
      expect(obtenerNotas(168345, undefined)).toEqual([]);
    });

    test('retorna copia, no referencia', () => {
      var almacen = {
        '168345': [{ id: 'nota_1', texto: 'Test', fechaCreacion: AHORA.toISOString() }]
      };
      var n1 = obtenerNotas(168345, almacen);
      var n2 = obtenerNotas(168345, almacen);
      expect(n1).not.toBe(n2);
    });
  });

  // --- eliminarNota ---

  describe('eliminarNota', () => {
    test('elimina nota por id', () => {
      var almacen = {
        '168345': [
          { id: 'nota_1', texto: 'Mantener', fechaCreacion: AHORA.toISOString() },
          { id: 'nota_2', texto: 'Eliminar', fechaCreacion: AHORA.toISOString() }
        ]
      };
      var nuevo = eliminarNota('nota_2', 168345, almacen);
      expect(nuevo['168345'].length).toBe(1);
      expect(nuevo['168345'][0].id).toBe('nota_1');
    });

    test('no modifica almacen original', () => {
      var almacen = {
        '168345': [{ id: 'nota_1', texto: 'Test', fechaCreacion: AHORA.toISOString() }]
      };
      eliminarNota('nota_1', 168345, almacen);
      expect(almacen['168345'].length).toBe(1);
    });

    test('retorna almacen sin cambios si id no existe', () => {
      var almacen = {
        '168345': [{ id: 'nota_1', texto: 'Test', fechaCreacion: AHORA.toISOString() }]
      };
      var nuevo = eliminarNota('nota_inexistente', 168345, almacen);
      expect(nuevo['168345'].length).toBe(1);
    });

    test('retorna almacen vacio si codCar no existe', () => {
      var nuevo = eliminarNota('nota_1', 168345, {});
      expect(nuevo['168345']).toBeUndefined();
    });
  });

  // --- contarNotas ---

  describe('contarNotas', () => {
    test('cuenta notas de un codCar', () => {
      var almacen = {
        '168345': [
          { id: 'nota_1', texto: 'A', fechaCreacion: AHORA.toISOString() },
          { id: 'nota_2', texto: 'B', fechaCreacion: AHORA.toISOString() }
        ]
      };
      expect(contarNotas(168345, almacen)).toBe(2);
    });

    test('retorna 0 si codCar no tiene notas', () => {
      expect(contarNotas(168345, {})).toBe(0);
    });

    test('retorna 0 si almacen null', () => {
      expect(contarNotas(168345, null)).toBe(0);
    });
  });

  // --- tieneNotas ---

  describe('tieneNotas', () => {
    test('retorna true si tiene notas', () => {
      var almacen = {
        '168345': [{ id: 'nota_1', texto: 'A', fechaCreacion: AHORA.toISOString() }]
      };
      expect(tieneNotas(168345, almacen)).toBe(true);
    });

    test('retorna false si no tiene notas', () => {
      expect(tieneNotas(168345, {})).toBe(false);
    });

    test('retorna false si almacen null', () => {
      expect(tieneNotas(168345, null)).toBe(false);
    });

    test('retorna false si array vacio', () => {
      expect(tieneNotas(168345, { '168345': [] })).toBe(false);
    });
  });

  // --- Constantes ---

  describe('constantes', () => {
    test('MAX_NOTAS_POR_CARGA es 50', () => {
      expect(MAX_NOTAS_POR_CARGA).toBe(50);
    });
  });
});
