/**
 * test_action_bar.js - Tests TDD para modulo de acciones contextuales por fase
 * Sprint 4: HU-11 (Acciones contextuales)
 */

const {
  obtenerAccionesPorFase,
  obtenerGrupoFase,
  ACCIONES_POR_GRUPO,
  MAPA_FASE_A_GRUPO
} = require('../../../src/extension/action-bar.js');

describe('action-bar.js', () => {

  // --- obtenerGrupoFase ---

  describe('obtenerGrupoFase', () => {
    test('clasifica fases de espera correctamente', () => {
      expect(obtenerGrupoFase('00')).toBe('espera');
      expect(obtenerGrupoFase('01')).toBe('espera');
      expect(obtenerGrupoFase('02')).toBe('espera');
    });

    test('clasifica fases de carga correctamente', () => {
      expect(obtenerGrupoFase('11')).toBe('carga');
      expect(obtenerGrupoFase('12')).toBe('carga');
    });

    test('clasifica fase en ruta correctamente', () => {
      expect(obtenerGrupoFase('19')).toBe('en_ruta');
    });

    test('clasifica fases de descarga correctamente', () => {
      expect(obtenerGrupoFase('21')).toBe('descarga');
      expect(obtenerGrupoFase('22')).toBe('descarga');
    });

    test('clasifica fase vacio correctamente', () => {
      expect(obtenerGrupoFase('29')).toBe('vacio');
    });

    test('clasifica fases de incidencia correctamente', () => {
      expect(obtenerGrupoFase('05')).toBe('incidencia');
      expect(obtenerGrupoFase('25')).toBe('incidencia');
    });

    test('retorna null para fase documentado (30)', () => {
      expect(obtenerGrupoFase('30')).toBeNull();
    });

    test('retorna null para fase null', () => {
      expect(obtenerGrupoFase(null)).toBeNull();
    });

    test('retorna null para fase undefined', () => {
      expect(obtenerGrupoFase(undefined)).toBeNull();
    });

    test('retorna null para fase vacia', () => {
      expect(obtenerGrupoFase('')).toBeNull();
    });

    test('retorna null para fase desconocida', () => {
      expect(obtenerGrupoFase('99')).toBeNull();
    });
  });

  // --- obtenerAccionesPorFase ---

  describe('obtenerAccionesPorFase', () => {
    test('retorna acciones de espera para fase 00', () => {
      var acciones = obtenerAccionesPorFase('00');
      expect(acciones.length).toBe(2);
      expect(acciones[0].etiqueta).toBe('Confirmar hora carga');
      expect(acciones[1].etiqueta).toBe('Retrasar carga');
    });

    test('retorna acciones de carga para fase 12', () => {
      var acciones = obtenerAccionesPorFase('12');
      expect(acciones.length).toBe(2);
      expect(acciones[0].etiqueta).toBe('Solicitar posicion');
      expect(acciones[1].etiqueta).toBe('Avisar destino');
    });

    test('retorna acciones de en_ruta para fase 19', () => {
      var acciones = obtenerAccionesPorFase('19');
      expect(acciones.length).toBe(2);
      expect(acciones[0].etiqueta).toBe('Verificar ETA');
    });

    test('retorna acciones de descarga para fase 21', () => {
      var acciones = obtenerAccionesPorFase('21');
      expect(acciones.length).toBe(1);
      expect(acciones[0].etiqueta).toBe('Confirmar descarga');
    });

    test('retorna acciones de vacio para fase 29', () => {
      var acciones = obtenerAccionesPorFase('29');
      expect(acciones.length).toBe(2);
      expect(acciones[0].etiqueta).toBe('Reclamar POD');
      expect(acciones[1].etiqueta).toBe('Marcar documentado');
    });

    test('retorna acciones de incidencia para fase 05', () => {
      var acciones = obtenerAccionesPorFase('05');
      expect(acciones.length).toBe(2);
      expect(acciones[0].etiqueta).toBe('Solicitar detalle');
      expect(acciones[1].etiqueta).toBe('Escalar responsable');
    });

    test('retorna array vacio para fase 30 (documentado)', () => {
      expect(obtenerAccionesPorFase('30')).toEqual([]);
    });

    test('retorna array vacio para fase null', () => {
      expect(obtenerAccionesPorFase(null)).toEqual([]);
    });

    test('retorna array vacio para fase undefined', () => {
      expect(obtenerAccionesPorFase(undefined)).toEqual([]);
    });

    test('retorna array vacio para fase desconocida', () => {
      expect(obtenerAccionesPorFase('99')).toEqual([]);
    });

    test('cada accion tiene etiqueta como string', () => {
      var acciones = obtenerAccionesPorFase('29');
      acciones.forEach(function(a) {
        expect(typeof a.etiqueta).toBe('string');
        expect(a.etiqueta.length).toBeGreaterThan(0);
      });
    });

    test('cada accion tiene faseSiguiente como string o null', () => {
      var acciones = obtenerAccionesPorFase('29');
      acciones.forEach(function(a) {
        expect(a.faseSiguiente === null || typeof a.faseSiguiente === 'string').toBe(true);
      });
    });

    test('Marcar documentado tiene faseSiguiente 30', () => {
      var acciones = obtenerAccionesPorFase('29');
      var marcar = acciones.find(function(a) { return a.etiqueta === 'Marcar documentado'; });
      expect(marcar.faseSiguiente).toBe('30');
    });

    test('retorna copia nueva, no referencia', () => {
      var a1 = obtenerAccionesPorFase('29');
      var a2 = obtenerAccionesPorFase('29');
      expect(a1).not.toBe(a2);
      expect(a1).toEqual(a2);
    });
  });

  // --- Constantes ---

  describe('ACCIONES_POR_GRUPO', () => {
    test('tiene 6 grupos definidos', () => {
      var grupos = Object.keys(ACCIONES_POR_GRUPO);
      expect(grupos.length).toBe(6);
      expect(grupos).toContain('espera');
      expect(grupos).toContain('carga');
      expect(grupos).toContain('en_ruta');
      expect(grupos).toContain('descarga');
      expect(grupos).toContain('vacio');
      expect(grupos).toContain('incidencia');
    });

    test('cada grupo tiene al menos 1 accion', () => {
      Object.keys(ACCIONES_POR_GRUPO).forEach(function(grupo) {
        expect(ACCIONES_POR_GRUPO[grupo].length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
