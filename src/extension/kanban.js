/**
 * kanban.js - Logica pura del tablero Kanban
 * Sin DOM, sin Chrome API. Testeable unitariamente.
 */

var COLUMNAS_KANBAN = [
  { id: 'sin_fase',    nombre: 'Sin Fase',    fases: [],              orden: 0 },
  { id: 'espera',      nombre: 'Espera',      fases: ['00','01','02'], orden: 1 },
  { id: 'carga',       nombre: 'Carga',       fases: ['11','12'],     orden: 2 },
  { id: 'en_ruta',     nombre: 'En Ruta',     fases: ['19'],          orden: 3 },
  { id: 'descarga',    nombre: 'Descarga',    fases: ['21','22'],     orden: 4 },
  { id: 'vacio',       nombre: 'Vacio',       fases: ['29'],          orden: 5 },
  { id: 'incidencia',  nombre: 'Incidencia',  fases: ['05','25'],     orden: 6 },
  { id: 'documentado', nombre: 'Documentado', fases: ['30'],          orden: 7 }
];

// Mapa inverso fase→columnaId (construido desde COLUMNAS_KANBAN)
var _FASE_A_COLUMNA = {};
COLUMNAS_KANBAN.forEach(function(col) {
  col.fases.forEach(function(f) { _FASE_A_COLUMNA[f] = col.id; });
});

function deduplicarPorCarga(registros) {
  if (!registros || !registros.length) return [];
  var mapa = {};
  var sinCodCar = [];

  registros.forEach(function(r) {
    var cod = r.codCar;
    if (!cod && cod !== 0) {
      sinCodCar.push(r);
      return;
    }
    var existente = mapa[cod];
    if (!existente || r.fechaCorreo > existente.fechaCorreo) {
      mapa[cod] = r;
    }
  });

  var resultado = [];
  Object.keys(mapa).forEach(function(k) { resultado.push(mapa[k]); });
  return resultado.concat(sinCodCar);
}

function agruparPorColumna(registros) {
  var grupos = {};
  COLUMNAS_KANBAN.forEach(function(col) { grupos[col.id] = []; });

  registros.forEach(function(r) {
    var fase = r.fase;
    var columna = fase ? _FASE_A_COLUMNA[fase] : null;
    if (columna) {
      grupos[columna].push(r);
    } else {
      grupos.sin_fase.push(r);
    }
  });

  return grupos;
}

function agruparPorEstado(registrosColumna, estados) {
  var resultado = {};
  estados.forEach(function(e) { resultado[e] = []; });
  resultado.OTRO = [];

  registrosColumna.forEach(function(r) {
    var estado = r.estado;
    if (estado && resultado[estado] !== undefined && estado !== 'OTRO') {
      resultado[estado].push(r);
    } else {
      resultado.OTRO.push(r);
    }
  });

  return resultado;
}

function resolverColumnaDestino(faseActual) {
  if (!faseActual) return null;
  return _FASE_A_COLUMNA[faseActual] || null;
}

function resolverFaseAlMover(columnaDestinoId, faseActual) {
  if (columnaDestinoId === 'sin_fase') return '';

  var columna = COLUMNAS_KANBAN.find(function(c) { return c.id === columnaDestinoId; });
  if (!columna) return null;

  var faseNorm = String(faseActual).padStart(2, '0');

  // Si la fase actual ya pertenece al grupo destino, no cambia
  if (columna.fases.indexOf(faseNorm) !== -1) return faseNorm;

  // Asignar primera fase del grupo destino
  return columna.fases[0];
}

function calcularConteos(registrosAgrupados) {
  var conteos = {};
  var claves = Object.keys(registrosAgrupados);

  claves.forEach(function(clave) {
    var lista = registrosAgrupados[clave];
    var porEstado = {};
    lista.forEach(function(r) {
      var est = r.estado || 'SIN_ESTADO';
      porEstado[est] = (porEstado[est] || 0) + 1;
    });
    conteos[clave] = { total: lista.length, porEstado: porEstado };
  });

  return conteos;
}

function calcularConteosDual(agrupadosFiltrados, agrupadosTotales) {
  var conteos = {};
  var claves = Object.keys(agrupadosTotales);

  claves.forEach(function(clave) {
    var listaTotal = agrupadosTotales[clave] || [];
    var listaFiltrada = agrupadosFiltrados[clave] || [];

    var porEstadoTotal = {};
    listaTotal.forEach(function(r) {
      var est = r.estado || 'SIN_ESTADO';
      porEstadoTotal[est] = (porEstadoTotal[est] || 0) + 1;
    });

    var porEstadoFiltrado = {};
    listaFiltrada.forEach(function(r) {
      var est = r.estado || 'SIN_ESTADO';
      porEstadoFiltrado[est] = (porEstadoFiltrado[est] || 0) + 1;
    });

    conteos[clave] = {
      filtrado: listaFiltrada.length,
      total: listaTotal.length,
      porEstadoFiltrado: porEstadoFiltrado,
      porEstadoTotal: porEstadoTotal
    };
  });

  return conteos;
}

function formatearConteo(filtrado, total, hayFiltros) {
  if (!hayFiltros) return String(total);
  return filtrado + '/' + total;
}

function obtenerSeleccionEstadoColumna(regsColumna, seleccionadosMap) {
  var total = regsColumna.length;
  if (total === 0) return { total: 0, seleccionados: 0, estado: 'ninguno' };
  var mapa = seleccionadosMap || {};
  var numSel = regsColumna.filter(function(r) { return !!mapa[r.messageId]; }).length;
  var estado = numSel === 0 ? 'ninguno' : numSel === total ? 'todos' : 'parcial';
  return { total: total, seleccionados: numSel, estado: estado };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLUMNAS_KANBAN: COLUMNAS_KANBAN,
    deduplicarPorCarga: deduplicarPorCarga,
    agruparPorColumna: agruparPorColumna,
    agruparPorEstado: agruparPorEstado,
    resolverColumnaDestino: resolverColumnaDestino,
    resolverFaseAlMover: resolverFaseAlMover,
    calcularConteos: calcularConteos,
    calcularConteosDual: calcularConteosDual,
    formatearConteo: formatearConteo,
    obtenerSeleccionEstadoColumna: obtenerSeleccionEstadoColumna
  };
}
