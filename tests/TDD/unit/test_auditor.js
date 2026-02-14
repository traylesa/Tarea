const { auditEmail } = require('../../../src/gas/Auditor');

describe('Auditor', () => {

  describe('auditEmail', () => {
    const mockFindEmail = (codVia) => {
      const emails = {
        'V001': 'trafico@traylesa.com',
        'V002': 'pepe@transportespepe.com'
      };
      return emails[codVia] || null;
    };

    test('email correcto no genera alerta', () => {
      const result = auditEmail('trafico@traylesa.com', 'V001', mockFindEmail);
      expect(result.valido).toBe(true);
      expect(result.alerta).toBeNull();
      expect(result.emailErp).toBe('trafico@traylesa.com');
    });

    test('email incorrecto genera ALERTA_CONTACTO_NO_REGISTRADO', () => {
      const result = auditEmail('juan@otro.com', 'V001', mockFindEmail);
      expect(result.valido).toBe(false);
      expect(result.alerta).toBe('ALERTA_CONTACTO_NO_REGISTRADO');
      expect(result.emailErp).toBe('trafico@traylesa.com');
    });

    test('sin email en ERP genera ALERTA_SIN_CONTACTO_ERP', () => {
      const result = auditEmail('alguien@email.com', 'V999', mockFindEmail);
      expect(result.valido).toBe(false);
      expect(result.alerta).toBe('ALERTA_SIN_CONTACTO_ERP');
      expect(result.emailErp).toBeNull();
    });

    test('comparacion case-insensitive', () => {
      const result = auditEmail('TRAFICO@TRAYLESA.COM', 'V001', mockFindEmail);
      expect(result.valido).toBe(true);
    });

    test('codVia null genera alerta sin contacto', () => {
      const result = auditEmail('alguien@email.com', null, mockFindEmail);
      expect(result.valido).toBe(false);
      expect(result.alerta).toBe('ALERTA_SIN_CONTACTO_ERP');
    });
  });
});
