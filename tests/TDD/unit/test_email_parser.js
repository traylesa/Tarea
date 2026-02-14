const {
  extractCodCarFromFilename,
  isAdministrative,
  extractNif,
  extractMetadata
} = require('../../../src/gas/EmailParser');

describe('EmailParser', () => {

  describe('extractCodCarFromFilename', () => {
    test('extrae CODCAR de adjunto con ceros iniciales', () => {
      expect(extractCodCarFromFilename('Carga_0168345.pdf')).toBe(168345);
    });

    test('extrae CODCAR de adjunto sin ceros', () => {
      expect(extractCodCarFromFilename('Carga_168345.pdf')).toBe(168345);
    });

    test('extrae CODCAR con multiples ceros', () => {
      expect(extractCodCarFromFilename('Carga_000123.pdf')).toBe(123);
    });

    test('retorna null para adjunto que no es carga', () => {
      expect(extractCodCarFromFilename('Factura_001.pdf')).toBeNull();
    });

    test('retorna null para string vacio', () => {
      expect(extractCodCarFromFilename('')).toBeNull();
    });

    test('retorna null para null/undefined', () => {
      expect(extractCodCarFromFilename(null)).toBeNull();
      expect(extractCodCarFromFilename(undefined)).toBeNull();
    });

    test('case insensitive', () => {
      expect(extractCodCarFromFilename('CARGA_168345.PDF')).toBe(168345);
      expect(extractCodCarFromFilename('carga_168345.pdf')).toBe(168345);
    });
  });

  describe('isAdministrative', () => {
    test('detecta keyword Certificado en asunto', () => {
      expect(isAdministrative('Solicitud Certificado corriente de pago', '')).toBe(true);
    });

    test('detecta keyword 347 en asunto', () => {
      expect(isAdministrative('Declaracion AEAT 347', '')).toBe(true);
    });

    test('detecta keyword AEAT en cuerpo', () => {
      expect(isAdministrative('Consulta', 'Necesito el modelo AEAT')).toBe(true);
    });

    test('detecta keyword Factura', () => {
      expect(isAdministrative('Envio Factura mensual', '')).toBe(true);
    });

    test('detecta keyword Hacienda', () => {
      expect(isAdministrative('Documento de Hacienda', '')).toBe(true);
    });

    test('no detecta correo operativo normal', () => {
      expect(isAdministrative('Re: Orden de carga', 'Recibido, gracias')).toBe(false);
    });

    test('maneja null/undefined', () => {
      expect(isAdministrative(null, null)).toBe(false);
      expect(isAdministrative(undefined, undefined)).toBe(false);
    });
  });

  describe('extractNif', () => {
    test('extrae NIF con letra final', () => {
      expect(extractNif('El NIF es 12345678Z del transportista')).toBe('12345678Z');
    });

    test('extrae CIF con letra inicial', () => {
      expect(extractNif('CIF: B12345678 empresa')).toBe('B12345678');
    });

    test('retorna null si no hay NIF/CIF', () => {
      expect(extractNif('Texto sin identificacion fiscal')).toBeNull();
    });

    test('retorna null para string vacio', () => {
      expect(extractNif('')).toBeNull();
    });

    test('retorna null para null', () => {
      expect(extractNif(null)).toBeNull();
    });

    test('extrae primer NIF encontrado', () => {
      expect(extractNif('NIF: 12345678Z y CIF: B87654321')).toBe('12345678Z');
    });
  });

  describe('extractMetadata', () => {
    test('extrae CODCAR de adjunto y clasifica como OPERATIVO', () => {
      const message = {
        attachments: ['Carga_0168345.pdf'],
        subject: 'Orden de carga',
        body: 'Adjunto orden',
        from: 'trafico@empresa.com'
      };
      const result = extractMetadata(message);
      expect(result.codCar).toBe(168345);
      expect(result.tipo).toBe('OPERATIVO');
    });

    test('clasifica como ADMINISTRATIVA sin adjunto carga', () => {
      const message = {
        attachments: [],
        subject: 'Solicitud Certificado',
        body: 'NIF: 12345678Z',
        from: 'admin@empresa.com'
      };
      const result = extractMetadata(message);
      expect(result.codCar).toBeNull();
      expect(result.tipo).toBe('ADMINISTRATIVA');
      expect(result.nif).toBe('12345678Z');
    });

    test('clasifica como SIN_CLASIFICAR si no hay patron', () => {
      const message = {
        attachments: [],
        subject: 'Hola',
        body: 'Mensaje generico',
        from: 'alguien@email.com'
      };
      const result = extractMetadata(message);
      expect(result.codCar).toBeNull();
      expect(result.tipo).toBe('SIN_CLASIFICAR');
    });

    test('prioriza adjunto sobre keywords admin', () => {
      const message = {
        attachments: ['Carga_100.pdf'],
        subject: 'Certificado y carga',
        body: '',
        from: 'trafico@empresa.com'
      };
      const result = extractMetadata(message);
      expect(result.codCar).toBe(100);
      expect(result.tipo).toBe('OPERATIVO');
    });

    test('maneja message null', () => {
      const result = extractMetadata(null);
      expect(result.tipo).toBe('SIN_CLASIFICAR');
    });

    test('maneja message sin attachments', () => {
      const result = extractMetadata({ subject: 'Hola', body: 'Texto' });
      expect(result.tipo).toBe('SIN_CLASIFICAR');
    });

    test('multiple adjuntos, solo uno es carga', () => {
      const message = {
        attachments: ['Factura_001.pdf', 'Carga_555.pdf'],
        subject: 'Documentos',
        body: '',
        from: 'test@test.com'
      };
      const result = extractMetadata(message);
      expect(result.codCar).toBe(555);
      expect(result.tipo).toBe('OPERATIVO');
    });
  });
});
