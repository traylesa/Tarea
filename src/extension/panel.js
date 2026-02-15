// Estados se cargan desde config (ver cargarDatos -> configActual.estados)
let estadosActuales = [];
let ESTADO_EDITOR_MAP = {};
let ESTADO_FILTER_LIST = [''];

function actualizarEstadosDesdeConfig() {
  if (configActual && configActual.estados) {
    estadosActuales = configActual.estados;
  } else {
    estadosActuales = getDefaultEstados();
  }
  ESTADO_EDITOR_MAP = estadosAMapaEditor(estadosActuales);
  ESTADO_FILTER_LIST = estadosAListaHeaderFilter(estadosActuales);
}

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
const STORAGE_KEY_SERVICES = 'tarealog_gas_services';
const STORAGE_KEY_PLANTILLAS = 'tarealog_plantillas';
const STORAGE_KEY_AYUDA = 'tarealog_ayuda_estado';
const STORAGE_KEY_PIE = 'tarealog_pie_comun';

let registros = [];
let threadIdSeleccionado = null;
let tabla = null;
let configActual = null;
let agrupacionActiva = false;
let serviciosGas = { services: [], activeServiceId: null };
let plantillasGuardadas = [];
let plantillaEditandoId = null;
let pieComun = '';
let filtroGlobalActivo = false;
const CAMPOS_BUSCABLES = ['estado', 'fase', 'codCar', 'nombreTransportista', 'emailRemitente', 'interlocutor', 'asunto', 'tipoTarea', 'vinculacion', 'fechaCorreo', 'fCarga', 'hCarga', 'fEntrega', 'hEntrega', 'zona', 'zDest'];
let fasesCardActivas = null;
let filtroCorreoActivo = false;
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
  const val = cell.getValue() || '';
  const estado = obtenerEstadoPorCodigo(estadosActuales, val);
  if (estado) {
    if (estado.clase_css) cell.getElement().classList.add(estado.clase_css);
    return estado.icono + ' ' + estado.nombre;
  }
  cell.getElement().classList.add('estado-sin');
  return '\u26AA ' + (val || 'SIN');
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
      formatter: 'rowSelection',
      titleFormatter: function(cell) {
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.addEventListener('change', function() {
          if (!tabla) return;
          if (chk.checked) {
            tabla.selectRow(tabla.getRows('active'));
          } else {
            tabla.deselectRow();
          }
        });
        return chk;
      },
      hozAlign: 'center', headerSort: false, width: 30
    },
    {
      title: 'Estado', field: 'estado', width: 100,
      formatter: formatearEstado,
      editor: 'list',
      editorParams: { values: ESTADO_EDITOR_MAP },
      headerFilter: 'list',
      headerFilterParams: { values: ESTADO_FILTER_LIST },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Fase', field: 'fase', width: 120,
      formatter: formatearFase,
      editor: 'list',
      editorParams: { values: FASES_TRANSPORTE },
      headerFilter: 'list',
      headerFilterParams: { values: FASES_TRANSPORTE },
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Msgs', field: 'mensajesEnHilo', width: 55,
      hozAlign: 'center',
      sorter: 'number',
      headerFilter: 'number',
      headerFilterPlaceholder: '=',
      headerFilterFunc: function(headerValue, rowValue) {
        if (!headerValue) return true;
        return parseInt(rowValue, 10) === parseInt(headerValue, 10);
      },
      formatter: cell => {
        const v = cell.getValue();
        if (!v || v <= 1) return '1';
        cell.getElement().style.fontWeight = 'bold';
        cell.getElement().style.color = '#2563eb';
        return String(v);
      },
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
      sorter: function(a, b) {
        var da = a ? new Date(a).getTime() : 0;
        var db = b ? new Date(b).getTime() : 0;
        return da - db;
      },
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
      title: 'Referencia', field: 'referencia', width: 100,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Interlocutor', field: 'interlocutor', width: 150,
      headerFilter: 'input',
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Para', field: 'para', width: 150,
      headerFilter: 'input',
      visible: false,
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'CC', field: 'cc', width: 120,
      visible: false,
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'CCO', field: 'cco', width: 120,
      visible: false,
      formatter: cell => cell.getValue() || '--',
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Cuerpo', field: 'cuerpo', width: 200,
      visible: false,
      formatter: cell => {
        const v = cell.getValue() || '';
        return v.length > 100 ? v.substring(0, 100) + '...' : v || '--';
      },
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
  const panelBulk = document.getElementById('panel-bulk');
  const panelFiltros = document.getElementById('panel-filtros');
  const footer = document.querySelector('footer');
  const hHeader = header ? header.offsetHeight : 0;
  const hControls = controls ? controls.offsetHeight : 0;
  const hBulk = (panelBulk && !panelBulk.classList.contains('hidden')) ? panelBulk.offsetHeight : 0;
  const hFiltros = (panelFiltros && !panelFiltros.classList.contains('hidden')) ? panelFiltros.offsetHeight : 0;
  const hFooter = footer ? footer.offsetHeight : 0;
  return window.innerHeight - hHeader - hControls - hBulk - hFiltros - hFooter - 32;
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

  // Sugerencias automaticas al cambiar fase
  if (campo === 'fase' && configActual && typeof generarSugerencia === 'function') {
    var sug = generarSugerencia(valor, configActual);
    if (sug) {
      var aceptar = confirm('Sugerencia: "' + sug.texto + '" en ' + sug.horasAntes + 'h. ¿Crear recordatorio?');
      if (aceptar) {
        var rec = aceptarSugerencia(sug, row.codCar || null, new Date());
        var stored = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
        var lista = stored[STORAGE_KEY_RECORDATORIOS] || [];
        lista.push(rec);
        await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: lista });
        recordatoriosCache = lista;
        renderRecordatorios();
      }
    }
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
  vincularCursorConClicks();
  filaCursorPos = -1;
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
    tabla.addFilter(function(data) { return !visibles.has(data.messageId); });
    btn.textContent = 'Volver a filtros';
    btn.classList.add('active');
    btn.classList.remove('hidden');
  } else {
    // Restaurar todos los filtros normales
    aplicarTodosFiltros();
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

function poblarSelectEstados() {
  const select = document.getElementById('bulk-estado');
  if (!select) return;
  select.innerHTML = '<option value="">--</option>';
  obtenerEstadosOrdenados(estadosActuales)
    .filter(function(e) { return e.activo; })
    .forEach(function(e) {
      var opt = document.createElement('option');
      opt.value = e.codigo;
      opt.textContent = e.icono + ' ' + e.nombre;
      select.appendChild(opt);
    });
}

async function aplicarConfigSesion() {
  actualizarFasesDesdeConfig();
  actualizarEstadosDesdeConfig();
  poblarSelectFases();
  poblarSelectEstados();
  renderFaseCards();

  if (tabla) {
    tabla.destroy();
    tabla = null;
    await renderTabla();
  }
}

// Alias para compatibilidad
var aplicarConfigFasesSesion = aplicarConfigSesion;

async function cargarDatos() {
  configActual = await cargar();
  actualizarFasesDesdeConfig();
  actualizarEstadosDesdeConfig();
  poblarSelectFases();
  poblarSelectEstados();
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

function toggleSeccionFiltro(header) {
  const cuerpo = header.nextElementSibling;
  if (!cuerpo) return;
  header.classList.toggle('abierta');
  cuerpo.classList.toggle('colapsado');
  setTimeout(() => { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

function inicializarSeccionesFiltros() {
  document.querySelectorAll('.filtro-seccion-header[data-toggle]').forEach(header => {
    header.addEventListener('click', () => toggleSeccionFiltro(header));
  });
}

let filtrosBateriaActivos = null;

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

      // Toggle: si la misma batería está activa, desactivar
      if (filtrosBateriaActivos === b.nombre) {
        filtrosBateriaActivos = null;
      } else {
        filtrosBateriaActivos = b.nombre;
      }

      // Actualizar visual
      container.querySelectorAll('.btn-bateria').forEach(x => x.classList.remove('active'));
      if (filtrosBateriaActivos) btn.classList.add('active');

      aplicarTodosFiltros();
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

// === FUNCION CENTRAL DE FILTROS ===
// Reconstruye TODOS los filtros desde el estado actual de la UI.
// Todos los tipos se combinan con AND.

function aplicarTodosFiltros() {
  if (!tabla) return;

  tabla.clearFilter();

  // 1. Filtro global (buscar en todos los campos)
  if (filtroGlobalActivo && filtroGlobalFn) {
    tabla.addFilter(filtroGlobalFn);
  }

  // 2. Filtro de fases (cards)
  if (fasesCardActivas !== null && filtroFasesFn) {
    tabla.addFilter(filtroFasesFn);
  }

  // 3. Filtros temporales (correo, carga, descarga)
  if (filtroCorreoActivo) {
    var correoDesde = document.getElementById('filtro-correo-desde').value;
    var correoHasta = document.getElementById('filtro-correo-hasta').value;
    var correoSinFecha = document.getElementById('chk-correo-sin-fecha').checked;
    var fnCorreo = filtroRangoFechas(correoDesde, correoHasta, correoSinFecha);
    filtroCorreoFn = function(data) { return fnCorreo(data.fechaCorreo); };
    tabla.addFilter(filtroCorreoFn);
  }

  if (filtroCargaActivo) {
    var cargaDesde = document.getElementById('filtro-carga-desde').value;
    var cargaHasta = document.getElementById('filtro-carga-hasta').value;
    var cargaSinFecha = document.getElementById('chk-carga-sin-fecha').checked;
    var fnCarga = filtroRangoFechas(cargaDesde, cargaHasta, cargaSinFecha);
    filtroCargaFn = function(data) { return fnCarga(data.fCarga); };
    tabla.addFilter(filtroCargaFn);
  }

  if (filtroDescargaActivo) {
    var descargaDesde = document.getElementById('filtro-descarga-desde').value;
    var descargaHasta = document.getElementById('filtro-descarga-hasta').value;
    var descargaSinFecha = document.getElementById('chk-descarga-sin-fecha').checked;
    var fnDescarga = filtroRangoFechas(descargaDesde, descargaHasta, descargaSinFecha);
    filtroDescargaFn = function(data) { return fnDescarga(data.fEntrega); };
    tabla.addFilter(filtroDescargaFn);
  }

  // 4. Batería rápida activa
  if (filtrosBateriaActivos) {
    var baterias = obtenerBaterias();
    var bat = baterias.find(function(b) { return b.nombre === filtrosBateriaActivos; });
    if (bat) {
      var batEstandar = bat.filtros.filter(function(f) { return !f.func; });
      var batCustom = bat.filtros.filter(function(f) { return f.func; });
      batEstandar.forEach(function(f) { tabla.addFilter(f.field, f.type, f.value); });
      batCustom.forEach(function(f) { tabla.addFilter(f.func); });
    }
  }

  // 5. Filtros personalizados (campo/operador/valor)
  var filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  var definiciones = [];
  filas.forEach(function(fila) {
    var campo = fila.querySelector('.filtro-campo').value;
    var operador = fila.querySelector('.filtro-operador').value;
    var valor = fila.querySelector('.filtro-valor').value;
    if (campo && valor) {
      definiciones.push({ campo: campo, operador: operador, valor: valor });
    }
  });

  if (definiciones.length > 0) {
    var filtros = construirFiltros(definiciones);
    var filtrosSinCustom = filtros.filter(function(f) { return !f.func; });
    var filtrosCustom = filtros.filter(function(f) { return f.func; });

    filtrosSinCustom.forEach(function(f) {
      tabla.addFilter(f.field, f.type, f.value);
    });
    filtrosCustom.forEach(function(f) {
      tabla.addFilter(f.field, f.func, f.value);
    });
  }

  actualizarConteo();
  actualizarBadgeFiltros();
}

// Alias: los botones y events llaman a estas, que ahora delegan en aplicarTodosFiltros
function aplicarFiltrosAvanzados() {
  aplicarTodosFiltros();
}

function limpiarTodosFiltros() {
  if (!tabla) return;

  // Resetear filtros temporales avanzados
  filtroCorreoActivo = false;
  filtroCargaActivo = false;
  filtroDescargaActivo = false;
  filtroCorreoFn = null;
  filtroCargaFn = null;
  filtroDescargaFn = null;

  // Resetear batería activa
  filtrosBateriaActivos = null;
  document.querySelectorAll('.btn-bateria').forEach(function(b) { b.classList.remove('active'); });

  var chkCorreo = document.getElementById('chk-rango-correo');
  var chkCarga = document.getElementById('chk-rango-carga');
  var chkDescarga = document.getElementById('chk-rango-descarga');
  if (chkCorreo) { chkCorreo.checked = false; }
  if (chkCarga) { chkCarga.checked = false; }
  if (chkDescarga) { chkDescarga.checked = false; }

  ['filtro-correo-desde', 'filtro-correo-hasta',
   'filtro-carga-desde', 'filtro-carga-hasta',
   'filtro-descarga-desde', 'filtro-descarga-hasta'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = ''; el.disabled = true; }
  });

  ['chk-correo-sin-fecha', 'chk-carga-sin-fecha', 'chk-descarga-sin-fecha'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.checked = false;
  });

  // Resetear filtros personalizados
  const filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  filas.forEach(fila => {
    fila.querySelector('.filtro-campo').value = '';
    fila.querySelector('.filtro-valor').value = '';
  });

  // Re-aplicar solo los filtros que quedan (global, fases)
  aplicarTodosFiltros();
}

// --- Filtro global ---

const aplicarFiltroGlobalDebounced = debounce(() => {
  if (!tabla) return;
  const texto = document.getElementById('filtro-global').value.trim();

  if (texto) {
    filtroGlobalActivo = true;
    filtroGlobalFn = filtroGlobal(texto, CAMPOS_BUSCABLES);
  } else {
    filtroGlobalActivo = false;
    filtroGlobalFn = null;
  }

  aplicarTodosFiltros();
}, 300);

let filtroGlobalFn = null;

function actualizarBadgeFiltros() {
  const badge = document.getElementById('badge-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar-todo');
  if (!badge) return;

  const filtrosTab = tabla ? tabla.getFilters().length : 0;
  const total = contarFiltrosActivos(filtrosTab, filtroGlobalActivo, false);

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

  tabla.clearHeaderFilter();

  // Resetear filtro global
  document.getElementById('filtro-global').value = '';
  filtroGlobalActivo = false;
  filtroGlobalFn = null;

  // Resetear invertido
  filtroInvertido = false;
  const btnExcl = document.getElementById('btn-mostrar-excluidos');
  if (btnExcl) {
    btnExcl.textContent = 'Mostrar ocultos';
    btnExcl.classList.remove('active');
  }

  // Resetear fases (todas activas)
  fasesCardActivas = null;
  filtroFasesFn = null;
  document.querySelectorAll('.fase-card').forEach(function(c) { c.classList.add('active'); });

  // Resetear baterías
  filtrosBateriaActivos = null;
  document.querySelectorAll('.btn-bateria').forEach(function(b) { b.classList.remove('active'); });

  // Resetear temporales
  filtroCorreoActivo = false;
  filtroCargaActivo = false;
  filtroDescargaActivo = false;
  filtroCorreoFn = null;
  filtroCargaFn = null;
  filtroDescargaFn = null;

  ['chk-rango-correo', 'chk-rango-carga', 'chk-rango-descarga'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.checked = false;
  });

  ['filtro-correo-desde', 'filtro-correo-hasta',
   'filtro-carga-desde', 'filtro-carga-hasta',
   'filtro-descarga-desde', 'filtro-descarga-hasta'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = ''; el.disabled = true; }
  });

  ['chk-correo-sin-fecha', 'chk-carga-sin-fecha', 'chk-descarga-sin-fecha'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.checked = false;
  });

  // Resetear filtros personalizados
  const filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  filas.forEach(fila => {
    fila.querySelector('.filtro-campo').value = '';
    fila.querySelector('.filtro-valor').value = '';
  });

  // Reconstruir (sin filtros, quedará vacío = todo visible)
  aplicarTodosFiltros();
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
  const result = await chrome.storage.local.get([STORAGE_KEY_PLANTILLAS, STORAGE_KEY_PIE]);
  plantillasGuardadas = (result[STORAGE_KEY_PLANTILLAS] || {}).plantillas || [];
  pieComun = result[STORAGE_KEY_PIE] || '';

  if (plantillasGuardadas.length === 0) {
    plantillasGuardadas = crearPlantillasPredefinidas();
    await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  }
}

async function guardarPieComun() {
  pieComun = document.getElementById('pie-comun').value;
  await chrome.storage.local.set({ [STORAGE_KEY_PIE]: pieComun });
}

function obtenerPieComun() {
  return pieComun || '';
}

function crearPlantillasPredefinidas() {
  return [
    crearPlantilla(
      'Consulta hora carga',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;">' +
        '<p style="margin-bottom: 20px;">Estimad@ compañer@,</p>' +
        '<p style="margin-bottom: 20px;">Respecto a la <b>carga del asunto</b>: ¿Cuál es su <b>hora prevista de llegada</b> al punto de carga?</p>' +
        '<p style="margin-bottom: 20px;">Su reporte nos ayuda a mejorar la <b>planificación operativa</b>. Gracias por su <b>pronta respuesta</b>.</p>' +
      '</div>',
      ''
    ),
    crearPlantilla(
      'Solicitud docs descarga',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 2.0; color: #333;">' +
        '<p style="margin-bottom: 25px;">Estimad@ compañer@:</p>' +
        '<p style="margin-bottom: 25px;">Esperamos que la entrega de la carga <b>referida al asunto</b> se haya realizado con éxito. ¿Podría confirmarnos si la descarga finalizó <b>sin incidencias ni diferencias</b>? En caso de cualquier novedad, le agradecemos que nos lo comunique.</p>' +
        '<p style="margin-bottom: 25px;">Por ello, le solicitamos nos adelante por este medio los <b>documentos justificantes de la entrega</b> a la mayor brevedad. Si aún no dispone de los originales, las <b>fotografías</b> son válidas como adelanto.</p>' +
        '<p style="margin-bottom: 25px;">Le recordamos que también debe remitirnos la <b>factura</b> y los <b>documentos de entrega originales</b> de forma física a nuestra oficina a la mayor brevedad posible.</p>' +
        '<p>Gracias por su colaboración. Quedamos a su entera disposición.</p>' +
      '</div>',
      ''
    ),
    crearPlantilla(
      'Recordatorio docs pendientes',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 2.0; color: #333;">' +
        '<p style="margin-bottom: 14px;">Estimad@ compañer@:</p>' +
        '<p style="margin-bottom: 14px;">Esperamos que se encuentre bien. Le escribimos en relación a la carga <b>referido al asunto</b>.</p>' +
        '<p style="margin-bottom: 14px;">Salvo error u omisión, a fecha de hoy, todavía no hemos recibido los <b>documentos justificativos de la entrega</b>. Entendemos que los plazos pueden complicarse, pero le agradeceríamos enormemente que pudiera adelantárnoslos a la mayor brevedad.</p>' +
        '<p style="margin-bottom: 25px;">Le recordamos que también debe remitirnos la <b>factura</b> y los <b>documentos de entrega originales</b> de forma física a nuestra oficina a la mayor brevedad posible.</p>' +
        '<p>Agradecidos sinceramente por su gestión y atención, quedamos a su entera disposición.</p>' +
      '</div>',
      ''
    )
  ];
}

function abrirModalRespuesta() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const resultado = validarSeleccion(seleccionados);
  if (!resultado.valido) return;

  const destContainer = document.getElementById('respuesta-destinatarios');
  const interlocutores = seleccionados.map(r => r.interlocutor || r.emailRemitente).filter(Boolean);
  const unicos = [...new Set(interlocutores)];
  destContainer.innerHTML = '<strong>Destinatarios:</strong> ' + unicos.join(', ');

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
  document.getElementById('respuesta-error').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');

  const piePreview = document.getElementById('respuesta-pie-preview');
  if (pieComun) {
    piePreview.innerHTML = '<small>Pie comun:</small> ' + sanitizarHtml(pieComun);
    piePreview.style.display = '';
  } else {
    piePreview.style.display = 'none';
  }

  document.getElementById('modal-respuesta').classList.remove('hidden');
}

function alSeleccionarPlantillaRespuesta() {
  const id = document.getElementById('respuesta-plantilla').value;
  if (!id) return;

  const plantilla = plantillasGuardadas.find(p => p.id === id);
  if (!plantilla) return;

  document.getElementById('respuesta-asunto').value = plantilla.asunto;
  document.getElementById('respuesta-cuerpo').value = plantilla.cuerpo;
}

async function enviarRespuestaMasiva() {
  const seleccionados = tabla.getSelectedData();
  const plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: obtenerPieComun()
  };

  const payload = construirPayload(seleccionados, plantilla);
  // Enriquecer cada destinatario con campos para/cc/cco del registro
  payload.destinatarios.forEach(function(dest, i) {
    var reg = seleccionados[i];
    dest.para = reg.para || '';
    dest.cc = reg.cc || '';
    dest.cco = reg.cco || '';
  });
  payload.emailsPorMinuto = (configActual && configActual.emailsPorMinuto) || 10;
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
    firma: obtenerPieComun()
  };

  const result = generarPrevisualizacion(seleccionados, plantilla, sanitizarHtml);
  const container = document.getElementById('preview-respuesta-contenido');
  container.innerHTML = '<p><strong>Asunto:</strong> ' + (result.asuntoPreview || '') + '</p>' + result.cuerpoPreview;
  document.getElementById('preview-respuesta').classList.remove('hidden');
}

function cargarPieEnUI() {
  const textarea = document.getElementById('pie-comun');
  if (textarea) textarea.value = pieComun || '';
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
  document.getElementById('editor-plantilla').classList.remove('hidden');
}

async function guardarPlantillaUI() {
  const alias = document.getElementById('tpl-alias').value.trim();
  const asunto = document.getElementById('tpl-asunto').value.trim();
  const cuerpo = document.getElementById('tpl-cuerpo').value;

  if (!alias) return;

  if (plantillaEditandoId) {
    const idx = plantillasGuardadas.findIndex(p => p.id === plantillaEditandoId);
    if (idx >= 0) {
      plantillasGuardadas[idx] = editarPlantilla(plantillasGuardadas[idx], { alias, asunto, cuerpo });
    }
  } else {
    const nueva = crearPlantilla(alias, asunto, cuerpo, '');
    plantillasGuardadas.push(nueva);
    plantillaEditandoId = nueva.id;
  }

  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
}

async function eliminarPlantillaUI(id) {
  plantillasGuardadas = eliminarPlantilla(id, plantillasGuardadas);
  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
}

function exportarPlantillas() {
  const datos = { version: 1, plantillas: plantillasGuardadas };

  if (pieComun) {
    const incluirPie = confirm('Se ha detectado un pie comun configurado.\n\nPulse Aceptar para INCLUIR el pie en la exportacion.\nPulse Cancelar para exportar SOLO las plantillas (sin pie).');
    if (incluirPie) datos.pieComun = pieComun;
  }

  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tarealog_plantillas_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarPlantillas() {
  document.getElementById('input-importar-plantillas').click();
}

async function procesarImportPlantillas(event) {
  const file = event.target.files[0];
  if (!file) return;

  const resultado = document.getElementById('plantillas-import-resultado');

  try {
    const texto = await file.text();
    const datos = JSON.parse(texto);

    if (!datos.plantillas || !Array.isArray(datos.plantillas)) {
      resultado.textContent = 'Archivo no valido: no contiene plantillas';
      resultado.className = 'error';
      resultado.classList.remove('hidden');
      return;
    }

    const tienePie = datos.pieComun !== undefined;
    let importarPie = false;
    if (tienePie) {
      importarPie = confirm('El archivo incluye un pie comun. ¿Desea importarlo tambien?\n\nPie: ' + datos.pieComun.substring(0, 80) + '...');
    }

    const modo = confirm('¿Reemplazar todas las plantillas actuales?\n\nAceptar = Reemplazar\nCancelar = Agregar a las existentes');

    if (modo) {
      plantillasGuardadas = datos.plantillas;
    } else {
      datos.plantillas.forEach(p => {
        p.id = 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        plantillasGuardadas.push(p);
      });
    }

    await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });

    if (importarPie) {
      pieComun = datos.pieComun;
      await chrome.storage.local.set({ [STORAGE_KEY_PIE]: pieComun });
      cargarPieEnUI();
    }

    renderListaPlantillas();
    const count = datos.plantillas.length;
    resultado.textContent = count + ' plantilla' + (count !== 1 ? 's' : '') + ' importada' + (count !== 1 ? 's' : '') + (importarPie ? ' + pie comun' : '');
    resultado.className = 'exito';
    resultado.classList.remove('hidden');
  } catch (e) {
    resultado.textContent = 'Error al leer archivo: ' + e.message;
    resultado.className = 'error';
    resultado.classList.remove('hidden');
  }

  event.target.value = '';
}

function previsualizarPlantilla() {
  const cuerpo = document.getElementById('tpl-cuerpo').value;
  const pie = obtenerPieComun();

  const datosPrueba = {
    codCar: '168345', nombreTransportista: 'Transportes Garcia SL',
    codTra: 'TRA001', emailRemitente: 'garcia@email.com',
    asunto: 'Carga 168345', fechaCorreo: '13/02/2026 15:30',
    estado: 'ENVIADO', tipoTarea: 'OPERATIVO'
  };

  const cuerpoInterpolado = interpolar(cuerpo, datosPrueba);
  const pieInterpolado = pie ? '<hr style="border:none;border-top:1px solid #ddd;margin:8px 0">' + interpolar(pie, datosPrueba) : '';
  const htmlFinal = sanitizarHtml(cuerpoInterpolado + pieInterpolado);

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

  var fn = filtroFases(fasesCardActivas);
  filtroFasesFn = function(data) { return fn(data.fase); };

  aplicarTodosFiltros();
}

// --- Filtros temporales ---

function formatearFechaInput(date) {
  return date.toISOString().split('T')[0];
}

function toggleFiltroCorreo() {
  const checkbox = document.getElementById('chk-rango-correo');
  const inputDesde = document.getElementById('filtro-correo-desde');
  const inputHasta = document.getElementById('filtro-correo-hasta');

  filtroCorreoActivo = checkbox.checked;
  inputDesde.disabled = !filtroCorreoActivo;
  inputHasta.disabled = !filtroCorreoActivo;

  if (filtroCorreoActivo) {
    const hoy = new Date();
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 7);
    if (!inputDesde.value) inputDesde.value = formatearFechaInput(hace7);
    if (!inputHasta.value) inputHasta.value = formatearFechaInput(hoy);
  }

  aplicarFiltrosTemporales();
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

let filtroCorreoFn = null;
let filtroCargaFn = null;
let filtroDescargaFn = null;

function aplicarFiltrosTemporales() {
  aplicarTodosFiltros();
}

// --- Navegacion por teclado ---

let filaCursorPos = -1;

function inicializarNavegacionTeclado() {
  var contenedor = document.getElementById('tabla-seguimiento');
  contenedor.setAttribute('tabindex', '0');

  contenedor.addEventListener('keydown', function(e) {
    if (!tabla) return;
    // No interferir con inputs de edicion/filtros
    if (e.target.matches('input, select, textarea')) return;

    var rows = tabla.getRows('active');
    if (rows.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navegarFila(1, rows);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navegarFila(-1, rows);
        break;
      case ' ':
        e.preventDefault();
        toggleSeleccionCursor(rows);
        break;
      case 'Home':
        e.preventDefault();
        navegarAFila(0, rows);
        break;
      case 'End':
        e.preventDefault();
        navegarAFila(rows.length - 1, rows);
        break;
      case 'PageDown':
        e.preventDefault();
        navegarFila(15, rows);
        break;
      case 'PageUp':
        e.preventDefault();
        navegarFila(-15, rows);
        break;
      case 'a':
        if (e.ctrlKey) {
          e.preventDefault();
          tabla.selectRow(tabla.getRows('active'));
        }
        break;
      case 'Escape':
        tabla.deselectRow();
        break;
    }
  });
}

function navegarFila(delta, rows) {
  var newPos = filaCursorPos + delta;
  newPos = Math.max(0, Math.min(rows.length - 1, newPos));
  setCursorPos(newPos, rows);
}

function navegarAFila(pos, rows) {
  setCursorPos(Math.max(0, Math.min(rows.length - 1, pos)), rows);
}

function setCursorPos(pos, rows) {
  // Quitar cursor anterior
  document.querySelectorAll('.tabulator-row.fila-cursor').forEach(function(el) {
    el.classList.remove('fila-cursor');
  });

  filaCursorPos = pos;
  var row = rows[filaCursorPos];

  // scrollToRow garantiza que la fila esta renderizada en el DOM virtual
  tabla.scrollToRow(row, 'nearest', false)
    .then(function() {
      var el = row.getElement();
      if (el) el.classList.add('fila-cursor');
    })
    .catch(function() {
      var el = row.getElement();
      if (el) el.classList.add('fila-cursor');
    });
}

function toggleSeleccionCursor(rows) {
  if (filaCursorPos < 0 || filaCursorPos >= rows.length) return;
  rows[filaCursorPos].toggleSelect();
}

function vincularCursorConClicks() {
  if (!tabla) return;
  tabla.on('rowClick', function(e, row) {
    var rows = tabla.getRows('active');
    var idx = rows.indexOf(row);
    if (idx >= 0) {
      filaCursorPos = idx;
      document.querySelectorAll('.tabulator-row.fila-cursor').forEach(function(el) {
        el.classList.remove('fila-cursor');
      });
      var el = row.getElement();
      if (el) el.classList.add('fila-cursor');
    }
  });
}

// --- Edicion masiva ---

function actualizarBulkPanel() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const count = seleccionados.length;
  const panel = document.getElementById('panel-bulk');
  const btn = document.getElementById('btn-bulk-aplicar');

  const eraVisible = !panel.classList.contains('hidden');
  const debeSerVisible = count > 0;

  if (debeSerVisible) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }

  btn.disabled = count === 0;
  btn.textContent = count > 0 ? `Aplicar a seleccionados (${count})` : 'Aplicar a seleccionados';

  // Solo recalcular altura si cambio la visibilidad del panel
  if (eraVisible !== debeSerVisible) {
    var holder = document.querySelector('.tabulator-tableholder');
    var scrollPos = holder ? holder.scrollTop : 0;
    setTimeout(function() {
      if (tabla) tabla.setHeight(calcularAlturaTabla());
      if (holder) holder.scrollTop = scrollPos;
    }, 50);
  }
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
  tabla.deselectRow();

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

// --- Recordatorios ---

const STORAGE_KEY_RECORDATORIOS = 'tarealog_recordatorios';
let recordatoriosCache = [];
let recordatorioCodCar = null;

function togglePanelRecordatorios() {
  var panel = document.getElementById('panel-recordatorios');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) cargarRecordatoriosUI();
  setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

async function cargarRecordatoriosUI() {
  var stored = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
  recordatoriosCache = stored[STORAGE_KEY_RECORDATORIOS] || [];
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
    var ahora = new Date();
    var diffMin = Math.round((disparo - ahora) / 60000);
    var countdown = diffMin > 60 ? Math.round(diffMin / 60) + 'h' : diffMin + 'min';

    div.innerHTML =
      '<div style="flex:1">' +
        '<strong>' + (rec.codCar ? 'Carga ' + rec.codCar + ' — ' : '') + '</strong>' +
        rec.texto +
        ' <span style="color:#999">(' + countdown + ')</span>' +
        (rec.origen === 'sugerido' ? ' <span style="color:#2196F3;font-size:10px">[sugerido]</span>' : '') +
      '</div>';

    var btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-secundario';
    btnEliminar.textContent = 'X';
    btnEliminar.style.cssText = 'font-size:10px;padding:2px 6px;margin-left:8px';
    btnEliminar.addEventListener('click', function() { eliminarRecordatorioUI(rec.id); });
    div.appendChild(btnEliminar);
    container.appendChild(div);
  });

  // Badge en boton
  var btn = document.getElementById('btn-toggle-recordatorios');
  btn.textContent = activos.length > 0 ? 'Recordatorios (' + activos.length + ')' : 'Recordatorios';
}

async function eliminarRecordatorioUI(id) {
  recordatoriosCache = eliminarRecordatorio(id, recordatoriosCache);
  await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
  renderRecordatorios();
}

function abrirModalRecordatorio(codCar) {
  recordatorioCodCar = codCar || null;
  document.getElementById('recordatorio-texto').value = '';
  document.getElementById('recordatorio-preset').value = '1h';
  document.getElementById('recordatorio-error').classList.add('hidden');
  document.getElementById('recordatorio-carga-info').textContent = codCar ? 'Carga: ' + codCar : 'Sin carga asociada';
  document.getElementById('modal-recordatorio').classList.remove('hidden');
  document.getElementById('recordatorio-texto').focus();
}

async function guardarRecordatorioUI() {
  var texto = document.getElementById('recordatorio-texto').value;
  var preset = document.getElementById('recordatorio-preset').value;

  try {
    var rec = crearRecordatorio(texto, recordatorioCodCar, preset, new Date(), recordatoriosCache);
    recordatoriosCache.push(rec);
    await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: recordatoriosCache });
    chrome.runtime.sendMessage({ tipo: 'RECORDATORIO_CREADO' });
    cerrarModalRecordatorio();
    renderRecordatorios();
  } catch (e) {
    document.getElementById('recordatorio-error').textContent = e.message;
    document.getElementById('recordatorio-error').classList.remove('hidden');
  }
}

function cerrarModalRecordatorio() {
  document.getElementById('modal-recordatorio').classList.add('hidden');
  recordatorioCodCar = null;
}

// --- Envios programados ---

let programadosCache = [];

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
    var response = await fetch(url + '?action=getProgramados');
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

  // Actualizar badge en boton
  var conteo = contarPorEstado(programadosCache);
  var btn = document.getElementById('btn-toggle-programados');
  btn.textContent = conteo.PENDIENTE > 0 ? 'Programados (' + conteo.PENDIENTE + ')' : 'Programados';
}

async function cancelarProgramado(id) {
  var url = obtenerUrlActiva();
  if (!url) return;

  try {
    await fetch(url + '?action=cancelarProgramado', {
      method: 'POST',
      body: JSON.stringify({ id: id })
    });
    await cargarProgramados();
  } catch (e) {
    // silencioso
  }
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

  var seleccionados = tabla.getSelectedData();
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
        asunto: dest.asunto,
        cuerpo: cuerpoFinal,
        cc: dest.cc || '',
        bcc: dest.cco || '',
        fechaProgramada: fechaProg.toISOString()
      };

      try {
        var response = await fetch(url + '?action=programarEnvio', {
          method: 'POST',
          body: JSON.stringify(body)
        });
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
      // Refrescar panel programados si visible
      var panel = document.getElementById('panel-programados');
      if (!panel.classList.contains('hidden')) cargarProgramados();
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
    // Pre-rellenar con +1 hora
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
    var response = await fetch(url + '?action=getHorarioLaboral');
    var data = await response.json();
    if (data.ok && data.horario) {
      var h = data.horario;
      document.querySelectorAll('.chk-dia-laboral').forEach(function(chk) {
        chk.checked = h.dias.indexOf(parseInt(chk.dataset.dia, 10)) !== -1;
      });
      document.getElementById('cfg-hora-inicio').value = h.horaInicio;
      document.getElementById('cfg-hora-fin').value = h.horaFin;
    }
  } catch (e) {
    // usar defaults del HTML
  }
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
      method: 'POST',
      body: JSON.stringify({ horario: horario })
    });
    var data = await response.json();
    var info = document.getElementById('horario-info');
    if (data.ok) {
      info.textContent = 'Horario guardado correctamente';
      info.className = 'exito';
      info.classList.remove('hidden');
    } else {
      info.textContent = data.error || 'Error al guardar';
      info.className = 'errores';
      info.classList.remove('hidden');
    }
    setTimeout(function() { info.classList.add('hidden'); }, 3000);
  } catch (e) {
    // silencioso
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
        cargarHorarioLaboral();
      }
      if (tab.dataset.tab === 'ayuda') {
        inicializarAyuda();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  inicializarTabs();
  inicializarNavegacionTeclado();
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
  inicializarSeccionesFiltros();
  document.getElementById('btn-agregar-filtro').addEventListener('click', agregarFilaFiltro);
  document.getElementById('btn-aplicar-filtros').addEventListener('click', () => { aplicarFiltrosAvanzados(); actualizarBadgeFiltros(); });
  document.getElementById('btn-limpiar-filtros').addEventListener('click', () => { limpiarTodosFiltros(); actualizarBadgeFiltros(); });
  document.getElementById('plantilla-filtro').querySelector('.btn-quitar-filtro')
    .addEventListener('click', () => limpiarTodosFiltros());

  // Filtros temporales
  document.getElementById('chk-rango-correo').addEventListener('change', toggleFiltroCorreo);
  document.getElementById('filtro-correo-desde').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('filtro-correo-hasta').addEventListener('change', aplicarFiltrosTemporales);
  document.getElementById('chk-correo-sin-fecha').addEventListener('change', aplicarFiltrosTemporales);
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
  document.getElementById('chk-bulk-fase').addEventListener('change', (e) => {
    document.getElementById('bulk-fase').disabled = !e.target.checked;
  });
  document.getElementById('chk-bulk-estado').addEventListener('change', (e) => {
    document.getElementById('bulk-estado').disabled = !e.target.checked;
  });
  document.getElementById('btn-bulk-aplicar').addEventListener('click', ejecutarCambioMasivo);

  // Plantillas
  document.getElementById('btn-nueva-plantilla').addEventListener('click', nuevaPlantillaUI);
  document.getElementById('btn-guardar-plantilla').addEventListener('click', guardarPlantillaUI);
  document.getElementById('btn-previsualizar-plantilla').addEventListener('click', previsualizarPlantilla);
  document.getElementById('btn-variables-disponibles').addEventListener('click', mostrarVariablesDisponibles);
  document.getElementById('btn-guardar-pie').addEventListener('click', guardarPieComun);
  document.getElementById('btn-exportar-plantillas').addEventListener('click', exportarPlantillas);
  document.getElementById('btn-importar-plantillas').addEventListener('click', importarPlantillas);
  document.getElementById('input-importar-plantillas').addEventListener('change', procesarImportPlantillas);
  cargarPieEnUI();

  // Servicios GAS
  document.getElementById('btn-agregar-servicio').addEventListener('click', agregarServicioUI);

  // Modal vincular
  document.getElementById('btn-confirmar-vincular').addEventListener('click', confirmarVinculacion);
  document.getElementById('btn-cancelar-vincular').addEventListener('click', cerrarModal);

  // Modal respuesta
  document.getElementById('respuesta-plantilla').addEventListener('change', alSeleccionarPlantillaRespuesta);
  document.getElementById('btn-preview-respuesta').addEventListener('click', previsualizarRespuesta);
  document.getElementById('btn-enviar-respuesta').addEventListener('click', despacharEnvio);
  document.getElementById('btn-cancelar-respuesta').addEventListener('click', cerrarModalRespuesta);

  // Programados
  document.getElementById('btn-toggle-programados').addEventListener('click', togglePanelProgramados);
  document.getElementById('btn-actualizar-programados').addEventListener('click', cargarProgramados);
  document.getElementById('filtro-programados').addEventListener('change', renderTablaProgramados);
  document.getElementById('chk-programar-envio').addEventListener('change', toggleCheckboxProgramar);

  // Horario laboral
  document.getElementById('btn-guardar-horario').addEventListener('click', guardarHorarioLaboralUI);

  // Recordatorios
  document.getElementById('btn-toggle-recordatorios').addEventListener('click', togglePanelRecordatorios);
  document.getElementById('btn-guardar-recordatorio').addEventListener('click', guardarRecordatorioUI);
  document.getElementById('btn-cancelar-recordatorio').addEventListener('click', cerrarModalRecordatorio);

  // Resumen de alertas
  document.getElementById('btn-resumen').addEventListener('click', function() {
    chrome.runtime.sendMessage({ tipo: 'ABRIR_RESUMEN' });
  });

  // Aplicar filtro pendiente desde click-through de ventana resumen
  chrome.storage.local.get('tarealog_filtro_pendiente', function(data) {
    if (!data.tarealog_filtro_pendiente) return;
    var filtros = data.tarealog_filtro_pendiente.filtros;
    chrome.storage.local.remove('tarealog_filtro_pendiente');
    if (filtros && filtros.length > 0 && tabla) {
      var tabulatorFilters = filtros.map(function(f) {
        return { field: f.field, type: f.type, value: f.value };
      });
      tabla.setFilter(tabulatorFilters);
    }
  });

  window.addEventListener('resize', redimensionarTabla);
});
