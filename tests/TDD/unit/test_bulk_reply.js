const {
  construirPayload,
  validarSeleccion,
  generarPrevisualizacion,
  obtenerFirmasDisponibles
} = require('../../../src/extension/bulk-reply');

describe('bulk-reply', () => {
  const registrosMock = [
    { emailRemitente: 'a@test.com', nombreTransportista: 'Trans A', codCar: 100, asunto: 'Carga 100', threadId: 't1' },
    { emailRemitente: 'b@test.com', nombreTransportista: 'Trans B', codCar: 200, asunto: 'Carga 200', threadId: 't2' }
  ];

  const plantillaMock = {
    asunto: 'Re: {{asunto}}',
    cuerpo: '<p>Estimado {{nombreTransportista}}, confirmamos carga {{codCar}}</p>',
    firma: '<p>--<br>Logistica</p>'
  };

  describe('construirPayload', () => {
    test('construye payload con destinatarios y cuerpo interpolado', () => {
      const payload = construirPayload(registrosMock, plantillaMock);

      expect(payload.destinatarios).toHaveLength(2);
      expect(payload.destinatarios[0].email).toBe('a@test.com');
      expect(payload.destinatarios[0].asunto).toBe('Re: Carga 100');
      expect(payload.destinatarios[0].cuerpo).toContain('Trans A');
      expect(payload.destinatarios[0].cuerpo).toContain('100');
    });

    test('incluye firma en cada mensaje', () => {
      const payload = construirPayload(registrosMock, plantillaMock);

      payload.destinatarios.forEach(d => {
        expect(d.cuerpo).toContain('Logistica');
      });
    });

    test('payload tiene threadId para reply', () => {
      const payload = construirPayload(registrosMock, plantillaMock);

      expect(payload.destinatarios[0].threadId).toBe('t1');
      expect(payload.destinatarios[1].threadId).toBe('t2');
    });
  });

  describe('validarSeleccion', () => {
    test('valida seleccion con registros', () => {
      const result = validarSeleccion(registrosMock);
      expect(result.valido).toBe(true);
    });

    test('rechaza seleccion vacia', () => {
      const result = validarSeleccion([]);
      expect(result.valido).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rechaza null', () => {
      const result = validarSeleccion(null);
      expect(result.valido).toBe(false);
    });
  });

  describe('generarPrevisualizacion', () => {
    const sanitizar = (html) => html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    test('interpola datos del primer registro seleccionado', () => {
      const result = generarPrevisualizacion(registrosMock, plantillaMock, sanitizar);

      expect(result.asuntoPreview).toBe('Re: Carga 100');
      expect(result.cuerpoPreview).toContain('Trans A');
      expect(result.cuerpoPreview).toContain('100');
    });

    test('incluye firma en previsualizacion', () => {
      const result = generarPrevisualizacion(registrosMock, plantillaMock, sanitizar);

      expect(result.cuerpoPreview).toContain('Logistica');
    });

    test('sanitiza HTML en previsualizacion', () => {
      const plantillaConScript = {
        ...plantillaMock,
        cuerpo: '<p>Hola</p><script>alert("xss")</script>'
      };
      const result = generarPrevisualizacion(registrosMock, plantillaConScript, sanitizar);

      expect(result.cuerpoPreview).not.toContain('<script>');
      expect(result.cuerpoPreview).toContain('<p>Hola</p>');
    });

    test('retorna vacio si no hay registros', () => {
      const result = generarPrevisualizacion([], plantillaMock, sanitizar);

      expect(result.asuntoPreview).toBe('');
      expect(result.cuerpoPreview).toBe('');
    });
  });

  describe('obtenerFirmasDisponibles', () => {
    const plantillas = [
      { id: 'tpl_1', alias: 'Confirmacion', firma: '<p>--<br>Logistica</p>' },
      { id: 'tpl_2', alias: 'Urgente', firma: '<p>--<br>Dpto Urgente</p>' },
      { id: 'tpl_3', alias: 'Sin firma', firma: '' }
    ];

    test('retorna firmas de plantillas que tienen firma', () => {
      const result = obtenerFirmasDisponibles(plantillas);

      expect(result).toHaveLength(2);
      expect(result[0].alias).toBe('Confirmacion');
      expect(result[0].firma).toContain('Logistica');
    });

    test('excluye plantillas sin firma', () => {
      const result = obtenerFirmasDisponibles(plantillas);

      const sinFirma = result.find(f => f.alias === 'Sin firma');
      expect(sinFirma).toBeUndefined();
    });

    test('retorna array vacio si no hay plantillas', () => {
      expect(obtenerFirmasDisponibles([])).toEqual([]);
    });

    test('retorna array vacio si plantillas es null', () => {
      expect(obtenerFirmasDisponibles(null)).toEqual([]);
    });
  });
});
