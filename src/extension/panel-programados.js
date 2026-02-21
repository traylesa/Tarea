// panel-programados.js — UI envios programados: panel, tabla, horario laboral
// Depende de globals: programadosCache, tabla, configActual
// Depende de: scheduled.js (filtrarProgramados, ordenarPorFechaProgramada,
//   formatearEstadoProgramado, formatearFechaCorta, contarPorEstado)

function togglePanelProgramados() {
  var panel = document.getElementById('panel-programados');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) cargarProgramados();
  setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

async function cargarProgramados() {
  var url = obtenerUrlActiva();
  if (!url) return;
  try {
    var response = await fetch(url + '?action=getProgramados', { credentials: 'omit' });
    var data = await response.json();
    programadosCache = data.programados || [];
  } catch (e) {
    programadosCache = [];
  }
  renderTablaProgramados();
}

function renderTablaProgramados() {
  var filtro = document.getElementById('filtro-programados').value;
  var lista = filtrarProgramados(programadosCache, filtro);
  lista = ordenarPorFechaProgramada(lista);

  var tbody = document.querySelector('#tabla-programados tbody');
  var vacio = document.getElementById('programados-vacio');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    vacio.classList.remove('hidden');
    return;
  }
  vacio.classList.add('hidden');

  lista.forEach(function(p) {
    var estado = formatearEstadoProgramado(p.estado);
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="' + estado.clase + '">' + estado.html + '</td>' +
      '<td>' + (p.interlocutor || '--') + '</td>' +
      '<td>' + (p.asunto || '--') + '</td>' +
      '<td>' + formatearFechaCorta(p.fechaProgramada) + '</td>' +
      '<td>' + formatearFechaCorta(p.fechaEnvio) + '</td>' +
      '<td></td>';

    tr.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON') return;
      abrirModalProgramado(p);
    });

    if (p.estado === 'PENDIENTE') {
      var btn = document.createElement('button');
      btn.className = 'btn-secundario';
      btn.textContent = 'Cancelar';
      btn.style.fontSize = '11px';
      btn.style.padding = '2px 8px';
      btn.addEventListener('click', function(e) { e.stopPropagation(); cancelarProgramado(p.id); });
      tr.lastChild.appendChild(btn);
    } else if (p.estado === 'ERROR' && p.errorDetalle) {
      tr.lastChild.textContent = p.errorDetalle.substring(0, 40);
      tr.lastChild.title = p.errorDetalle;
    }
    tbody.appendChild(tr);
  });

  var conteo = contarPorEstado(programadosCache);
  var btn = document.getElementById('btn-toggle-programados');
  btn.textContent = conteo.PENDIENTE > 0 ? 'Programados (' + conteo.PENDIENTE + ')' : 'Programados';
}

async function cancelarProgramado(id) {
  var url = obtenerUrlActiva();
  if (!url) return;
  try {
    await fetch(url + '?action=cancelarProgramado', { method: 'POST', credentials: 'omit', body: JSON.stringify({ id: id }) });
    await cargarProgramados();
    if (tabla) tabla.redraw(true);
  } catch (e) { /* silencioso */ }
}

async function programarEnvioMasivo() {
  var fecha = document.getElementById('programar-fecha').value;
  if (!fecha) {
    document.getElementById('respuesta-error').textContent = 'Selecciona fecha y hora para programar';
    document.getElementById('respuesta-error').classList.remove('hidden');
    return;
  }

  var fechaProg = new Date(fecha);
  if (fechaProg <= new Date()) {
    document.getElementById('respuesta-error').textContent = 'La fecha debe ser futura';
    document.getElementById('respuesta-error').classList.remove('hidden');
    return;
  }

  var seleccionados = _registroRegla ? [_registroRegla] : tabla.getSelectedData();
  var plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: obtenerPieComun()
  };

  var payload = construirPayload(seleccionados, plantilla);
  payload.destinatarios.forEach(function(dest, i) {
    var reg = seleccionados[i];
    dest.para = reg.para || '';
    dest.cc = reg.cc || '';
    dest.cco = reg.cco || '';
  });

  var url = obtenerUrlActiva();
  if (!url) return;

  var btnEnviar = document.getElementById('btn-enviar-respuesta');
  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Programando...';

  var errores = [];
  var exitos = 0;

  try {
    for (var i = 0; i < payload.destinatarios.length; i++) {
      var dest = payload.destinatarios[i];
      var cuerpoFinal = dest.cuerpo;
      if (plantilla.firma) {
        cuerpoFinal += '<hr style="border:none;border-top:1px solid #ddd;margin:8px 0">' + plantilla.firma;
      }

      var body = {
        threadId: dest.threadId,
        interlocutor: dest.interlocutor || dest.email || dest.emailRemitente || '',
        asunto: dest.asunto, cuerpo: cuerpoFinal,
        cc: dest.cc || '', bcc: dest.cco || '',
        fechaProgramada: fechaProg.toISOString()
      };

      try {
        var response = await fetch(url + '?action=programarEnvio', { method: 'POST', credentials: 'omit', body: JSON.stringify(body) });
        var data = await response.json();
        if (data.ok) exitos++;
        else errores.push(data.error || 'Error desconocido');
      } catch (e) {
        errores.push(e.message);
      }
    }

    if (errores.length > 0) {
      document.getElementById('respuesta-error').textContent = errores.join('; ');
      document.getElementById('respuesta-error').classList.remove('hidden');
    } else {
      cerrarModalRespuesta();
      await cargarProgramados();
      if (tabla) tabla.redraw(true);
    }
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar';
    document.getElementById('chk-programar-envio').checked = false;
    document.getElementById('programar-campos').classList.add('hidden');
  }
}

function toggleCheckboxProgramar() {
  var checked = document.getElementById('chk-programar-envio').checked;
  var campos = document.getElementById('programar-campos');
  var btnEnviar = document.getElementById('btn-enviar-respuesta');

  if (checked) {
    campos.classList.remove('hidden');
    btnEnviar.textContent = 'Programar envio';
    var ahora = new Date();
    ahora.setHours(ahora.getHours() + 1);
    ahora.setMinutes(0);
    var local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    document.getElementById('programar-fecha').value = local.toISOString().slice(0, 16);
  } else {
    campos.classList.add('hidden');
    btnEnviar.textContent = 'Enviar';
  }
}

function despacharEnvio() {
  if (document.getElementById('chk-programar-envio').checked) {
    programarEnvioMasivo();
  } else {
    enviarRespuestaMasiva();
  }
}

// --- Horario laboral UI ---

async function cargarHorarioLaboral() {
  var url = obtenerUrlActiva();
  if (!url) return;
  try {
    var response = await fetch(url + '?action=getHorarioLaboral', { credentials: 'omit' });
    var data = await response.json();
    if (data.ok && data.horario) {
      var h = data.horario;
      document.querySelectorAll('.chk-dia-laboral').forEach(function(chk) {
        chk.checked = h.dias.indexOf(parseInt(chk.dataset.dia, 10)) !== -1;
      });
      document.getElementById('cfg-hora-inicio').value = h.horaInicio;
      document.getElementById('cfg-hora-fin').value = h.horaFin;
    }
  } catch (e) { /* usar defaults */ }
}

// --- Modal detalle programado ---

var _programadoActual = null;

function abrirModalProgramado(prog) {
  _programadoActual = prog;
  var editable = esEditable(prog);
  var modal = document.getElementById('modal-programado');
  var estado = formatearEstadoProgramado(prog.estado);

  document.getElementById('prog-modal-titulo').textContent =
    editable ? 'Editar Envio Programado' : 'Detalle Envio Programado';

  document.getElementById('prog-estado-badge').innerHTML =
    '<span class="prog-estado-inline ' + estado.clase + '">' + estado.html + '</span>';

  document.getElementById('prog-interlocutor').value = prog.interlocutor || '--';
  document.getElementById('prog-asunto').value = prog.asunto || '';
  document.getElementById('prog-cc').value = prog.cc || '';
  document.getElementById('prog-bcc').value = prog.bcc || '';

  // Fecha
  var inputFecha = document.getElementById('prog-fecha');
  if (prog.fechaProgramada) {
    var d = new Date(prog.fechaProgramada);
    var local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    inputFecha.value = local.toISOString().slice(0, 16);
  } else {
    inputFecha.value = '';
  }

  // Cuerpo: editable=textarea, readonly=preview HTML
  var textarea = document.getElementById('prog-cuerpo');
  var preview = document.getElementById('prog-preview-cuerpo');
  if (editable) {
    textarea.value = prog.cuerpo || '';
    textarea.classList.remove('hidden');
    preview.classList.add('hidden');
  } else {
    textarea.classList.add('hidden');
    preview.innerHTML = prog.cuerpo || '<em>Sin contenido</em>';
    preview.classList.remove('hidden');
  }

  // Campos editables/readonly
  ['prog-asunto', 'prog-cc', 'prog-bcc', 'prog-fecha'].forEach(function(id) {
    var el = document.getElementById(id);
    el.readOnly = !editable;
    el.disabled = !editable;
    el.style.background = editable ? '' : '#f5f5f5';
    el.style.color = editable ? '' : '#666';
  });

  // Info envio (solo no-pendientes)
  var infoEnvio = document.getElementById('prog-info-envio');
  if (!editable) {
    infoEnvio.classList.remove('hidden');
    document.getElementById('prog-fecha-envio').textContent =
      prog.fechaEnvio ? 'Enviado: ' + formatearFechaCorta(prog.fechaEnvio) : '';
    document.getElementById('prog-creado-por').textContent =
      prog.creadoPor ? 'Creado por: ' + prog.creadoPor : '';
  } else {
    infoEnvio.classList.add('hidden');
  }

  // Error detalle
  var errorDiv = document.getElementById('prog-error-detalle');
  if (prog.estado === 'ERROR' && prog.errorDetalle) {
    errorDiv.textContent = prog.errorDetalle;
    errorDiv.classList.remove('hidden');
  } else {
    errorDiv.classList.add('hidden');
  }

  // Botones segun estado
  document.getElementById('btn-guardar-programado').classList.toggle('hidden', !editable);
  document.getElementById('btn-enviar-ahora').classList.toggle('hidden', !editable);
  document.getElementById('btn-cancelar-programado-modal').classList.toggle('hidden', !editable);
  document.getElementById('btn-reprogramar').classList.toggle('hidden', prog.estado !== 'ERROR');

  document.getElementById('prog-modal-error').classList.add('hidden');
  modal.classList.remove('hidden');
}

function cerrarModalProgramado() {
  _programadoActual = null;
  document.getElementById('modal-programado').classList.add('hidden');
}

function abrirModalProgramadoPorThread(threadId) {
  var pendientes = buscarPendientesPorThread(programadosCache, threadId);
  if (pendientes.length > 0) {
    abrirModalProgramado(pendientes[0]);
  } else {
    var todos = buscarPorThread(programadosCache, threadId);
    if (todos.length > 0) {
      abrirModalProgramado(todos[0]);
    } else {
      var panel = document.getElementById('panel-programados');
      if (panel.classList.contains('hidden')) togglePanelProgramados();
    }
  }
}

async function guardarCambiosProgramado() {
  if (!_programadoActual) return;
  var errorEl = document.getElementById('prog-modal-error');

  var cambios = {};
  var nuevoAsunto = document.getElementById('prog-asunto').value;
  var nuevoCuerpo = document.getElementById('prog-cuerpo').value;
  var nuevoCC = document.getElementById('prog-cc').value;
  var nuevoBCC = document.getElementById('prog-bcc').value;
  var nuevaFecha = document.getElementById('prog-fecha').value;

  if (nuevoAsunto !== (_programadoActual.asunto || '')) cambios.asunto = nuevoAsunto;
  if (nuevoCuerpo !== (_programadoActual.cuerpo || '')) cambios.cuerpo = nuevoCuerpo;
  if (nuevoCC !== (_programadoActual.cc || '')) cambios.cc = nuevoCC;
  if (nuevoBCC !== (_programadoActual.bcc || '')) cambios.bcc = nuevoBCC;

  if (nuevaFecha) {
    var fechaISO = new Date(nuevaFecha).toISOString();
    if (fechaISO !== _programadoActual.fechaProgramada) cambios.fechaProgramada = fechaISO;
  }

  var v = validarEdicionProgramado(cambios);
  if (!v.valido) {
    errorEl.textContent = v.error;
    errorEl.classList.remove('hidden');
    return;
  }

  var url = obtenerUrlActiva();
  if (!url) return;

  var btn = document.getElementById('btn-guardar-programado');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    var response = await fetch(url + '?action=actualizarProgramadoCampos', {
      method: 'POST', credentials: 'omit',
      body: JSON.stringify({ id: _programadoActual.id, campos: cambios })
    });
    var data = await response.json();
    if (data.ok) {
      cerrarModalProgramado();
      await cargarProgramados();
      if (tabla) tabla.redraw(true);
    } else {
      errorEl.textContent = data.error || 'Error al guardar';
      errorEl.classList.remove('hidden');
    }
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

async function enviarProgramadoAhora() {
  if (!_programadoActual) return;
  var errorEl = document.getElementById('prog-modal-error');

  var url = obtenerUrlActiva();
  if (!url) return;

  var btn = document.getElementById('btn-enviar-ahora');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    var response = await fetch(url + '?action=enviarProgramadoAhora', {
      method: 'POST', credentials: 'omit',
      body: JSON.stringify({ id: _programadoActual.id })
    });
    var data = await response.json();
    if (data.ok) {
      cerrarModalProgramado();
      await cargarProgramados();
      if (tabla) tabla.redraw(true);
    } else {
      errorEl.textContent = data.error || 'Error al enviar';
      errorEl.classList.remove('hidden');
    }
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar ahora';
  }
}

async function cancelarProgramadoDesdeModal() {
  if (!_programadoActual) return;
  await cancelarProgramado(_programadoActual.id);
  cerrarModalProgramado();
}

function reprogramarProgramado() {
  if (!_programadoActual || _programadoActual.estado !== 'ERROR') return;
  // Reutilizar modal de respuesta precargado con datos del programado fallido
  cerrarModalProgramado();
  abrirModalRespuesta();
  document.getElementById('respuesta-asunto').value = _programadoActual.asunto || '';
  document.getElementById('respuesta-cuerpo').value = _programadoActual.cuerpo || '';
  document.getElementById('chk-programar-envio').checked = true;
  toggleCheckboxProgramar();
}

async function guardarHorarioLaboralUI() {
  var url = obtenerUrlActiva();
  if (!url) return;

  var dias = [];
  document.querySelectorAll('.chk-dia-laboral').forEach(function(chk) {
    if (chk.checked) dias.push(parseInt(chk.dataset.dia, 10));
  });

  var horario = {
    dias: dias,
    horaInicio: parseInt(document.getElementById('cfg-hora-inicio').value, 10) || 7,
    horaFin: parseInt(document.getElementById('cfg-hora-fin').value, 10) || 21
  };

  try {
    var response = await fetch(url + '?action=guardarHorarioLaboral', {
      method: 'POST', credentials: 'omit', body: JSON.stringify({ horario: horario })
    });
    var data = await response.json();
    var info = document.getElementById('horario-info');
    if (data.ok) {
      info.textContent = 'Horario guardado correctamente';
      info.className = 'exito';
    } else {
      info.textContent = data.error || 'Error al guardar';
      info.className = 'errores';
    }
    info.classList.remove('hidden');
    setTimeout(function() { info.classList.add('hidden'); }, 3000);
  } catch (e) { /* silencioso */ }
}
