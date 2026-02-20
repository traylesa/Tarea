/**
 * Tests unitarios para constants.js
 * Verifica que todas las constantes estan definidas correctamente
 */

const {
  // Tiempo
  MS_POR_SEGUNDO,
  MS_POR_MINUTO,
  MS_POR_HORA,
  MS_POR_DIA,
  SEGUNDOS_POR_MINUTO,
  MINUTOS_POR_HORA,
  HORAS_POR_DIA,
  DIAS_POR_SEMANA,

  // Limites
  MAX_RECORDATORIOS,
  MAX_PASOS_SECUENCIA,
  MAX_ENTRADAS_HISTORIAL_POR_CARGA,
  DIAS_RETENCION_HISTORIAL,

  // Timeouts
  TIMEOUT_BARRIDO_MS,
  COOLDOWN_ALERTA_MS,
  INTERVALO_VERIFICACION_RECORDATORIOS_MS,
  INTERVALO_VERIFICACION_SECUENCIAS_MS,

  // Lotes
  LIMITE_LOTE_PROCESAMIENTO,
  TAMANO_TANDA_ENVIO,

  // Umbrales alertas
  UMBRAL_SILENCIO_HORAS,
  UMBRAL_ESTANCAMIENTO_HORAS,
  UMBRAL_DOCS_DIAS,
  UMBRAL_URGENCIA_CARGA_HORAS,

  // Dashboard
  VENTANA_SEMANAL_DIAS,

  // Presets
  PRESET_15_MIN,
  PRESET_30_MIN,
  PRESET_1_HORA,
  PRESET_2_HORAS,
  PRESET_4_HORAS,

  // Horarios
  HORA_MATUTINO_DEFAULT,
  HORA_REPORTE_DEFAULT,
  HORA_MANANA_DEFAULT
} = require('../../../src/extension/constants.js');

describe('constants.js - Constantes de tiempo', () => {
  test('MS_POR_SEGUNDO es 1000', () => {
    expect(MS_POR_SEGUNDO).toBe(1000);
  });

  test('MS_POR_MINUTO es 60000', () => {
    expect(MS_POR_MINUTO).toBe(60 * 1000);
    expect(MS_POR_MINUTO).toBe(60000);
  });

  test('MS_POR_HORA es 3600000', () => {
    expect(MS_POR_HORA).toBe(60 * 60 * 1000);
    expect(MS_POR_HORA).toBe(3600000);
  });

  test('MS_POR_DIA es 86400000', () => {
    expect(MS_POR_DIA).toBe(24 * 60 * 60 * 1000);
    expect(MS_POR_DIA).toBe(86400000);
  });

  test('constantes de tiempo base son coherentes', () => {
    expect(SEGUNDOS_POR_MINUTO).toBe(60);
    expect(MINUTOS_POR_HORA).toBe(60);
    expect(HORAS_POR_DIA).toBe(24);
    expect(DIAS_POR_SEMANA).toBe(7);
  });
});

describe('constants.js - Limites operacionales', () => {
  test('MAX_RECORDATORIOS es 50', () => {
    expect(MAX_RECORDATORIOS).toBe(50);
  });

  test('MAX_PASOS_SECUENCIA es 3', () => {
    expect(MAX_PASOS_SECUENCIA).toBe(3);
  });

  test('MAX_ENTRADAS_HISTORIAL_POR_CARGA es 100', () => {
    expect(MAX_ENTRADAS_HISTORIAL_POR_CARGA).toBe(100);
  });

  test('DIAS_RETENCION_HISTORIAL es 30', () => {
    expect(DIAS_RETENCION_HISTORIAL).toBe(30);
  });
});

describe('constants.js - Timeouts y cooldowns', () => {
  test('TIMEOUT_BARRIDO_MS es 5 minutos', () => {
    expect(TIMEOUT_BARRIDO_MS).toBe(300000);
    expect(TIMEOUT_BARRIDO_MS).toBe(5 * 60 * 1000);
  });

  test('COOLDOWN_ALERTA_MS es 1 hora', () => {
    expect(COOLDOWN_ALERTA_MS).toBe(MS_POR_HORA);
    expect(COOLDOWN_ALERTA_MS).toBe(3600000);
  });

  test('INTERVALO_VERIFICACION_RECORDATORIOS_MS es 1 minuto', () => {
    expect(INTERVALO_VERIFICACION_RECORDATORIOS_MS).toBe(MS_POR_MINUTO);
    expect(INTERVALO_VERIFICACION_RECORDATORIOS_MS).toBe(60000);
  });

  test('INTERVALO_VERIFICACION_SECUENCIAS_MS es 15 minutos', () => {
    expect(INTERVALO_VERIFICACION_SECUENCIAS_MS).toBe(15 * MS_POR_MINUTO);
    expect(INTERVALO_VERIFICACION_SECUENCIAS_MS).toBe(900000);
  });
});

describe('constants.js - Procesamiento por lotes', () => {
  test('LIMITE_LOTE_PROCESAMIENTO es 50', () => {
    expect(LIMITE_LOTE_PROCESAMIENTO).toBe(50);
  });

  test('TAMANO_TANDA_ENVIO es 15', () => {
    expect(TAMANO_TANDA_ENVIO).toBe(15);
  });
});

describe('constants.js - Umbrales alertas', () => {
  test('UMBRAL_SILENCIO_HORAS es 4', () => {
    expect(UMBRAL_SILENCIO_HORAS).toBe(4);
  });

  test('UMBRAL_ESTANCAMIENTO_HORAS es 24', () => {
    expect(UMBRAL_ESTANCAMIENTO_HORAS).toBe(24);
  });

  test('UMBRAL_DOCS_DIAS es 2', () => {
    expect(UMBRAL_DOCS_DIAS).toBe(2);
  });

  test('UMBRAL_URGENCIA_CARGA_HORAS es 3', () => {
    expect(UMBRAL_URGENCIA_CARGA_HORAS).toBe(3);
  });
});

describe('constants.js - Dashboard', () => {
  test('VENTANA_SEMANAL_DIAS es 6 (ultimos 7 dias = hoy + 6)', () => {
    expect(VENTANA_SEMANAL_DIAS).toBe(6);
  });
});

describe('constants.js - Presets temporales', () => {
  test('PRESET_15_MIN es 15', () => {
    expect(PRESET_15_MIN).toBe(15);
  });

  test('PRESET_30_MIN es 30', () => {
    expect(PRESET_30_MIN).toBe(30);
  });

  test('PRESET_1_HORA es 60', () => {
    expect(PRESET_1_HORA).toBe(60);
  });

  test('PRESET_2_HORAS es 120', () => {
    expect(PRESET_2_HORAS).toBe(120);
  });

  test('PRESET_4_HORAS es 240', () => {
    expect(PRESET_4_HORAS).toBe(240);
  });
});

describe('constants.js - Horarios especiales', () => {
  test('HORA_MATUTINO_DEFAULT es 08:00', () => {
    expect(HORA_MATUTINO_DEFAULT).toBe('08:00');
  });

  test('HORA_REPORTE_DEFAULT es 18:00', () => {
    expect(HORA_REPORTE_DEFAULT).toBe('18:00');
  });

  test('HORA_MANANA_DEFAULT es 9', () => {
    expect(HORA_MANANA_DEFAULT).toBe(9);
  });
});

describe('constants.js - Coherencia entre constantes', () => {
  test('MS_POR_MINUTO derivado correctamente de MS_POR_SEGUNDO', () => {
    expect(MS_POR_MINUTO).toBe(SEGUNDOS_POR_MINUTO * MS_POR_SEGUNDO);
  });

  test('MS_POR_HORA derivado correctamente de MS_POR_MINUTO', () => {
    expect(MS_POR_HORA).toBe(MINUTOS_POR_HORA * MS_POR_MINUTO);
  });

  test('MS_POR_DIA derivado correctamente de MS_POR_HORA', () => {
    expect(MS_POR_DIA).toBe(HORAS_POR_DIA * MS_POR_HORA);
  });

  test('intervalos de verificacion coherentes con limites', () => {
    expect(INTERVALO_VERIFICACION_RECORDATORIOS_MS).toBeLessThan(INTERVALO_VERIFICACION_SECUENCIAS_MS);
  });

  test('tamano tanda menor que limite lote', () => {
    expect(TAMANO_TANDA_ENVIO).toBeLessThan(LIMITE_LOTE_PROCESAMIENTO);
  });
});
