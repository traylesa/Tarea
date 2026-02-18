/**
 * action-log.js - Historial de acciones por carga
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 5: Historial de acciones
 */

var TIPOS_ACCION = ['EMAIL', 'FASE', 'RECORDATORIO', 'NOTA'];
var MAX_ENTRADAS_POR_CARGA = 200;

function _generarIdHist() {
  return 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function _copiarAlmacen(almacen) {
  var copia = {};
  if (almacen) {
    Object.keys(almacen).forEach(function(k) {
      copia[k] = almacen[k].slice();
    });
  }
  return copia;
}

function registrarAccion(tipo, codCar, descripcion, almacen, ahora) {
  if (TIPOS_ACCION.indexOf(tipo) === -1) {
    throw new Error('Tipo de accion no valido: ' + tipo);
  }
  if (!descripcion || !descripcion.trim()) {
    throw new Error('La descripcion es obligatoria');
  }
  if (isNaN(Number(codCar))) {
    throw new Error('codCar debe ser numerico');
  }

  var clave = String(codCar);
  var entrada = {
    id: _generarIdHist(),
    tipo: tipo,
    codCar: clave,
    descripcion: descripcion.trim(),
    fechaCreacion: ahora.toISOString()
  };

  var nuevoAlmacen = _copiarAlmacen(almacen);
  if (!nuevoAlmacen[clave]) nuevoAlmacen[clave] = [];
  nuevoAlmacen[clave].push(entrada);

  return { almacen: nuevoAlmacen, entrada: entrada };
}

function obtenerHistorial(codCar, almacen) {
  if (!almacen) return [];
  var clave = String(codCar);
  var entradas = almacen[clave];
  if (!entradas || !Array.isArray(entradas)) return [];

  return entradas.slice().sort(function(a, b) {
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });
}

function filtrarPorTipo(historial, tipo) {
  if (!historial) return [];
  if (!tipo) return historial.slice();

  return historial.filter(function(e) {
    return e.tipo === tipo;
  });
}

function rotarHistorial(almacen, diasMax, ahora) {
  if (!almacen) return {};

  var limiteMs = diasMax * MS_POR_DIA;
  var ahoraMs = ahora.getTime();
  var nuevoAlmacen = {};

  Object.keys(almacen).forEach(function(clave) {
    nuevoAlmacen[clave] = almacen[clave].filter(function(e) {
      return (ahoraMs - new Date(e.fechaCreacion).getTime()) <= limiteMs;
    });
  });

  return nuevoAlmacen;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registrarAccion: registrarAccion,
    obtenerHistorial: obtenerHistorial,
    filtrarPorTipo: filtrarPorTipo,
    rotarHistorial: rotarHistorial,
    TIPOS_ACCION: TIPOS_ACCION,
    MAX_ENTRADAS_POR_CARGA: MAX_ENTRADAS_POR_CARGA
  };
}
