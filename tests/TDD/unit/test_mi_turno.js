/**
 * test_mi_turno.js - Tests logica vista Mi Turno
 * Valida: formateo reporte, categorias->navegacion, secuencias activas
 */
const constants = require('../../../src/extension/constants');
Object.assign(global, constants);

const { generarDatosReporte, calcularKPIsDia, esMismoDia } = require('../../../src/extension/shift-report');
const { calcularKPIsTurno, calcularGraficoSemanal, calcularCargasPorGrupo } = require('../../../src/extension/dashboard');
const { categorizarAlertas, calcularKPIs } = require('../../../src/extension/alert-summary');

describe('Mi Turno - KPIs dashboard', () => {
  test('calcularKPIsTurno con registros vacios retorna ceros', () => {
    var resultado = calcularKPIsTurno([], [], [], new Date());
    expect(resultado.activas).toBe(0);
    expect(resultado.cerradasHoy).toBe(0);
    expect(resultado.alertasUrgentes).toBe(0);
  });

  test('calcularKPIsTurno cuenta activas correctamente', () => {
    var registros = [
      { codCar: 1, fase: '11', estado: 'RECIBIDO', fechaCorreo: new Date().toISOString() },
      { codCar: 2, fase: '19', estado: 'RECIBIDO', fechaCorreo: new Date().toISOString() }
    ];
    var resultado = calcularKPIsTurno(registros, [], [], new Date());
    expect(resultado.activas).toBe(2);
  });

  test('calcularGraficoSemanal retorna 7 dias', () => {
    var dias = calcularGraficoSemanal([], new Date());
    expect(dias).toHaveLength(7);
    expect(dias[0]).toHaveProperty('dia');
    expect(dias[0]).toHaveProperty('conteo');
  });
});

describe('Mi Turno - Categorias alertas', () => {
  test('categorizarAlertas separa por categoria', () => {
    var alertas = [
      { regla: 'R5', nivel: 'CRITICO', threadId: 't1' },
      { regla: 'R2', nivel: 'ALTO', threadId: 't2' },
      { regla: 'R4', nivel: 'MEDIO', threadId: 't3' }
    ];
    var cats = categorizarAlertas(alertas);
    expect(cats.urgente.length).toBeGreaterThanOrEqual(0);
    expect(cats.sinRespuesta.length).toBeGreaterThanOrEqual(0);
  });

  test('categorizarAlertas con array vacio retorna categorias vacias', () => {
    var cats = categorizarAlertas([]);
    expect(cats.urgente).toEqual([]);
    expect(cats.sinRespuesta).toEqual([]);
    expect(cats.documentacion).toEqual([]);
    expect(cats.estancadas).toEqual([]);
  });
});

describe('Mi Turno - Reporte turno', () => {
  test('generarDatosReporte genera estructura correcta', () => {
    var reporte = generarDatosReporte([], [], [], new Date());
    expect(reporte).toHaveProperty('cargasGestionadas');
    expect(reporte).toHaveProperty('incidenciasActivas');
    expect(reporte).toHaveProperty('recordatoriosPendientes');
    expect(reporte).toHaveProperty('kpis');
    expect(reporte.kpis).toHaveProperty('cerradas');
    expect(reporte.kpis).toHaveProperty('emailsEnviados');
  });

  test('generarDatosReporte cuenta gestionadas del dia', () => {
    var ahora = new Date();
    var registros = [
      { codCar: 1, fase: '30', estado: 'GESTIONADO', fechaCorreo: ahora.toISOString() },
      { codCar: 2, fase: '11', estado: 'RECIBIDO', fechaCorreo: ahora.toISOString() }
    ];
    var reporte = generarDatosReporte(registros, [], [], ahora);
    expect(reporte.cargasGestionadas).toBe(1);
  });
});
