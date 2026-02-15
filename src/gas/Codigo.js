// Punto de entrada Web App - Endpoints HTTP

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'getRegistros') return accionGetRegistros();
    if (action === 'obtenerConfig') return accionObtenerConfig();
    if (action === 'getProgramados') return accionGetProgramados();
    if (action === 'getHorarioLaboral') return accionGetHorarioLaboral();

    return respuestaError('Accion no reconocida');
  } catch (err) {
    return respuestaError(err.message);
  }
}

function doPost(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';
    var body = e && e.postData ? JSON.parse(e.postData.contents) : {};

    if (action === 'procesarCorreos') return accionProcesarCorreos();
    if (action === 'actualizarCampo') return accionActualizarCampo(body);
    if (action === 'vincularManual') return accionVincularManual(body);
    if (action === 'enviarRespuesta') return accionEnviarRespuesta(body);
    if (action === 'configurarSpreadsheet') return accionConfigurarSpreadsheet(body);
    if (action === 'configurarGmailQuery') return accionConfigurarGmailQuery(body);
    if (action === 'programarEnvio') return accionProgramarEnvio(body);
    if (action === 'cancelarProgramado') return accionCancelarProgramado(body);
    if (action === 'guardarHorarioLaboral') return accionGuardarHorarioLaboral(body);

    return respuestaError('Accion no reconocida');
  } catch (err) {
    return respuestaError(err.message);
  }
}

// --- Acciones GET ---

function accionGetRegistros() {
  var registros = leerRegistros();
  return respuestaJson({ ok: true, registros: registros });
}

function accionObtenerConfig() {
  var id = obtenerSpreadsheetId();
  var nombre = SpreadsheetApp.openById(id).getName();
  var gmailQuery = obtenerGmailQuery();
  return respuestaJson({ ok: true, spreadsheetId: id, spreadsheetNombre: nombre, gmailQuery: gmailQuery });
}

// --- Acciones POST ---

function accionProcesarCorreos() {
  Logger.log('=== INICIO procesarCorreos ===');
  Logger.log('Spreadsheet ID: ' + obtenerSpreadsheetId());

  var hilosMap = leerHilos();
  Logger.log('Hilos cargados: ' + Object.keys(hilosMap).length);

  var threadManager = createThreadManager();
  Object.keys(hilosMap).forEach(function(tid) {
    threadManager.mapThreadToLoad(tid, hilosMap[tid]);
  });

  var erpReader = createERPReader();

  var idsExistentes = obtenerIdsYaProcesados();
  cargarIdsProcesados(idsExistentes);

  var mensajes = obtenerMensajesNuevos();
  var procesados = 0;
  var errores = 0;

  mensajes.forEach(function(msg) {
    try {
      var resultado = processMessage(msg, threadManager, erpReader);
      guardarRegistro(resultado);
      procesados++;
    } catch (err) {
      errores++;
      Logger.log('Error procesando mensaje ' + msg.messageId + ': ' + err.message);
    }
  });

  Logger.log('=== FIN procesarCorreos: ' + procesados + ' procesados, ' + errores + ' errores ===');

  // Retornar registros actualizados para evaluacion client-side de alertas
  var registrosActualizados = leerRegistros();

  return respuestaJson({
    ok: true,
    procesados: procesados,
    errores: errores,
    registros: registrosActualizados
  });
}

function accionActualizarCampo(body) {
  actualizarCampo(body.messageId, body.campo, body.valor);
  return respuestaJson({ ok: true });
}

function accionVincularManual(body) {
  guardarHilo(body.threadId, body.codCar);
  return respuestaJson({ ok: true });
}

function accionEnviarRespuesta(body) {
  var lista = body.destinatarios;
  if (!lista || !lista.length) {
    return respuestaError('No hay destinatarios');
  }

  var epm = Math.min(Math.max(body.emailsPorMinuto || 10, 1), 30);
  var pausaMs = Math.ceil(60000 / epm);

  var emailsPropios = obtenerEmailsPropios();
  Logger.log('Emails propios: ' + Object.keys(emailsPropios).join(', '));
  var resultados = [];
  var procesados = {};
  var contador = 0;

  lista.forEach(function(dest) {
    var tid = dest.threadId;
    if (!tid || procesados[tid]) return;
    procesados[tid] = true;

    // Pausa entre envios para respetar rate limit
    if (contador > 0) {
      Utilities.sleep(pausaMs);
    }

    var regsHilo = lista.filter(function(d) { return d.threadId === tid; });
    var destCorreo = _recopilarDestinatariosV2(regsHilo, emailsPropios);

    var r = enviarRespuesta(tid, dest.asunto, dest.cuerpo, destCorreo, emailsPropios);
    resultados.push({ threadId: tid, enviado: !!r });
    contador++;
  });

  return respuestaJson({ ok: true, resultados: resultados, emailsPorMinuto: epm });
}

function _recopilarDestinatarios(registros, emailPropio) {
  return _recopilarDestinatariosV2(registros, typeof emailPropio === 'object' ? emailPropio : _aMapaPropios(emailPropio));
}

function _recopilarDestinatariosV2(registros, emailsPropios) {
  var toSet = {};
  var ccSet = {};

  registros.forEach(function(r) {
    _parsearEmails(r.email || r.emailRemitente).forEach(function(e) { toSet[e] = true; });
    _parsearEmails(r.para).forEach(function(e) { toSet[e] = true; });
    _parsearEmails(r.cc).forEach(function(e) { ccSet[e] = true; });
    _parsearEmails(r.cco).forEach(function(e) { ccSet[e] = true; });
  });

  // Quitar TODOS los emails propios (cuenta + aliases)
  Object.keys(emailsPropios).forEach(function(propio) {
    delete toSet[propio];
    delete ccSet[propio];
  });

  return {
    to: Object.keys(toSet).join(', '),
    cc: Object.keys(ccSet).join(', '),
    bcc: ''
  };
}

function _aMapaPropios(email) {
  var m = {};
  if (email) m[email.toLowerCase()] = true;
  return m;
}

function _parsearEmails(texto) {
  if (!texto) return [];
  return texto.split(',').map(function(e) {
    var match = e.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase().trim() : e.toLowerCase().trim();
  }).filter(function(e) { return e.indexOf('@') > -1; });
}

function accionConfigurarGmailQuery(body) {
  if (!body.gmailQuery || typeof body.gmailQuery !== 'string') {
    return respuestaError('gmailQuery es requerido (texto)');
  }

  var query = body.gmailQuery.trim();
  if (!query) return respuestaError('La query no puede estar vacia');

  // Validar que la query funciona
  try {
    GmailApp.search(query, 0, 1);
  } catch (err) {
    return respuestaError('Query Gmail invalida: ' + err.message);
  }

  guardarGmailQuery(query);
  return respuestaJson({ ok: true, gmailQuery: query });
}

function accionConfigurarSpreadsheet(body) {
  if (!body.spreadsheetId) return respuestaError('spreadsheetId es requerido');

  try {
    var ss = SpreadsheetApp.openById(body.spreadsheetId);
    var nombre = ss.getName();
  } catch (err) {
    return respuestaError('No se pudo abrir el spreadsheet: ' + err.message);
  }

  guardarSpreadsheetId(body.spreadsheetId);
  return respuestaJson({ ok: true, nombre: nombre });
}

// --- Acciones Programados ---

function accionGetProgramados() {
  var programados = leerTodosProgramados();
  return respuestaJson({ ok: true, programados: programados });
}

function accionGetHorarioLaboral() {
  var horario = obtenerHorarioLaboral();
  return respuestaJson({ ok: true, horario: horario });
}

function accionProgramarEnvio(body) {
  if (!body.threadId) return respuestaError('threadId es requerido');
  if (!body.cuerpo) return respuestaError('cuerpo es requerido');
  if (!body.fechaProgramada) return respuestaError('fechaProgramada es requerida');

  var fechaProg = new Date(body.fechaProgramada);
  if (isNaN(fechaProg.getTime())) return respuestaError('fechaProgramada invalida');
  if (fechaProg <= new Date()) return respuestaError('fechaProgramada debe ser futura');

  var id = 'prog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  var registro = {
    id: id,
    threadId: body.threadId,
    interlocutor: body.interlocutor || '',
    asunto: body.asunto || '',
    cuerpo: body.cuerpo,
    cc: body.cc || '',
    bcc: body.bcc || '',
    fechaProgramada: fechaProg.toISOString(),
    estado: 'PENDIENTE',
    fechaEnvio: '',
    errorDetalle: '',
    creadoPor: obtenerEmailPropio(),
    creadoAt: new Date().toISOString()
  };

  guardarProgramado(registro);
  return respuestaJson({ ok: true, id: id });
}

function accionCancelarProgramado(body) {
  if (!body.id) return respuestaError('id es requerido');

  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var datos = hoja.getDataRange().getValues();
  var colId = datos[0].indexOf('id');
  var colEstado = datos[0].indexOf('estado');

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === body.id) {
      if (datos[i][colEstado] !== 'PENDIENTE') {
        return respuestaError('Solo se pueden cancelar envios PENDIENTE');
      }
      hoja.getRange(i + 1, colEstado + 1).setValue('CANCELADO');
      return respuestaJson({ ok: true });
    }
  }
  return respuestaError('Programado no encontrado: ' + body.id);
}

function accionGuardarHorarioLaboral(body) {
  if (!body.horario) return respuestaError('horario es requerido');
  var h = body.horario;
  if (!Array.isArray(h.dias) || typeof h.horaInicio !== 'number' || typeof h.horaFin !== 'number') {
    return respuestaError('Formato horario invalido: {dias:[1..5], horaInicio:7, horaFin:21}');
  }
  guardarHorarioLaboral(h);
  return respuestaJson({ ok: true, horario: h });
}

// --- Trigger programado ---

function ejecutarBarridoProgramado() {
  try {
    // 1. Barrido de correos nuevos
    var hilosMap = leerHilos();
    var threadManager = createThreadManager();

    Object.keys(hilosMap).forEach(function(tid) {
      threadManager.mapThreadToLoad(tid, hilosMap[tid]);
    });

    var erpReader = createERPReader();

    var idsExistentes = obtenerIdsYaProcesados();
    cargarIdsProcesados(idsExistentes);

    var mensajes = obtenerMensajesNuevos();
    var procesados = 0;

    mensajes.forEach(function(msg) {
      try {
        var resultado = processMessage(msg, threadManager, erpReader);
        guardarRegistro(resultado);
        procesados++;
      } catch (err) {
        Logger.log('Error procesando mensaje: ' + err.message);
      }
    });

    Logger.log('Barrido completado: ' + procesados + ' mensajes procesados');

    // 2. Procesar cola de envios programados (solo en horario laboral)
    _procesarColaProgramados();

  } catch (err) {
    Logger.log('Error en barrido programado: ' + err.message);
  }
}

function _procesarColaProgramados() {
  if (!estaEnHorarioLaboral()) {
    Logger.log('Fuera de horario laboral, envios programados omitidos');
    return;
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('Lock ocupado, otro trigger ya procesa la cola');
    return;
  }

  try {
    var pendientes = leerProgramadosPendientes();
    if (pendientes.length === 0) return;

    var props = PropertiesService.getScriptProperties();
    var epm = parseInt(props.getProperty('EMAILS_POR_MINUTO') || '10', 10);
    var pausaMs = Math.ceil(60000 / Math.min(Math.max(epm, 1), 30));
    var emailsPropios = obtenerEmailsPropios();
    var limite = Math.min(pendientes.length, 20);

    Logger.log('Cola programados: ' + pendientes.length + ' pendientes, procesando ' + limite);

    for (var i = 0; i < limite; i++) {
      var prog = pendientes[i];
      if (i > 0) Utilities.sleep(pausaMs);

      try {
        var destinatarios = {
          to: prog.interlocutor,
          cc: prog.cc || '',
          bcc: prog.bcc || ''
        };

        var resultado = enviarRespuesta(
          prog.threadId, prog.asunto, prog.cuerpo, destinatarios, emailsPropios
        );

        if (resultado) {
          actualizarProgramado(prog._fila, 'estado', 'ENVIADO');
          actualizarProgramado(prog._fila, 'fechaEnvio', new Date().toISOString());
        } else {
          actualizarProgramado(prog._fila, 'estado', 'ERROR');
          actualizarProgramado(prog._fila, 'errorDetalle', 'enviarRespuesta retorno null');
        }
      } catch (err) {
        actualizarProgramado(prog._fila, 'estado', 'ERROR');
        actualizarProgramado(prog._fila, 'errorDetalle', err.message);
        Logger.log('Error enviando programado ' + prog.id + ': ' + err.message);
      }
    }

    Logger.log('Cola programados procesada: ' + limite + ' intentados');
  } finally {
    lock.releaseLock();
  }
}

// --- Setup trigger (ejecutar UNA VEZ desde editor GAS: Run > crearTrigger) ---

function crearTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'ejecutarBarridoProgramado') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('ejecutarBarridoProgramado')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Trigger creado: ejecutarBarridoProgramado cada 5 min');
}

// --- Diagnostico (ejecutar manualmente desde editor GAS) ---

function diagnostico() {
  Logger.log('=== DIAGNOSTICO TAREALOG ===');

  var ssId = obtenerSpreadsheetId();
  Logger.log('1. Spreadsheet ID: ' + ssId);

  try {
    var ss = SpreadsheetApp.openById(ssId);
    Logger.log('2. Spreadsheet nombre: ' + ss.getName());
    Logger.log('3. Hojas: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
  } catch (e) {
    Logger.log('2. ERROR abriendo spreadsheet: ' + e.message);
    return;
  }

  var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
  var filas = hoja.getLastRow();
  var cols = hoja.getLastColumn();
  Logger.log('4. SEGUIMIENTO: ' + filas + ' filas, ' + cols + ' columnas');
  if (filas >= 1) {
    Logger.log('5. Headers: ' + hoja.getRange(1, 1, 1, cols).getValues()[0].join(', '));
  }

  var idsExist = obtenerIdsYaProcesados();
  Logger.log('6. IDs ya procesados en hoja: ' + idsExist.length);

  Logger.log('7. Email propio: ' + obtenerEmailPropio());
  var query = obtenerGmailQuery();
  Logger.log('8. Gmail query: ' + query);

  try {
    var threads = GmailApp.search(query);
    Logger.log('9. Threads encontrados con query: ' + threads.length);
    if (threads.length > 0) {
      var msgs = threads[0].getMessages();
      Logger.log('10. Primer thread tiene ' + msgs.length + ' mensajes');
      Logger.log('11. Primer mensaje ID: ' + msgs[0].getId());
      Logger.log('12. Primer mensaje asunto: ' + msgs[0].getSubject());
    }
  } catch (e) {
    Logger.log('9. ERROR buscando Gmail: ' + e.message);
  }

  Logger.log('=== FIN DIAGNOSTICO ===');
}

// --- Helpers ---

function respuestaJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function respuestaError(mensaje) {
  return respuestaJson({ ok: false, error: mensaje });
}
