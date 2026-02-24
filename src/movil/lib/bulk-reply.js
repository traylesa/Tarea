/**
 * bulk-reply.js - Construccion de payload para respuesta masiva
 * Logica pura sin dependencias DOM/fetch.
 */

function interpolarTexto(texto, vars) {
  if (!texto) return texto;
  return texto.replace(/\{\{(\w+)\}\}/g, (match, nombre) => {
    return vars.hasOwnProperty(nombre) ? String(vars[nombre]) : match;
  });
}

function construirPayload(registros, plantilla) {
  const destinatarios = registros.map(reg => {
    const vars = {
      codCar: reg.codCar,
      nombreTransportista: reg.nombreTransportista,
      codTra: reg.codTra,
      emailRemitente: reg.emailRemitente,
      interlocutor: reg.interlocutor || '',
      asunto: reg.asunto,
      fechaCorreo: reg.fechaCorreo,
      estado: reg.estado,
      tipoTarea: reg.tipoTarea
    };

    const asunto = interpolarTexto(plantilla.asunto, vars);
    const cuerpoInterpolado = interpolarTexto(plantilla.cuerpo, vars);
    const firma = plantilla.firma || '';
    const cuerpo = cuerpoInterpolado + firma;

    return {
      email: reg.emailRemitente,
      interlocutor: reg.interlocutor || reg.emailRemitente || '',
      threadId: reg.threadId,
      asunto,
      cuerpo
    };
  });

  return { destinatarios };
}

function validarSeleccion(registros) {
  if (!registros || !Array.isArray(registros) || registros.length === 0) {
    return { valido: false, error: 'Selecciona al menos un correo para responder' };
  }
  return { valido: true };
}

function generarPrevisualizacion(registros, plantilla, sanitizar) {
  if (!registros || registros.length === 0) {
    return { asuntoPreview: '', cuerpoPreview: '' };
  }

  const primer = registros[0];
  const vars = {
    codCar: primer.codCar,
    nombreTransportista: primer.nombreTransportista,
    codTra: primer.codTra,
    emailRemitente: primer.emailRemitente,
    interlocutor: primer.interlocutor || '',
    asunto: primer.asunto,
    fechaCorreo: primer.fechaCorreo,
    estado: primer.estado,
    tipoTarea: primer.tipoTarea
  };

  const asuntoPreview = interpolarTexto(plantilla.asunto, vars);
  const cuerpoInterpolado = interpolarTexto(plantilla.cuerpo, vars);
  const firma = plantilla.firma || '';
  const cuerpoPreview = sanitizar(cuerpoInterpolado + firma);

  return { asuntoPreview, cuerpoPreview };
}

function obtenerFirmasDisponibles(plantillas) {
  if (!plantillas || !Array.isArray(plantillas)) return [];
  return plantillas
    .filter(p => p.firma && p.firma.trim() !== '')
    .map(p => ({ id: p.id, alias: p.alias, firma: p.firma }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { construirPayload, validarSeleccion, generarPrevisualizacion, obtenerFirmasDisponibles };
}
