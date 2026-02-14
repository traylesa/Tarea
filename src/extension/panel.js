const ESTADO_CLASSES = {
  ENVIADO: 'estado-ok',
  RECIBIDO: 'estado-ok',
  GESTIONADO: 'estado-ok',
  ALERTA: 'estado-alerta'
};

const ESTADO_ICONS = {
  ENVIADO: '\u{1F7E2}',
  RECIBIDO: '\u{1F7E2}',
  GESTIONADO: '\u{1F7E2}',
  ALERTA: '\u{1F534}',
  DEFAULT: '\u26AA'
};

// Fases se cargan desde config (ver cargarDatos -> configActual.fases)
let fasesActuales = [];
let FASES_TRANSPORTE = {};

function actualizarFasesDesdeConfig() {
  if (configActual && configActual.fases) {
    fasesActuales = configActual.fases;
  } else {
    fasesActuales = getDefaultFases();
  }
  FASES_TRANSPORTE = fasesAMapaLegacy(fasesActuales);
}

const STORAGE_KEY_PREFS = 'tabulatorPrefs';
const STORAGE_KEY_SERVICES = 'logitask_gas_services';
const STORAGE_KEY_PLANTILLAS = 'logitask_plantillas';
const STORAGE_KEY_AYUDA = 'logitask_ayuda_estado';

let registros = [];
let threadIdSeleccionado = null;
let tabla = null;
let configActual = null;
let agrupacionActiva = false;
let serviciosGas = { services: [], activeServiceId: null };
let plantillasGuardadas = [];
let plantillaEditandoId = null;
let filtroGlobalActivo = false;
const CAMPOS_BUSCABLES = ['estado', 'fase', 'codCar', 'nombreTransportista', 'emailRemitente', 'asunto', 'tipoTarea', 'vinculacion', 'fCarga', 'hCarga', 'fEntrega', 'hEntrega', 'zona', 'zDest'];
let fasesCardActivas = null;
let filtroCargaActivo = false;
let filtroDescargaActivo = false;
let filtroInvertido = false;

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function formatearEstado(cell) {
  const val = cell.getValue() || 'SIN';
  const clase = ESTADO_CLASSES[val] || 'estado-sin';
  const icono = ESTADO_ICONS[val] || ESTADO_ICONS.DEFAULT;
  cell.getElement().classList.add(clase);
  return `${icono} ${val}`;
}

function formatearFase(cell) {
  const val = cell.getValue() || '';
  const clase = obtenerClaseCSS(fasesActuales, val);
  if (clase) cell.getElement().classList.add(clase);
  return FASES_TRANSPORTE[val] || val || '--';
}

function formatearEmail(cell) {
  const row = cell.getRow().getData();
  const val = row.emailRemitente || '--';
  if (row.alerta) {
    cell.getElement().classList.add('estado-alerta');
  }
  return val;
}

function formatearAcciones(cell) {
  const row = cell.getRow().getData();
  if (row.vinculacion !== 'SIN_VINCULAR') return row.vinculacion || '--';

  const btn = document.createElement('button');
  btn.className = 'btn-vincular';
  btn.textContent = 'Vincular';
  btn.addEventListener('click', () => abrirModal(row.threadId));
  return btn;
}

function columnVisibilityMenu() {
  const menu = [];
  if (!tabla) return menu;

  tabla.getColumns().forEach(col => {
    const def = col.getDefinition();
    if (!def.title) return;

    menu.push({
      label: `<input type="checkbox" ${col.isVisible() ? 'checked' : ''}> ${def.title}`,
      action: () => col.isVisible() ? col.hide() : col.show()
    });
  });
  return menu;
}

function crearColumnas() {
  return [
    {
      formatter: 'rowSelection', titleFormatter: 'rowSelection',
      hozAlign: 'center', headerSort: false, width: 30
    },
    {
      title: 'Estado', field: 'estado', width: 100,
      formatter: formatearEstado,
      editor: 'list',
      editorParams: {
        values: {
          ENVIADO: '\u{1F7E2} ENVIADO',
          RECIBIDO: '\u{1F7E2} RECIBIDO',
          GESTIONADO: '\u{1F7E2} GESTIONADO',
          ALERTA: '\u{1F534} ALERTA'
        }
      },
      headerFilter: 'list',
      headerFilterParams: { values: ['', 'ENVIADO', 'RECIBIDO', 'GESTIONADO', 'ALERTA'] },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Fase', field: 'fase', width: 120,
      formatter: formatearFase,
      editor: 'list',
      editorParams: { values: FASES_TRANSPORTE },
      headerFilter: 'list',
      headerFilterParams: { values: Object.keys(FASES_TRANSPORTE) },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'CODCAR', field: 'codCar', width: 70,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Transportista', field: 'nombreTransportista', width: 130,
      headerFilter: 'input',
      formatter: cell => {
        const d = cell.getRow().getData();
        return d.nombreTransportista || d.codTra || '--';
      },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Email', field: 'emailRemitente', width: 150,
      headerFilter: 'input',
      formatter: formatearEmail,
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Tipo', field: 'tipoTarea', width: 100,
      headerSort: true,
      headerFilter: 'list',
      headerFilterParams: { values: ['', 'OPERATIVO', 'ADMINISTRATIVA', 'SIN_CLASIFICAR'] },
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Asunto', field: 'asunto', width: 150,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Fecha', field: 'fechaCorreo', width: 110,
      sorter: 'datetime',
      formatter: cell => {
        const v = cell.getValue();
        return v ? new Date(v).toLocaleString('es-ES') : '--';
      },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'FCarga', field: 'fCarga', width: 90,
      sorter: 'date',
      formatter: cell => {
        const v = cell.getValue();
        if (!v) return '--';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-ES');
      },
      headerFilter: 'input',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'HCarga', field: 'hCarga', width: 60,
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'FEntrega', field: 'fEntrega', width: 90,
      sorter: 'date',
      formatter: cell => {
        const v = cell.getValue();
        if (!v) return '--';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-ES');
      },
      headerFilter: 'input',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'HEntrega', field: 'hEntrega', width: 60,
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Zona', field: 'zona', width: 80,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'ZDest', field: 'zDest', width: 80,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Acciones', field: 'vinculacion', width: 80,
      headerSort: false,
      formatter: formatearAcciones,
      headerMenu: columnVisibilityMenu
    }
  ];
}

async function guardarPreferencias() {
  if (!tabla) return;

  const cols = tabla.getColumns().map(col => {
    const def = col.getDefinition();
    return { field: def.field, width: col.getWidth(), visible: col.isVisible() };
  });

  const sorters = tabla.getSorters().map(s => ({ column: s.field, dir: s.dir }));
  await chrome.storage.local.set({ [STORAGE_KEY_PREFS]: { columnas: cols, sorters } });
}

const guardarPrefsDebounced = debounce(guardarPreferencias, 500);

async function cargarPreferencias() {
  const result = await chrome.storage.local.get(STORAGE_KEY_PREFS);
  return result[STORAGE_KEY_PREFS] || null;
}

function aplicarPreferencias(columnas, prefs) {
  if (!prefs || !prefs.columnas) return columnas;

  const ordenadas = [];
  prefs.columnas.forEach(p => {
    const col = columnas.find(c => c.field === p.field);
    if (col) {
      if (p.width) col.width = p.width;
      if (p.visible === false) col.visible = false;
      ordenadas.push(col);
    }
  });

  columnas.forEach(col => {
    if (!ordenadas.includes(col)) ordenadas.push(col);
  });

  return ordenadas;
}

function conectarPersistencia(t) {
  t.on('columnMoved', guardarPrefsDebounced);
  t.on('columnResized', guardarPrefsDebounced);
  t.on('columnVisibilityChanged', guardarPrefsDebounced);
  t.on('dataSorted', guardarPrefsDebounced);
}

function calcularAlturaTabla() {
  const header = document.querySelector('header');
  const controls = document.getElementById('controls');
  const panelFiltros = document.getElementById('panel-filtros');
  const footer = document.querySelector('footer');
  const hHeader = header ? header.offsetHeight : 0;
  const hControls = controls ? controls.offsetHeight : 0;
  const hFiltros = (panelFiltros && !panelFiltros.classList.contains('hidden')) ? panelFiltros.offsetHeight : 0;
  const hFooter = footer ? footer.offsetHeight : 0;
  return window.innerHeight - hHeader - hControls - hFiltros - hFooter - 32;
}

async function persistirCambio(cell) {
  const campo = cell.getField();
  const row = cell.getRow().getData();
  const valor = cell.getValue();
  const messageId = row.messageId;

  const idx = registros.findIndex(r => r.messageId === messageId);
  if (idx >= 0) registros[idx][campo] = valor;
  await chrome.storage.local.set({ registros });

  const url = obtenerUrlActiva();
  if (url) {
    fetch(url + '?action=actualizarCampo', {
      method: 'POST',
      body: JSON.stringify({ messageId, campo, valor })
    }).catch(() => {});
  }
}

async function inicializarTabla(datos) {
  const prefs = await cargarPreferencias();
  let columnas = crearColumnas();
  columnas = aplicarPreferencias(columnas, prefs);

  const opciones = {
    data: datos,
    columns: columnas,
    layout: 'fitColumns',
    height: calcularAlturaTabla(),
    movableColumns: true,
    resizableColumns: true,
    selectable: true,
    placeholder: 'Sin registros',
    columnDefaults: { resizable: true }
  };

  const configGrupo = obtenerConfigAgrupacion(agrupacionActiva);
  if (configGrupo.groupBy) {
    opciones.groupBy = configGrupo.groupBy;
    opciones.groupStartOpen = configGrupo.groupStartOpen;
    opciones.groupHeader = configGrupo.groupHeader;
  }

  tabla = new Tabulator('#tabla-seguimiento', opciones);

  if (prefs && prefs.sorters && prefs.sorters.length) {
    tabla.on('tableBuilt', () => tabla.setSort(prefs.sorters));
  }

  tabla.on('cellEdited', persistirCambio);
  tabla.on('rowSelectionChanged', () => { actualizarBotonResponder(); actualizarBulkPanel(); });
  conectarPersistencia(tabla);
}

const redimensionarTabla = debounce(() => {
  if (tabla) tabla.setHeight(calcularAlturaTabla());
}, 150);

function actualizarBotonResponder() {
  const btn = document.getElementById('btn-responder-seleccionados');
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  btn.disabled = seleccionados.length === 0;
  btn.textContent = seleccionados.length > 0
    ? `Responder (${seleccionados.length})`
    : 'Responder seleccionados';
}

function actualizarConteo() {
  if (!tabla) return;
  const count = tabla.getDataCount('active');
  document.getElementById('total-registros').textContent = `Total: ${count}`;
  actualizarConteoExcluidos();
}

function actualizarConteoExcluidos() {
  if (!tabla) return;
  const total = tabla.getDataCount();
  const visibles = tabla.getDataCount('active');
  const excluidos = total - visibles;
  const badge = document.getElementById('registros-excluidos');
  const btn = document.getElementById('btn-mostrar-excluidos');
  if (!badge || !btn) return;

  if (excluidos > 0 && !filtroInvertido) {
    badge.textContent = `${excluidos} oculto${excluidos !== 1 ? 's' : ''}`;
    badge.classList.remove('hidden');
    btn.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    if (!filtroInvertido) btn.classList.add('hidden');
  }
}

function mostrarExcluidos() {
  if (!tabla) return;
  filtroInvertido = !filtroInvertido;
  const btn = document.getElementById('btn-mostrar-excluidos');

  if (filtroInvertido) {
    const visibles = new Set(tabla.getData('active').map(r => r.messageId));
    tabla.clearFilter();
    tabla.clearHeaderFilter();
    tabla.addFilter((data) => !visibles.has(data.messageId));
    btn.textContent = 'Volver a filtros';
    btn.classList.add('active');
    btn.classList.remove('hidden');
  } else {
    tabla.clearFilter();
    aplicarFiltroFases();
    aplicarFiltrosTemporales();
    if (filtroGlobalFn) tabla.addFilter(filtroGlobalFn);
    btn.textContent = 'Mostrar ocultos';
    btn.classList.remove('active');
  }
  actualizarConteo();
}

async function renderTabla() {
  if (!tabla) {
    await inicializarTabla(registros);
    tabla.on('tableBuilt', () => {
      actualizarConteo();
    });
  } else {
    await tabla.replaceData(registros);
  }
  actualizarConteo();
}

function obtenerUrlActiva() {
  const activo = obtenerServicioActivo(serviciosGas);
  return activo ? activo.url : (configActual ? configActual.gasUrl : '');
}

async function cargarServicios() {
  const result = await chrome.storage.local.get(STORAGE_KEY_SERVICES);
  if (result[STORAGE_KEY_SERVICES]) {
    serviciosGas = result[STORAGE_KEY_SERVICES];
  } else if (configActual && configActual.gasUrl) {
    serviciosGas = agregarServicio('Principal', configActual.gasUrl, { services: [], activeServiceId: null });
    serviciosGas.activeServiceId = serviciosGas.services[0].id;
    await chrome.storage.local.set({ [STORAGE_KEY_SERVICES]: serviciosGas });
  }
  renderSelectorServicio();
}

function renderSelectorServicio() {
  const select = document.getElementById('selector-servicio');
  select.innerHTML = '';
  if (serviciosGas.services.length === 0) {
    select.innerHTML = '<option value="">Sin servicio</option>';
    return;
  }
  serviciosGas.services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.alias;
    opt.selected = s.id === serviciosGas.activeServiceId;
    select.appendChild(opt);
  });
}

function poblarSelectFases() {
  const select = document.getElementById('bulk-fase');
  if (!select) return;
  select.innerHTML = '';
  Object.entries(FASES_TRANSPORTE).forEach(([codigo, nombre]) => {
    const opt = document.createElement('option');
    opt.value = codigo;
    opt.textContent = nombre;
    select.appendChild(opt);
  });
}

async function aplicarConfigFasesSesion() {
  actualizarFasesDesdeConfig();
  poblarSelectFases();
  renderFaseCards();

  if (tabla) {
    tabla.destroy();
    tabla = null;
    await renderTabla();
  }
}

async function cargarDatos() {
  configActual = await cargar();
  actualizarFasesDesdeConfig();
  poblarSelectFases();
  await cargarServicios();

  try {
    const cached = await chrome.storage.local.get(['registros', 'ultimoBarrido']);
    if (cached.registros) {
      registros = cached.registros;
      await renderTabla();
      actualizarFooter(cached.ultimoBarrido);
    }
    const url = obtenerUrlActiva();
    if (url) {
      const response = await fetch(url + '?action=getRegistros');
      const data = await response.json();
      registros = data.registros || [];
      await chrome.storage.local.set({ registros, ultimoBarrido: new Date().toISOString() });
      await renderTabla();
      actualizarFooter(new Date().toISOString());
    }
  } catch (error) {
    if (tabla) tabla.clearData();
  }
}

async function ejecutarBarrido() {
  const btn = document.getElementById('btn-refresh');
  btn.textContent = 'Procesando...';
  btn.disabled = true;
  try {
    const url = obtenerUrlActiva();
    if (url) {
      await fetch(url + '?action=procesarCorreos', { method: 'POST' });
      await cargarDatos();
    }
  } finally {
    btn.textContent = 'Ejecutar Ahora';
    btn.disabled = false;
  }
}

// --- Filtros avanzados ---

function togglePanelFiltros() {
  const panel = document.getElementById('panel-filtros');
  panel.classList.toggle('hidden');
  setTimeout(() => { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

function renderBaterias() {
  const container = document.getElementById('baterias-filtros');
  const baterias = obtenerBaterias();
  container.innerHTML = '';
  baterias.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn-bateria';
    btn.textContent = b.nombre;
    btn.addEventListener('click', () => {
      if (!tabla) return;
      tabla.setFilter(b.filtros);
      actualizarConteo();
    });
    container.appendChild(btn);
  });
}

function agregarFilaFiltro() {
  const container = document.getElementById('filtros-personalizados');
  const plantilla = document.getElementById('plantilla-filtro');
  const clon = plantilla.cloneNode(true);
  clon.removeAttribute('id');
  clon.querySelector('.filtro-valor').value = '';
  clon.querySelector('.btn-quitar-filtro').addEventListener('click', () => clon.remove());
  container.appendChild(clon);
}

function aplicarFiltrosAvanzados() {
  if (!tabla) return;

  const filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  const definiciones = [];

  filas.forEach(fila => {
    const campo = fila.querySelector('.filtro-campo').value;
    const operador = fila.querySelector('.filtro-operador').value;
    const valor = fila.querySelector('.filtro-valor').value;
    if (campo && valor) {
      definiciones.push({ campo, operador, valor });
    }
  });

  const filtros = construirFiltros(definiciones);
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value || null;
  const fechaFin = document.getElementById('filtro-fecha-fin').value || null;

  tabla.clearFilter();

  if (filtros.length > 0) {
    const filtrosSinCustom = filtros.filter(f => !f.func);
    const filtrosCustom = filtros.filter(f => f.func);

    if (filtrosSinCustom.length) tabla.setFilter(filtrosSinCustom);
    filtrosCustom.forEach(f => {
      tabla.addFilter(f.field, f.func, f.value);
    });
  }

  if (fechaInicio || fechaFin) {
    const sinFecha = document.getElementById('chk-correo-sin-fecha').checked;
    const fnFecha = filtroRangoFechas(fechaInicio, fechaFin, sinFecha);
    tabla.addFilter('fechaCorreo', fnFecha);
  }

  actualizarConteo();
}

function limpiarTodosFiltros() {
  if (!tabla) return;
  tabla.clearFilter();

  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';

  const filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  filas.forEach(fila => {
    fila.querySelector('.filtro-campo').value = '';
    fila.querySelector('.filtro-valor').value = '';
  });

  actualizarConteo();
}

// --- Filtro global ---

const aplicarFiltroGlobalDebounced = debounce(() => {
  if (!tabla) return;
  const texto = document.getElementById('filtro-global').value.trim();

  tabla.removeFilter(filtroGlobalFn);
  if (texto) {
    filtroGlobalActivo = true;
    const fn = filtroGlobal(texto, CAMPOS_BUSCABLES);
    filtroGlobalFn = fn;
    tabla.addFilter(fn);
  } else {
    filtroGlobalActivo = false;
    filtroGlobalFn = null;
  }

  actualizarConteo();
  actualizarBadgeFiltros();
}, 300);

let filtroGlobalFn = null;

function actualizarBadgeFiltros() {
  const badge = document.getElementById('badge-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar-todo');
  if (!badge) return;

  const filtrosTab = tabla ? tabla.getFilters().length : 0;
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;
  const tieneRango = !!(fechaInicio || fechaFin);

  const total = contarFiltrosActivos(filtrosTab, filtroGlobalActivo, tieneRango);

  if (total > 0) {
    badge.textContent = total + ' filtro' + (total !== 1 ? 's' : '');
    badge.classList.remove('hidden');
    if (btnLimpiar) btnLimpiar.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    if (btnLimpiar) btnLimpiar.classList.add('hidden');
  }
}

function limpiarTodoCompleto() {
  if (!tabla) return;

  tabla.clearFilter();
  tabla.clearHeaderFilter();

  document.getElementById('filtro-global').value = '';
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  document.getElementById('chk-carga-sin-fecha').checked = false;
  document.getElementById('chk-descarga-sin-fecha').checked = false;
  document.getElementById('chk-correo-sin-fecha').checked = false;

  filtroGlobalActivo = false;
  filtroGlobalFn = null;
  filtroInvertido = false;

  const btn = document.getElementById('btn-mostrar-excluidos');
  if (btn) {
    btn.textContent = 'Mostrar ocultos';
    btn.classList.remove('active');
  }

  const filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  filas.forEach(fila => {
    fila.querySelector('.filtro-campo').value = '';
    fila.querySelector('.filtro-valor').value = '';
  });

  actualizarConteo();
  actualizarBadgeFiltros();
}

// --- Agrupacion por hilo ---

async function toggleAgrupar() {
  agrupacionActiva = toggleAgrupacion(agrupacionActiva);
  const btn = document.getElementById('btn-toggle-agrupar');
  btn.classList.toggle('active', agrupacionActiva);

  if (tabla) {
    tabla.destroy();
    tabla = null;
  }
  await renderTabla();
}

// --- Respuesta masiva ---

async function cargarPlantillasGuardadas() {
  const result = await chrome.storage.local.get(STORAGE_KEY_PLANTILLAS);
  plantillasGuardadas = (result[STORAGE_KEY_PLANTILLAS] || {}).plantillas || [];
}

function abrirModalRespuesta() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const resultado = validarSeleccion(seleccionados);
  if (!resultado.valido) return;

  const destContainer = document.getElementById('respuesta-destinatarios');
  destContainer.innerHTML = '<strong>Destinatarios:</strong> ' +
    seleccionados.map(r => r.emailRemitente).join(', ');

  const selectPlantilla = document.getElementById('respuesta-plantilla');
  selectPlantilla.innerHTML = '<option value="">-- Sin plantilla --</option>';
  plantillasGuardadas.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.alias;
    selectPlantilla.appendChild(opt);
  });

  document.getElementById('respuesta-asunto').value = '';
  document.getElementById('respuesta-cuerpo').value = '';
  document.getElementById('respuesta-firma').value = '';
  document.getElementById('respuesta-error').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');
  inicializarSelectorFirma();
  document.getElementById('modal-respuesta').classList.remove('hidden');
}

function alSeleccionarPlantillaRespuesta() {
  const id = document.getElementById('respuesta-plantilla').value;
  if (!id) return;

  const plantilla = plantillasGuardadas.find(p => p.id === id);
  if (!plantilla) return;

  document.getElementById('respuesta-asunto').value = plantilla.asunto;
  document.getElementById('respuesta-cuerpo').value = plantilla.cuerpo;
  document.getElementById('respuesta-firma').value = plantilla.firma || '';
}

async function enviarRespuestaMasiva() {
  const seleccionados = tabla.getSelectedData();
  const plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: document.getElementById('respuesta-firma').value
  };

  const payload = construirPayload(seleccionados, plantilla);
  const url = obtenerUrlActiva();
  if (!url) return;

  const btnEnviar = document.getElementById('btn-enviar-respuesta');
  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';

  try {
    const response = await fetch(url + '?action=enviarRespuesta', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data.error) {
      document.getElementById('respuesta-error').textContent = data.error;
      document.getElementById('respuesta-error').classList.remove('hidden');
      return;
    }

    cerrarModalRespuesta();
    await cargarDatos();
  } catch (err) {
    document.getElementById('respuesta-error').textContent = 'Error al enviar: ' + err.message;
    document.getElementById('respuesta-error').classList.remove('hidden');
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar';
  }
}

function cerrarModalRespuesta() {
  document.getElementById('modal-respuesta').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');
}

function previsualizarRespuesta() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: document.getElementById('respuesta-firma').value
  };

  const result = generarPrevisualizacion(seleccionados, plantilla, sanitizarHtml);
  const container = document.getElementById('preview-respuesta-contenido');
  container.innerHTML = '<p><strong>Asunto:</strong> ' + (result.asuntoPreview || '') + '</p>' + result.cuerpoPreview;
  document.getElementById('preview-respuesta').classList.remove('hidden');
}

function inicializarSelectorFirma() {
  const select = document.getElementById('respuesta-firma-selector');
  const textarea = document.getElementById('respuesta-firma');

  select.innerHTML = '<option value="">Sin firma</option><option value="__custom__">Personalizada</option>';

  const firmas = obtenerFirmasDisponibles(plantillasGuardadas);
  firmas.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.alias;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const val = select.value;
    if (val === '__custom__') {
      textarea.classList.remove('hidden');
      textarea.value = '';
    } else if (val === '') {
      textarea.classList.add('hidden');
      textarea.value = '';
    } else {
      const firma = firmas.find(f => f.id === val);
      textarea.classList.add('hidden');
      textarea.value = firma ? firma.firma : '';
    }
  });
}

// --- Plantillas UI ---

function renderListaPlantillas() {
  const container = document.getElementById('lista-plantillas');
  container.innerHTML = '';

  plantillasGuardadas.forEach(p => {
    const item = document.createElement('div');
    item.className = 'plantilla-item';
    item.innerHTML = `<span class="plantilla-alias">${p.alias}</span>
      <button class="btn-editar-plantilla btn-secundario" data-id="${p.id}">Editar</button>
      <button class="btn-eliminar-plantilla btn-secundario" data-id="${p.id}">Eliminar</button>`;
    container.appendChild(item);
  });

  container.querySelectorAll('.btn-editar-plantilla').forEach(btn => {
    btn.addEventListener('click', () => editarPlantillaUI(btn.dataset.id));
  });

  container.querySelectorAll('.btn-eliminar-plantilla').forEach(btn => {
    btn.addEventListener('click', () => eliminarPlantillaUI(btn.dataset.id));
  });
}

function nuevaPlantillaUI() {
  plantillaEditandoId = null;
  document.getElementById('tpl-alias').value = '';
  document.getElementById('tpl-asunto').value = '';
  document.getElementById('tpl-cuerpo').value = '';
  document.getElementById('tpl-firma').value = '';
  document.getElementById('editor-plantilla').classList.remove('hidden');
  document.getElementById('preview-plantilla').classList.add('hidden');
  document.getElementById('panel-variables').classList.add('hidden');
}

function editarPlantillaUI(id) {
  const p = plantillasGuardadas.find(x => x.id === id);
  if (!p) return;

  plantillaEditandoId = id;
  document.getElementById('tpl-alias').value = p.alias;
  document.getElementById('tpl-asunto').value = p.asunto;
  document.getElementById('tpl-cuerpo').value = p.cuerpo;
  document.getElementById('tpl-firma').value = p.firma || '';
  document.getElementById('editor-plantilla').classList.remove('hidden');
}

async function guardarPlantillaUI() {
  const alias = document.getElementById('tpl-alias').value.trim();
  const asunto = document.getElementById('tpl-asunto').value.trim();
  const cuerpo = document.getElementById('tpl-cuerpo').value;
  const firma = document.getElementById('tpl-firma').value;

  if (!alias) return;

  if (plantillaEditandoId) {
    const idx = plantillasGuardadas.findIndex(p => p.id === plantillaEditandoId);
    if (idx >= 0) {
      plantillasGuardadas[idx] = editarPlantilla(plantillasGuardadas[idx], { alias, asunto, cuerpo, firma });
    }
  } else {
    const nueva = crearPlantilla(alias, asunto, cuerpo, firma);
    plantillasGuardadas.push(nueva);
  }

  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
  plantillaEditandoId = null;
}

async function eliminarPlantillaUI(id) {
  plantillasGuardadas = eliminarPlantilla(id, plantillasGuardadas);
  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
}

function previsualizarPlantilla() {
  const cuerpo = document.getElementById('tpl-cuerpo').value;
  const firma = document.getElementById('tpl-firma').value;

  const datosPrueba = {
    codCar: '168345', nombreTransportista: 'Transportes Garcia SL',
    codTra: 'TRA001', emailRemitente: 'garcia@email.com',
    asunto: 'Carga 168345', fechaCorreo: '13/02/2026 15:30',
    estado: 'ENVIADO', tipoTarea: 'OPERATIVO'
  };

  const cuerpoInterpolado = interpolar(cuerpo, datosPrueba);
  const firmaInterpolada = interpolar(firma, datosPrueba);
  const htmlFinal = sanitizarHtml(cuerpoInterpolado + firmaInterpolada);

  document.getElementById('preview-contenido').innerHTML = htmlFinal;
  document.getElementById('preview-plantilla').classList.remove('hidden');
}

function mostrarVariablesDisponibles() {
  const vars = obtenerVariablesDisponibles();
  const tabla = document.getElementById('tabla-variables');
  tabla.innerHTML = '<tr><th>Variable</th><th>Descripcion</th></tr>' +
    vars.map(v => `<tr><td><code>{{${v.nombre}}}</code></td><td>${v.descripcion}</td></tr>`).join('');
  document.getElementById('panel-variables').classList.toggle('hidden');
}

// --- Servicios GAS UI (Config tab) ---

function renderListaServicios() {
  const container = document.getElementById('lista-servicios');
  container.innerHTML = '';

  serviciosGas.services.forEach(s => {
    const item = document.createElement('div');
    item.className = 'servicio-item';
    const esActivo = s.id === serviciosGas.activeServiceId;
    item.innerHTML = `<span class="servicio-alias ${esActivo ? 'servicio-activo' : ''}">${s.alias}</span>
      <span class="servicio-url">${s.url.substring(0, 50)}...</span>
      <button class="btn-eliminar-servicio btn-secundario" data-id="${s.id}">Eliminar</button>`;
    container.appendChild(item);
  });

  container.querySelectorAll('.btn-eliminar-servicio').forEach(btn => {
    btn.addEventListener('click', async () => {
      serviciosGas = eliminarServicio(btn.dataset.id, serviciosGas);
      await chrome.storage.local.set({ [STORAGE_KEY_SERVICES]: serviciosGas });
      renderListaServicios();
      renderSelectorServicio();
    });
  });
}

async function agregarServicioUI() {
  const alias = document.getElementById('nuevo-servicio-alias').value.trim();
  const url = document.getElementById('nuevo-servicio-url').value.trim();

  if (!alias || !url) return;
  const validacion = validarUrlServicio(url);
  if (!validacion.valido) return;

  serviciosGas = agregarServicio(alias, url, serviciosGas);
  if (!serviciosGas.activeServiceId && serviciosGas.services.length === 1) {
    serviciosGas.activeServiceId = serviciosGas.services[0].id;
  }

  await chrome.storage.local.set({ [STORAGE_KEY_SERVICES]: serviciosGas });
  document.getElementById('nuevo-servicio-alias').value = '';
  document.getElementById('nuevo-servicio-url').value = '';
  renderListaServicios();
  renderSelectorServicio();
}

async function alCambiarServicio() {
  const id = document.getElementById('selector-servicio').value;
  serviciosGas = cambiarServicioActivo(id, serviciosGas);
  await chrome.storage.local.set({ [STORAGE_KEY_SERVICES]: serviciosGas });
  await cargarDatos();
}

// --- Ayuda ---

async function inicializarAyuda() {
  const secciones = obtenerSecciones();
  const nav = document.getElementById('ayuda-nav');
  const contenido = document.getElementById('ayuda-contenido');

  nav.innerHTML = '';
  secciones.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'btn-ayuda-seccion';
    btn.textContent = s.titulo;
    btn.addEventListener('click', () => mostrarSeccionAyuda(s.id));
    nav.appendChild(btn);
  });

  const estado = await chrome.storage.local.get(STORAGE_KEY_AYUDA);
  const ultimaSeccion = (estado[STORAGE_KEY_AYUDA] || {}).ultimaSeccion || secciones[0].id;
  mostrarSeccionAyuda(ultimaSeccion);
}

async function mostrarSeccionAyuda(id) {
  const seccion = obtenerSeccion(id);
  if (!seccion) return;

  document.getElementById('ayuda-contenido').innerHTML = seccion.contenido;
  await chrome.storage.local.set({ [STORAGE_KEY_AYUDA]: { ultimaSeccion: id } });

  document.querySelectorAll('.btn-ayuda-seccion').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === seccion.titulo);
  });
}

// --- Cards de fases ---

function renderFaseCards() {
  const container = document.getElementById('fase-cards-container');
  if (!container) return;
  container.innerHTML = '';

  const btnAll = document.createElement('button');
  btnAll.className = 'btn-fase-control';
  btnAll.textContent = 'Marcar Todas';
  btnAll.addEventListener('click', () => toggleTodasFases(true));

  const btnNone = document.createElement('button');
  btnNone.className = 'btn-fase-control';
  btnNone.textContent = 'Desmarcar Todas';
  btnNone.addEventListener('click', () => toggleTodasFases(false));

  container.appendChild(btnAll);
  container.appendChild(btnNone);

  obtenerFasesOrdenadas(fasesActuales).forEach(fase => {
    if (fase.codigo === '' || !fase.activa) return;
    const card = document.createElement('button');
    card.className = 'fase-card';
    if (fase.es_critica) card.classList.add('fase-card-critica');
    if (!fasesCardActivas || fasesCardActivas.includes(fase.codigo)) card.classList.add('active');
    card.textContent = fase.nombre;
    card.dataset.codigo = fase.codigo;
    card.addEventListener('click', () => toggleFaseCard(card, fase.codigo));
    container.appendChild(card);
  });

  const cardSinFase = document.createElement('button');
  cardSinFase.className = 'fase-card fase-card-sin-fase';
  if (!fasesCardActivas || fasesCardActivas.includes('__SIN_FASE__')) cardSinFase.classList.add('active');
  cardSinFase.textContent = '(Sin fase)';
  cardSinFase.dataset.codigo = '__SIN_FASE__';
  cardSinFase.addEventListener('click', () => toggleFaseCard(cardSinFase, '__SIN_FASE__'));
  container.appendChild(cardSinFase);
}

function toggleFaseCard(card, codigo) {
  if (!fasesCardActivas) {
    fasesCardActivas = [
      ...fasesActuales.filter(f => f.codigo !== '' && f.activa).map(f => f.codigo),
      '__SIN_FASE__'
    ];
  }

  const idx = fasesCardActivas.indexOf(codigo);
  if (idx >= 0) {
    fasesCardActivas.splice(idx, 1);
    card.classList.remove('active');
  } else {
    fasesCardActivas.push(codigo);
    card.classList.add('active');
  }

  aplicarFiltroFases();
}

function toggleTodasFases(marcar) {
  if (marcar) {
    fasesCardActivas = null;
  } else {
    fasesCardActivas = [];
  }

  document.querySelectorAll('.fase-card').forEach(card => {
    card.classList.toggle('active', marcar);
  });

  aplicarFiltroFases();
}

let filtroFasesFn = null;

function aplicarFiltroFases() {
  if (!tabla) return;

  if (filtroFasesFn) tabla.removeFilter(filtroFasesFn);

  const fn = filtroFases(fasesCardActivas);
  filtroFasesFn = (data) => fn(data.fase);

  if (fasesCardActivas !== null) {
    tabla.addFilter(filtroFasesFn);
  }

  actualizarConteo();
  actualizarBadgeFiltros();
}

// --- Filtros temporales ---

function formatearFechaInput(date) {
  return date.toISOString().split('T')[0];
}

function toggleFiltroCarga() {
  const checkbox = document.getElementById('chk-rango-carga');
  const inputDesde = document.getElementById('filtro-carga-desde');
  const inputHasta = document.getElementById('filtro-carga-hasta');

  filtroCargaActivo = checkbox.checked;
  inputDesde.disabled = !filtroCargaActivo;
  inputHasta.disabled = !filtroCargaActivo;

  if (filtroCargaActivo) {
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    if (!inputDesde.value) inputDesde.value = formatearFechaInput(hoy);
    if (!inputHasta.value) inputHasta.value = formatearFechaInput(manana);
  }

  aplicarFiltrosTemporales();
}

function toggleFiltroDescarga() {
  const checkbox = document.getElementById('chk-rango-descarga');
  const inputDesde = document.getElementById('filtro-descarga-desde');
  const inputHasta = document.getElementById('filtro-descarga-hasta');

  filtroDescargaActivo = checkbox.checked;
  inputDesde.disabled = !filtroDescargaActivo;
  inputHasta.disabled = !filtroDescargaActivo;

  if (filtroDescargaActivo) {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (!inputDesde.value) inputDesde.value = formatearFechaInput(ayer);
    if (!inputHasta.value) inputHasta.value = formatearFechaInput(hoy);
  }

  aplicarFiltrosTemporales();
}

let filtroCargaFn = null;
let filtroDescargaFn = null;

function aplicarFiltrosTemporales() {
  if (!tabla) return;

  if (filtroCargaFn) { tabla.removeFilter(filtroCargaFn); filtroCargaFn = null; }
  if (filtroDescargaFn) { tabla.removeFilter(filtroDescargaFn); filtroDescargaFn = null; }

  if (filtroCargaActivo) {
    const desde = document.getElementById('filtro-carga-desde').value;
    const hasta = document.getElementById('filtro-carga-hasta').value;
    const sinFecha = document.getElementById('chk-carga-sin-fecha').checked;
    const fn = filtroRangoFechas(desde, hasta, sinFecha);
    filtroCargaFn = (data) => fn(data.fCarga);
    tabla.addFilter(filtroCargaFn);
  }

  if (filtroDescargaActivo) {
    const desde = document.getElementById('filtro-descarga-desde').value;
    const hasta = document.getElementById('filtro-descarga-hasta').value;
    const sinFecha = document.getElementById('chk-descarga-sin-fecha').checked;
    const fn = filtroRangoFechas(desde, hasta, sinFecha);
    filtroDescargaFn = (data) => fn(data.fEntrega);
    tabla.addFilter(filtroDescargaFn);
  }

  actualizarConteo();
  actualizarBadgeFiltros();
}

// --- Edicion masiva ---

function actualizarBulkPanel() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const count = seleccionados.length;
  const btn = document.getElementById('btn-bulk-aplicar');
  btn.disabled = count === 0;
  btn.textContent = count > 0 ? `Aplicar a seleccionados (${count})` : 'Aplicar a seleccionados';
}

async function ejecutarCambioMasivo() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  if (seleccionados.length === 0) return;

  const ids = seleccionados.map(r => r.messageId);
  const chkFase = document.getElementById('chk-bulk-fase');
  const chkEstado = document.getElementById('chk-bulk-estado');

  if (chkFase.checked) {
    const fase = document.getElementById('bulk-fase').value;
    registros = aplicarCambioMasivo(registros, ids, 'fase', fase);
  }

  if (chkEstado.checked) {
    const estado = document.getElementById('bulk-estado').value;
    registros = aplicarCambioMasivo(registros, ids, 'estado', estado);
  }

  await chrome.storage.local.set({ registros });
  await renderTabla();

  const url = obtenerUrlActiva();
  if (url) {
    ids.forEach(messageId => {
      const reg = registros.find(r => r.messageId === messageId);
      if (reg) {
        if (chkFase.checked) {
          fetch(url + '?action=actualizarCampo', {
            method: 'POST',
            body: JSON.stringify({ messageId, campo: 'fase', valor: reg.fase })
          }).catch(() => {});
        }
        if (chkEstado.checked) {
          fetch(url + '?action=actualizarCampo', {
            method: 'POST',
            body: JSON.stringify({ messageId, campo: 'estado', valor: reg.estado })
          }).catch(() => {});
        }
      }
    });
  }
}

// --- Modal vincular (existente) ---

function abrirModal(threadId) {
  threadIdSeleccionado = threadId;
  document.getElementById('modal-vincular').classList.remove('hidden');
  document.getElementById('input-codcar').focus();
}

function cerrarModal() {
  document.getElementById('modal-vincular').classList.add('hidden');
  document.getElementById('input-codcar').value = '';
  threadIdSeleccionado = null;
}

async function confirmarVinculacion() {
  const codCar = parseInt(document.getElementById('input-codcar').value, 10);
  if (!codCar || !threadIdSeleccionado) return;

  try {
    const url = obtenerUrlActiva();
    if (url) {
      await fetch(url + '?action=vincularManual', {
        method: 'POST',
        body: JSON.stringify({ threadId: threadIdSeleccionado, codCar })
      });
      await cargarDatos();
    }
  } finally {
    cerrarModal();
  }
}

function actualizarFooter(timestamp) {
  if (timestamp) {
    const fecha = new Date(timestamp).toLocaleString('es-ES');
    document.getElementById('ultimo-barrido').textContent = `Ultimo barrido: ${fecha}`;
  }
}

function inicializarTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

      if (tab.dataset.tab === 'datos' && tabla) {
        tabla.redraw(true);
      }
      if (tab.dataset.tab === 'plantillas') {
        renderListaPlantillas();
      }
      if (tab.dataset.tab === 'config') {
        renderListaServicios();
      }
      if (tab.dataset.tab === 'ayuda') {
        inicializarAyuda();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  inicializarTabs();
  await cargarPlantillasGuardadas();
  await cargarDatos();
  renderBaterias();
  renderFaseCards();

  // Controles principales
  document.getElementById('btn-refresh').addEventListener('click', ejecutarBarrido);
  document.getElementById('btn-toggle-filtros').addEventListener('click', togglePanelFiltros);
  document.getElementById('btn-toggle-agrupar').addEventListener('click', toggleAgrupar);
  document.getElementById('btn-responder-seleccionados').addEventListener('click', abrirModalRespuesta);
  document.getElementById('selector-servicio').addEventListener('change', alCambiarServicio);

  // Filtro global
  document.getElementById('filtro-global').addEventListener('input', aplicarFiltroGlobalDebounced);
  document.getElementById('btn-limpiar-todo').addEventListener('click', limpiarTodoCompleto);

  // Filtros avanzados
  document.getElementById('btn-agregar-filtro').addEventListener('click', agregarFilaFiltro);
  document.getElementById('btn-aplicar-filtros').addEventListener('click', () => { aplicarFiltrosAvanzados(); actualizarBadgeFiltros(); });
  document.getElementById('btn-limpiar-filtros').addEventListener('click', () => { limpiarTodosFiltros(); actualizarBadgeFiltros(); });
  document.getElementById('plantilla-filtro').querySelector('.btn-quitar-filtro')
    .addEventListener('click', () => limpiarTodosFiltros());

  // Filtros temporales
  document.getElementById('chk-rango-carga').addEventListener('change', toggleFiltroCarga);
  document.getElementById('chk-rango-descarga').addEventListener('change', toggleFiltroDescarga);
  document.getElementById('filtro-carga-desde').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('filtro-carga-hasta').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('filtro-descarga-desde').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('filtro-descarga-hasta').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('chk-carga-sin-fecha').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('chk-descarga-sin-fecha').addEventListener('change', aplicarFiltrosTemporales);

  // Contador excluidos
  document.getElementById('btn-mostrar-excluidos').addEventListener('click', mostrarExcluidos);

  // Edicion masiva
  document.getElementById('btn-bulk-aplicar').addEventListener('click', ejecutarCambioMasivo);

  // Plantillas
  document.getElementById('btn-nueva-plantilla').addEventListener('click', nuevaPlantillaUI);
  document.getElementById('btn-guardar-plantilla').addEventListener('click', guardarPlantillaUI);
  document.getElementById('btn-previsualizar-plantilla').addEventListener('click', previsualizarPlantilla);
  document.getElementById('btn-variables-disponibles').addEventListener('click', mostrarVariablesDisponibles);

  // Servicios GAS
  document.getElementById('btn-agregar-servicio').addEventListener('click', agregarServicioUI);

  // Modal vincular
  document.getElementById('btn-confirmar-vincular').addEventListener('click', confirmarVinculacion);
  document.getElementById('btn-cancelar-vincular').addEventListener('click', cerrarModal);

  // Modal respuesta
  document.getElementById('respuesta-plantilla').addEventListener('change', alSeleccionarPlantillaRespuesta);
  document.getElementById('btn-preview-respuesta').addEventListener('click', previsualizarRespuesta);
  document.getElementById('btn-enviar-respuesta').addEventListener('click', enviarRespuestaMasiva);
  document.getElementById('btn-cancelar-respuesta').addEventListener('click', cerrarModalRespuesta);

  window.addEventListener('resize', redimensionarTabla);
});
