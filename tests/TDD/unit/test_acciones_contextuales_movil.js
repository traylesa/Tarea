/**
 * test_acciones_contextuales_movil.js - Tests bottom bar por fase via reglas,
 * evaluarReglas->accion, payload email programado, mapeo fase->plantilla
 */
const {
  evaluarReglas, obtenerAccionesDesdeReglas, generarReglasDefault,
  TIPOS_ACCION_REGLA
} = require('../../../src/extension/action-rules');
const { obtenerAccionesPorFase } = require('../../../src/extension/action-bar');

describe('Acciones contextuales - Bottom bar via reglas', () => {
  var reglasDefault = generarReglasDefault();

  test('obtenerAccionesDesdeReglas retorna acciones para fase 29', () => {
    var acciones = obtenerAccionesDesdeReglas(reglasDefault, '29');
    expect(acciones.length).toBeGreaterThan(0);
    var etiquetas = acciones.map(a => a.etiqueta);
    expect(etiquetas.some(e => e.toLowerCase().includes('documentado'))).toBe(true);
  });

  test('obtenerAccionesDesdeReglas retorna vacio sin reglas', () => {
    expect(obtenerAccionesDesdeReglas(null, '29')).toEqual([]);
    expect(obtenerAccionesDesdeReglas([], '29')).toEqual([]);
  });

  test('obtenerAccionesPorFase funciona como fallback', () => {
    var acciones = obtenerAccionesPorFase('19');
    expect(Array.isArray(acciones)).toBe(true);
  });
});

describe('Acciones contextuales - evaluarReglas post-cambio', () => {
  var reglasDefault = generarReglasDefault();

  test('evaluarReglas detecta cambio a fase 19', () => {
    var resultados = evaluarReglas(reglasDefault, 'fase', '19', '12');
    expect(resultados.length).toBeGreaterThan(0);
    // Debe incluir propagar + sugerir recordatorio
    var tipos = [];
    resultados.forEach(r => r.acciones.forEach(a => tipos.push(a.tipo)));
    expect(tipos).toContain('PROPAGAR_HILO');
    expect(tipos).toContain('SUGERIR_RECORDATORIO');
  });

  test('evaluarReglas detecta cambio a fase 29', () => {
    var resultados = evaluarReglas(reglasDefault, 'fase', '29', '22');
    var tipos = [];
    resultados.forEach(r => r.acciones.forEach(a => tipos.push(a.tipo)));
    expect(tipos).toContain('SUGERIR_RECORDATORIO');
  });

  test('evaluarReglas ignora reglas desactivadas', () => {
    var reglas = reglasDefault.map(r => Object.assign({}, r, { activa: false }));
    var resultados = evaluarReglas(reglas, 'fase', '19', '12');
    expect(resultados).toEqual([]);
  });
});

describe('Acciones contextuales - Mapeo fase/plantilla email programado', () => {
  test('TIPOS_ACCION_REGLA tiene todos los tipos esperados', () => {
    expect(TIPOS_ACCION_REGLA.PROPAGAR_HILO).toBe('PROPAGAR_HILO');
    expect(TIPOS_ACCION_REGLA.SUGERIR_RECORDATORIO).toBe('SUGERIR_RECORDATORIO');
    expect(TIPOS_ACCION_REGLA.CREAR_RECORDATORIO).toBe('CREAR_RECORDATORIO');
    expect(TIPOS_ACCION_REGLA.INICIAR_SECUENCIA).toBe('INICIAR_SECUENCIA');
    expect(TIPOS_ACCION_REGLA.PRESELECCIONAR_PLANTILLA).toBe('PRESELECCIONAR_PLANTILLA');
    expect(TIPOS_ACCION_REGLA.CAMBIAR_FASE).toBe('CAMBIAR_FASE');
    expect(TIPOS_ACCION_REGLA.CAMBIAR_ESTADO).toBe('CAMBIAR_ESTADO');
    expect(TIPOS_ACCION_REGLA.MOSTRAR_AVISO).toBe('MOSTRAR_AVISO');
  });

  test('reglas default sugieren recordatorio con params correctos para fase 19', () => {
    var resultados = evaluarReglas(generarReglasDefault(), 'fase', '19', null);
    var sugerencia = null;
    resultados.forEach(function(r) {
      r.acciones.forEach(function(a) {
        if (a.tipo === 'SUGERIR_RECORDATORIO') sugerencia = a;
      });
    });
    expect(sugerencia).not.toBeNull();
    expect(sugerencia.params.texto).toBe('Verificar descarga');
    expect(sugerencia.params.horas).toBe(8);
  });

  test('reglas default sugieren recordatorio con params correctos para fase 29', () => {
    var resultados = evaluarReglas(generarReglasDefault(), 'fase', '29', null);
    var sugerencia = null;
    resultados.forEach(function(r) {
      r.acciones.forEach(function(a) {
        if (a.tipo === 'SUGERIR_RECORDATORIO') sugerencia = a;
      });
    });
    expect(sugerencia).not.toBeNull();
    expect(sugerencia.params.texto).toBe('Reclamar POD');
    expect(sugerencia.params.horas).toBe(24);
  });
});
