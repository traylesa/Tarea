/**
 * test_reminders.js - Tests TDD para modulo de recordatorios
 * Sprint 3: HU-07 (Recordatorios manuales) + HU-08 (Sugerencias automaticas)
 */

// Importar constantes primero (deben estar en scope global antes de reminders.js)
const constants = require('../../../src/extension/constants.js');
Object.assign(global, constants);

const {
  crearRecordatorio,
  eliminarRecordatorio,
  completarRecordatorio,
  obtenerActivos,
  aplicarSnooze,
  calcularFechaDisparo,
  evaluarPendientes,
  generarSugerencia,
  aceptarSugerencia,
  buscarPorCodCar,
  buscarActivosPorCodCar,
  PRESETS,
  MAX_RECORDATORIOS,
  SUGERENCIAS_POR_FASE
} = require('../../../src/extension/reminders.js');

// Fecha fija para tests: 2026-02-15 10:00:00
const AHORA = new Date('2026-02-15T10:00:00.000Z');

describe('reminders.js', () => {

  // --- crearRecordatorio ---

  describe('crearRecordatorio', () => {
    test('crea recordatorio con todos los campos', () => {
      const rec = crearRecordatorio('Llamar a Garcia', 168345, '2h', AHORA);
      expect(rec.id).toMatch(/^rec_/);
      expect(rec.texto).toBe('Llamar a Garcia');
      expect(rec.codCar).toBe(168345);
      expect(rec.asunto).toBeNull();
      expect(rec.snoozeCount).toBe(0);
      expect(rec.origen).toBe('manual');
      expect(rec.fechaCreacion).toBe(AHORA.toISOString());
      expect(rec.fechaDisparo).toBeDefined();
    });

    test('incluye asunto cuando se proporciona', () => {
      const rec = crearRecordatorio('Revisar docs', 168345, '1h', AHORA, [], 'RE: Carga 168345 - Albaran');
      expect(rec.asunto).toBe('RE: Carga 168345 - Albaran');
      expect(rec.codCar).toBe(168345);
    });

    test('asunto es null si no se proporciona', () => {
      const rec = crearRecordatorio('Tarea', 100, '1h', AHORA);
      expect(rec.asunto).toBeNull();
    });

    test('genera id unico en cada llamada', () => {
      const r1 = crearRecordatorio('Test 1', 100, '1h', AHORA);
      const r2 = crearRecordatorio('Test 2', 200, '1h', AHORA);
      expect(r1.id).not.toBe(r2.id);
    });

    test('lanza error si texto vacio', () => {
      expect(() => crearRecordatorio('', 168345, '1h', AHORA)).toThrow('texto');
    });

    test('lanza error si texto solo espacios', () => {
      expect(() => crearRecordatorio('   ', 168345, '1h', AHORA)).toThrow('texto');
    });

    test('permite codCar null', () => {
      const rec = crearRecordatorio('Tarea general', null, '1h', AHORA);
      expect(rec.codCar).toBeNull();
    });

    test('lanza error si lista supera limite', () => {
      const lista = Array.from({ length: MAX_RECORDATORIOS }, (_, i) => ({
        id: 'rec_' + i, texto: 't', codCar: null, fechaDisparo: AHORA.toISOString(),
        fechaCreacion: AHORA.toISOString(), snoozeCount: 0, origen: 'manual'
      }));
      expect(() => crearRecordatorio('Uno mas', null, '1h', AHORA, lista))
        .toThrow('limite');
    });

    test('no lanza error si lista bajo limite', () => {
      const lista = [{ id: 'rec_1' }];
      const rec = crearRecordatorio('Ok', 100, '1h', AHORA, lista);
      expect(rec.id).toMatch(/^rec_/);
    });
  });

  // --- calcularFechaDisparo ---

  describe('calcularFechaDisparo', () => {
    test('preset 15min suma 15 minutos', () => {
      const fecha = calcularFechaDisparo('15min', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 15 * 60000);
    });

    test('preset 30min suma 30 minutos', () => {
      const fecha = calcularFechaDisparo('30min', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 30 * 60000);
    });

    test('preset 1h suma 60 minutos', () => {
      const fecha = calcularFechaDisparo('1h', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 60 * 60000);
    });

    test('preset 2h suma 120 minutos', () => {
      const fecha = calcularFechaDisparo('2h', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 120 * 60000);
    });

    test('preset 4h suma 240 minutos', () => {
      const fecha = calcularFechaDisparo('4h', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 240 * 60000);
    });

    test('preset manana retorna siguiente dia a las 09:00 local', () => {
      const fecha = new Date(calcularFechaDisparo('manana', AHORA));
      expect(fecha.getDate()).toBe(AHORA.getDate() + 1);
      expect(fecha.getHours()).toBe(9);
      expect(fecha.getMinutes()).toBe(0);
    });

    test('preset desconocido usa 1h por defecto', () => {
      const fecha = calcularFechaDisparo('xyz', AHORA);
      expect(new Date(fecha).getTime()).toBe(AHORA.getTime() + 60 * 60000);
    });
  });

  // --- obtenerActivos ---

  describe('obtenerActivos', () => {
    test('filtra solo recordatorios con fechaDisparo futuro', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T11:00:00.000Z' },
        { id: 'r2', fechaDisparo: '2026-02-15T09:00:00.000Z' },
        { id: 'r3', fechaDisparo: '2026-02-15T12:00:00.000Z' }
      ];
      const activos = obtenerActivos(lista, AHORA);
      expect(activos).toHaveLength(2);
      expect(activos[0].id).toBe('r1');
      expect(activos[1].id).toBe('r3');
    });

    test('ordena por fechaDisparo ascendente', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T14:00:00.000Z' },
        { id: 'r2', fechaDisparo: '2026-02-15T11:00:00.000Z' }
      ];
      const activos = obtenerActivos(lista, AHORA);
      expect(activos[0].id).toBe('r2');
      expect(activos[1].id).toBe('r1');
    });

    test('retorna vacio si lista vacia', () => {
      expect(obtenerActivos([], AHORA)).toEqual([]);
    });

    test('retorna vacio si null', () => {
      expect(obtenerActivos(null, AHORA)).toEqual([]);
    });
  });

  // --- eliminarRecordatorio ---

  describe('eliminarRecordatorio', () => {
    test('elimina por id', () => {
      const lista = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
      const resultado = eliminarRecordatorio('r2', lista);
      expect(resultado).toHaveLength(2);
      expect(resultado.find(r => r.id === 'r2')).toBeUndefined();
    });

    test('retorna lista sin cambios si id no existe', () => {
      const lista = [{ id: 'r1' }];
      const resultado = eliminarRecordatorio('r99', lista);
      expect(resultado).toHaveLength(1);
    });

    test('retorna vacio si lista vacia', () => {
      expect(eliminarRecordatorio('r1', [])).toEqual([]);
    });
  });

  // --- completarRecordatorio ---

  describe('completarRecordatorio', () => {
    test('elimina el recordatorio completado', () => {
      const lista = [{ id: 'r1' }, { id: 'r2' }];
      const resultado = completarRecordatorio('r1', lista);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('r2');
    });
  });

  // --- aplicarSnooze ---

  describe('aplicarSnooze', () => {
    test('actualiza fechaDisparo y snoozeCount', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T09:00:00.000Z', snoozeCount: 0 }
      ];
      const resultado = aplicarSnooze('r1', '15min', lista, AHORA);
      const rec = resultado.find(r => r.id === 'r1');
      expect(rec.snoozeCount).toBe(1);
      expect(new Date(rec.fechaDisparo).getTime()).toBe(AHORA.getTime() + 15 * 60000);
    });

    test('snooze 1h', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T09:00:00.000Z', snoozeCount: 2 }
      ];
      const resultado = aplicarSnooze('r1', '1h', lista, AHORA);
      const rec = resultado.find(r => r.id === 'r1');
      expect(rec.snoozeCount).toBe(3);
      expect(new Date(rec.fechaDisparo).getTime()).toBe(AHORA.getTime() + 60 * 60000);
    });

    test('snooze manana', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T09:00:00.000Z', snoozeCount: 0 }
      ];
      const resultado = aplicarSnooze('r1', 'manana', lista, AHORA);
      const rec = resultado.find(r => r.id === 'r1');
      const disparo = new Date(rec.fechaDisparo);
      expect(disparo.getDate()).toBe(AHORA.getDate() + 1);
      expect(disparo.getHours()).toBe(9);
    });

    test('preserva asunto en snooze', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T09:00:00.000Z', snoozeCount: 0, asunto: 'RE: Carga 168345' }
      ];
      const resultado = aplicarSnooze('r1', '15min', lista, AHORA);
      expect(resultado[0].asunto).toBe('RE: Carga 168345');
    });

    test('retorna lista sin cambios si id no encontrado', () => {
      const lista = [{ id: 'r1', fechaDisparo: AHORA.toISOString(), snoozeCount: 0 }];
      const resultado = aplicarSnooze('r99', '15min', lista, AHORA);
      expect(resultado[0].snoozeCount).toBe(0);
    });
  });

  // --- evaluarPendientes ---

  describe('evaluarPendientes', () => {
    test('detecta recordatorios vencidos', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T09:30:00.000Z', texto: 'Vencido' },
        { id: 'r2', fechaDisparo: '2026-02-15T11:00:00.000Z', texto: 'Futuro' }
      ];
      const vencidos = evaluarPendientes(lista, AHORA);
      expect(vencidos).toHaveLength(1);
      expect(vencidos[0].id).toBe('r1');
    });

    test('incluye recordatorios exactamente en la hora', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T10:00:00.000Z' }
      ];
      const vencidos = evaluarPendientes(lista, AHORA);
      expect(vencidos).toHaveLength(1);
    });

    test('retorna vacio si no hay vencidos', () => {
      const lista = [
        { id: 'r1', fechaDisparo: '2026-02-15T11:00:00.000Z' }
      ];
      expect(evaluarPendientes(lista, AHORA)).toHaveLength(0);
    });

    test('retorna vacio si lista vacia', () => {
      expect(evaluarPendientes([], AHORA)).toEqual([]);
    });

    test('retorna vacio si null', () => {
      expect(evaluarPendientes(null, AHORA)).toEqual([]);
    });
  });

  // --- generarSugerencia ---

  describe('generarSugerencia', () => {
    const configActivada = { recordatorios: { sugerenciasActivadas: true } };
    const configDesactivada = { recordatorios: { sugerenciasActivadas: false } };

    test('fase 19 genera sugerencia verificar descarga', () => {
      const sug = generarSugerencia('19', configActivada);
      expect(sug).not.toBeNull();
      expect(sug.texto).toMatch(/descarga/i);
      expect(sug.horasAntes).toBe(8);
    });

    test('fase 29 genera sugerencia reclamar POD', () => {
      const sug = generarSugerencia('29', configActivada);
      expect(sug).not.toBeNull();
      expect(sug.texto).toMatch(/POD/i);
      expect(sug.horasAntes).toBe(24);
    });

    test('fase sin config retorna null', () => {
      expect(generarSugerencia('12', configActivada)).toBeNull();
    });

    test('sugerencias desactivadas retorna null', () => {
      expect(generarSugerencia('19', configDesactivada)).toBeNull();
    });

    test('config sin recordatorios retorna null', () => {
      expect(generarSugerencia('19', {})).toBeNull();
    });

    test('config null retorna null', () => {
      expect(generarSugerencia('19', null)).toBeNull();
    });
  });

  // --- aceptarSugerencia ---

  describe('aceptarSugerencia', () => {
    test('crea recordatorio con origen sugerido', () => {
      const sug = { texto: 'Verificar descarga', horasAntes: 8 };
      const rec = aceptarSugerencia(sug, 168400, AHORA);
      expect(rec.origen).toBe('sugerido');
      expect(rec.texto).toBe('Verificar descarga');
      expect(rec.codCar).toBe(168400);
      expect(rec.snoozeCount).toBe(0);
      expect(rec.id).toMatch(/^rec_/);
    });

    test('fechaDisparo es ahora + horasAntes', () => {
      const sug = { texto: 'Reclamar POD', horasAntes: 24 };
      const rec = aceptarSugerencia(sug, 168200, AHORA);
      const esperado = AHORA.getTime() + 24 * 3600000;
      expect(new Date(rec.fechaDisparo).getTime()).toBe(esperado);
    });

    test('incluye asunto cuando se proporciona', () => {
      const sug = { texto: 'Verificar descarga', horasAntes: 8 };
      const rec = aceptarSugerencia(sug, 168400, AHORA, 'Carga 168400 - Destino BCN');
      expect(rec.asunto).toBe('Carga 168400 - Destino BCN');
    });

    test('asunto es null si no se proporciona', () => {
      const sug = { texto: 'Verificar descarga', horasAntes: 8 };
      const rec = aceptarSugerencia(sug, 168400, AHORA);
      expect(rec.asunto).toBeNull();
    });
  });

  // --- Constantes ---

  describe('constantes', () => {
    test('PRESETS tiene 6 opciones', () => {
      expect(Object.keys(PRESETS)).toHaveLength(6);
    });

    test('MAX_RECORDATORIOS es 50', () => {
      expect(MAX_RECORDATORIOS).toBe(50);
    });

    test('SUGERENCIAS_POR_FASE tiene fases 19 y 29', () => {
      expect(SUGERENCIAS_POR_FASE['19']).toBeDefined();
      expect(SUGERENCIAS_POR_FASE['29']).toBeDefined();
    });
  });

  // --- buscarPorCodCar ---

  describe('buscarPorCodCar', () => {
    var lista = [
      crearRecordatorio('Rec A', '100', '1h', AHORA, []),
      crearRecordatorio('Rec B', '200', '1h', AHORA, []),
      crearRecordatorio('Rec C', '100', '2h', AHORA, [])
    ];

    test('encuentra recordatorios por codCar', () => {
      var r = buscarPorCodCar(lista, '100');
      expect(r).toHaveLength(2);
    });

    test('codCar sin recordatorios retorna vacio', () => {
      expect(buscarPorCodCar(lista, '999')).toHaveLength(0);
    });

    test('lista null retorna vacio', () => {
      expect(buscarPorCodCar(null, '100')).toHaveLength(0);
    });

    test('codCar null retorna vacio', () => {
      expect(buscarPorCodCar(lista, null)).toHaveLength(0);
    });
  });

  // --- buscarActivosPorCodCar ---

  describe('buscarActivosPorCodCar', () => {
    var futuro = new Date(AHORA.getTime() + 2 * 60 * 60000); // +2h
    var lista = [
      crearRecordatorio('Activo', '100', '4h', AHORA, []),
      crearRecordatorio('Otro carga', '200', '4h', AHORA, [])
    ];
    // Agregar uno vencido manualmente
    lista.push({
      id: 'rec_vencido', codCar: '100', texto: 'Vencido',
      fechaCreacion: AHORA.toISOString(),
      fechaDisparo: new Date(AHORA.getTime() - 60000).toISOString(),
      snoozeCount: 0, origen: 'manual'
    });

    test('solo retorna activos de la carga', () => {
      var r = buscarActivosPorCodCar(lista, '100', AHORA);
      expect(r).toHaveLength(1);
      expect(r[0].texto).toBe('Activo');
    });

    test('carga sin activos retorna vacio', () => {
      expect(buscarActivosPorCodCar(lista, '999', AHORA)).toHaveLength(0);
    });
  });
});
