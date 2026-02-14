const {
  crearPlantilla,
  editarPlantilla,
  eliminarPlantilla,
  interpolar,
  obtenerVariablesDisponibles,
  sanitizarHtml
} = require('../../../src/extension/templates');

describe('templates', () => {
  describe('crearPlantilla', () => {
    test('crea plantilla con id generado', () => {
      const p = crearPlantilla('Confirmacion', 'Re: {{asunto}}', '<p>Hola</p>', '<p>Firma</p>');

      expect(p.id).toBeDefined();
      expect(p.id).toMatch(/^tpl_/);
      expect(p.alias).toBe('Confirmacion');
      expect(p.asunto).toBe('Re: {{asunto}}');
      expect(p.cuerpo).toBe('<p>Hola</p>');
      expect(p.firma).toBe('<p>Firma</p>');
      expect(p.created_at).toBeDefined();
      expect(p.updated_at).toBeDefined();
    });

    test('genera ids unicos', () => {
      const p1 = crearPlantilla('A', '', '', '');
      const p2 = crearPlantilla('B', '', '', '');
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('editarPlantilla', () => {
    test('actualiza campos especificados', () => {
      const original = crearPlantilla('Original', 'Asunto', '<p>Body</p>', '');
      const editada = editarPlantilla(original, { alias: 'Editada', cuerpo: '<p>Nuevo</p>' });

      expect(editada.alias).toBe('Editada');
      expect(editada.cuerpo).toBe('<p>Nuevo</p>');
      expect(editada.asunto).toBe('Asunto');
      expect(editada.id).toBe(original.id);
    });

    test('actualiza updated_at', () => {
      const original = crearPlantilla('Test', '', '', '');
      const editada = editarPlantilla(original, { alias: 'Nuevo' });
      expect(editada.updated_at).toBeDefined();
    });
  });

  describe('eliminarPlantilla', () => {
    test('elimina plantilla por id', () => {
      const p1 = crearPlantilla('A', '', '', '');
      const p2 = crearPlantilla('B', '', '', '');
      const resultado = eliminarPlantilla(p1.id, [p1, p2]);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].alias).toBe('B');
    });

    test('retorna array intacto si id no existe', () => {
      const p1 = crearPlantilla('A', '', '', '');
      const resultado = eliminarPlantilla('inexistente', [p1]);
      expect(resultado).toHaveLength(1);
    });
  });

  describe('interpolar', () => {
    test('reemplaza variables con valores', () => {
      const texto = 'Hola {{nombreTransportista}}, su carga {{codCar}} esta en proceso';
      const vars = { nombreTransportista: 'Garcia SL', codCar: '168345' };

      expect(interpolar(texto, vars)).toBe('Hola Garcia SL, su carga 168345 esta en proceso');
    });

    test('deja placeholder si variable no existe', () => {
      const texto = 'Hola {{nombre}}';
      const vars = {};

      expect(interpolar(texto, vars)).toBe('Hola {{nombre}}');
    });

    test('maneja texto sin variables', () => {
      expect(interpolar('Texto plano', {})).toBe('Texto plano');
    });

    test('reemplaza multiples ocurrencias de la misma variable', () => {
      const texto = '{{codCar}} - referencia {{codCar}}';
      expect(interpolar(texto, { codCar: '123' })).toBe('123 - referencia 123');
    });
  });

  describe('obtenerVariablesDisponibles', () => {
    test('retorna lista de variables con nombre y descripcion', () => {
      const vars = obtenerVariablesDisponibles();

      expect(vars.length).toBeGreaterThan(0);
      vars.forEach(v => {
        expect(v).toHaveProperty('nombre');
        expect(v).toHaveProperty('descripcion');
      });
    });

    test('incluye variables del modelo seguimiento', () => {
      const vars = obtenerVariablesDisponibles();
      const nombres = vars.map(v => v.nombre);

      expect(nombres).toContain('codCar');
      expect(nombres).toContain('nombreTransportista');
      expect(nombres).toContain('emailRemitente');
    });
  });

  describe('sanitizarHtml', () => {
    test('elimina etiquetas script', () => {
      const html = '<p>Hola</p><script>alert("xss")</script>';
      expect(sanitizarHtml(html)).toBe('<p>Hola</p>');
    });

    test('elimina atributos on*', () => {
      const html = '<p onclick="alert(1)">Click</p>';
      expect(sanitizarHtml(html)).toBe('<p>Click</p>');
    });

    test('permite etiquetas seguras', () => {
      const html = '<p>Hola <strong>mundo</strong></p>';
      expect(sanitizarHtml(html)).toBe('<p>Hola <strong>mundo</strong></p>');
    });

    test('maneja texto vacio', () => {
      expect(sanitizarHtml('')).toBe('');
    });
  });
});
