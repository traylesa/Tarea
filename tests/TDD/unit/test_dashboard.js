/**
 * test_dashboard.js - Tests TDD para modulo dashboard de KPIs y metricas
 * Sprint 5: Dashboard operativo
 */

const {
  calcularKPIsTurno,
  calcularGraficoSemanal,
  calcularCargasPorGrupo
} = require('../../../src/extension/dashboard.js');

// Fecha fija para tests: domingo 15 feb 2026, 14:00 UTC
var AHORA = new Date('2026-02-15T14:00:00Z');

// --- Helpers ---

function crearRegistro(overrides) {
  return Object.assign({
    codCar: 168200,
    fase: '19',
    estado: 'PENDIENTE',
    fechaCorreo: '2026-02-15T10:00:00Z'
  }, overrides);
}

describe('dashboard.js', function() {

  // --- calcularKPIsTurno ---

  describe('calcularKPIsTurno', function() {

    test('retorna activas, porGrupo, alertasUrgentes, recordatoriosHoy, cerradasHoy, cerradasSemana', function() {
      // Arrange
      var registros = [
        crearRegistro({ codCar: 1, fase: '00', estado: 'PENDIENTE' }),
        crearRegistro({ codCar: 2, fase: '19', estado: 'PENDIENTE' }),
        crearRegistro({ codCar: 3, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-15T08:00:00Z' }),
        crearRegistro({ codCar: 4, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-12T08:00:00Z' }),
        crearRegistro({ codCar: 5, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-05T08:00:00Z' })
      ];
      var alertas = [
        { nivel: 'CRITICO' },
        { nivel: 'CRITICO' },
        { nivel: 'INFO' }
      ];
      var recordatorios = [
        { fechaDisparo: '2026-02-15T08:00:00Z' },
        { fechaDisparo: '2026-02-15T20:00:00Z' },
        { fechaDisparo: '2026-02-16T08:00:00Z' }
      ];

      // Act
      var kpis = calcularKPIsTurno(registros, alertas, recordatorios, AHORA);

      // Assert
      expect(kpis.activas).toBe(2);
      expect(kpis.alertasUrgentes).toBe(2);
      expect(kpis.recordatoriosHoy).toBe(2);
      expect(kpis.cerradasHoy).toBe(1);
      expect(kpis.cerradasSemana).toBe(2);
      expect(kpis.porGrupo).toBeDefined();
    });

    test('sin registros retorna zeros', function() {
      // Arrange - Act
      var kpis = calcularKPIsTurno([], [], [], AHORA);

      // Assert
      expect(kpis.activas).toBe(0);
      expect(kpis.alertasUrgentes).toBe(0);
      expect(kpis.recordatoriosHoy).toBe(0);
      expect(kpis.cerradasHoy).toBe(0);
      expect(kpis.cerradasSemana).toBe(0);
      expect(kpis.porGrupo).toEqual({
        espera: 0, carga: 0, en_ruta: 0,
        descarga: 0, vacio: 0, incidencia: 0, sin_fase: 0
      });
    });

    test('porGrupo refleja distribucion de registros activos', function() {
      // Arrange
      var registros = [
        crearRegistro({ codCar: 1, fase: '00' }),
        crearRegistro({ codCar: 2, fase: '01' }),
        crearRegistro({ codCar: 3, fase: '19' }),
        crearRegistro({ codCar: 4, fase: '21' }),
        crearRegistro({ codCar: 5, fase: '30', estado: 'GESTIONADO' })
      ];

      // Act
      var kpis = calcularKPIsTurno(registros, [], [], AHORA);

      // Assert
      expect(kpis.porGrupo.espera).toBe(2);
      expect(kpis.porGrupo.en_ruta).toBe(1);
      expect(kpis.porGrupo.descarga).toBe(1);
    });
  });

  // --- calcularGraficoSemanal ---

  describe('calcularGraficoSemanal', function() {

    test('retorna 7 dias con conteos', function() {
      // Arrange
      var registros = [
        crearRegistro({ codCar: 1, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-15T08:00:00Z' }),
        crearRegistro({ codCar: 2, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-15T12:00:00Z' }),
        crearRegistro({ codCar: 3, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-14T10:00:00Z' }),
        crearRegistro({ codCar: 4, fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-10T10:00:00Z' })
      ];

      // Act
      var grafico = calcularGraficoSemanal(registros, AHORA);

      // Assert
      expect(grafico.length).toBe(7);
      // Cada entrada tiene dia, fecha, conteo
      grafico.forEach(function(entrada) {
        expect(entrada).toHaveProperty('dia');
        expect(entrada).toHaveProperty('fecha');
        expect(entrada).toHaveProperty('conteo');
      });
      // Ultimo dia (hoy 15 feb) = 2 cerradas
      var hoy = grafico.find(function(d) { return d.fecha === '2026-02-15'; });
      expect(hoy.conteo).toBe(2);
      // 14 feb = 1 cerrada
      var ayer = grafico.find(function(d) { return d.fecha === '2026-02-14'; });
      expect(ayer.conteo).toBe(1);
      // 10 feb = 1 cerrada
      var lunes = grafico.find(function(d) { return d.fecha === '2026-02-10'; });
      expect(lunes).toBeDefined();
    });

    test('sin datos retorna 7 dias con 0', function() {
      // Arrange - Act
      var grafico = calcularGraficoSemanal([], AHORA);

      // Assert
      expect(grafico.length).toBe(7);
      grafico.forEach(function(entrada) {
        expect(entrada.conteo).toBe(0);
        expect(typeof entrada.dia).toBe('string');
        expect(typeof entrada.fecha).toBe('string');
      });
    });

    test('no cuenta registros fuera de la semana', function() {
      // Arrange
      var registros = [
        crearRegistro({ fase: '30', estado: 'GESTIONADO', fechaCorreo: '2026-02-01T10:00:00Z' })
      ];

      // Act
      var grafico = calcularGraficoSemanal(registros, AHORA);

      // Assert
      var total = grafico.reduce(function(s, d) { return s + d.conteo; }, 0);
      expect(total).toBe(0);
    });

    test('no cuenta registros no cerrados', function() {
      // Arrange
      var registros = [
        crearRegistro({ fase: '19', estado: 'PENDIENTE', fechaCorreo: '2026-02-15T10:00:00Z' })
      ];

      // Act
      var grafico = calcularGraficoSemanal(registros, AHORA);

      // Assert
      var total = grafico.reduce(function(s, d) { return s + d.conteo; }, 0);
      expect(total).toBe(0);
    });
  });

  // --- calcularCargasPorGrupo ---

  describe('calcularCargasPorGrupo', function() {

    test('agrupa por fases (espera, carga, en_ruta, descarga, vacio, incidencia)', function() {
      // Arrange
      var registros = [
        crearRegistro({ fase: '00' }),
        crearRegistro({ fase: '01' }),
        crearRegistro({ fase: '11' }),
        crearRegistro({ fase: '19' }),
        crearRegistro({ fase: '21' }),
        crearRegistro({ fase: '29' }),
        crearRegistro({ fase: '05' })
      ];

      // Act
      var grupos = calcularCargasPorGrupo(registros);

      // Assert
      expect(grupos.espera).toBe(2);
      expect(grupos.carga).toBe(1);
      expect(grupos.en_ruta).toBe(1);
      expect(grupos.descarga).toBe(1);
      expect(grupos.vacio).toBe(1);
      expect(grupos.incidencia).toBe(1);
      expect(grupos.sin_fase).toBe(0);
    });

    test('registros sin fase van a sin_fase', function() {
      // Arrange
      var registros = [
        crearRegistro({ fase: null }),
        crearRegistro({ fase: undefined }),
        crearRegistro({ fase: '' }),
        crearRegistro({ fase: '99' }),
        crearRegistro({ fase: '19' })
      ];

      // Act
      var grupos = calcularCargasPorGrupo(registros);

      // Assert
      expect(grupos.sin_fase).toBe(4);
      expect(grupos.en_ruta).toBe(1);
    });

    test('sin registros retorna todos los grupos en cero', function() {
      // Arrange - Act
      var grupos = calcularCargasPorGrupo([]);

      // Assert
      expect(grupos).toEqual({
        espera: 0, carga: 0, en_ruta: 0,
        descarga: 0, vacio: 0, incidencia: 0, sin_fase: 0
      });
    });
  });
});
