/**
 * thread-grouping.js - Configuracion de agrupacion por hilos
 * Logica pura para generar config Tabulator groupBy.
 */

function obtenerConfigAgrupacion(activa) {
  if (!activa) {
    return {};
  }

  return {
    groupBy: 'threadId',
    groupStartOpen: false,
    groupHeader: (value, count) => {
      return `Hilo: ${value} (${count} mensaje${count !== 1 ? 's' : ''})`;
    }
  };
}

function toggleAgrupacion(estadoActual) {
  return !estadoActual;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { obtenerConfigAgrupacion, toggleAgrupacion };
}
