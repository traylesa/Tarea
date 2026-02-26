// === TareaLog — Adaptador Gmail (GAS) ===

var _idsYaProcesados = new Set();

function cargarIdsProcesados(idsExistentes) {
  _idsYaProcesados = new Set();
  if (idsExistentes && idsExistentes.length) {
    idsExistentes.forEach(function(id) { _idsYaProcesados.add(id); });
  }
  Logger.log('IDs ya procesados cargados: ' + _idsYaProcesados.size);
}

function obtenerMensajesNuevos(ultimoTimestamp, limite) {
  var maxMensajes = limite || 0;
  const query = _construirQuery(ultimoTimestamp);
  Logger.log('Gmail query: ' + query + (maxMensajes ? ' (limite: ' + maxMensajes + ')' : ''));
  const threads = _buscarThreads(query);
  if (!threads) {
    Logger.log('No se encontraron threads (null/error)');
    return [];
  }

  Logger.log('Threads encontrados: ' + threads.length);
  const mensajes = [];
  var saltados = 0;
  for (const thread of threads) {
    if (maxMensajes && mensajes.length >= maxMensajes) break;
    for (const msg of thread.getMessages()) {
      if (maxMensajes && mensajes.length >= maxMensajes) break;
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
  var labels = thread.getLabels().map(function(l) { return l.getName(); });
  var bandeja = labels.length > 0 ? labels.join(', ') : (thread.isInInbox() ? 'INBOX' : 'OTRO');
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
    date: fechaLocalISO(gmailMessage.getDate()),
    attachments: gmailMessage.getAttachments().map(a => a.getName()),
    bandeja: bandeja
  };
}

function enviarRespuesta(threadId, asunto, cuerpo, destinatarios, emailsPropios) {
  if (!threadId || !cuerpo) return null;
  var propios = emailsPropios || {};

  try {
    var thread = GmailApp.getThreadById(threadId);
    if (!thread) return null;

    var mensajes = thread.getMessages();
    var asuntoFinal = _asegurarPrefijo(asunto || thread.getFirstMessageSubject());

    // Buscar ultimo mensaje que NO sea nuestro (es al que respondemos)
    var mensajeReply = mensajes[mensajes.length - 1];
    var interlocutor = '';
    for (var i = mensajes.length - 1; i >= 0; i--) {
      var from = _extraerEmail(mensajes[i].getFrom());
      if (from && !propios[from]) {
        mensajeReply = mensajes[i];
        interlocutor = from;
        break;
      }
    }

    // TO explicito tiene prioridad (respuesta masiva puede especificarlo)
    if (destinatarios && destinatarios.to) {
      var toExpl = _parsearEmails(destinatarios.to).filter(function(e) { return !propios[e]; });
      if (toExpl.length > 0) interlocutor = toExpl[0];
    }
    if (!interlocutor) interlocutor = _extraerEmail(mensajes[0].getFrom());
    if (!interlocutor || propios[interlocutor]) return null;

    // CC: deduplicar quitando propios + interlocutor
    var vistos = {};
    Object.keys(propios).forEach(function(p) { vistos[p] = true; });
    vistos[interlocutor] = true;
    var ccLimpio = [];
    if (destinatarios) {
      [].concat(_parsearEmails(destinatarios.to), _parsearEmails(destinatarios.cc)).forEach(function(e) {
        if (!vistos[e]) { vistos[e] = true; ccLimpio.push(e); }
      });
    }

    // Reply al mensaje — mantiene In-Reply-To/References automaticamente
    var opciones = { htmlBody: cuerpo, subject: asuntoFinal };
    if (ccLimpio.length > 0) opciones.cc = ccLimpio.join(', ');
    if (destinatarios && destinatarios.bcc) opciones.bcc = destinatarios.bcc;

    mensajeReply.reply('', opciones);
    Logger.log('Reply OK a ' + interlocutor + (ccLimpio.length > 0 ? ' CC: ' + ccLimpio.join(', ') : ''));
    return threadId;
  } catch (e) {
    Logger.log('Error reply hilo ' + threadId + ': ' + e.message);
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
