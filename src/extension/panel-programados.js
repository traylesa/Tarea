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

    if (p.estado === 'PENDIENTE') {
      var btn = document.createElement('button');
      btn.className = 'btn-secundario';
      btn.textContent = 'Cancelar';
      btn.style.fontSize = '11px';
      btn.style.padding = '2px 8px';
      btn.addEventListener('click', function() { cancelarProgramado(p.id); });
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
        interlocutor: dest.email || dest.emailRemitente || '',
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
