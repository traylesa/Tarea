/**
 * estados-config.js - Logica pura para estados configurables.
 * Sin dependencias DOM. Testeable unitariamente.
 *
 * 7 estados con iconos UNICOS por forma (accesibilidad daltonismo)
 * y colores distintos para escaneo rapido de 300+ cards.
 */

var CLASES_CSS_ESTADOS_VALIDAS = [
  '', 'estado-nuevo', 'estado-enviado', 'estado-recibido',
  'estado-pendiente', 'estado-gestionado', 'estado-alerta', 'estado-cerrado'
];

function getDefaultEstados() {
  return [
    { codigo: 'NUEVO',      nombre: 'Nuevo',      icono: '\u25CF', abreviatura: 'NUE', clase_css: 'estado-nuevo',      orden: 1, activo: true },
    { codigo: 'ENVIADO',    nombre: 'Enviado',     icono: '\u2197', abreviatura: 'ENV', clase_css: 'estado-enviado',    orden: 2, activo: true },
    { codigo: 'RECIBIDO',   nombre: 'Recibido',    icono: '\u2199', abreviatura: 'REC', clase_css: 'estado-recibido',   orden: 3, activo: true },
    { codigo: 'PENDIENTE',  nombre: 'Pendiente',   icono: '\u25D4', abreviatura: 'PEN', clase_css: 'estado-pendiente',  orden: 4, activo: true },
    { codigo: 'GESTIONADO', nombre: 'Gestionado',  icono: '\u2713', abreviatura: 'GES', clase_css: 'estado-gestionado', orden: 5, activo: true },
    { codigo: 'ALERTA',     nombre: 'Alerta',      icono: '\u25B2', abreviatura: 'ALE', clase_css: 'estado-alerta',     orden: 6, activo: true },
    { codigo: 'CERRADO',    nombre: 'Cerrado',     icono: '\u2714', abreviatura: 'CER', clase_css: 'estado-cerrado',    orden: 7, activo: true }
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
