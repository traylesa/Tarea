const { extractMetadata } = require('./EmailParser');
const { createThreadManager } = require('./ThreadManager');
const { createERPReader } = require('./ERPReader');
const { auditEmail } = require('./Auditor');
const { checkSLA } = require('./SLAChecker');

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
    codCar,
    codTra: cargaData?.codTra || null,
    nombreTransportista: transportistaData?.nombre || null,
    emailRemitente: message.from,
    emailErp: auditResult.emailErp,
    asunto: message.subject,
    fechaCorreo: message.date,
    tipoTarea: metadata.tipo,
    estado: auditResult.alerta ? 'ALERTA' : 'RECIBIDO',
    alerta: auditResult.alerta,
    vinculacion,
    procesadoAt: new Date().toISOString()
  };
}

module.exports = { processMessage };
