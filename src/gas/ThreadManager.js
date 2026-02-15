function createThreadManager() {
  const cache = new Map();

  function mapThreadToLoad(threadId, codCar) {
    cache.set(threadId, codCar);
  }

  function getLoadFromThread(threadId) {
    if (!threadId) return null;
    return cache.get(threadId) ?? null;
  }

  function hasThread(threadId) {
    return cache.has(threadId);
  }

  function getAllMappings() {
    return Array.from(cache.entries()).map(([threadId, codCar]) => ({
      threadId,
      codCar
    }));
  }

  return { mapThreadToLoad, getLoadFromThread, hasThread, getAllMappings };
}

if (typeof module !== 'undefined') module.exports = { createThreadManager };
