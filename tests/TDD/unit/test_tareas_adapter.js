/**
 * test_tareas_adapter.js - Tests TDD para TareasAdapter (Fase C: IA Integrada)
 * CRUD sobre hoja TAREAS con patron dual-compat GAS/Node
 */

// Mock de Logger
global.Logger = { log: jest.fn() };

// Constantes de configuracion (simula lo que exporta Configuracion.js)
const HOJA_TAREAS = 'TAREAS';
const HEADERS_TAREAS = [
  'id', 'titulo', 'descripcion', 'referencia', 'contactoTel',
  'entidadId', 'centroId', 'usuarioAsignado', 'creadoPor',
  'estado', 'fase', 'prioridadIa', 'horasIa', 'riesgoIa',
  'justificacionIa', 'subtareasJson', 'creadoAt', 'actualizadoAt'
];

// Mock de hoja de calculo en memoria
let hojaData = [];
let hojaHeaders = [...HEADERS_TAREAS];

const mockHoja = {
  getDataRange: () => ({
    getValues: () => [hojaHeaders, ...hojaData]
  }),
  appendRow: (fila) => { hojaData.push(fila); },
  getRange: (fila, col) => ({
    setValue: (val) => {
      // fila es 1-based, hojaData es 0-based (fila 1 = headers)
      hojaData[fila - 2][col - 1] = val;
    }
  }),
  getLastRow: () => hojaData.length + 1
};

// Mock de obtenerHoja (simula AdaptadorHojas)
global.obtenerHoja = jest.fn(() => mockHoja);

// Mock de ahoraLocalISO (simula Configuracion)
global.ahoraLocalISO = jest.fn(() => '2026-03-04T10:00:00+01:00');

// Inyectar constantes globales que TareasAdapter necesita
global.HOJA_TAREAS = HOJA_TAREAS;
global.HEADERS_TAREAS = HEADERS_TAREAS;

const {
  crearTarea,
  obtenerTareas,
  obtenerTareasPorUsuario,
  actualizarTarea,
  actualizarValoracionIA,
  actualizarSubtareas
} = require('../../../src/gas/TareasAdapter');

describe('TareasAdapter', () => {
  beforeEach(() => {
    hojaData = [];
    hojaHeaders = [...HEADERS_TAREAS];
    jest.clearAllMocks();
  });

  // --- crearTarea ---

  describe('crearTarea', () => {
    test('crea registro con ID generado', () => {
      const tarea = { titulo: 'Nueva tarea', creadoPor: 'usuario1@test.com' };
      const resultado = crearTarea(tarea);

      expect(resultado).toHaveProperty('id');
      expect(resultado.id).toBeTruthy();
      expect(hojaData.length).toBe(1);
    });

    test('valida campos obligatorios: titulo', () => {
      expect(() => crearTarea({ creadoPor: 'u@test.com' }))
        .toThrow();
    });

    test('valida campos obligatorios: creadoPor', () => {
      expect(() => crearTarea({ titulo: 'Tarea sin creador' }))
        .toThrow();
    });

    test('establece estado inicial PENDIENTE', () => {
      const resultado = crearTarea({ titulo: 'Test', creadoPor: 'u@test.com' });
      expect(resultado.estado).toBe('PENDIENTE');
    });

    test('establece timestamps creadoAt y actualizadoAt', () => {
      const resultado = crearTarea({ titulo: 'Test', creadoPor: 'u@test.com' });
      expect(resultado.creadoAt).toBe('2026-03-04T10:00:00+01:00');
      expect(resultado.actualizadoAt).toBe('2026-03-04T10:00:00+01:00');
    });
  });

  // --- obtenerTareas ---

  describe('obtenerTareas', () => {
    test('retorna todas las tareas', () => {
      // Insertar datos directamente
      const fila1 = HEADERS_TAREAS.map(h => {
        if (h === 'id') return 'T001';
        if (h === 'titulo') return 'Tarea 1';
        return '';
      });
      const fila2 = HEADERS_TAREAS.map(h => {
        if (h === 'id') return 'T002';
        if (h === 'titulo') return 'Tarea 2';
        return '';
      });
      hojaData.push(fila1, fila2);

      const tareas = obtenerTareas();
      expect(tareas).toHaveLength(2);
      expect(tareas[0].id).toBe('T001');
      expect(tareas[1].id).toBe('T002');
    });

    test('retorna array vacio si no hay tareas', () => {
      const tareas = obtenerTareas();
      expect(tareas).toEqual([]);
    });
  });

  // --- obtenerTareasPorUsuario ---

  describe('obtenerTareasPorUsuario', () => {
    test('filtra por usuario asignado', () => {
      const idxAsignado = HEADERS_TAREAS.indexOf('usuarioAsignado');
      const idxId = HEADERS_TAREAS.indexOf('id');

      const fila1 = HEADERS_TAREAS.map(() => '');
      fila1[idxId] = 'T001';
      fila1[idxAsignado] = 'juan@test.com';

      const fila2 = HEADERS_TAREAS.map(() => '');
      fila2[idxId] = 'T002';
      fila2[idxAsignado] = 'maria@test.com';

      const fila3 = HEADERS_TAREAS.map(() => '');
      fila3[idxId] = 'T003';
      fila3[idxAsignado] = 'juan@test.com';

      hojaData.push(fila1, fila2, fila3);

      const tareas = obtenerTareasPorUsuario('juan@test.com');
      expect(tareas).toHaveLength(2);
      expect(tareas[0].id).toBe('T001');
      expect(tareas[1].id).toBe('T003');
    });

    test('retorna array vacio si no hay tareas del usuario', () => {
      const tareas = obtenerTareasPorUsuario('nadie@test.com');
      expect(tareas).toEqual([]);
    });
  });

  // --- actualizarTarea ---

  describe('actualizarTarea', () => {
    test('modifica campos especificos', () => {
      const idxId = HEADERS_TAREAS.indexOf('id');
      const idxTitulo = HEADERS_TAREAS.indexOf('titulo');
      const idxEstado = HEADERS_TAREAS.indexOf('estado');

      const fila = HEADERS_TAREAS.map(() => '');
      fila[idxId] = 'T001';
      fila[idxTitulo] = 'Titulo original';
      fila[idxEstado] = 'PENDIENTE';
      hojaData.push(fila);

      actualizarTarea('T001', { estado: 'EN_PROCESO' });

      // Verificar que se actualizo
      expect(hojaData[0][idxEstado]).toBe('EN_PROCESO');
    });

    test('retorna false si tarea no existe', () => {
      const resultado = actualizarTarea('NO_EXISTE', { estado: 'COMPLETADA' });
      expect(resultado).toBe(false);
    });
  });

  // --- actualizarValoracionIA ---

  describe('actualizarValoracionIA', () => {
    test('actualiza campos IA (prioridad, horas, riesgo, justificacion)', () => {
      const idxId = HEADERS_TAREAS.indexOf('id');
      const fila = HEADERS_TAREAS.map(() => '');
      fila[idxId] = 'T001';
      hojaData.push(fila);

      actualizarValoracionIA('T001', {
        prioridad: 3,
        horas: 8,
        riesgo: 'ALTO',
        justificacion: 'Tarea critica'
      });

      const idxPrioridad = HEADERS_TAREAS.indexOf('prioridadIa');
      const idxHoras = HEADERS_TAREAS.indexOf('horasIa');
      const idxRiesgo = HEADERS_TAREAS.indexOf('riesgoIa');
      const idxJust = HEADERS_TAREAS.indexOf('justificacionIa');

      expect(hojaData[0][idxPrioridad]).toBe(3);
      expect(hojaData[0][idxHoras]).toBe(8);
      expect(hojaData[0][idxRiesgo]).toBe('ALTO');
      expect(hojaData[0][idxJust]).toBe('Tarea critica');
    });
  });

  // --- actualizarSubtareas ---

  describe('actualizarSubtareas', () => {
    test('guarda JSON stringificado', () => {
      const idxId = HEADERS_TAREAS.indexOf('id');
      const fila = HEADERS_TAREAS.map(() => '');
      fila[idxId] = 'T001';
      hojaData.push(fila);

      const subtareas = [
        { titulo: 'Sub 1', horasEstimadas: 4 },
        { titulo: 'Sub 2', horasEstimadas: 6 }
      ];
      actualizarSubtareas('T001', subtareas);

      const idxSubtareas = HEADERS_TAREAS.indexOf('subtareasJson');
      const guardado = hojaData[0][idxSubtareas];
      expect(typeof guardado).toBe('string');
      expect(JSON.parse(guardado)).toEqual(subtareas);
    });
  });
});
