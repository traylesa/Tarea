function _extraerEmail(texto) {
  if (!texto) return '';
  var match = texto.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : texto.toLowerCase().trim();
}

function _esEmailPropio(email) {
  var limpio = _extraerEmail(email);
  var propio = (typeof obtenerEmailPropio === 'function')
    ? obtenerEmailPropio()
    : '';
  return limpio === propio;
}

function calcularInterlocutor(message) {
  var todos = (message.from || '') + ',' + (message.to || '');
  var emails = todos.split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e && !_esEmailPropio(e); })
    .map(function(e) { return _extraerEmail(e); })
    .filter(function(e) { return e; });

  var unicos = [];
  emails.forEach(function(e) {
    if (unicos.indexOf(e) === -1) unicos.push(e);
  });
  return unicos.join(', ');
}

function processMessage(message, threadManager, erpReader) {
  const metadata = extractMetadata(message);

  let codCar = metadata.codCar;
  let vinculacion = codCar ? 'AUTOMATICA' : 'SIN_VINCULAR';

  if (codCar) {
    threadManager.mapThreadToLoad(message.threadId, codCar);
  } else {
    const cachedCodCar = threadManager.getLoadFromThread(message.threadId);
    if (cachedCodCar) {
      codCar = cachedCodCar;
      vinculacion = 'HILO';
    }
  }

  let cargaData = null;
  let transportistaData = null;
  let auditResult = { valido: true, alerta: null, emailErp: null };

  if (codCar) {
    cargaData = erpReader.findCarga(codCar);
    if (cargaData) {
      transportistaData = erpReader.findTransportista(cargaData.codTra);
      auditResult = auditEmail(
        message.from,
        cargaData.codVia,
        erpReader.findEmailContacto
      );
    }
  }

  return {
    messageId: message.messageId,
    threadId: message.threadId,
    mensajesEnHilo: message.mensajesEnHilo || 1,
    codCar,
    codTra: cargaData?.codTra || null,
    nombreTransportista: transportistaData?.nombre || null,
    emailRemitente: message.from,
    emailErp: auditResult.emailErp,
    asunto: message.subject,
    fechaCorreo: message.date,
    tipoTarea: metadata.tipo,
    estado: auditResult.alerta ? 'ALERTA' : (typeof obtenerEstadoInicial === 'function' ? obtenerEstadoInicial() : 'NUEVO'),
    alerta: auditResult.alerta,
    vinculacion,
    referencia: cargaData?.referencia || null,
    para: message.to || '',
    cc: message.cc || '',
    cco: message.bcc || '',
    interlocutor: calcularInterlocutor(message),
    cuerpo: message.body || '',
    bandeja: message.bandeja || '',
    procesadoAt: typeof ahoraLocalISO === 'function' ? ahoraLocalISO() : new Date().toISOString()
  };
}

if (typeof module !== 'undefined') module.exports = { processMessage, calcularInterlocutor, _extraerEmail, _esEmailPropio };
