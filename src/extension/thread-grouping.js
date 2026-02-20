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
    groupHeader: function(value, count, data) {
      var interlocutor = '';
      var asunto = '';
      var fecha = '';
      if (data && data.length > 0) {
        var primero = data[0];
        interlocutor = primero.interlocutor || primero.emailRemitente || '';
        asunto = primero.asunto || '';
        if (asunto.length > 60) asunto = asunto.substring(0, 60) + '...';
        if (primero.fechaCorreo) {
          var d = new Date(primero.fechaCorreo);
          if (!isNaN(d.getTime())) {
            fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          }
        }
      }
      var partes = ['Hilo (' + count + ')'];
      if (fecha) partes.push(fecha);
      if (interlocutor) partes.push(interlocutor);
      if (asunto) partes.push(asunto);
      return partes.join(' — ');
    }
  };
}

function toggleAgrupacion(estadoActual) {
  return !estadoActual;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { obtenerConfigAgrupacion, toggleAgrupacion };
}
