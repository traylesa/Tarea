// panel-acciones.js — Action bar contextual + Notas UI
// Depende de globals: tabla, registros, almacenNotas, almacenHistorial,
//   notasCodCarActual, plantillasGuardadas, configActual,
//   STORAGE_KEY_NOTAS, STORAGE_KEY_HISTORIAL
// Depende de: action-bar.js (obtenerAccionesPorFase, obtenerGrupoFase)
// Depende de: notes.js (crearNota, obtenerNotas, eliminarNota)
// Depende de: action-log.js (registrarAccion)

function renderActionBar(rowData) {
  var bar = document.getElementById('action-bar');
  var label = document.getElementById('action-bar-label');
  var botones = document.getElementById('action-bar-botones');

  if (!rowData) {
    bar.classList.add('hidden');
    return;
  }

  var acciones = [];
  if (rowData.fase) {
    var tieneReglas = configActual && configActual.reglasAcciones && typeof obtenerAccionesDesdeReglas === 'function';
    acciones = tieneReglas
      ? obtenerAccionesDesdeReglas(configActual.reglasAcciones, rowData.fase)
      : obtenerAccionesPorFase(rowData.fase);
  }
  var grupo = rowData.fase ? obtenerGrupoFase(rowData.fase) : null;
  var partes = [];
  if (rowData.codCar) partes.push('Carga ' + rowData.codCar);
  if (grupo) partes.push(grupo);
  else if (rowData.fase) partes.push('fase ' + rowData.fase);
  label.textContent = partes.length > 0 ? partes.join(' - ') : (rowData.asunto || 'Sin identificar');
  botones.innerHTML = '';

  acciones.forEach(function(accion) {
    var btn = document.createElement('button');
    btn.className = 'btn-accion-ctx';
    btn.textContent = accion.etiqueta;
    btn.addEventListener('click', function() { ejecutarAccionContextual(accion, rowData); });
    botones.appendChild(btn);
  });

  // Botones siempre visibles: Nota y Recordar
  var claveNota = rowData.codCar || rowData.threadId;
  var etiquetaClave = rowData.codCar ? 'Carga ' + rowData.codCar : 'Hilo';
  if (claveNota) {
    var btnNota = document.createElement('button');
    btnNota.className = 'btn-accion-ctx';
    btnNota.textContent = 'Nota';
    btnNota.addEventListener('click', function() { abrirModalNotas(claveNota, etiquetaClave); });
    botones.appendChild(btnNota);

    var btnRec = document.createElement('button');
    btnRec.className = 'btn-accion-ctx';
    btnRec.textContent = 'Recordar';
    btnRec.addEventListener('click', function() { abrirModalRecordatorio(claveNota, rowData.asunto); });
    botones.appendChild(btnRec);
  }

  bar.classList.remove('hidden');
  setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

async function ejecutarAccionContextual(accion, rowData) {
  var claveHist = rowData.codCar || rowData.threadId || '0';
  almacenHistorial = registrarAccion('FASE', claveHist, accion.etiqueta, almacenHistorial, new Date()).almacen;
  await chrome.storage.local.set({ [STORAGE_KEY_HISTORIAL]: almacenHistorial });
  syncBackend('registrarHistorial', { clave: claveHist, tipo: 'FASE', descripcion: accion.etiqueta });

  // Mostrar aviso si la accion lo tiene
  if (accion.aviso && typeof mostrarToast === 'function') {
    mostrarToast(accion.aviso, 'info');
  }

  if (accion.faseSiguiente && rowData.messageId) {
    var idx = registros.findIndex(function(r) { return r.messageId === rowData.messageId; });
    if (idx >= 0) {
      registros[idx].fase = accion.faseSiguiente;
      await chrome.storage.local.set({ registros: registros });
      var url = obtenerUrlActiva();
      if (url) {
        fetch(url + '?action=actualizarCampo', {
          method: 'POST',
          credentials: 'omit',
          body: JSON.stringify({ messageId: rowData.messageId, campo: 'fase', valor: accion.faseSiguiente })
        }).catch(function() {});
      }
      await renderTabla();
    }
  }

  if (rowData.messageId && tabla) {
    tabla.deselectRow();
    var row = tabla.getRows().find(function(r) { return r.getData().messageId === rowData.messageId; });
    if (row) row.select();
  }
  abrirModalRespuesta();

  if (accion.plantilla) {
    var plantilla = plantillasGuardadas.find(function(p) { return p.alias === accion.plantilla; });
    if (plantilla) {
      setTimeout(function() {
        var select = document.getElementById('respuesta-plantilla');
        select.value = plantilla.id;
        alSeleccionarPlantillaRespuesta();
      }, 100);
    }
  }
}

// --- Notas UI ---

async function cargarNotas() {
  var stored = await chrome.storage.local.get(STORAGE_KEY_NOTAS);
  almacenNotas = stored[STORAGE_KEY_NOTAS] || {};

  var data = await fetchBackend('getNotas');
  if (data && data.ok && data.notas) {
    var idsLocales = {};
    Object.keys(almacenNotas).forEach(function(clave) {
      almacenNotas[clave].forEach(function(n) { idsLocales[n.id] = true; });
    });
    data.notas.forEach(function(n) {
      if (idsLocales[n.id]) return;
      var clave = String(n.clave);
      if (!almacenNotas[clave]) almacenNotas[clave] = [];
      almacenNotas[clave].push({ id: n.id, texto: n.texto, fechaCreacion: n.fechaCreacion });
    });
    await chrome.storage.local.set({ [STORAGE_KEY_NOTAS]: almacenNotas });
  }
}

function abrirModalNotas(clave, etiqueta) {
  notasCodCarActual = clave;
  document.getElementById('notas-carga-info').textContent = '- ' + (etiqueta || 'Carga ' + clave);
  document.getElementById('notas-texto').value = '';
  document.getElementById('notas-error').classList.add('hidden');
  renderListaNotas(clave);
  document.getElementById('modal-notas').classList.remove('hidden');
  document.getElementById('notas-texto').focus();
}

function renderListaNotas(codCar) {
  var container = document.getElementById('notas-lista');
  var notas = obtenerNotas(codCar, almacenNotas);
  container.innerHTML = '';

  if (notas.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#999;padding:12px;font-size:12px">Sin notas</div>';
    return;
  }

  notas.forEach(function(nota) {
    var div = document.createElement('div');
    div.className = 'nota-item';
    var fecha = new Date(nota.fechaCreacion);
    div.innerHTML =
      '<div class="nota-texto">' + nota.texto + '</div>' +
      '<span class="nota-fecha">' + fecha.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</span>';

    var btnElim = document.createElement('button');
    btnElim.className = 'btn-icon btn-danger';
    btnElim.textContent = 'X';
    btnElim.style.cssText = 'font-size:10px;padding:1px 4px;margin-left:4px';
    btnElim.addEventListener('click', function() { eliminarNotaUI(nota.id, codCar); });
    div.appendChild(btnElim);
    container.appendChild(div);
  });
}

async function agregarNotaUI() {
  var texto = document.getElementById('notas-texto').value;
  if (!notasCodCarActual) return;

  try {
    var resultado = crearNota(texto, notasCodCarActual, almacenNotas, new Date());
    almacenNotas = resultado.almacen;
    await chrome.storage.local.set({ [STORAGE_KEY_NOTAS]: almacenNotas });

    var esCarga = /^\d+$/.test(String(notasCodCarActual));
    syncBackend('guardarNota', {
      clave: notasCodCarActual, id: resultado.nota.id,
      texto: resultado.nota.texto, fechaCreacion: resultado.nota.fechaCreacion,
      tipo: esCarga ? 'CARGA' : 'HILO'
    });

    var descHist = 'Nota: ' + texto.substring(0, 50);
    almacenHistorial = registrarAccion('NOTA', notasCodCarActual, descHist, almacenHistorial, new Date()).almacen;
    await chrome.storage.local.set({ [STORAGE_KEY_HISTORIAL]: almacenHistorial });
    syncBackend('registrarHistorial', { clave: notasCodCarActual, tipo: 'NOTA', descripcion: descHist });

    document.getElementById('notas-texto').value = '';
    renderListaNotas(notasCodCarActual);
    if (tabla) tabla.redraw(true);
  } catch (e) {
    document.getElementById('notas-error').textContent = e.message;
    document.getElementById('notas-error').classList.remove('hidden');
  }
}

async function eliminarNotaUI(id, codCar) {
  almacenNotas = eliminarNota(id, codCar, almacenNotas);
  await chrome.storage.local.set({ [STORAGE_KEY_NOTAS]: almacenNotas });
  syncBackend('eliminarNota', { id: id });
  renderListaNotas(codCar);
  if (tabla) tabla.redraw(true);
}

function cerrarModalNotas() {
  document.getElementById('modal-notas').classList.add('hidden');
  notasCodCarActual = null;
}
