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

    test('groupHeader genera texto descriptivo', () => {
      const config = obtenerConfigAgrupacion(true);
      const header = config.groupHeader('thread_abc', 3);

      expect(header).toContain('thread_abc');
      expect(header).toContain('3');
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
