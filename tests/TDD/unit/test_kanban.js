/**
 * test_kanban.js - Tests TDD para modulo Kanban (logica pura)
 * Vista Kanban: agrupar, deduplicar, mover, conteos
 */

// Setup: exponer constantes y action-bar en scope global (simula script tags)
const constants = require('../../../src/extension/constants.js');
Object.assign(global, constants);
const actionBar = require('../../../src/extension/action-bar.js');
Object.assign(global, actionBar);

const {
  COLUMNAS_KANBAN,
  deduplicarPorCarga,
  agruparPorColumna,
  agruparPorEstado,
  resolverColumnaDestino,
  resolverFaseAlMover,
  calcularConteos,
  calcularConteosDual,
  formatearConteo
} = require('../../../src/extension/kanban.js');

// --- Helpers ---

function crearRegistro(overrides) {
  return Object.assign({
    messageId: 'msg-' + Math.random().toString(36).slice(2, 8),
    codCar: 168200,
    fase: '19',
    estado: 'PENDIENTE',
    fechaCorreo: '2026-02-23T10:00:00Z'
  }, overrides);
}

describe('kanban.js', function() {

  // --- COLUMNAS_KANBAN ---

  describe('COLUMNAS_KANBAN', function() {
    test('existe y es un array', function() {
      expect(Array.isArray(COLUMNAS_KANBAN)).toBe(true);
    });

    test('tiene 7 columnas', function() {
      expect(COLUMNAS_KANBAN.length).toBe(7);
    });

    test('cada columna tiene id, nombre, fases y orden', function() {
      COLUMNAS_KANBAN.forEach(function(col) {
        expect(typeof col.id).toBe('string');
        expect(typeof col.nombre).toBe('string');
        expect(Array.isArray(col.fases)).toBe(true);
        expect(typeof col.orden).toBe('number');
      });
    });

    test('columnas estan ordenadas por orden ascendente', function() {
      for (var i = 1; i < COLUMNAS_KANBAN.length; i++) {
        expect(COLUMNAS_KANBAN[i].orden).toBeGreaterThan(COLUMNAS_KANBAN[i - 1].orden);
      }
    });

    test('incluye las 7 columnas esperadas', function() {
      var ids = COLUMNAS_KANBAN.map(function(c) { return c.id; });
      expect(ids).toEqual(['espera', 'carga', 'en_ruta', 'descarga', 'vacio', 'incidencia', 'documentado']);
    });
  });

  // --- deduplicarPorCarga ---

  describe('deduplicarPorCarga', function() {
    test('mismo codCar toma el mas reciente por fechaCorreo', function() {
      var registros = [
        crearRegistro({ codCar: 100, fechaCorreo: '2026-02-20T08:00:00Z' }),
        crearRegistro({ codCar: 100, fechaCorreo: '2026-02-22T08:00:00Z' }),
        crearRegistro({ codCar: 100, fechaCorreo: '2026-02-21T08:00:00Z' })
      ];

      var resultado = deduplicarPorCarga(registros);

      expect(resultado.length).toBe(1);
      expect(resultado[0].fechaCorreo).toBe('2026-02-22T08:00:00Z');
    });

    test('sin codCar mantiene todos los registros', function() {
      var registros = [
        crearRegistro({ codCar: null, messageId: 'a' }),
        crearRegistro({ codCar: undefined, messageId: 'b' }),
        crearRegistro({ codCar: '', messageId: 'c' })
      ];

      var resultado = deduplicarPorCarga(registros);

      expect(resultado.length).toBe(3);
    });

    test('mezcla duplicados y unicos correctamente', function() {
      var registros = [
        crearRegistro({ codCar: 100, fechaCorreo: '2026-02-20T08:00:00Z' }),
        crearRegistro({ codCar: 200, fechaCorreo: '2026-02-21T08:00:00Z' }),
        crearRegistro({ codCar: 100, fechaCorreo: '2026-02-22T08:00:00Z' }),
        crearRegistro({ codCar: null, messageId: 'solo' })
      ];

      var resultado = deduplicarPorCarga(registros);

      expect(resultado.length).toBe(3);
    });

    test('array vacio retorna array vacio', function() {
      expect(deduplicarPorCarga([])).toEqual([]);
    });
  });

  // --- agruparPorColumna ---

  describe('agruparPorColumna', function() {
    test('array vacio retorna grupos vacios', function() {
      var grupos = agruparPorColumna([]);

      COLUMNAS_KANBAN.forEach(function(col) {
        expect(grupos[col.id]).toEqual([]);
      });
      expect(grupos.sin_columna).toEqual([]);
    });

    test('fase 00 va a espera', function() {
      var registros = [crearRegistro({ fase: '00' })];
      var grupos = agruparPorColumna(registros);

      expect(grupos.espera.length).toBe(1);
    });

    test('fase 19 va a en_ruta', function() {
      var registros = [crearRegistro({ fase: '19' })];
      var grupos = agruparPorColumna(registros);

      expect(grupos.en_ruta.length).toBe(1);
    });

    test('fase 05 va a incidencia', function() {
      var registros = [crearRegistro({ fase: '05' })];
      var grupos = agruparPorColumna(registros);

      expect(grupos.incidencia.length).toBe(1);
    });

    test('fase 30 va a documentado', function() {
      var registros = [crearRegistro({ fase: '30' })];
      var grupos = agruparPorColumna(registros);

      expect(grupos.documentado.length).toBe(1);
    });

    test('sin fase va a sin_columna', function() {
      var registros = [
        crearRegistro({ fase: null }),
        crearRegistro({ fase: '' })
      ];
      var grupos = agruparPorColumna(registros);

      expect(grupos.sin_columna.length).toBe(2);
    });

    test('fase desconocida va a sin_columna', function() {
      var registros = [crearRegistro({ fase: '99' })];
      var grupos = agruparPorColumna(registros);

      expect(grupos.sin_columna.length).toBe(1);
    });

    test('multiples registros se distribuyen correctamente', function() {
      var registros = [
        crearRegistro({ fase: '00' }),
        crearRegistro({ fase: '01' }),
        crearRegistro({ fase: '11' }),
        crearRegistro({ fase: '19' }),
        crearRegistro({ fase: '21' }),
        crearRegistro({ fase: '29' }),
        crearRegistro({ fase: '05' }),
        crearRegistro({ fase: '30' })
      ];
      var grupos = agruparPorColumna(registros);

      expect(grupos.espera.length).toBe(2);
      expect(grupos.carga.length).toBe(1);
      expect(grupos.en_ruta.length).toBe(1);
      expect(grupos.descarga.length).toBe(1);
      expect(grupos.vacio.length).toBe(1);
      expect(grupos.incidencia.length).toBe(1);
      expect(grupos.documentado.length).toBe(1);
      expect(grupos.sin_columna.length).toBe(0);
    });
  });

  // --- agruparPorEstado ---

  describe('agruparPorEstado', function() {
    test('agrupa registros por su estado', function() {
      var registros = [
        crearRegistro({ estado: 'NUEVO' }),
        crearRegistro({ estado: 'PENDIENTE' }),
        crearRegistro({ estado: 'NUEVO' })
      ];
      var estados = ['NUEVO', 'PENDIENTE', 'GESTIONADO'];

      var resultado = agruparPorEstado(registros, estados);

      expect(resultado.NUEVO.length).toBe(2);
      expect(resultado.PENDIENTE.length).toBe(1);
      expect(resultado.GESTIONADO.length).toBe(0);
    });

    test('estado no definido va a OTRO', function() {
      var registros = [
        crearRegistro({ estado: 'DESCONOCIDO' }),
        crearRegistro({ estado: null })
      ];
      var estados = ['NUEVO', 'PENDIENTE'];

      var resultado = agruparPorEstado(registros, estados);

      expect(resultado.OTRO.length).toBe(2);
    });

    test('retorna todos los estados aunque esten vacios', function() {
      var estados = ['NUEVO', 'ENVIADO', 'PENDIENTE'];
      var resultado = agruparPorEstado([], estados);

      expect(resultado.NUEVO).toEqual([]);
      expect(resultado.ENVIADO).toEqual([]);
      expect(resultado.PENDIENTE).toEqual([]);
      expect(resultado.OTRO).toEqual([]);
    });
  });

  // --- resolverColumnaDestino ---

  describe('resolverColumnaDestino', function() {
    test('fase 11 resuelve a carga', function() {
      expect(resolverColumnaDestino('11')).toBe('carga');
    });

    test('fase 30 resuelve a documentado', function() {
      expect(resolverColumnaDestino('30')).toBe('documentado');
    });

    test('fase 00 resuelve a espera', function() {
      expect(resolverColumnaDestino('00')).toBe('espera');
    });

    test('fase null retorna null', function() {
      expect(resolverColumnaDestino(null)).toBeNull();
    });

    test('fase desconocida retorna null', function() {
      expect(resolverColumnaDestino('99')).toBeNull();
    });
  });

  // --- resolverFaseAlMover ---

  describe('resolverFaseAlMover', function() {
    test('mover a carga con fase 00 retorna 11', function() {
      expect(resolverFaseAlMover('carga', '00')).toBe('11');
    });

    test('mover dentro del mismo grupo mantiene fase', function() {
      expect(resolverFaseAlMover('espera', '01')).toBe('01');
    });

    test('mover a incidencia retorna 05', function() {
      expect(resolverFaseAlMover('incidencia', '19')).toBe('05');
    });

    test('mover a documentado retorna 30', function() {
      expect(resolverFaseAlMover('documentado', '29')).toBe('30');
    });

    test('normaliza fase con padStart', function() {
      // fase numerica 5 se normaliza a '05'
      expect(resolverFaseAlMover('incidencia', '5')).toBe('05');
    });

    test('columna destino inexistente retorna null', function() {
      expect(resolverFaseAlMover('noexiste', '19')).toBeNull();
    });

    test('mover a en_ruta retorna 19', function() {
      expect(resolverFaseAlMover('en_ruta', '12')).toBe('19');
    });

    test('mover a descarga retorna 21', function() {
      expect(resolverFaseAlMover('descarga', '19')).toBe('21');
    });
  });

  // --- calcularConteos ---

  describe('calcularConteos', function() {
    test('totales correctos por columna', function() {
      var agrupados = agruparPorColumna([
        crearRegistro({ fase: '00', estado: 'NUEVO' }),
        crearRegistro({ fase: '01', estado: 'PENDIENTE' }),
        crearRegistro({ fase: '19', estado: 'NUEVO' })
      ]);

      var conteos = calcularConteos(agrupados);

      expect(conteos.espera.total).toBe(2);
      expect(conteos.en_ruta.total).toBe(1);
      expect(conteos.carga.total).toBe(0);
    });

    test('sub-totales por estado', function() {
      var agrupados = agruparPorColumna([
        crearRegistro({ fase: '00', estado: 'NUEVO' }),
        crearRegistro({ fase: '01', estado: 'PENDIENTE' }),
        crearRegistro({ fase: '02', estado: 'NUEVO' })
      ]);

      var conteos = calcularConteos(agrupados);

      expect(conteos.espera.porEstado.NUEVO).toBe(2);
      expect(conteos.espera.porEstado.PENDIENTE).toBe(1);
    });

    test('columnas vacias tienen conteo 0', function() {
      var agrupados = agruparPorColumna([]);
      var conteos = calcularConteos(agrupados);

      COLUMNAS_KANBAN.forEach(function(col) {
        expect(conteos[col.id].total).toBe(0);
      });
    });

    test('incluye sin_columna en conteos', function() {
      var agrupados = agruparPorColumna([
        crearRegistro({ fase: '99' })
      ]);
      var conteos = calcularConteos(agrupados);

      expect(conteos.sin_columna.total).toBe(1);
    });
  });

  // --- calcularConteosDual ---

  describe('calcularConteosDual', function() {
    test('retorna filtrado y total por columna', function() {
      var todos = [
        crearRegistro({ fase: '00', estado: 'NUEVO' }),
        crearRegistro({ fase: '00', estado: 'PENDIENTE' }),
        crearRegistro({ fase: '00', estado: 'NUEVO' }),
        crearRegistro({ fase: '19', estado: 'NUEVO' })
      ];
      var filtrados = [
        crearRegistro({ fase: '00', estado: 'NUEVO' }),
        crearRegistro({ fase: '19', estado: 'NUEVO' })
      ];

      var agrupadosTotales = agruparPorColumna(todos);
      var agrupadosFiltrados = agruparPorColumna(filtrados);
      var conteos = calcularConteosDual(agrupadosFiltrados, agrupadosTotales);

      expect(conteos.espera.total).toBe(3);
      expect(conteos.espera.filtrado).toBe(1);
      expect(conteos.en_ruta.total).toBe(1);
      expect(conteos.en_ruta.filtrado).toBe(1);
    });

    test('incluye porEstadoFiltrado y porEstadoTotal', function() {
      var todos = [
        crearRegistro({ fase: '11', estado: 'NUEVO' }),
        crearRegistro({ fase: '11', estado: 'NUEVO' }),
        crearRegistro({ fase: '11', estado: 'PENDIENTE' })
      ];
      var filtrados = [
        crearRegistro({ fase: '11', estado: 'NUEVO' })
      ];

      var conteos = calcularConteosDual(
        agruparPorColumna(filtrados),
        agruparPorColumna(todos)
      );

      expect(conteos.carga.porEstadoTotal.NUEVO).toBe(2);
      expect(conteos.carga.porEstadoTotal.PENDIENTE).toBe(1);
      expect(conteos.carga.porEstadoFiltrado.NUEVO).toBe(1);
      expect(conteos.carga.porEstadoFiltrado.PENDIENTE).toBeUndefined();
    });

    test('columnas sin filtrados tienen filtrado 0', function() {
      var todos = [crearRegistro({ fase: '29', estado: 'NUEVO' })];
      var filtrados = [];

      var conteos = calcularConteosDual(
        agruparPorColumna(filtrados),
        agruparPorColumna(todos)
      );

      expect(conteos.vacio.total).toBe(1);
      expect(conteos.vacio.filtrado).toBe(0);
    });

    test('columnas vacias tienen ambos conteos en 0', function() {
      var conteos = calcularConteosDual(
        agruparPorColumna([]),
        agruparPorColumna([])
      );

      COLUMNAS_KANBAN.forEach(function(col) {
        expect(conteos[col.id].total).toBe(0);
        expect(conteos[col.id].filtrado).toBe(0);
      });
    });
  });

  // --- formatearConteo ---

  describe('formatearConteo', function() {
    test('sin filtros muestra solo total', function() {
      expect(formatearConteo(3, 8, false)).toBe('8');
    });

    test('con filtros muestra filtrado/total', function() {
      expect(formatearConteo(3, 8, true)).toBe('3/8');
    });

    test('con filtros y 0 filtrados', function() {
      expect(formatearConteo(0, 5, true)).toBe('0/5');
    });

    test('sin filtros con 0 total', function() {
      expect(formatearConteo(0, 0, false)).toBe('0');
    });

    test('con filtros e iguales', function() {
      expect(formatearConteo(5, 5, true)).toBe('5/5');
    });
  });
});
