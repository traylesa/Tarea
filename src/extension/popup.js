const GAS_URL = ''; // URL de la Web App desplegada (configurar tras deploy)

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

// Fases se cargan desde config (storage) dinamicamente
let fasesActualesPopup = [];
let FASES_TRANSPORTE = {};

async function actualizarFasesPopup() {
  if (typeof cargar === 'function') {
    const config = await cargar();
    if (config && config.fases && config.fases.length > 0) {
      fasesActualesPopup = config.fases;
    } else if (typeof getDefaultFases === 'function') {
      fasesActualesPopup = getDefaultFases();
    }
  } else if (typeof getDefaultFases === 'function') {
    fasesActualesPopup = getDefaultFases();
  }
  if (typeof fasesAMapaLegacy === 'function') {
    FASES_TRANSPORTE = fasesAMapaLegacy(fasesActualesPopup);
  }
}

const STORAGE_KEY_PREFS = 'tabulatorPrefs';

let registros = [];
let threadIdSeleccionado = null;
let tabla = null;

// --- Utilidades ---

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// --- Formatters custom ---

function formatearEstado(cell) {
  const val = cell.getValue() || 'SIN';
  const clase = ESTADO_CLASSES[val] || 'estado-sin';
  const icono = ESTADO_ICONS[val] || ESTADO_ICONS.DEFAULT;
  cell.getElement().classList.add(clase);
  return `${icono} ${val}`;
}

function formatearFase(cell) {
  const val = cell.getValue() || '';
  const clase = (typeof obtenerClaseCSS === 'function') ? obtenerClaseCSS(fasesActualesPopup, val) : '';
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

// --- Menu visibilidad columnas ---

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

// --- Definicion de columnas ---

function crearColumnas() {
  return [
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
      title: 'Acciones', field: 'vinculacion', width: 80,
      headerSort: false,
      formatter: formatearAcciones,
      headerMenu: columnVisibilityMenu
    }
  ];
}

// --- Persistencia ---

async function guardarPreferencias() {
  if (!tabla) return;

  const cols = tabla.getColumns().map(col => {
    const def = col.getDefinition();
    return {
      field: def.field,
      width: col.getWidth(),
      visible: col.isVisible()
    };
  });

  const sorters = tabla.getSorters().map(s => ({
    column: s.field,
    dir: s.dir
  }));

  const prefs = { columnas: cols, sorters };
  await chrome.storage.local.set({ [STORAGE_KEY_PREFS]: prefs });
}

const guardarPrefsDebounced = debounce(guardarPreferencias, 500);

async function cargarPreferencias() {
  const result = await chrome.storage.local.get(STORAGE_KEY_PREFS);
  return result[STORAGE_KEY_PREFS] || null;
}

function aplicarPreferencias(columnas, prefs) {
  if (!prefs || !prefs.columnas) return columnas;

  const prefMap = {};
  prefs.columnas.forEach(p => { prefMap[p.field] = p; });

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

// --- Persistir cambios de celdas editables ---

async function persistirCambio(cell) {
  const campo = cell.getField();
  const row = cell.getRow().getData();
  const valor = cell.getValue();
  const messageId = row.messageId;

  const idx = registros.findIndex(r => r.messageId === messageId);
  if (idx >= 0) registros[idx][campo] = valor;
  await chrome.storage.local.set({ registros });

  if (GAS_URL) {
    fetch(GAS_URL + '?action=actualizarCampo', {
      method: 'POST',
      body: JSON.stringify({ messageId, campo, valor })
    }).catch(() => {});
  }
}

// --- Inicializacion Tabulator ---

async function inicializarTabla(datos) {
  const prefs = await cargarPreferencias();
  let columnas = crearColumnas();
  columnas = aplicarPreferencias(columnas, prefs);

  tabla = new Tabulator('#tabla-seguimiento', {
    data: datos,
    columns: columnas,
    layout: 'fitColumns',
    height: 320,
    movableColumns: true,
    resizableColumns: true,
    placeholder: 'Sin registros',
    columnDefaults: { resizable: true }
  });

  if (prefs && prefs.sorters && prefs.sorters.length) {
    tabla.on('tableBuilt', () => {
      tabla.setSort(prefs.sorters);
    });
  }

  tabla.on('cellEdited', persistirCambio);
  conectarPersistencia(tabla);
}

// --- Render y filtro ---

function aplicarFiltroGlobal() {
  if (!tabla) return;
  const filtro = document.getElementById('filter-tipo').value;

  if (filtro) {
    tabla.setFilter('tipoTarea', '=', filtro);
  } else {
    tabla.clearFilter();
  }

  actualizarConteo();
}

function actualizarConteo() {
  if (!tabla) return;
  const count = tabla.getDataCount('active');
  document.getElementById('total-registros').textContent = `Total: ${count}`;
}

async function renderTabla() {
  if (!tabla) {
    await inicializarTabla(registros);
    tabla.on('tableBuilt', () => {
      aplicarFiltroGlobal();
      actualizarConteo();
    });
  } else {
    await tabla.replaceData(registros);
    aplicarFiltroGlobal();
  }
}

// --- Datos y acciones (sin cambios funcionales) ---

async function cargarDatos() {
  try {
    const cached = await chrome.storage.local.get(['registros', 'ultimoBarrido']);
    if (cached.registros) {
      registros = cached.registros;
      await renderTabla();
      actualizarFooter(cached.ultimoBarrido);
    }
    if (GAS_URL) {
      const response = await fetch(GAS_URL + '?action=getRegistros');
      const data = await response.json();
      registros = data.registros || [];
      await chrome.storage.local.set({ registros, ultimoBarrido: new Date().toISOString() });
      await renderTabla();
      actualizarFooter(new Date().toISOString());
    }
  } catch (error) {
    if (tabla) {
      tabla.clearData();
    }
  }
}

async function ejecutarBarrido() {
  const btn = document.getElementById('btn-refresh');
  btn.textContent = 'Procesando...';
  btn.disabled = true;
  try {
    if (GAS_URL) {
      await fetch(GAS_URL + '?action=procesarCorreos', { method: 'POST' });
      await cargarDatos();
    }
  } finally {
    btn.textContent = 'Ejecutar Ahora';
    btn.disabled = false;
  }
}

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
    if (GAS_URL) {
      await fetch(GAS_URL + '?action=vincularManual', {
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

// --- Programados popup ---

let programadosCachePopup = [];

function obtenerUrlPopup() {
  // Usa GAS_URL o intenta desde storage
  return GAS_URL || '';
}

function togglePanelProgramadosPopup() {
  var panel = document.getElementById('panel-programados-popup');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) cargarProgramadosPopup();
}

async function cargarProgramadosPopup() {
  var url = obtenerUrlPopup();
  if (!url) {
    // Intentar obtener URL desde storage (servicios GAS)
    try {
      var result = await chrome.storage.local.get('tarealog_gas_services');
      var servicios = result['tarealog_gas_services'];
      if (servicios && servicios.services && servicios.services.length > 0) {
        var activo = servicios.services.find(function(s) { return s.id === servicios.activeServiceId; });
        url = activo ? activo.url : servicios.services[0].url;
      }
    } catch (e) { return; }
  }
  if (!url) return;

  try {
    var response = await fetch(url + '?action=getProgramados');
    var data = await response.json();
    programadosCachePopup = data.programados || [];
  } catch (e) {
    programadosCachePopup = [];
  }
  renderTablaProgramadosPopup();
}

function renderTablaProgramadosPopup() {
  var filtro = document.getElementById('filtro-programados-popup').value;
  var lista = filtrarProgramados(programadosCachePopup, filtro);
  lista = ordenarPorFechaProgramada(lista);

  var tbody = document.querySelector('#tabla-programados-popup tbody');
  var vacio = document.getElementById('programados-vacio-popup');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    vacio.classList.remove('hidden');
    return;
  }
  vacio.classList.add('hidden');

  lista.forEach(function(p) {
    var estado = formatearEstadoProgramado(p.estado);
    var tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #eee';
    tr.innerHTML =
      '<td style="padding:3px 6px" class="' + estado.clase + '">' + estado.html + '</td>' +
      '<td style="padding:3px 6px">' + (p.interlocutor || '--') + '</td>' +
      '<td style="padding:3px 6px">' + (p.asunto || '--').substring(0, 30) + '</td>' +
      '<td style="padding:3px 6px">' + formatearFechaCorta(p.fechaProgramada) + '</td>' +
      '<td style="padding:3px 6px"></td>';

    if (p.estado === 'PENDIENTE') {
      var btn = document.createElement('button');
      btn.textContent = 'Cancelar';
      btn.style.cssText = 'font-size:10px;padding:1px 6px;border:1px solid #d93025;border-radius:3px;background:white;color:#d93025;cursor:pointer';
      btn.addEventListener('click', function() { cancelarProgramadoPopup(p.id); });
      tr.lastChild.appendChild(btn);
    }

    tbody.appendChild(tr);
  });

  // Actualizar badge
  var conteo = contarPorEstado(programadosCachePopup);
  var btn = document.getElementById('btn-toggle-programados-popup');
  btn.textContent = conteo.PENDIENTE > 0 ? 'Programados (' + conteo.PENDIENTE + ')' : 'Programados';
}

async function cancelarProgramadoPopup(id) {
  var url = obtenerUrlPopup();
  if (!url) {
    try {
      var result = await chrome.storage.local.get('tarealog_gas_services');
      var servicios = result['tarealog_gas_services'];
      if (servicios && servicios.services && servicios.services.length > 0) {
        var activo = servicios.services.find(function(s) { return s.id === servicios.activeServiceId; });
        url = activo ? activo.url : servicios.services[0].url;
      }
    } catch (e) { return; }
  }
  if (!url) return;

  try {
    await fetch(url + '?action=cancelarProgramado', {
      method: 'POST',
      body: JSON.stringify({ id: id })
    });
    await cargarProgramadosPopup();
  } catch (e) {
    // silencioso
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await actualizarFasesPopup();
  cargarDatos();
  document.getElementById('btn-refresh').addEventListener('click', ejecutarBarrido);
  document.getElementById('filter-tipo').addEventListener('change', aplicarFiltroGlobal);
  document.getElementById('btn-confirmar-vincular').addEventListener('click', confirmarVinculacion);
  document.getElementById('btn-cancelar-vincular').addEventListener('click', cerrarModal);

  // Programados
  document.getElementById('btn-toggle-programados-popup').addEventListener('click', togglePanelProgramadosPopup);
  document.getElementById('btn-actualizar-programados-popup').addEventListener('click', cargarProgramadosPopup);
  document.getElementById('filtro-programados-popup').addEventListener('change', renderTablaProgramadosPopup);
});
