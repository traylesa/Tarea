/**
 * test_date_utils.js - Tests TDD para utilidades de fecha/hora
 * Modulo: src/extension/date-utils.js
 */

const {
  esMismoDia,
  obtenerFechaLocal,
  inicioDelDia,
  horasTranscurridas,
  sumarMinutos,
  mananaPorLaManana,
  crearHoraLocal
} = require('../../../src/extension/date-utils.js');

// Fecha fija para tests: 2026-02-15 10:30:00 LOCAL
const AHORA = new Date(2026, 1, 15, 10, 30, 0, 0);

describe('date-utils.js', () => {

  // --- esMismoDia ---

  describe('esMismoDia', () => {
    test('dos fechas del mismo dia retorna true', () => {
      // Arrange
      var manana = new Date(2026, 1, 15, 8, 0);
      var tarde = new Date(2026, 1, 15, 20, 45);

      // Act
      var resultado = esMismoDia(manana, tarde);

      // Assert
      expect(resultado).toBe(true);
    });

    test('dos fechas de dias diferentes retorna false', () => {
      var dia1 = new Date(2026, 1, 15, 23, 0);
      var dia2 = new Date(2026, 1, 16, 1, 0);

      expect(esMismoDia(dia1, dia2)).toBe(false);
    });

    test('23:59 vs 00:01 del dia siguiente son dias diferentes', () => {
      var antesMedianoche = new Date(2026, 1, 15, 23, 59, 59);
      var despuesMedianoche = new Date(2026, 1, 16, 0, 1, 0);

      expect(esMismoDia(antesMedianoche, despuesMedianoche)).toBe(false);
    });

    test('null como primer argumento retorna false', () => {
      expect(esMismoDia(null, AHORA)).toBe(false);
    });

    test('undefined como segundo argumento retorna false', () => {
      expect(esMismoDia(AHORA, undefined)).toBe(false);
    });

    test('ambos null retorna false', () => {
      expect(esMismoDia(null, null)).toBe(false);
    });

    test('acepta strings ISO como entrada', () => {
      var resultado = esMismoDia('2026-02-15T08:00:00', '2026-02-15T22:00:00');

      expect(resultado).toBe(true);
    });

    test('acepta mezcla de Date y string ISO', () => {
      var fecha = new Date(2026, 1, 15, 12, 0);

      expect(esMismoDia(fecha, '2026-02-15T18:00:00')).toBe(true);
    });
  });

  // --- obtenerFechaLocal ---

  describe('obtenerFechaLocal', () => {
    test('retorna formato YYYY-MM-DD', () => {
      var fecha = new Date(2026, 1, 15, 14, 30);

      var resultado = obtenerFechaLocal(fecha);

      expect(resultado).toBe('2026-02-15');
    });

    test('rellena con cero meses y dias de un digito', () => {
      var fecha = new Date(2026, 0, 5, 10, 0); // 5 de enero

      expect(obtenerFechaLocal(fecha)).toBe('2026-01-05');
    });

    test('acepta string ISO como entrada', () => {
      expect(obtenerFechaLocal('2026-06-20T12:00:00')).toBe('2026-06-20');
    });

    test('acepta timestamp numerico', () => {
      var ts = new Date(2026, 11, 25, 0, 0).getTime(); // 25 diciembre

      expect(obtenerFechaLocal(ts)).toBe('2026-12-25');
    });
  });

  // --- inicioDelDia ---

  describe('inicioDelDia', () => {
    test('retorna horas/minutos/segundos/ms en cero', () => {
      var resultado = inicioDelDia(new Date(2026, 1, 15, 14, 30, 45, 123));

      expect(resultado.getHours()).toBe(0);
      expect(resultado.getMinutes()).toBe(0);
      expect(resultado.getSeconds()).toBe(0);
      expect(resultado.getMilliseconds()).toBe(0);
    });

    test('mantiene el mismo dia', () => {
      var original = new Date(2026, 1, 15, 23, 59);

      var resultado = inicioDelDia(original);

      expect(resultado.getDate()).toBe(15);
      expect(resultado.getMonth()).toBe(1); // febrero
      expect(resultado.getFullYear()).toBe(2026);
    });
  });

  // --- horasTranscurridas ---

  describe('horasTranscurridas', () => {
    test('calcula 2 horas de diferencia', () => {
      var desde = new Date(2026, 1, 15, 10, 0);
      var hasta = new Date(2026, 1, 15, 12, 0);

      expect(horasTranscurridas(desde, hasta)).toBe(2);
    });

    test('retorna valor negativo si hasta es anterior a desde', () => {
      var desde = new Date(2026, 1, 15, 12, 0);
      var hasta = new Date(2026, 1, 15, 10, 0);

      expect(horasTranscurridas(desde, hasta)).toBe(-2);
    });

    test('retorna 0 para misma fecha', () => {
      var fecha = new Date(2026, 1, 15, 10, 0);

      expect(horasTranscurridas(fecha, fecha)).toBe(0);
    });

    test('calcula fracciones de hora (30 min = 0.5)', () => {
      var desde = new Date(2026, 1, 15, 10, 0);
      var hasta = new Date(2026, 1, 15, 10, 30);

      expect(horasTranscurridas(desde, hasta)).toBe(0.5);
    });
  });

  // --- sumarMinutos ---

  describe('sumarMinutos', () => {
    test('suma 60 minutos equivale a 1 hora adelante', () => {
      var base = new Date(2026, 1, 15, 10, 0);

      var resultado = sumarMinutos(base, 60);

      expect(resultado.getHours()).toBe(11);
      expect(resultado.getMinutes()).toBe(0);
    });

    test('suma 0 minutos retorna fecha equivalente', () => {
      var base = new Date(2026, 1, 15, 10, 30);

      var resultado = sumarMinutos(base, 0);

      expect(resultado.getTime()).toBe(base.getTime());
    });

    test('acepta string ISO como fecha', () => {
      var resultado = sumarMinutos('2026-02-15T10:00:00', 90);

      expect(resultado.getMinutes()).toBe(30);
      // 10:00 + 90 min = 11:30
      expect(resultado.getHours()).toBe(11);
    });

    test('retorna nuevo Date sin mutar el original', () => {
      var base = new Date(2026, 1, 15, 10, 0);
      var original = base.getTime();

      sumarMinutos(base, 120);

      expect(base.getTime()).toBe(original);
    });
  });

  // --- mananaPorLaManana ---

  describe('mananaPorLaManana', () => {
    test('retorna dia siguiente', () => {
      var resultado = mananaPorLaManana(new Date(2026, 1, 15, 22, 0));

      expect(resultado.getDate()).toBe(16);
    });

    test('hora es 9:00:00.000', () => {
      var resultado = mananaPorLaManana(AHORA);

      expect(resultado.getHours()).toBe(9);
      expect(resultado.getMinutes()).toBe(0);
      expect(resultado.getSeconds()).toBe(0);
      expect(resultado.getMilliseconds()).toBe(0);
    });

    test('funciona en fin de mes (31 enero → 1 febrero)', () => {
      var finMes = new Date(2026, 0, 31, 20, 0); // 31 enero

      var resultado = mananaPorLaManana(finMes);

      expect(resultado.getMonth()).toBe(1); // febrero
      expect(resultado.getDate()).toBe(1);
      expect(resultado.getHours()).toBe(9);
    });
  });

  // --- crearHoraLocal ---

  describe('crearHoraLocal', () => {
    test('"14:30" establece hora 14 y minuto 30', () => {
      var resultado = crearHoraLocal(AHORA, '14:30');

      expect(resultado.getHours()).toBe(14);
      expect(resultado.getMinutes()).toBe(30);
    });

    test('"08:00" establece hora 8 y minuto 0', () => {
      var resultado = crearHoraLocal(AHORA, '08:00');

      expect(resultado.getHours()).toBe(8);
      expect(resultado.getMinutes()).toBe(0);
    });

    test('segundos y milisegundos quedan en 0', () => {
      var resultado = crearHoraLocal(AHORA, '14:30');

      expect(resultado.getSeconds()).toBe(0);
      expect(resultado.getMilliseconds()).toBe(0);
    });

    test('mantiene el dia de la fecha base', () => {
      var base = new Date(2026, 1, 15, 10, 30);

      var resultado = crearHoraLocal(base, '20:00');

      expect(resultado.getDate()).toBe(15);
      expect(resultado.getMonth()).toBe(1);
    });
  });
});
