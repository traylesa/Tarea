const {
  parseCsv,
  findCarga,
  findTransportista,
  findEmailContacto,
  createERPReader
} = require('../../../src/gas/ERPReader');

const PEDCLI_CSV = `CODCAR;CODTRA;CODVIA;FECHOR;REFERENCIA
168345;TR001;V001;13/02/2026 18:00;REF-CLIENTE-A
168346;TR002;V002;14/02/2026 10:00;REF-CLIENTE-B
168347;TR001;V001;15/02/2026 08:00;REF-CLIENTE-C`;

const TRANSPOR_CSV = `CODIGO;NOMBRE;NIF;DIRECCION
TR001;TRAYLESA SL;B12345678;Calle Mayor 1
TR002;TRANSPORTES PEPE;A87654321;Av. Libertad 5`;

const VIATELEF_CSV = `CODVIA;NUMERO
V001;trafico@traylesa.com
V002;pepe@transportespepe.com`;

describe('ERPReader', () => {

  describe('parseCsv', () => {
    test('parsea CSV con separador ;', () => {
      const rows = parseCsv(PEDCLI_CSV);
      expect(rows).toHaveLength(3);
      expect(rows[0].CODCAR).toBe('168345');
      expect(rows[0].CODTRA).toBe('TR001');
    });

    test('retorna array vacio para CSV vacio', () => {
      expect(parseCsv('')).toEqual([]);
    });

    test('retorna array vacio para null', () => {
      expect(parseCsv(null)).toEqual([]);
    });

    test('maneja CSV con solo header', () => {
      expect(parseCsv('COL1;COL2')).toEqual([]);
    });
  });

  describe('findCarga', () => {
    let reader;

    beforeAll(() => {
      reader = createERPReader({ pedcli: PEDCLI_CSV, transpor: TRANSPOR_CSV, viatelef: VIATELEF_CSV });
    });

    test('encuentra carga por CODCAR', () => {
      const carga = reader.findCarga(168345);
      expect(carga).not.toBeNull();
      expect(carga.codCar).toBe(168345);
      expect(carga.codTra).toBe('TR001');
      expect(carga.codVia).toBe('V001');
      expect(carga.referencia).toBe('REF-CLIENTE-A');
    });

    test('retorna null para CODCAR inexistente', () => {
      expect(reader.findCarga(999999)).toBeNull();
    });

    test('retorna null para null', () => {
      expect(reader.findCarga(null)).toBeNull();
    });
  });

  describe('findTransportista', () => {
    let reader;

    beforeAll(() => {
      reader = createERPReader({ pedcli: PEDCLI_CSV, transpor: TRANSPOR_CSV, viatelef: VIATELEF_CSV });
    });

    test('encuentra transportista por CODTRA', () => {
      const t = reader.findTransportista('TR001');
      expect(t).not.toBeNull();
      expect(t.nombre).toBe('TRAYLESA SL');
      expect(t.nif).toBe('B12345678');
    });

    test('retorna null para CODTRA inexistente', () => {
      expect(reader.findTransportista('TR999')).toBeNull();
    });
  });

  describe('findEmailContacto', () => {
    let reader;

    beforeAll(() => {
      reader = createERPReader({ pedcli: PEDCLI_CSV, transpor: TRANSPOR_CSV, viatelef: VIATELEF_CSV });
    });

    test('encuentra email por CODVIA', () => {
      expect(reader.findEmailContacto('V001')).toBe('trafico@traylesa.com');
    });

    test('retorna null para CODVIA inexistente', () => {
      expect(reader.findEmailContacto('V999')).toBeNull();
    });

    test('retorna null para CODVIA null', () => {
      expect(reader.findEmailContacto(null)).toBeNull();
    });
  });

  describe('createERPReader con defaults', () => {
    test('crea reader sin argumentos', () => {
      const reader = createERPReader();
      expect(reader.findCarga(1)).toBeNull();
    });

    test('findTransportista retorna null para null', () => {
      const reader = createERPReader({ pedcli: PEDCLI_CSV, transpor: TRANSPOR_CSV, viatelef: VIATELEF_CSV });
      expect(reader.findTransportista(null)).toBeNull();
    });

    test('parsea CSV con campo vacio al final de linea', () => {
      const csv = 'A;B;C\n1;2;';
      const rows = parseCsv(csv);
      expect(rows[0].C).toBe('');
    });
  });
});
