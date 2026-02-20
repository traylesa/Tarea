/**
 * test_edicion_masiva_movil.js - Tests payload masivo y validacion
 */
const { construirPayload, validarSeleccion } = require('../../../src/extension/bulk-reply');
const { getDefaultFases, obtenerFasePorCodigo } = require('../../../src/extension/fases-config');

describe('Edicion masiva - Fases dinamicas', () => {
  test('getDefaultFases retorna fases activas con codigo', () => {
    var fases = getDefaultFases().filter(f => f.activa && f.codigo);
    expect(fases.length).toBeGreaterThanOrEqual(10);
    expect(fases[0]).toHaveProperty('nombre');
    expect(fases[0]).toHaveProperty('codigo');
  });

  test('obtenerFasePorCodigo encuentra fase existente', () => {
    var fases = getDefaultFases();
    var fase = obtenerFasePorCodigo(fases, '19');
    expect(fase).not.toBeNull();
    expect(fase.nombre).toContain('Cargado');
  });

  test('obtenerFasePorCodigo retorna null para fase inexistente', () => {
    var fases = getDefaultFases();
    expect(obtenerFasePorCodigo(fases, '99')).toBeNull();
  });
});

describe('Edicion masiva - Payload respuesta', () => {
  test('construirPayload genera destinatarios correctos', () => {
    var registros = [
      { codCar: 1, threadId: 't1', interlocutor: 'a@b.com', asunto: 'Test', cc: '' }
    ];
    var plantilla = { alias: 'Test', cuerpo: 'Hola {codCar}' };
    var payload = construirPayload(registros, plantilla);
    expect(payload).toHaveProperty('destinatarios');
    expect(payload.destinatarios).toHaveLength(1);
    expect(payload.destinatarios[0]).toHaveProperty('threadId', 't1');
  });

  test('validarSeleccion rechaza array vacio', () => {
    var resultado = validarSeleccion([]);
    expect(resultado.valido).toBe(false);
  });
});
