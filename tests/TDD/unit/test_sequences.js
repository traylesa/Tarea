/**
 * test_sequences.js - Tests TDD para modulo de secuencias automaticas
 * Sprint 5: Secuencias de acciones programadas por carga/hilo
 */

const {
  crearSecuencia,
  evaluarPasos,
  detenerSecuencia,
  cancelarSecuencia,
  obtenerSecuenciasActivas,
  obtenerPredefinida,
  MAX_PASOS,
  ESTADOS_SECUENCIA,
  ESTADOS_PASO,
  SECUENCIAS_PREDEFINIDAS
} = require('../../../src/extension/sequences.js');

// Fecha fija para tests: 2026-02-15 10:00:00
var AHORA = new Date('2026-02-15T10:00:00.000Z');

function _crearPasos(n) {
  var pasos = [];
  for (var i = 0; i < n; i++) {
    pasos.push({ orden: i + 1, plantilla: 'Paso ' + (i + 1), horasEspera: i * 24 });
  }
  return pasos;
}

describe('sequences.js', function () {

  // --- crearSecuencia ---

  describe('crearSecuencia', function () {
    test('crea secuencia con id, codCar, threadId, nombre, estado ACTIVA, pasos', function () {
      // Arrange
      var pasos = _crearPasos(2);

      // Act
      var seq = crearSecuencia('168345', 'thread_abc', 'Mi secuencia', pasos, AHORA);

      // Assert
      expect(seq.id).toMatch(/^seq_/);
      expect(seq.codCar).toBe('168345');
      expect(seq.threadId).toBe('thread_abc');
      expect(seq.nombre).toBe('Mi secuencia');
      expect(seq.estado).toBe(ESTADOS_SECUENCIA.ACTIVA);
      expect(seq.pasos).toHaveLength(2);
      expect(seq.fechaCreacion).toBe(AHORA.toISOString());
    });

    test('calcula fechaProgramada de cada paso sumando horasEspera a ahora', function () {
      // Arrange
      var pasos = [
        { orden: 1, plantilla: 'Inmediato', horasEspera: 0 },
        { orden: 2, plantilla: 'En 24h', horasEspera: 24 },
        { orden: 3, plantilla: 'En 72h', horasEspera: 72 }
      ];

      // Act
      var seq = crearSecuencia('100', 'thread_1', 'Test', pasos, AHORA);

      // Assert
      expect(new Date(seq.pasos[0].fechaProgramada).getTime()).toBe(AHORA.getTime());
      expect(new Date(seq.pasos[1].fechaProgramada).getTime()).toBe(AHORA.getTime() + 24 * 3600000);
      expect(new Date(seq.pasos[2].fechaProgramada).getTime()).toBe(AHORA.getTime() + 72 * 3600000);
    });

    test('rechaza mas de 3 pasos (MAX_PASOS)', function () {
      // Arrange
      var pasos = _crearPasos(4);

      // Act & Assert
      expect(function () {
        crearSecuencia('100', 'thread_1', 'Test', pasos, AHORA);
      }).toThrow('maximo');
    });

    test('rechaza pasos vacios', function () {
      expect(function () {
        crearSecuencia('100', 'thread_1', 'Test', [], AHORA);
      }).toThrow('pasos');
    });

    test('rechaza codCar no numerico', function () {
      var pasos = _crearPasos(1);
      expect(function () {
        crearSecuencia('abc', 'thread_1', 'Test', pasos, AHORA);
      }).toThrow('codCar');
    });

    test('rechaza threadId vacio', function () {
      var pasos = _crearPasos(1);
      expect(function () {
        crearSecuencia('100', '', 'Test', pasos, AHORA);
      }).toThrow('threadId');
    });
  });

  // --- evaluarPasos ---

  describe('evaluarPasos', function () {
    test('retorna pasos PENDIENTE cuya fechaProgramada <= ahora', function () {
      // Arrange
      var almacen = [
        crearSecuencia('100', 'thread_1', 'S1', [
          { orden: 1, plantilla: 'Ya', horasEspera: 0 },
          { orden: 2, plantilla: 'Futuro', horasEspera: 48 }
        ], AHORA)
      ];

      // Act
      var listos = evaluarPasos(almacen, AHORA);

      // Assert
      expect(listos).toHaveLength(1);
      expect(listos[0].paso.plantilla).toBe('Ya');
      expect(listos[0].secuenciaId).toBe(almacen[0].id);
    });

    test('no retorna pasos ya EJECUTADO', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', [
        { orden: 1, plantilla: 'Paso1', horasEspera: 0 }
      ], AHORA);
      seq.pasos[0].estado = ESTADOS_PASO.EJECUTADO;
      var almacen = [seq];

      // Act
      var listos = evaluarPasos(almacen, AHORA);

      // Assert
      expect(listos).toHaveLength(0);
    });

    test('no retorna pasos de secuencia no ACTIVA', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', [
        { orden: 1, plantilla: 'Paso1', horasEspera: 0 }
      ], AHORA);
      seq.estado = ESTADOS_SECUENCIA.DETENIDA;
      var almacen = [seq];

      // Act
      var listos = evaluarPasos(almacen, AHORA);

      // Assert
      expect(listos).toHaveLength(0);
    });

    test('retorna vacio si no hay pendientes listos', function () {
      // Arrange
      var almacen = [
        crearSecuencia('100', 'thread_1', 'S1', [
          { orden: 1, plantilla: 'Futuro', horasEspera: 48 }
        ], AHORA)
      ];

      // Act
      var listos = evaluarPasos(almacen, AHORA);

      // Assert
      expect(listos).toHaveLength(0);
    });
  });

  // --- detenerSecuencia ---

  describe('detenerSecuencia', function () {
    test('cambia estado secuencia a DETENIDA', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(2), AHORA);

      // Act
      var resultado = detenerSecuencia(seq);

      // Assert
      expect(resultado.estado).toBe(ESTADOS_SECUENCIA.DETENIDA);
    });

    test('cambia pasos PENDIENTE a DETENIDO', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(2), AHORA);

      // Act
      var resultado = detenerSecuencia(seq);

      // Assert
      resultado.pasos.forEach(function (p) {
        expect(p.estado).toBe(ESTADOS_PASO.DETENIDO);
      });
    });

    test('preserva pasos ya EJECUTADO', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(2), AHORA);
      seq.pasos[0].estado = ESTADOS_PASO.EJECUTADO;

      // Act
      var resultado = detenerSecuencia(seq);

      // Assert
      expect(resultado.pasos[0].estado).toBe(ESTADOS_PASO.EJECUTADO);
      expect(resultado.pasos[1].estado).toBe(ESTADOS_PASO.DETENIDO);
    });

    test('no muta secuencia original', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(1), AHORA);

      // Act
      detenerSecuencia(seq);

      // Assert
      expect(seq.estado).toBe(ESTADOS_SECUENCIA.ACTIVA);
      expect(seq.pasos[0].estado).toBe(ESTADOS_PASO.PENDIENTE);
    });
  });

  // --- cancelarSecuencia ---

  describe('cancelarSecuencia', function () {
    test('cambia estado a CANCELADA', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(1), AHORA);

      // Act
      var resultado = cancelarSecuencia(seq);

      // Assert
      expect(resultado.estado).toBe(ESTADOS_SECUENCIA.CANCELADA);
    });

    test('cambia pasos PENDIENTE a CANCELADO', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(2), AHORA);

      // Act
      var resultado = cancelarSecuencia(seq);

      // Assert
      resultado.pasos.forEach(function (p) {
        expect(p.estado).toBe(ESTADOS_PASO.CANCELADO);
      });
    });

    test('no muta original', function () {
      // Arrange
      var seq = crearSecuencia('100', 'thread_1', 'S1', _crearPasos(1), AHORA);

      // Act
      cancelarSecuencia(seq);

      // Assert
      expect(seq.estado).toBe(ESTADOS_SECUENCIA.ACTIVA);
    });
  });

  // --- obtenerSecuenciasActivas ---

  describe('obtenerSecuenciasActivas', function () {
    test('filtra solo estado ACTIVA', function () {
      // Arrange
      var s1 = crearSecuencia('100', 't1', 'S1', _crearPasos(1), AHORA);
      var s2 = crearSecuencia('200', 't2', 'S2', _crearPasos(1), AHORA);
      s2.estado = ESTADOS_SECUENCIA.COMPLETADA;
      var s3 = crearSecuencia('300', 't3', 'S3', _crearPasos(1), AHORA);

      // Act
      var activas = obtenerSecuenciasActivas([s1, s2, s3]);

      // Assert
      expect(activas).toHaveLength(2);
      expect(activas[0].id).toBe(s1.id);
      expect(activas[1].id).toBe(s3.id);
    });
  });

  // --- obtenerPredefinida ---

  describe('obtenerPredefinida', function () {
    test('retorna config "Reclamar POD" con 3 pasos', function () {
      // Act
      var config = obtenerPredefinida('Reclamar POD');

      // Assert
      expect(config).not.toBeNull();
      expect(config.pasos).toHaveLength(3);
      expect(config.pasos[0].horasEspera).toBe(0);
      expect(config.pasos[2].horasEspera).toBe(168);
    });

    test('retorna config "Confirmar carga" con 3 pasos', function () {
      // Act
      var config = obtenerPredefinida('Confirmar carga');

      // Assert
      expect(config).not.toBeNull();
      expect(config.pasos).toHaveLength(3);
      expect(config.pasos[1].horasEspera).toBe(24);
    });

    test('retorna config "Seguimiento incidencia" con 3 pasos', function () {
      // Act
      var config = obtenerPredefinida('Seguimiento incidencia');

      // Assert
      expect(config).not.toBeNull();
      expect(config.pasos).toHaveLength(3);
      expect(config.pasos[2].horasEspera).toBe(72);
    });

    test('retorna null para nombre desconocido', function () {
      expect(obtenerPredefinida('Inexistente')).toBeNull();
    });
  });

  // --- Constantes ---

  describe('constantes', function () {
    test('MAX_PASOS es 3', function () {
      expect(MAX_PASOS).toBe(3);
    });

    test('ESTADOS_SECUENCIA tiene 4 estados', function () {
      expect(Object.keys(ESTADOS_SECUENCIA)).toHaveLength(4);
    });

    test('ESTADOS_PASO tiene 4 estados', function () {
      expect(Object.keys(ESTADOS_PASO)).toHaveLength(4);
    });

    test('SECUENCIAS_PREDEFINIDAS tiene 3 plantillas', function () {
      expect(Object.keys(SECUENCIAS_PREDEFINIDAS)).toHaveLength(3);
    });
  });
});
