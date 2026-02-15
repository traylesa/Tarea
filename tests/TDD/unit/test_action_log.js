/**
 * test_action_log.js - Tests TDD para modulo de historial de acciones por carga
 * Sprint 5: Historial de acciones (action-log)
 */

const {
  registrarAccion,
  obtenerHistorial,
  filtrarPorTipo,
  rotarHistorial,
  TIPOS_ACCION,
  MAX_ENTRADAS_POR_CARGA
} = require('../../../src/extension/action-log.js');

const AHORA = new Date('2026-02-15T10:00:00.000Z');

describe('action-log.js', () => {

  // --- registrarAccion ---

  describe('registrarAccion', () => {
    test('crea entrada con id, tipo, codCar, descripcion, fechaCreacion', () => {
      var resultado = registrarAccion('EMAIL', 168345, 'Enviado email a proveedor', {}, AHORA);
      expect(resultado.entrada.id).toMatch(/^hist_/);
      expect(resultado.entrada.tipo).toBe('EMAIL');
      expect(resultado.entrada.codCar).toBe('168345');
      expect(resultado.entrada.descripcion).toBe('Enviado email a proveedor');
      expect(resultado.entrada.fechaCreacion).toBe(AHORA.toISOString());
    });

    test('almacen original no se muta', () => {
      var almacen = {};
      registrarAccion('FASE', 168345, 'Cambio a fase 19', almacen, AHORA);
      expect(almacen['168345']).toBeUndefined();
    });

    test('agrega a historial existente de la carga', () => {
      var almacen = {
        '168345': [{ id: 'hist_x', tipo: 'EMAIL', codCar: '168345', descripcion: 'Anterior', fechaCreacion: '2026-02-14T10:00:00.000Z' }]
      };
      var resultado = registrarAccion('NOTA', 168345, 'Nueva nota', almacen, AHORA);
      expect(resultado.almacen['168345'].length).toBe(2);
    });

    test('rechaza tipo invalido', () => {
      expect(function() {
        registrarAccion('INVALIDO', 168345, 'Algo', {}, AHORA);
      }).toThrow('Tipo de accion no valido');
    });

    test('rechaza descripcion vacia', () => {
      expect(function() {
        registrarAccion('EMAIL', 168345, '', {}, AHORA);
      }).toThrow('La descripcion es obligatoria');
    });

    test('rechaza descripcion solo espacios', () => {
      expect(function() {
        registrarAccion('EMAIL', 168345, '   ', {}, AHORA);
      }).toThrow('La descripcion es obligatoria');
    });

    test('rechaza descripcion null', () => {
      expect(function() {
        registrarAccion('EMAIL', 168345, null, {}, AHORA);
      }).toThrow('La descripcion es obligatoria');
    });

    test('rechaza codCar no numerico', () => {
      expect(function() {
        registrarAccion('EMAIL', 'abc', 'Algo', {}, AHORA);
      }).toThrow('codCar debe ser numerico');
    });

    test('genera id unico en cada llamada', () => {
      var r1 = registrarAccion('EMAIL', 100, 'Primero', {}, AHORA);
      var r2 = registrarAccion('EMAIL', 100, 'Segundo', {}, AHORA);
      expect(r1.entrada.id).not.toBe(r2.entrada.id);
    });

    test('recorta espacios de la descripcion', () => {
      var resultado = registrarAccion('EMAIL', 168345, '  Enviado  ', {}, AHORA);
      expect(resultado.entrada.descripcion).toBe('Enviado');
    });

    test('convierte codCar numerico a string como clave', () => {
      var resultado = registrarAccion('FASE', 168345, 'Cambio fase', {}, AHORA);
      expect(resultado.almacen['168345']).toBeDefined();
    });

    test('acepta todos los tipos validos', () => {
      TIPOS_ACCION.forEach(function(tipo) {
        expect(function() {
          registrarAccion(tipo, 100, 'Test ' + tipo, {}, AHORA);
        }).not.toThrow();
      });
    });
  });

  // --- obtenerHistorial ---

  describe('obtenerHistorial', () => {
    test('retorna historial ordenado DESC por fechaCreacion', () => {
      var almacen = {
        '168345': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'Vieja', fechaCreacion: '2026-02-13T10:00:00.000Z' },
          { id: 'hist_2', tipo: 'FASE', codCar: '168345', descripcion: 'Nueva', fechaCreacion: '2026-02-15T10:00:00.000Z' },
          { id: 'hist_3', tipo: 'NOTA', codCar: '168345', descripcion: 'Media', fechaCreacion: '2026-02-14T10:00:00.000Z' }
        ]
      };
      var historial = obtenerHistorial(168345, almacen);
      expect(historial[0].descripcion).toBe('Nueva');
      expect(historial[1].descripcion).toBe('Media');
      expect(historial[2].descripcion).toBe('Vieja');
    });

    test('retorna array vacio si no hay entradas para codCar', () => {
      expect(obtenerHistorial(168345, {})).toEqual([]);
    });

    test('retorna array vacio si almacen null', () => {
      expect(obtenerHistorial(168345, null)).toEqual([]);
    });

    test('retorna array vacio si almacen undefined', () => {
      expect(obtenerHistorial(168345, undefined)).toEqual([]);
    });

    test('filtra correctamente por codCar', () => {
      var almacen = {
        '100': [{ id: 'hist_1', tipo: 'EMAIL', codCar: '100', descripcion: 'Carga 100', fechaCreacion: AHORA.toISOString() }],
        '200': [{ id: 'hist_2', tipo: 'FASE', codCar: '200', descripcion: 'Carga 200', fechaCreacion: AHORA.toISOString() }]
      };
      var historial = obtenerHistorial(100, almacen);
      expect(historial.length).toBe(1);
      expect(historial[0].descripcion).toBe('Carga 100');
    });

    test('retorna copia, no referencia', () => {
      var almacen = {
        '168345': [{ id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'Test', fechaCreacion: AHORA.toISOString() }]
      };
      var h1 = obtenerHistorial(168345, almacen);
      var h2 = obtenerHistorial(168345, almacen);
      expect(h1).not.toBe(h2);
    });
  });

  // --- filtrarPorTipo ---

  describe('filtrarPorTipo', () => {
    var historial = [
      { id: 'hist_1', tipo: 'EMAIL', descripcion: 'Email enviado', fechaCreacion: '2026-02-15T10:00:00.000Z' },
      { id: 'hist_2', tipo: 'FASE', descripcion: 'Cambio fase', fechaCreacion: '2026-02-15T11:00:00.000Z' },
      { id: 'hist_3', tipo: 'EMAIL', descripcion: 'Otro email', fechaCreacion: '2026-02-15T12:00:00.000Z' },
      { id: 'hist_4', tipo: 'NOTA', descripcion: 'Una nota', fechaCreacion: '2026-02-15T13:00:00.000Z' }
    ];

    test('filtra solo entradas del tipo pedido', () => {
      var resultado = filtrarPorTipo(historial, 'EMAIL');
      expect(resultado.length).toBe(2);
      resultado.forEach(function(e) {
        expect(e.tipo).toBe('EMAIL');
      });
    });

    test('retorna vacio si no hay coincidencias', () => {
      var resultado = filtrarPorTipo(historial, 'RECORDATORIO');
      expect(resultado).toEqual([]);
    });

    test('retorna todas si tipo es null', () => {
      var resultado = filtrarPorTipo(historial, null);
      expect(resultado.length).toBe(4);
    });

    test('retorna todas si tipo es undefined', () => {
      var resultado = filtrarPorTipo(historial, undefined);
      expect(resultado.length).toBe(4);
    });

    test('retorna array vacio si historial vacio', () => {
      expect(filtrarPorTipo([], 'EMAIL')).toEqual([]);
    });
  });

  // --- rotarHistorial ---

  describe('rotarHistorial', () => {
    test('elimina entradas mayores a 30 dias', () => {
      var almacen = {
        '168345': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'Vieja', fechaCreacion: '2026-01-10T10:00:00.000Z' },
          { id: 'hist_2', tipo: 'FASE', codCar: '168345', descripcion: 'Reciente', fechaCreacion: '2026-02-14T10:00:00.000Z' }
        ]
      };
      var nuevo = rotarHistorial(almacen, 30, AHORA);
      expect(nuevo['168345'].length).toBe(1);
      expect(nuevo['168345'][0].descripcion).toBe('Reciente');
    });

    test('preserva entradas recientes', () => {
      var almacen = {
        '168345': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'Hoy', fechaCreacion: '2026-02-15T08:00:00.000Z' },
          { id: 'hist_2', tipo: 'FASE', codCar: '168345', descripcion: 'Ayer', fechaCreacion: '2026-02-14T10:00:00.000Z' }
        ]
      };
      var nuevo = rotarHistorial(almacen, 30, AHORA);
      expect(nuevo['168345'].length).toBe(2);
    });

    test('no muta almacen original', () => {
      var almacen = {
        '168345': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'Vieja', fechaCreacion: '2026-01-01T10:00:00.000Z' }
        ]
      };
      rotarHistorial(almacen, 30, AHORA);
      expect(almacen['168345'].length).toBe(1);
    });

    test('con diasMax personalizado funciona', () => {
      var almacen = {
        '168345': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '168345', descripcion: 'De hace 3 dias', fechaCreacion: '2026-02-12T10:00:00.000Z' },
          { id: 'hist_2', tipo: 'FASE', codCar: '168345', descripcion: 'De hoy', fechaCreacion: '2026-02-15T09:00:00.000Z' }
        ]
      };
      var nuevo = rotarHistorial(almacen, 2, AHORA);
      expect(nuevo['168345'].length).toBe(1);
      expect(nuevo['168345'][0].descripcion).toBe('De hoy');
    });

    test('almacen vacio retorna vacio', () => {
      var nuevo = rotarHistorial({}, 30, AHORA);
      expect(nuevo).toEqual({});
    });

    test('almacen null retorna vacio', () => {
      var nuevo = rotarHistorial(null, 30, AHORA);
      expect(nuevo).toEqual({});
    });

    test('rota multiples codCar independientemente', () => {
      var almacen = {
        '100': [
          { id: 'hist_1', tipo: 'EMAIL', codCar: '100', descripcion: 'Vieja 100', fechaCreacion: '2026-01-01T10:00:00.000Z' }
        ],
        '200': [
          { id: 'hist_2', tipo: 'FASE', codCar: '200', descripcion: 'Reciente 200', fechaCreacion: '2026-02-14T10:00:00.000Z' }
        ]
      };
      var nuevo = rotarHistorial(almacen, 30, AHORA);
      expect(nuevo['100'].length).toBe(0);
      expect(nuevo['200'].length).toBe(1);
    });
  });

  // --- Constantes ---

  describe('constantes', () => {
    test('TIPOS_ACCION contiene los 4 tipos', () => {
      expect(TIPOS_ACCION).toEqual(['EMAIL', 'FASE', 'RECORDATORIO', 'NOTA']);
    });

    test('MAX_ENTRADAS_POR_CARGA es 200', () => {
      expect(MAX_ENTRADAS_POR_CARGA).toBe(200);
    });
  });
});
