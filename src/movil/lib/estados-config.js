/**
 * estados-config.js - Logica pura para estados configurables.
 * Sin dependencias DOM. Testeable unitariamente.
 */

const CLASES_CSS_ESTADOS_VALIDAS = ['', 'estado-ok', 'estado-alerta', 'estado-admin', 'estado-sin'];

function getDefaultEstados() {
  return [
    { codigo: 'ENVIADO',     nombre: 'Enviado',     icono: '\u{1F7E2}', clase_css: 'estado-ok',     orden: 1, activo: true },
    { codigo: 'RECIBIDO',    nombre: 'Recibido',    icono: '\u{1F7E2}', clase_css: 'estado-ok',     orden: 2, activo: true },
    { codigo: 'GESTIONADO',  nombre: 'Gestionado',  icono: '\u{1F7E2}', clase_css: 'estado-ok',     orden: 3, activo: true },
    { codigo: 'ALERTA',      nombre: 'Alerta',      icono: '\u{1F534}', clase_css: 'estado-alerta', orden: 4, activo: true }
  ];
}

function validarEstados(estados) {
  var errores = [];

  if (!Array.isArray(estados) || estados.length === 0) {
    return { valido: false, errores: ['Debe haber al menos un estado'] };
  }

  var codigos = {};
  var ordenes = {};

  for (var i = 0; i < estados.length; i++) {
    var e = estados[i];
    if (!e.codigo || !e.codigo.trim()) {
      errores.push('Estado en posicion ' + i + ': el codigo es obligatorio');
    }
    if (codigos[e.codigo]) {
      errores.push('Codigo duplicado: "' + e.codigo + '"');
    }
    codigos[e.codigo] = true;

    if (ordenes[e.orden]) {
      errores.push('Orden duplicado: ' + e.orden);
    }
    ordenes[e.orden] = true;

    if (CLASES_CSS_ESTADOS_VALIDAS.indexOf(e.clase_css) === -1) {
      errores.push('Clase CSS invalida: "' + e.clase_css + '"');
    }
  }

  return { valido: errores.length === 0, errores: errores };
}

function obtenerEstadoPorCodigo(estados, codigo) {
  for (var i = 0; i < estados.length; i++) {
    if (estados[i].codigo === codigo) return estados[i];
  }
  return null;
}

function obtenerEstadosOrdenados(estados) {
  return estados.slice().sort(function(a, b) { return a.orden - b.orden; });
}

function estadosAMapaEditor(estados) {
  var mapa = {};
  obtenerEstadosOrdenados(estados)
    .filter(function(e) { return e.activo; })
    .forEach(function(e) { mapa[e.codigo] = e.icono + ' ' + e.nombre; });
  return mapa;
}

function estadosAListaHeaderFilter(estados) {
  var lista = [''];
  obtenerEstadosOrdenados(estados)
    .filter(function(e) { return e.activo; })
    .forEach(function(e) { lista.push(e.codigo); });
  return lista;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDefaultEstados, validarEstados, obtenerEstadoPorCodigo,
    obtenerEstadosOrdenados, estadosAMapaEditor, estadosAListaHeaderFilter,
    CLASES_CSS_ESTADOS_VALIDAS
  };
}
