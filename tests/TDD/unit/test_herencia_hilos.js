/**
 * test_herencia_hilos.js - Tests TDD para herencia de campos en hilos
 * Verifica que processMessage hereda fase/estado del ultimo registro del hilo
 */

const { processMessage, calcularInterlocutor, _extraerEmail } = require('../../../src/gas/Main.js');

// Mock de funciones GAS globales
beforeEach(() => {
  global.extractMetadata = jest.fn(() => ({ codCar: null, tipo: 'OPERATIVO' }));
  global.auditEmail = jest.fn(() => ({ valido: true, alerta: null, emailErp: null }));
  global.obtenerEstadoInicial = jest.fn(() => 'NUEVO');
  global.obtenerEmailPropio = jest.fn(() => 'yo@empresa.com');
  global.ahoraLocalISO = jest.fn(() => '2026-02-26T10:00:00+01:00');
  global.obtenerUltimoRegistroPorThread = jest.fn(() => null);
});

afterEach(() => {
  delete global.extractMetadata;
  delete global.auditEmail;
  delete global.obtenerEstadoInicial;
  delete global.obtenerEmailPropio;
  delete global.ahoraLocalISO;
  delete global.obtenerUltimoRegistroPorThread;
});

function crearMessage(overrides) {
  return Object.assign({
    messageId: 'msg_001',
    threadId: 'thread_001',
    from: 'transportista@ext.com',
    to: 'yo@empresa.com',
    subject: 'Re: Carga 12345',
    date: '2026-02-26T09:00:00+01:00',
    body: 'Confirmado',
    cc: '',
    bcc: '',
    bandeja: 'INBOX',
    mensajesEnHilo: 3
  }, overrides);
}

function crearThreadManager(codCar) {
  return {
    mapThreadToLoad: jest.fn(),
    getLoadFromThread: jest.fn(() => codCar || null)
  };
}

function crearErpReader(carga) {
  return {
    findCarga: jest.fn(() => carga || null),
    findTransportista: jest.fn(() => null),
    findEmailContacto: jest.fn(() => null)
  };
}

describe('Herencia de campos en hilos', () => {

  describe('processMessage con herencia', () => {

    test('hereda fase y estado del ultimo registro del hilo', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '19',
        estado: 'GESTIONADO',
        codCar: 5678
      });

      var tm = crearThreadManager(5678);
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.fase).toBe('19');
      expect(result.estado).toBe('GESTIONADO');
    });

    test('hereda codCar de SEGUIMIENTO si ThreadManager no lo tiene', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '11',
        estado: 'PENDIENTE',
        codCar: 9999
      });

      var tm = crearThreadManager(null); // ThreadManager no tiene
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.codCar).toBe(9999);
      expect(result.vinculacion).toBe('HILO');
    });

    test('no sobreescribe codCar de ThreadManager', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '19',
        estado: 'GESTIONADO',
        codCar: 1111
      });

      var tm = crearThreadManager(5678); // ThreadManager SI tiene
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.codCar).toBe(5678);
      expect(result.vinculacion).toBe('HILO');
    });

    test('alerta prevalece sobre estado heredado', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '19',
        estado: 'GESTIONADO',
        codCar: 5678
      });
      global.auditEmail.mockReturnValue({
        valido: false,
        alerta: 'ALERTA_CONTACTO_NO_REGISTRADO',
        emailErp: null
      });

      var tm = crearThreadManager(5678);
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader({ codTra: 'T01', referencia: null }));

      expect(result.estado).toBe('ALERTA');
      expect(result.fase).toBe('19'); // Fase SI se hereda
    });

    test('sin registro previo usa defaults', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue(null);

      var tm = crearThreadManager(null);
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.fase).toBe('');
      expect(result.estado).toBe('NUEVO');
    });

    test('sin threadId no intenta buscar herencia', () => {
      var tm = crearThreadManager(null);
      var msg = crearMessage({ threadId: '' });
      var result = processMessage(msg, tm, crearErpReader());

      expect(global.obtenerUltimoRegistroPorThread).not.toHaveBeenCalled();
      expect(result.fase).toBe('');
      expect(result.estado).toBe('NUEVO');
    });

    test('hereda fase vacia "" correctamente (no confundir con null)', () => {
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '',
        estado: 'PENDIENTE',
        codCar: 5678
      });

      var tm = crearThreadManager(5678);
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.fase).toBe('');
      expect(result.estado).toBe('PENDIENTE');
    });

    test('codCar de adjunto (AUTOMATICA) tiene prioridad sobre herencia', () => {
      global.extractMetadata.mockReturnValue({ codCar: 7777, tipo: 'OPERATIVO' });
      global.obtenerUltimoRegistroPorThread.mockReturnValue({
        threadId: 'thread_001',
        fase: '19',
        estado: 'GESTIONADO',
        codCar: 5678
      });

      var tm = crearThreadManager(null);
      var msg = crearMessage();
      var result = processMessage(msg, tm, crearErpReader());

      expect(result.codCar).toBe(7777);
      expect(result.vinculacion).toBe('AUTOMATICA');
      // Pero fase/estado SI se heredan del hilo
      expect(result.fase).toBe('19');
      expect(result.estado).toBe('GESTIONADO');
    });
  });
});
