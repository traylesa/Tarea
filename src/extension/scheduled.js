// === TareaLog — Logica pura de envios programados ===

var ESTADOS_PROGRAMADO = {
  PENDIENTE:  { icono: '\u23F3', clase: 'prog-pendiente',  texto: 'Pendiente' },
  ENVIADO:    { icono: '\u2705', clase: 'prog-enviado',    texto: 'Enviado' },
  ERROR:      { icono: '\u274C', clase: 'prog-error',      texto: 'Error' },
  CANCELADO:  { icono: '\u26D4', clase: 'prog-cancelado',  texto: 'Cancelado' }
};

function formatearEstadoProgramado(estado) {
  var info = ESTADOS_PROGRAMADO[estado] || { icono: '\u2753', clase: '', texto: estado || 'Desconocido' };
  return { icono: info.icono, clase: info.clase, texto: info.texto, html: info.icono + ' ' + info.texto };
}

function filtrarProgramados(lista, filtro) {
  if (!filtro || filtro === 'TODOS') return lista;
  return lista.filter(function(p) { return p.estado === filtro; });
}

function ordenarPorFechaProgramada(lista) {
  return lista.slice().sort(function(a, b) {
    var fa = a.fechaProgramada ? new Date(a.fechaProgramada).getTime() : 0;
    var fb = b.fechaProgramada ? new Date(b.fechaProgramada).getTime() : 0;
    return fb - fa;
  });
}

function formatearFechaCorta(isoString) {
  if (!isoString) return '--';
  var d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function contarPorEstado(lista) {
  var conteo = { PENDIENTE: 0, ENVIADO: 0, ERROR: 0, CANCELADO: 0 };
  lista.forEach(function(p) {
    if (conteo[p.estado] !== undefined) conteo[p.estado]++;
  });
  return conteo;
}

if (typeof module !== 'undefined') {
  module.exports = {
    ESTADOS_PROGRAMADO: ESTADOS_PROGRAMADO,
    formatearEstadoProgramado: formatearEstadoProgramado,
    filtrarProgramados: filtrarProgramados,
    ordenarPorFechaProgramada: ordenarPorFechaProgramada,
    formatearFechaCorta: formatearFechaCorta,
    contarPorEstado: contarPorEstado
  };
}
