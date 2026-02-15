const CARGA_REGEX = /carga_0*(\d+)\.pdf/i;
const ADMIN_KEYWORDS = /certificado|hacienda|347|aeat|factura/i;
const NIF_REGEX = /\b([0-9]{8}[A-Z])\b/;
const CIF_REGEX = /\b([A-Z][0-9]{8})\b/;

function extractCodCarFromFilename(filename) {
  if (!filename) return null;
  const match = filename.match(CARGA_REGEX);
  return match ? parseInt(match[1], 10) : null;
}

function isAdministrative(subject, body) {
  const text = (subject || '') + ' ' + (body || '');
  return ADMIN_KEYWORDS.test(text);
}

function extractNif(text) {
  if (!text) return null;
  const nifMatch = text.match(NIF_REGEX);
  if (nifMatch) return nifMatch[1];
  const cifMatch = text.match(CIF_REGEX);
  return cifMatch ? cifMatch[1] : null;
}

function extractMetadata(message) {
  const { attachments = [], subject = '', body = '', from = '' } = message || {};

  for (const attachment of attachments) {
    const codCar = extractCodCarFromFilename(attachment);
    if (codCar) {
      return { codCar, nif: null, tipo: 'OPERATIVO' };
    }
  }

  if (isAdministrative(subject, body)) {
    const nif = extractNif(subject + ' ' + body);
    return { codCar: null, nif, tipo: 'ADMINISTRATIVA' };
  }

  return { codCar: null, nif: null, tipo: 'SIN_CLASIFICAR' };
}

if (typeof module !== 'undefined') module.exports = { extractCodCarFromFilename, isAdministrative, extractNif, extractMetadata };
