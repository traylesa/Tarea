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
    // Tags seguros preservados
    test('preserva tags de formato basico', () => {
      const html = '<p>Hola <strong>mundo</strong> <em>test</em></p>';
      expect(sanitizarHtml(html)).toBe('<p>Hola <strong>mundo</strong> <em>test</em></p>');
    });

    test('preserva tags de lista', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizarHtml(html)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    test('preserva tags de tabla', () => {
      const html = '<table><tr><td>Celda</td></tr></table>';
      expect(sanitizarHtml(html)).toBe('<table><tr><td>Celda</td></tr></table>');
    });

    test('preserva enlaces con href https', () => {
      const html = '<a href="https://example.com">Link</a>';
      expect(sanitizarHtml(html)).toBe('<a href="https://example.com">Link</a>');
    });

    test('preserva imagenes con src https', () => {
      const html = '<img src="https://example.com/img.png" alt="foto">';
      expect(sanitizarHtml(html)).toContain('src="https://example.com/img.png"');
      expect(sanitizarHtml(html)).toContain('alt="foto"');
    });

    test('preserva br y hr', () => {
      expect(sanitizarHtml('<br>')).toBe('<br>');
      expect(sanitizarHtml('<hr>')).toBe('<hr>');
    });

    test('preserva atributos class y style', () => {
      const html = '<span class="rojo" style="color:red">Texto</span>';
      expect(sanitizarHtml(html)).toBe('<span class="rojo" style="color:red">Texto</span>');
    });

    // Tags peligrosos eliminados
    test('elimina script con contenido', () => {
      const html = '<p>Hola</p><script>alert("xss")</script>';
      expect(sanitizarHtml(html)).toBe('<p>Hola</p>');
    });

    test('elimina iframe', () => {
      const html = '<p>Texto</p><iframe src="evil.com"></iframe>';
      expect(sanitizarHtml(html)).toBe('<p>Texto</p>');
    });

    test('elimina object', () => {
      const html = '<object data="malware.swf"></object><p>OK</p>';
      expect(sanitizarHtml(html)).toBe('<p>OK</p>');
    });

    test('elimina embed', () => {
      const html = '<embed src="bad.swf"><p>OK</p>';
      expect(sanitizarHtml(html)).toBe('<p>OK</p>');
    });

    test('elimina form', () => {
      const html = '<form action="evil"><input type="text"></form>';
      expect(sanitizarHtml(html)).not.toContain('<form');
    });

    test('elimina style tag (no atributo)', () => {
      const html = '<style>body{display:none}</style><p>Visible</p>';
      expect(sanitizarHtml(html)).toBe('<p>Visible</p>');
    });

    // Atributos peligrosos
    test('elimina atributos onclick', () => {
      const html = '<p onclick="alert(1)">Click</p>';
      expect(sanitizarHtml(html)).toBe('<p>Click</p>');
    });

    test('elimina atributos onerror', () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = sanitizarHtml(html);
      expect(result).not.toContain('onerror');
      expect(result).toContain('<img');
    });

    test('elimina atributos on* sin comillas', () => {
      const html = '<p onmouseover=alert(1)>Hover</p>';
      expect(sanitizarHtml(html)).not.toContain('onmouseover');
    });

    // URLs peligrosas
    test('elimina href javascript:', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizarHtml(html);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Click');
    });

    test('elimina href data:', () => {
      const html = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
      const result = sanitizarHtml(html);
      expect(result).not.toContain('data:');
    });

    test('elimina src javascript:', () => {
      const html = '<img src="javascript:alert(1)">';
      expect(sanitizarHtml(html)).not.toContain('javascript:');
    });

    // Casos borde
    test('maneja null', () => {
      expect(sanitizarHtml(null)).toBe('');
    });

    test('maneja undefined', () => {
      expect(sanitizarHtml(undefined)).toBe('');
    });

    test('maneja texto vacio', () => {
      expect(sanitizarHtml('')).toBe('');
    });

    test('maneja texto plano sin HTML', () => {
      expect(sanitizarHtml('Hola mundo')).toBe('Hola mundo');
    });

    test('maneja tags desconocidos conservando contenido', () => {
      const html = '<custom>Texto interno</custom>';
      const result = sanitizarHtml(html);
      expect(result).toContain('Texto interno');
      expect(result).not.toContain('<custom');
    });
  });
});
