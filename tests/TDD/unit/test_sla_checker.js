const { checkSLA } = require('../../../src/gas/SLAChecker');

describe('SLAChecker', () => {

  describe('checkSLA', () => {
    const now = new Date('2026-02-13T16:00:00');

    test('detecta carga a punto de vencer sin correo enviado', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T18:00:00') }
      ];
      const registros = [];
      const alertas = checkSLA(cargas, registros, 2, now);
      expect(alertas).toHaveLength(1);
      expect(alertas[0].codCar).toBe(168345);
    });

    test('no genera alerta si carga tiene correo enviado', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T18:00:00') }
      ];
      const registros = [
        { codCar: 168345, estado: 'ENVIADO' }
      ];
      const alertas = checkSLA(cargas, registros, 2, now);
      expect(alertas).toHaveLength(0);
    });

    test('no genera alerta si falta mas del umbral', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-14T18:00:00') }
      ];
      const registros = [];
      const alertas = checkSLA(cargas, registros, 2, now);
      expect(alertas).toHaveLength(0);
    });

    test('detecta multiples cargas por vencer', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T17:30:00') },
        { codCar: 168346, fechor: new Date('2026-02-13T17:00:00') },
        { codCar: 168347, fechor: new Date('2026-02-14T18:00:00') }
      ];
      const registros = [];
      const alertas = checkSLA(cargas, registros, 2, now);
      expect(alertas).toHaveLength(2);
    });

    test('calcula horas restantes correctamente', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T17:30:00') }
      ];
      const alertas = checkSLA(cargas, [], 2, now);
      expect(alertas[0].horasRestantes).toBeCloseTo(1.5, 1);
    });

    test('ignora cargas ya vencidas (fechor en pasado)', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T15:00:00') }
      ];
      const alertas = checkSLA(cargas, [], 2, now);
      expect(alertas).toHaveLength(1);
      expect(alertas[0].horasRestantes).toBeLessThan(0);
    });

    test('retorna array vacio sin cargas', () => {
      expect(checkSLA([], [], 2, now)).toEqual([]);
    });

    test('maneja null/undefined gracefully', () => {
      expect(checkSLA(null, null, 2, now)).toEqual([]);
    });

    test('usa umbral por defecto de 2 horas', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T17:00:00') }
      ];
      const alertas = checkSLA(cargas, [], undefined, now);
      expect(alertas).toHaveLength(1);
    });

    test('registros null tratado como array vacio', () => {
      const cargas = [
        { codCar: 168345, fechor: new Date('2026-02-13T17:00:00') }
      ];
      const alertas = checkSLA(cargas, null, 2, now);
      expect(alertas).toHaveLength(1);
    });
  });
});
