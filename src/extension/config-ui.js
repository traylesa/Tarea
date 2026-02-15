let fasesEditando = [];
let faseEditandoIdx = null;
let estadosEditando = [];
let estadoEditandoIdx = null;

async function inicializarConfigUI() {
  const config = await cargar();

  const elGasUrl = document.getElementById('cfg-gas-url');
  if (elGasUrl) elGasUrl.value = config.gasUrl;
  document.getElementById('cfg-intervalo').value = config.intervaloMinutos;
  document.getElementById('cfg-emails-por-minuto').value = config.emailsPorMinuto || 10;
  document.getElementById('cfg-ruta-csv').value = config.rutaCsvErp;
  document.getElementById('cfg-patron-codcar').value = config.patrones.codcarAdjunto;
  document.getElementById('cfg-patron-keywords').value = config.patrones.keywordsAdmin;

  fasesEditando = config.fases ? JSON.parse(JSON.stringify(config.fases)) : getDefaultFases();
  estadosEditando = config.estados ? JSON.parse(JSON.stringify(config.estados)) : getDefaultEstados();
  renderListaFasesConfig();
  renderListaEstadosConfig();
  cargarSpreadsheetInfo();
  cargarGmailQueryInfo();
}

function leerFormulario() {
  // gasUrl: usar servicio activo si existe, o campo legacy
  var gasUrl = '';
  var elGasUrl = document.getElementById('cfg-gas-url');
  if (elGasUrl) {
    gasUrl = elGasUrl.value.trim();
  } else if (typeof serviciosGas !== 'undefined' && typeof obtenerServicioActivo === 'function') {
    var activo = obtenerServicioActivo(serviciosGas);
    if (activo) gasUrl = activo.url;
  }

  return {
    gasUrl: gasUrl,
    intervaloMinutos: parseInt(document.getElementById('cfg-intervalo').value, 10) || 0,
    emailsPorMinuto: parseInt(document.getElementById('cfg-emails-por-minuto').value, 10) || 10,
    rutaCsvErp: document.getElementById('cfg-ruta-csv').value.trim(),
    patrones: {
      codcarAdjunto: document.getElementById('cfg-patron-codcar').value.trim(),
      keywordsAdmin: document.getElementById('cfg-patron-keywords').value.trim()
    },
    fases: fasesEditando,
    estados: estadosEditando
  };
}

function mostrarErrores(errores) {
  const el = document.getElementById('config-errores');
  el.innerHTML = errores.map(e => `<p>${e}</p>`).join('');
  el.classList.remove('hidden');
  document.getElementById('config-exito').classList.add('hidden');
}

function mostrarExito() {
  document.getElementById('config-exito').classList.remove('hidden');
  document.getElementById('config-errores').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('config-exito').classList.add('hidden');
  }, 3000);
}

async function guardarConfigDesdeUI(e) {
  e.preventDefault();

  const configAnterior = await cargar();
  const nuevaConfig = leerFormulario();
  nuevaConfig.ventana = configAnterior.ventana;

  const resultado = validar(nuevaConfig);
  if (!resultado.valido) {
    mostrarErrores(resultado.errores);
    return;
  }

  await guardar(nuevaConfig);
  mostrarExito();

  if (nuevaConfig.intervaloMinutos !== configAnterior.intervaloMinutos) {
    chrome.runtime.sendMessage({
      tipo: 'RECREAR_ALARMA',
      intervaloMinutos: nuevaConfig.intervaloMinutos
    });
  }

  if (typeof configActual !== 'undefined') {
    configActual = nuevaConfig;
  }

  if (typeof aplicarConfigFasesSesion === 'function') {
    await aplicarConfigFasesSesion();
  }
}

async function restaurarDefaults() {
  const config = getDefaults();
  await guardar(config);
  await inicializarConfigUI();
  mostrarExito();

  if (typeof configActual !== 'undefined') {
    configActual = config;
  }

  if (typeof aplicarConfigFasesSesion === 'function') {
    await aplicarConfigFasesSesion();
  }
}

// --- Fases Config UI ---

function renderListaFasesConfig() {
  const container = document.getElementById('lista-fases-config');
  if (!container) return;
  container.innerHTML = '';

  const ordenadas = obtenerFasesOrdenadas(fasesEditando);

  ordenadas.forEach((fase, idx) => {
    const item = document.createElement('div');
    item.className = 'fase-item';

    let badges = '';
    if (fase.es_critica) badges += '<span class="badge-critica">critica</span>';
    if (fase.clase_css) badges += `<span class="badge-clase">${fase.clase_css}</span>`;
    if (!fase.activa) badges += '<span class="badge-inactiva">inactiva</span>';

    const codigoDisplay = fase.codigo || '(vacia)';

    item.innerHTML = `
      <span class="fase-codigo">${codigoDisplay}</span>
      <span class="fase-nombre">${fase.nombre}</span>
      ${badges}
      <button class="btn-icon" data-action="subir" title="Subir">&#9650;</button>
      <button class="btn-icon" data-action="bajar" title="Bajar">&#9660;</button>
      <button class="btn-icon" data-action="editar" title="Editar">&#9998;</button>
      <button class="btn-icon btn-danger" data-action="eliminar" title="Eliminar">&#10005;</button>
    `;

    item.querySelectorAll('.btn-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        const realIdx = fasesEditando.indexOf(fase);
        accionFase(btn.dataset.action, realIdx);
      });
    });

    container.appendChild(item);
  });
}

function accionFase(accion, idx) {
  if (accion === 'editar') {
    abrirModalFase(idx);
  } else if (accion === 'eliminar') {
    fasesEditando.splice(idx, 1);
    renderListaFasesConfig();
  } else if (accion === 'subir' || accion === 'bajar') {
    moverFase(idx, accion === 'subir' ? -1 : 1);
    renderListaFasesConfig();
  }
}

function moverFase(idx, direccion) {
  const ordenadas = obtenerFasesOrdenadas(fasesEditando);
  const fase = fasesEditando[idx];
  const posVisual = ordenadas.indexOf(fase);

  const posVecino = posVisual + direccion;
  if (posVecino < 0 || posVecino >= ordenadas.length) return;

  const vecino = ordenadas[posVecino];
  const tmpOrden = fase.orden;
  fase.orden = vecino.orden;
  vecino.orden = tmpOrden;
}

function abrirModalFase(idx) {
  faseEditandoIdx = idx;
  const modal = document.getElementById('modal-fase');
  const titulo = document.getElementById('modal-fase-titulo');
  const errorEl = document.getElementById('modal-fase-error');
  errorEl.classList.add('hidden');

  if (idx !== null && idx >= 0) {
    titulo.textContent = 'Editar Fase';
    const fase = fasesEditando[idx];
    document.getElementById('fase-codigo').value = fase.codigo;
    document.getElementById('fase-nombre').value = fase.nombre;
    document.getElementById('fase-orden').value = fase.orden;
    document.getElementById('fase-critica').checked = fase.es_critica;
    document.getElementById('fase-clase-css').value = fase.clase_css;
    document.getElementById('fase-activa').checked = fase.activa;
  } else {
    titulo.textContent = 'Nueva Fase';
    const maxOrden = fasesEditando.reduce((max, f) => Math.max(max, f.orden), 0);
    document.getElementById('fase-codigo').value = '';
    document.getElementById('fase-nombre').value = '';
    document.getElementById('fase-orden').value = maxOrden + 1;
    document.getElementById('fase-critica').checked = false;
    document.getElementById('fase-clase-css').value = '';
    document.getElementById('fase-activa').checked = true;
  }

  modal.classList.remove('hidden');
}

function cerrarModalFase() {
  document.getElementById('modal-fase').classList.add('hidden');
  faseEditandoIdx = null;
}

function guardarFaseDesdeModal() {
  const codigo = document.getElementById('fase-codigo').value.trim();
  const nombre = document.getElementById('fase-nombre').value.trim();
  const orden = parseInt(document.getElementById('fase-orden').value, 10);
  const es_critica = document.getElementById('fase-critica').checked;
  const clase_css = document.getElementById('fase-clase-css').value;
  const activa = document.getElementById('fase-activa').checked;

  if (!nombre) {
    const errorEl = document.getElementById('modal-fase-error');
    errorEl.textContent = 'El nombre es obligatorio';
    errorEl.classList.remove('hidden');
    return;
  }

  // Verificar codigo duplicado (excepto si editamos la misma fase)
  const duplicado = fasesEditando.findIndex(f => f.codigo === codigo);
  if (duplicado >= 0 && duplicado !== faseEditandoIdx) {
    const errorEl = document.getElementById('modal-fase-error');
    errorEl.textContent = `Ya existe una fase con codigo "${codigo}"`;
    errorEl.classList.remove('hidden');
    return;
  }

  const fase = { codigo, nombre, orden, es_critica, clase_css, activa };

  if (faseEditandoIdx !== null && faseEditandoIdx >= 0) {
    fasesEditando[faseEditandoIdx] = fase;
  } else {
    fasesEditando.push(fase);
  }

  cerrarModalFase();
  renderListaFasesConfig();
}

// --- Estados Config UI ---

function renderListaEstadosConfig() {
  var container = document.getElementById('lista-estados-config');
  if (!container) return;
  container.innerHTML = '';

  var ordenados = obtenerEstadosOrdenados(estadosEditando);

  ordenados.forEach(function(estado) {
    var item = document.createElement('div');
    item.className = 'fase-item';

    var badges = '';
    if (estado.clase_css) badges += '<span class="badge-clase">' + estado.clase_css + '</span>';
    if (!estado.activo) badges += '<span class="badge-inactiva">inactivo</span>';

    item.innerHTML =
      '<span class="fase-codigo">' + estado.icono + '</span>' +
      '<span class="fase-codigo">' + estado.codigo + '</span>' +
      '<span class="fase-nombre">' + estado.nombre + '</span>' +
      badges +
      '<button class="btn-icon" data-action="subir" title="Subir">&#9650;</button>' +
      '<button class="btn-icon" data-action="bajar" title="Bajar">&#9660;</button>' +
      '<button class="btn-icon" data-action="editar" title="Editar">&#9998;</button>' +
      '<button class="btn-icon btn-danger" data-action="eliminar" title="Eliminar">&#10005;</button>';

    item.querySelectorAll('.btn-icon').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var realIdx = estadosEditando.indexOf(estado);
        accionEstado(btn.dataset.action, realIdx);
      });
    });

    container.appendChild(item);
  });
}

function accionEstado(accion, idx) {
  if (accion === 'editar') {
    abrirModalEstado(idx);
  } else if (accion === 'eliminar') {
    estadosEditando.splice(idx, 1);
    renderListaEstadosConfig();
  } else if (accion === 'subir' || accion === 'bajar') {
    moverEstado(idx, accion === 'subir' ? -1 : 1);
    renderListaEstadosConfig();
  }
}

function moverEstado(idx, direccion) {
  var ordenados = obtenerEstadosOrdenados(estadosEditando);
  var estado = estadosEditando[idx];
  var posVisual = ordenados.indexOf(estado);

  var posVecino = posVisual + direccion;
  if (posVecino < 0 || posVecino >= ordenados.length) return;

  var vecino = ordenados[posVecino];
  var tmpOrden = estado.orden;
  estado.orden = vecino.orden;
  vecino.orden = tmpOrden;
}

function abrirModalEstado(idx) {
  estadoEditandoIdx = idx;
  var modal = document.getElementById('modal-estado');
  var titulo = document.getElementById('modal-estado-titulo');
  var errorEl = document.getElementById('modal-estado-error');
  errorEl.classList.add('hidden');

  if (idx !== null && idx >= 0) {
    titulo.textContent = 'Editar Estado';
    var estado = estadosEditando[idx];
    document.getElementById('estado-codigo').value = estado.codigo;
    document.getElementById('estado-nombre').value = estado.nombre;
    document.getElementById('estado-icono').value = estado.icono;
    document.getElementById('estado-orden').value = estado.orden;
    document.getElementById('estado-clase-css').value = estado.clase_css;
    document.getElementById('estado-activo').checked = estado.activo;
  } else {
    titulo.textContent = 'Nuevo Estado';
    var maxOrden = estadosEditando.reduce(function(max, e) { return Math.max(max, e.orden); }, 0);
    document.getElementById('estado-codigo').value = '';
    document.getElementById('estado-nombre').value = '';
    document.getElementById('estado-icono').value = '';
    document.getElementById('estado-orden').value = maxOrden + 1;
    document.getElementById('estado-clase-css').value = '';
    document.getElementById('estado-activo').checked = true;
  }

  modal.classList.remove('hidden');
}

function cerrarModalEstado() {
  document.getElementById('modal-estado').classList.add('hidden');
  estadoEditandoIdx = null;
}

function guardarEstadoDesdeModal() {
  var codigo = document.getElementById('estado-codigo').value.trim().toUpperCase();
  var nombre = document.getElementById('estado-nombre').value.trim();
  var icono = document.getElementById('estado-icono').value.trim();
  var orden = parseInt(document.getElementById('estado-orden').value, 10);
  var clase_css = document.getElementById('estado-clase-css').value;
  var activo = document.getElementById('estado-activo').checked;

  if (!codigo || !nombre) {
    var errorEl = document.getElementById('modal-estado-error');
    errorEl.textContent = 'Codigo y nombre son obligatorios';
    errorEl.classList.remove('hidden');
    return;
  }

  var duplicado = estadosEditando.findIndex(function(e) { return e.codigo === codigo; });
  if (duplicado >= 0 && duplicado !== estadoEditandoIdx) {
    var errorEl = document.getElementById('modal-estado-error');
    errorEl.textContent = 'Ya existe un estado con codigo "' + codigo + '"';
    errorEl.classList.remove('hidden');
    return;
  }

  var estado = { codigo: codigo, nombre: nombre, icono: icono || '\u26AA', orden: orden, clase_css: clase_css, activo: activo };

  if (estadoEditandoIdx !== null && estadoEditandoIdx >= 0) {
    estadosEditando[estadoEditandoIdx] = estado;
  } else {
    estadosEditando.push(estado);
  }

  cerrarModalEstado();
  renderListaEstadosConfig();
}

// --- Export/Import UI ---

async function exportarConfig() {
  const config = leerFormulario();
  const configAnterior = configActual || config;
  const merged = { ...configAnterior, ...config };
  merged.ventana = configAnterior.ventana || { width: 800, height: 600, left: null, top: null };

  // Recopilar campos extra desde storage
  const storage = await chrome.storage.local.get([
    STORAGE_KEY_SERVICES,
    'tarealog_gmail_query',
    'tarealog_spreadsheet',
    STORAGE_KEY_PIE
  ]);

  const extras = {};
  if (storage[STORAGE_KEY_SERVICES]) extras.servicios = storage[STORAGE_KEY_SERVICES];
  if (storage.tarealog_gmail_query) extras.gmailQuery = storage.tarealog_gmail_query;
  if (storage.tarealog_spreadsheet) extras.spreadsheet = storage.tarealog_spreadsheet;
  if (storage[STORAGE_KEY_PIE]) extras.pieComun = storage[STORAGE_KEY_PIE];

  const exportado = exportarConfigCompleta(merged, extras);
  const json = JSON.stringify(exportado, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const fecha = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `tarealog_config_${fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clickImportarConfig() {
  document.getElementById('input-importar-config').click();
}

function procesarImportacion(e) {
  const file = e.target.files[0];
  if (!file) return;

  const resultadoEl = document.getElementById('import-resultado');

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      const resultado = validarImportacion(data);

      if (!resultado.valido) {
        resultadoEl.className = 'error';
        resultadoEl.textContent = 'Error: ' + resultado.errores.join(', ');
        resultadoEl.classList.remove('hidden');
        return;
      }

      // Guardar config principal
      await guardar(data.config);

      // Restaurar campos extra si existen
      var extras = {};
      if (data.servicios) extras[STORAGE_KEY_SERVICES] = data.servicios;
      if (data.gmailQuery) extras['tarealog_gmail_query'] = data.gmailQuery;
      if (data.spreadsheet) extras['tarealog_spreadsheet'] = data.spreadsheet;
      if (data.pieComun) extras[STORAGE_KEY_PIE] = data.pieComun;

      if (Object.keys(extras).length > 0) {
        await chrome.storage.local.set(extras);
      }

      // Refrescar UI
      await inicializarConfigUI();

      if (typeof configActual !== 'undefined') {
        configActual = data.config;
      }

      if (typeof aplicarConfigFasesSesion === 'function') {
        await aplicarConfigFasesSesion();
      }

      // Refrescar servicios y pie si las funciones existen
      if (typeof cargarServicios === 'function') await cargarServicios();
      if (typeof cargarPieEnUI === 'function') {
        pieComun = data.pieComun || '';
        cargarPieEnUI();
      }

      var importados = ['config'];
      if (data.servicios) importados.push('servicios GAS');
      if (data.gmailQuery) importados.push('query Gmail');
      if (data.spreadsheet) importados.push('spreadsheet');
      if (data.pieComun) importados.push('pie comun');

      resultadoEl.className = 'exito';
      resultadoEl.textContent = 'Importado: ' + importados.join(', ');
      resultadoEl.classList.remove('hidden');
      setTimeout(() => resultadoEl.classList.add('hidden'), 5000);
    } catch (err) {
      resultadoEl.className = 'error';
      resultadoEl.textContent = 'Error al leer archivo: ' + err.message;
      resultadoEl.classList.remove('hidden');
    }
  };
  reader.readAsText(file);

  // Reset para permitir reimportar mismo archivo
  e.target.value = '';
}

// --- Gmail Query ---

async function guardarGmailQueryUI() {
  var input = document.getElementById('cfg-gmail-query');
  var infoEl = document.getElementById('gmail-query-info');
  var errorEl = document.getElementById('gmail-query-error');

  infoEl.classList.add('hidden');
  errorEl.classList.add('hidden');

  var query = input.value.trim();
  if (!query) {
    errorEl.textContent = 'La query no puede estar vacia';
    errorEl.classList.remove('hidden');
    return;
  }

  var servicioActivo = typeof obtenerServicioActivo === 'function' ? obtenerServicioActivo(serviciosGas) : null;
  if (!servicioActivo) {
    errorEl.textContent = 'Configura un servicio GAS primero';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    var url = servicioActivo.url + '?action=configurarGmailQuery';
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmailQuery: query })
    });
    var data = await resp.json();

    if (data.ok) {
      infoEl.textContent = 'Query aplicada: ' + data.gmailQuery;
      infoEl.classList.remove('hidden');
      chrome.storage.local.set({ tarealog_gmail_query: query });
    } else {
      errorEl.textContent = data.error || 'Error al configurar query';
      errorEl.classList.remove('hidden');
    }
  } catch (err) {
    errorEl.textContent = 'Error de conexion: ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

async function cargarGmailQueryInfo() {
  var input = document.getElementById('cfg-gmail-query');
  if (!input) return;

  // Primero cargar el valor local guardado
  var result = await chrome.storage.local.get('tarealog_gmail_query');
  if (result.tarealog_gmail_query) {
    input.value = result.tarealog_gmail_query;
    return;
  }

  // Si no hay local, intentar obtener del servicio GAS
  var servicioActivo = typeof obtenerServicioActivo === 'function' ? obtenerServicioActivo(serviciosGas) : null;
  if (!servicioActivo) {
    input.placeholder = '(in:inbox OR in:sent) newer_than:7d';
    return;
  }

  try {
    var url = servicioActivo.url + '?action=obtenerConfig';
    var resp = await fetch(url);
    var data = await resp.json();
    if (data.ok && data.gmailQuery) {
      input.value = data.gmailQuery;
      chrome.storage.local.set({ tarealog_gmail_query: data.gmailQuery });
    }
  } catch (_) {
    // Silencioso, usa placeholder
  }
}

function aplicarEjemploQuery(e) {
  var btn = e.target.closest('.btn-ejemplo-query');
  if (!btn) return;
  var query = btn.dataset.query;
  if (query) {
    document.getElementById('cfg-gmail-query').value = query;
  }
}

// --- Spreadsheet Selector ---

function extraerSpreadsheetId(input) {
  if (!input) return null;
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

async function detectarSpreadsheet() {
  const input = document.getElementById('cfg-spreadsheet-url').value.trim();
  const infoEl = document.getElementById('spreadsheet-info');
  const errorEl = document.getElementById('spreadsheet-error');
  const nombreEl = document.getElementById('spreadsheet-nombre');
  const idEl = document.getElementById('spreadsheet-id-display');

  infoEl.classList.add('hidden');
  errorEl.classList.add('hidden');

  const spreadsheetId = extraerSpreadsheetId(input);
  if (!spreadsheetId) {
    errorEl.textContent = 'No se pudo extraer un ID valido. Pega la URL completa del spreadsheet.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Intentar configurar en GAS
  const servicioActivo = typeof obtenerServicioActivo === 'function' ? obtenerServicioActivo(serviciosGas) : null;
  if (!servicioActivo) {
    // Sin servicio GAS, guardar solo localmente
    nombreEl.textContent = '(sin verificar — configura un servicio GAS primero)';
    idEl.textContent = spreadsheetId;
    infoEl.classList.remove('hidden');
    guardarSpreadsheetLocal(spreadsheetId, '');
    return;
  }

  try {
    const url = servicioActivo.url + '?action=configurarSpreadsheet';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId })
    });
    const data = await resp.json();

    if (data.ok) {
      nombreEl.textContent = data.nombre || 'Hoja detectada';
      idEl.textContent = spreadsheetId;
      infoEl.classList.remove('hidden');
      guardarSpreadsheetLocal(spreadsheetId, data.nombre || '');
    } else {
      errorEl.textContent = data.error || 'Error al configurar spreadsheet';
      errorEl.classList.remove('hidden');
    }
  } catch (err) {
    errorEl.textContent = 'Error de conexion: ' + err.message;
    errorEl.classList.remove('hidden');
  }
}

function guardarSpreadsheetLocal(id, nombre) {
  chrome.storage.local.set({
    tarealog_spreadsheet: { id, nombre, actualizadoAt: new Date().toISOString() }
  });
}

async function cargarSpreadsheetInfo() {
  const result = await chrome.storage.local.get('tarealog_spreadsheet');
  const info = result.tarealog_spreadsheet;
  if (!info || !info.id) return;

  const input = document.getElementById('cfg-spreadsheet-url');
  const infoEl = document.getElementById('spreadsheet-info');
  const nombreEl = document.getElementById('spreadsheet-nombre');
  const idEl = document.getElementById('spreadsheet-id-display');

  if (input) input.value = info.id;
  if (nombreEl) nombreEl.textContent = info.nombre || '(nombre no disponible)';
  if (idEl) idEl.textContent = info.id;
  if (infoEl) infoEl.classList.remove('hidden');
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  inicializarConfigUI();

  document.getElementById('form-config').addEventListener('submit', guardarConfigDesdeUI);
  document.getElementById('btn-restaurar-defaults').addEventListener('click', restaurarDefaults);

  // Fases
  document.getElementById('btn-nueva-fase').addEventListener('click', () => abrirModalFase(null));
  document.getElementById('btn-guardar-fase').addEventListener('click', guardarFaseDesdeModal);
  document.getElementById('btn-cancelar-fase').addEventListener('click', cerrarModalFase);

  // Estados
  document.getElementById('btn-nuevo-estado').addEventListener('click', function() { abrirModalEstado(null); });
  document.getElementById('btn-guardar-estado').addEventListener('click', guardarEstadoDesdeModal);
  document.getElementById('btn-cancelar-estado').addEventListener('click', cerrarModalEstado);

  // Gmail Query
  document.getElementById('btn-guardar-gmail-query').addEventListener('click', guardarGmailQueryUI);
  document.querySelector('.gmail-query-ejemplos').addEventListener('click', aplicarEjemploQuery);

  // Spreadsheet
  document.getElementById('btn-detectar-spreadsheet').addEventListener('click', detectarSpreadsheet);

  // Export/Import
  document.getElementById('btn-exportar-config').addEventListener('click', exportarConfig);
  document.getElementById('btn-importar-config').addEventListener('click', clickImportarConfig);
  document.getElementById('input-importar-config').addEventListener('change', procesarImportacion);
});
