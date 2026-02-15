// === TareaLog — Adaptador Gmail (GAS) ===

var _idsYaProcesados = new Set();

function cargarIdsProcesados(idsExistentes) {
  _idsYaProcesados = new Set();
  if (idsExistentes && idsExistentes.length) {
    idsExistentes.forEach(function(id) { _idsYaProcesados.add(id); });
  }
  Logger.log('IDs ya procesados cargados: ' + _idsYaProcesados.size);
}

function obtenerMensajesNuevos(ultimoTimestamp) {
  const query = _construirQuery(ultimoTimestamp);
  Logger.log('Gmail query: ' + query);
  const threads = _buscarThreads(query);
  if (!threads) {
    Logger.log('No se encontraron threads (null/error)');
    return [];
  }

  Logger.log('Threads encontrados: ' + threads.length);
  const mensajes = [];
  var saltados = 0;
  for (const thread of threads) {
    for (const msg of thread.getMessages()) {
      const id = msg.getId();
      if (_idsYaProcesados.has(id)) {
        saltados++;
        continue;
      }
      _idsYaProcesados.add(id);
      mensajes.push(construirMensaje(msg));
    }
  }
  Logger.log('Mensajes nuevos: ' + mensajes.length + ', saltados (ya procesados): ' + saltados);
  return mensajes;
}

function construirMensaje(gmailMessage) {
  var thread = gmailMessage.getThread();
  return {
    messageId: gmailMessage.getId(),
    threadId: thread.getId(),
    mensajesEnHilo: thread.getMessageCount(),
    from: gmailMessage.getFrom(),
    to: gmailMessage.getTo(),
    cc: gmailMessage.getCc() || '',
    bcc: gmailMessage.getBcc() || '',
    subject: gmailMessage.getSubject(),
    body: gmailMessage.getPlainBody(),
    date: gmailMessage.getDate().toISOString(),
    attachments: gmailMessage.getAttachments().map(a => a.getName())
  };
}

function enviarRespuesta(threadId, asunto, cuerpo, destinatarios, emailsPropios) {
  if (!threadId || !cuerpo) return null;

  // emailsPropios es un mapa {email: true} con cuenta + aliases
  var propios = emailsPropios || {};

  try {
    var thread = GmailApp.getThreadById(threadId);
    if (!thread) return null;

    var mensajes = thread.getMessages();
    var asuntoFinal = _asegurarPrefijo(asunto || thread.getFirstMessageSubject());

    // FASE 1: Interlocutor = ultimo remitente que NO sea yo (cuenta ni alias)
    var interlocutor = '';
    for (var i = mensajes.length - 1; i >= 0; i--) {
      var fromEmail = _extraerEmail(mensajes[i].getFrom());
      if (fromEmail && !propios[fromEmail]) {
        interlocutor = fromEmail;
        break;
      }
    }
    if (!interlocutor) {
      interlocutor = _extraerEmail(mensajes[0].getFrom());
    }
    Logger.log('FASE 1 - Interlocutor (TO): ' + interlocutor);
    Logger.log('Emails propios: ' + Object.keys(propios).join(', '));

    // FASE 2: Recopilar TODOS los emails de los registros
    var todosEmails = [];
    if (destinatarios) {
      todosEmails = [].concat(
        _parsearEmails(destinatarios.to),
        _parsearEmails(destinatarios.cc)
      );
    }

    // FASE 3: Deduplicar, quitar TODOS los propios + interlocutor (ya va en TO)
    var vistos = {};
    Object.keys(propios).forEach(function(p) { vistos[p] = true; });
    vistos[interlocutor] = true;
    var ccLimpio = [];
    todosEmails.forEach(function(e) {
      if (!vistos[e]) {
        vistos[e] = true;
        ccLimpio.push(e);
      }
    });
    Logger.log('FASE 3 - CC: ' + (ccLimpio.length > 0 ? ccLimpio.join(', ') : '(ninguno)'));

    // FASE 4: Enviar con control total de destinatarios
    if (!interlocutor || propios[interlocutor]) {
      Logger.log('ABORTADO: interlocutor es propio o vacio');
      return null;
    }

    var opciones = { htmlBody: cuerpo };
    if (ccLimpio.length > 0) opciones.cc = ccLimpio.join(', ');
    if (destinatarios && destinatarios.bcc) opciones.bcc = destinatarios.bcc;

    GmailApp.sendEmail(interlocutor, asuntoFinal, '', opciones);
    Logger.log('Enviado OK a ' + interlocutor + (ccLimpio.length > 0 ? ' CC: ' + ccLimpio.join(', ') : ''));

    return threadId;
  } catch (e) {
    Logger.log('Error enviando respuesta a hilo ' + threadId + ': ' + e.message);
    return null;
  }
}

function _extraerEmail(texto) {
  if (!texto) return '';
  var match = texto.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase().trim() : texto.toLowerCase().trim();
}

// --- Funciones internas ---

function _construirQuery(ultimoTimestamp) {
  var base = (typeof obtenerGmailQuery === 'function') ? obtenerGmailQuery() : GMAIL_QUERY_DEFAULT;

  if (!ultimoTimestamp) return base;

  var fecha = new Date(ultimoTimestamp);
  var yyyy = fecha.getFullYear();
  var mm = String(fecha.getMonth() + 1).padStart(2, '0');
  var dd = String(fecha.getDate()).padStart(2, '0');
  return base + ' after:' + yyyy + '/' + mm + '/' + dd;
}

function _buscarThreads(query) {
  try {
    return GmailApp.search(query);
  } catch (e) {
    Logger.log('Error buscando threads: ' + e.message);
    return null;
  }
}

function _asegurarPrefijo(asunto) {
  if (!asunto) return 'Re: (sin asunto)';
  return asunto.startsWith('Re:') ? asunto : 'Re: ' + asunto;
}
