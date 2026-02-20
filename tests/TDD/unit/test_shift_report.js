// tests/TDD/unit/test_shift_report.js
// Tests para shift-report.js - Reporte de turno

var { generarDatosReporte, calcularKPIsDia, esMismoDia } = require('../../../src/extension/shift-report.js');

var HOY = new Date('2026-02-15T14:00:00Z');
var AYER = new Date('2026-02-14T10:00:00Z');

function crearRegistro(overrides) {
  return Object.assign({
    codCar: 168200,
    fase: '19',
    estado: 'GESTIONADO',
    fechaCorreo: '2026-02-15T10:00:00Z'
  }, overrides);
}

describe('generarDatosReporte', function () {

  test('genera reporte con cargas gestionadas, incidencias, recordatorios y KPIs', function () {
    // Arrange
    var registros = [
      crearRegistro({ codCar: 1001, estado: 'GESTIONADO', fase: '19' }),
      crearRegistro({ codCar: 1002, estado: 'GESTIONADO', fase: '30' }),
      crearRegistro({ codCar: 1003, estado: 'PENDIENTE', fase: '05' }),
      crearRegistro({ codCar: 1004, estado: 'ENVIADO', fase: '11' })
    ];
    var alertas = [{ nivel: 'CRITICO', regla: 'R5' }];
    var recordatorios = [
      { fechaDisparo: '2026-02-16T08:00:00Z', texto: 'Verificar' },
      { fechaDisparo: '2026-02-14T08:00:00Z', texto: 'Ya pasó' }
    ];

    // Act
    var resultado = generarDatosReporte(registros, alertas, recordatorios, HOY);

    // Assert
    expect(resultado.fecha).toBe(HOY.toISOString());
    expect(resultado.cargasGestionadas).toBe(2);
    expect(resultado.incidenciasActivas).toBe(1);
    expect(resultado.recordatoriosPendientes).toBe(1);
    expect(resultado.kpis.cerradas).toBe(1);
    expect(resultado.kpis.emailsEnviados).toBe(1);
  });

  test('sin registros retorna zeros', function () {
    // Arrange / Act
    var resultado = generarDatosReporte([], [], [], HOY);

    // Assert
    expect(resultado.cargasGestionadas).toBe(0);
    expect(resultado.incidenciasActivas).toBe(0);
    expect(resultado.recordatoriosPendientes).toBe(0);
    expect(resultado.kpis.cerradas).toBe(0);
    expect(resultado.kpis.emailsEnviados).toBe(0);
  });

  test('solo cuenta registros de hoy', function () {
    // Arrange
    var registros = [
      crearRegistro({ estado: 'GESTIONADO', fechaCorreo: '2026-02-15T09:00:00Z' }),
      crearRegistro({ estado: 'GESTIONADO', fechaCorreo: '2026-02-14T09:00:00Z' })
    ];

    // Act
    var resultado = generarDatosReporte(registros, [], [], HOY);

    // Assert
    expect(resultado.cargasGestionadas).toBe(1);
  });

  test('cuenta incidencias activas (fase 05 o 25)', function () {
    // Arrange
    var registros = [
      crearRegistro({ fase: '05', estado: 'PENDIENTE' }),
      crearRegistro({ fase: '25', estado: 'PENDIENTE' }),
      crearRegistro({ fase: '19', estado: 'PENDIENTE' })
    ];

    // Act
    var resultado = generarDatosReporte(registros, [], [], HOY);

    // Assert
    expect(resultado.incidenciasActivas).toBe(2);
  });

});

describe('calcularKPIsDia', function () {

  test('cuenta cargas cerradas (GESTIONADO + fase 30)', function () {
    // Arrange
    var registros = [
      crearRegistro({ estado: 'GESTIONADO', fase: '30' }),
      crearRegistro({ estado: 'GESTIONADO', fase: '30' }),
      crearRegistro({ estado: 'GESTIONADO', fase: '19' })
    ];

    // Act
    var kpis = calcularKPIsDia(registros, HOY);

    // Assert
    expect(kpis.cerradas).toBe(2);
  });

  test('cuenta emails enviados (estado ENVIADO)', function () {
    // Arrange
    var registros = [
      crearRegistro({ estado: 'ENVIADO', fase: '11' }),
      crearRegistro({ estado: 'ENVIADO', fase: '19' }),
      crearRegistro({ estado: 'GESTIONADO', fase: '19' })
    ];

    // Act
    var kpis = calcularKPIsDia(registros, HOY);

    // Assert
    expect(kpis.emailsEnviados).toBe(2);
  });

  test('sin actividad retorna zeros', function () {
    // Arrange / Act
    var kpis = calcularKPIsDia([], HOY);

    // Assert
    expect(kpis.cerradas).toBe(0);
    expect(kpis.emailsEnviados).toBe(0);
  });

});

describe('esMismoDia', function () {

  test('misma fecha retorna true', function () {
    // Arrange
    var fecha1 = new Date('2026-02-15T08:00:00Z');
    var fecha2 = new Date('2026-02-15T18:00:00Z');

    // Act / Assert
    expect(esMismoDia(fecha1, fecha2)).toBe(true);
  });

  test('diferente fecha retorna false', function () {
    // Arrange
    var fecha1 = new Date('2026-02-15T08:00:00Z');
    var fecha2 = new Date('2026-02-14T08:00:00Z');

    // Act / Assert
    expect(esMismoDia(fecha1, fecha2)).toBe(false);
  });

  test('strings ISO y objetos Date funcionan', function () {
    // Arrange
    var fechaStr = '2026-02-15T10:00:00Z';
    var fechaObj = new Date('2026-02-15T20:00:00Z');

    // Act / Assert
    expect(esMismoDia(fechaStr, fechaObj)).toBe(true);
  });

  test('null retorna false', function () {
    // Act / Assert
    expect(esMismoDia(null, new Date())).toBe(false);
    expect(esMismoDia(new Date(), null)).toBe(false);
    expect(esMismoDia(null, null)).toBe(false);
  });

});
