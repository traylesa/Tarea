const {
  obtenerConfigAgrupacion,
  toggleAgrupacion
} = require('../../../src/extension/thread-grouping');

describe('thread-grouping', () => {
  describe('obtenerConfigAgrupacion', () => {
    test('retorna config con groupBy cuando activa', () => {
      const config = obtenerConfigAgrupacion(true);

      expect(config.groupBy).toBe('threadId');
      expect(config.groupStartOpen).toBe(false);
      expect(config.groupHeader).toBeInstanceOf(Function);
    });

    test('retorna config sin groupBy cuando inactiva', () => {
      const config = obtenerConfigAgrupacion(false);

      expect(config.groupBy).toBeUndefined();
    });

    test('groupHeader genera texto con conteo', () => {
      const config = obtenerConfigAgrupacion(true);
      const header = config.groupHeader('thread_abc', 3, []);

      expect(header).toContain('3');
    });

    test('groupHeader muestra fecha, interlocutor y asunto del primer registro', () => {
      const config = obtenerConfigAgrupacion(true);
      const data = [
        { interlocutor: 'Garcia', asunto: 'Carga 12345', emailRemitente: 'garcia@test.com', fechaCorreo: '2026-02-15T10:00:00Z' },
        { interlocutor: 'Lopez', asunto: 'Otro asunto', emailRemitente: 'lopez@test.com', fechaCorreo: '2026-02-14T08:00:00Z' }
      ];
      const header = config.groupHeader('thread_abc', 2, data);

      expect(header).toContain('Garcia');
      expect(header).toContain('Carga 12345');
      expect(header).toContain('2');
      expect(header).toMatch(/\d{1,2}\/\d{1,2}/);
    });

    test('groupHeader omite fecha si fechaCorreo no existe', () => {
      const config = obtenerConfigAgrupacion(true);
      const data = [{ interlocutor: 'Garcia', asunto: 'Test' }];
      const header = config.groupHeader('t1', 1, data);

      expect(header).toContain('Garcia');
      expect(header).toContain('Test');
    });

    test('groupHeader usa emailRemitente si no hay interlocutor', () => {
      const config = obtenerConfigAgrupacion(true);
      const data = [{ emailRemitente: 'garcia@test.com', asunto: 'Test' }];
      const header = config.groupHeader('t1', 1, data);

      expect(header).toContain('garcia@test.com');
    });

    test('groupHeader trunca asunto largo a 60 caracteres', () => {
      const config = obtenerConfigAgrupacion(true);
      const asuntoLargo = 'A'.repeat(80);
      const data = [{ interlocutor: 'X', asunto: asuntoLargo }];
      const header = config.groupHeader('t1', 1, data);

      expect(header).not.toContain(asuntoLargo);
      expect(header).toContain('...');
    });
  });

  describe('toggleAgrupacion', () => {
    test('cambia true a false', () => {
      expect(toggleAgrupacion(true)).toBe(false);
    });

    test('cambia false a true', () => {
      expect(toggleAgrupacion(false)).toBe(true);
    });
  });
});
