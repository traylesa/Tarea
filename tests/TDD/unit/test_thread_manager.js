const { createThreadManager } = require('../../../src/gas/ThreadManager');

describe('ThreadManager', () => {
  let manager;

  beforeEach(() => {
    manager = createThreadManager();
  });

  describe('mapThreadToLoad', () => {
    test('vincula threadId a CODCAR', () => {
      manager.mapThreadToLoad('thread_001', 168345);
      expect(manager.getLoadFromThread('thread_001')).toBe(168345);
    });

    test('sobreescribe vinculacion existente', () => {
      manager.mapThreadToLoad('thread_001', 168345);
      manager.mapThreadToLoad('thread_001', 168346);
      expect(manager.getLoadFromThread('thread_001')).toBe(168346);
    });

    test('soporta multiples hilos independientes', () => {
      manager.mapThreadToLoad('thread_001', 168345);
      manager.mapThreadToLoad('thread_002', 168346);
      expect(manager.getLoadFromThread('thread_001')).toBe(168345);
      expect(manager.getLoadFromThread('thread_002')).toBe(168346);
    });
  });

  describe('getLoadFromThread', () => {
    test('retorna null para hilo sin vincular', () => {
      expect(manager.getLoadFromThread('thread_999')).toBeNull();
    });

    test('retorna null para null', () => {
      expect(manager.getLoadFromThread(null)).toBeNull();
    });

    test('retorna null para string vacio', () => {
      expect(manager.getLoadFromThread('')).toBeNull();
    });
  });

  describe('hasThread', () => {
    test('retorna true para hilo vinculado', () => {
      manager.mapThreadToLoad('thread_001', 168345);
      expect(manager.hasThread('thread_001')).toBe(true);
    });

    test('retorna false para hilo no vinculado', () => {
      expect(manager.hasThread('thread_999')).toBe(false);
    });
  });

  describe('getAllMappings', () => {
    test('retorna todas las vinculaciones', () => {
      manager.mapThreadToLoad('t1', 100);
      manager.mapThreadToLoad('t2', 200);
      const mappings = manager.getAllMappings();
      expect(mappings).toHaveLength(2);
      expect(mappings).toContainEqual({ threadId: 't1', codCar: 100 });
      expect(mappings).toContainEqual({ threadId: 't2', codCar: 200 });
    });

    test('retorna array vacio sin vinculaciones', () => {
      expect(manager.getAllMappings()).toEqual([]);
    });
  });
});
