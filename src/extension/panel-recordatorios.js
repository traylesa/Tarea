// panel-recordatorios.js — UI recordatorios: panel, modal, CRUD + edicion
// Depende de globals: recordatoriosCache, tabla,
//   STORAGE_KEY_RECORDATORIOS, almacenHistorial, STORAGE_KEY_HISTORIAL
// Depende de: reminders.js (crearRecordatorio, eliminarRecordatorio, obtenerActivos)
// Depende de: action-log.js (registrarAccion)

var recordatorioCodCar = null;
var recordatorioEditandoId = null;

function togglePanelRecordatorios() {
  var panel = document.getElementById('panel-recordatorios');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) cargarRecordatoriosUI();
  setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

async function cargarRecordatoriosUI() {
  var stored = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
  recordatoriosCache = stored[STORAGE_KEY_RECORDATORIOS] || [];

  var data = await fetchBackend('getRecordatorios');
  if (data && data.ok && data.recordatorios) {
    var idsLocales = {};
    recordatoriosCache.forEach(function(r) { idsLocales[r.id] = true; });
    data.recordatorios.forEach(function(r) {
      if (idsLocales[r.id]) return;
      if (r.estado !== 'ACTIVO') return;
      recordatoriosCache.push({
        id: r.id, codCar: r.clave || null, texto: r.texto,
        fechaDisparo: r.fechaDisparo, preset: r.preset, origen: r.origen
      });
    });
    await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
  }
  renderRecordatorios();
}

function renderRecordatorios() {
  var activos = obtenerActivos(recordatoriosCache, new Date());
  var container = document.getElementById('lista-recordatorios');
  var vacio = document.getElementById('recordatorios-vacio');
  var count = document.getElementById('recordatorios-count');
  container.innerHTML = '';

  if (activos.length === 0) {
    vacio.classList.remove('hidden');
    count.textContent = '';
    return;
  }
  vacio.classList.add('hidden');
  count.textContent = activos.length + ' activo' + (activos.length !== 1 ? 's' : '');

  activos.forEach(function(rec) {
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #eee;font-size:12px';
    var disparo = new Date(rec.fechaDisparo);
    var diffMin = Math.round((disparo - new Date()) / 60000);
    var countdown = diffMin > 60 ? Math.round(diffMin / 60) + 'h' : diffMin + 'min';

    div.innerHTML =
      '<div style="flex:1">' +
        '<strong>' + (rec.codCar ? 'Carga ' + rec.codCar + ' — ' : '') + '</strong>' +
        rec.texto +
        ' <span style="color:#999">(' + countdown + ')</span>' +
        (rec.origen === 'sugerido' ? ' <span style="color:#2196F3;font-size:10px">[sugerido]</span>' : '') +
      '</div>';

    var btnEditar = document.createElement('button');
    btnEditar.className = 'btn-secundario';
    btnEditar.textContent = 'Ed';
    btnEditar.title = 'Editar recordatorio';
    btnEditar.style.cssText = 'font-size:10px;padding:2px 6px;margin-left:4px';
    btnEditar.addEventListener('click', function() { editarRecordatorioUI(rec); });
    div.appendChild(btnEditar);

    var btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-secundario';
    btnEliminar.textContent = 'X';
    btnEliminar.style.cssText = 'font-size:10px;padding:2px 6px;margin-left:4px';
    btnEliminar.addEventListener('click', function() { eliminarRecordatorioUI(rec.id); });
    div.appendChild(btnEliminar);
    container.appendChild(div);
  });

  var btn = document.getElementById('btn-toggle-recordatorios');
  btn.textContent = activos.length > 0 ? 'Recordatorios (' + activos.length + ')' : 'Recordatorios';
}

async function eliminarRecordatorioUI(id) {
  recordatoriosCache = eliminarRecordatorio(id, recordatoriosCache);
  await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
  syncBackend('eliminarRecordatorio', { id: id });
  renderRecordatorios();
  if (tabla) tabla.redraw(true);
}

function abrirModalRecordatorio(codCar) {
  recordatorioCodCar = codCar || null;
  recordatorioEditandoId = null;
  document.getElementById('recordatorio-texto').value = '';
  document.getElementById('recordatorio-preset').value = '1h';
  document.getElementById('recordatorio-error').classList.add('hidden');
  document.getElementById('recordatorio-carga-info').textContent = codCar ? 'Carga: ' + codCar : 'Sin carga asociada';
  document.getElementById('recordatorio-modal-titulo').textContent = 'Crear Recordatorio';
  document.getElementById('btn-guardar-recordatorio').textContent = 'Crear';
  document.getElementById('modal-recordatorio').classList.remove('hidden');
  document.getElementById('recordatorio-texto').focus();
}

function editarRecordatorioUI(rec) {
  recordatorioCodCar = rec.codCar || null;
  recordatorioEditandoId = rec.id;
  document.getElementById('recordatorio-texto').value = rec.texto;
  document.getElementById('recordatorio-preset').value = rec.preset || '1h';
  document.getElementById('recordatorio-error').classList.add('hidden');
  document.getElementById('recordatorio-carga-info').textContent = rec.codCar ? 'Carga: ' + rec.codCar : 'Sin carga asociada';
  document.getElementById('recordatorio-modal-titulo').textContent = 'Editar Recordatorio';
  document.getElementById('btn-guardar-recordatorio').textContent = 'Guardar';
  document.getElementById('modal-recordatorio').classList.remove('hidden');
  document.getElementById('recordatorio-texto').focus();
}

async function guardarRecordatorioUI() {
  var texto = document.getElementById('recordatorio-texto').value;
  var preset = document.getElementById('recordatorio-preset').value;

  try {
    if (recordatorioEditandoId) {
      // Modo edicion: eliminar viejo, crear nuevo con misma clave
      var viejo = recordatoriosCache.find(function(r) { return r.id === recordatorioEditandoId; });
      recordatoriosCache = eliminarRecordatorio(recordatorioEditandoId, recordatoriosCache);
      syncBackend('eliminarRecordatorio', { id: recordatorioEditandoId });

      var codCarEdicion = viejo ? viejo.codCar : recordatorioCodCar;
      var rec = crearRecordatorio(texto, codCarEdicion, preset, new Date(), recordatoriosCache);
      recordatoriosCache.push(rec);
      await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
      chrome.runtime.sendMessage({ tipo: 'RECORDATORIO_CREADO' });

      syncBackend('guardarRecordatorio', {
        id: rec.id, clave: rec.codCar || '', texto: rec.texto,
        fechaDisparo: rec.fechaDisparo, preset: preset,
        origen: rec.origen || 'manual', estado: 'ACTIVO'
      });
    } else {
      // Modo creacion
      var rec = crearRecordatorio(texto, recordatorioCodCar, preset, new Date(), recordatoriosCache);
      recordatoriosCache.push(rec);
      await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
      chrome.runtime.sendMessage({ tipo: 'RECORDATORIO_CREADO' });

      syncBackend('guardarRecordatorio', {
        id: rec.id, clave: rec.codCar || '', texto: rec.texto,
        fechaDisparo: rec.fechaDisparo, preset: preset,
        origen: rec.origen || 'manual', estado: 'ACTIVO'
      });
      syncBackend('registrarHistorial', {
        clave: rec.codCar || '', tipo: 'RECORDATORIO',
        descripcion: 'Recordatorio: ' + texto.substring(0, 50)
      });
    }

    cerrarModalRecordatorio();
    renderRecordatorios();
    if (tabla) tabla.redraw(true);
  } catch (e) {
    document.getElementById('recordatorio-error').textContent = e.message;
    document.getElementById('recordatorio-error').classList.remove('hidden');
  }
}

function cerrarModalRecordatorio() {
  document.getElementById('modal-recordatorio').classList.add('hidden');
  recordatorioCodCar = null;
  recordatorioEditandoId = null;
}
