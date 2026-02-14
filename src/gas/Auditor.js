function auditEmail(emailReal, codVia, findEmailFn) {
  const emailErp = findEmailFn(codVia);

  if (!emailErp) {
    return { valido: false, alerta: 'ALERTA_SIN_CONTACTO_ERP', emailErp: null };
  }

  const coincide = emailReal.toLowerCase() === emailErp.toLowerCase();
  return {
    valido: coincide,
    alerta: coincide ? null : 'ALERTA_CONTACTO_NO_REGISTRADO',
    emailErp
  };
}

module.exports = { auditEmail };
