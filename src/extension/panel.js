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

// STORAGE_KEY_PREFS definida en constants.js (cargado antes via script tag)
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
let almacenNotas = {};
let almacenHistorial = {};
const STORAGE_KEY_NOTAS = 'tarealog_notas';
const STORAGE_KEY_HISTORIAL = 'tarealog_historial';
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
  cell.getElement().classList.add('estado-nuevo');
  return '\u25CF ' + (val || 'NUEVO');
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
      title: 'Ult', field: 'esUltimoHilo', width: 40,
      hozAlign: 'center',
      headerFilter: 'list',
      headerFilterParams: { values: { '': 'Todos', 'true': 'Si', 'false': 'No' } },
      headerFilterFunc: function(headerValue, rowValue) {
        if (headerValue === '') return true;
        return String(!!rowValue) === headerValue;
      },
      formatter: function(cell) { return cell.getValue() ? '*' : ''; },
      headerMenu: columnVisibilityMenu,
      tooltip: 'Ultimo mensaje del hilo'
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
      title: 'Notas', field: '_notas', width: 50,
      headerSort: false,
      hozAlign: 'center',
      formatter: formatearNotasCell,
      accessorDownload: false,
      headerMenu: columnVisibilityMenu
    },
    {
      title: 'Rec', field: '_recordatorios', width: 40,
      headerSort: false,
      hozAlign: 'center',
      formatter: formatearRecordatoriosCell,
      accessorDownload: false,
      headerMenu: columnVisibilityMenu,
      tooltip: 'Recordatorios activos'
    },
    {
      title: 'Prog', field: '_programados', width: 40,
      headerSort: false,
      hozAlign: 'center',
      formatter: formatearProgramadosCell,
      accessorDownload: false,
      headerMenu: columnVisibilityMenu,
      tooltip: 'Envios programados pendientes'
    },
    {
      title: 'Acciones', field: 'vinculacion', width: 80,
      headerSort: false,
      formatter: formatearAcciones,
      headerMenu: columnVisibilityMenu
    }
  ];
}

function formatearNotasCell(cell) {
  var row = cell.getRow().getData();
  var clave = row.codCar || row.threadId;
  if (!clave) return '';
  var etiqueta = row.codCar ? 'Carga ' + row.codCar : 'Hilo';
  var count = contarNotas(clave, almacenNotas);

  var btn = document.createElement('button');
  btn.className = 'btn-notas-cell';
  btn.title = count > 0 ? count + ' nota(s)' : 'Agregar nota';
  btn.textContent = count > 0 ? '\uD83D\uDCDD' : '\u270F\uFE0F';
  if (count > 0) {
    var badge = document.createElement('span');
    badge.className = 'notas-count-badge';
    badge.textContent = count;
    btn.appendChild(badge);
  }
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    abrirModalNotas(clave, etiqueta);
  });
  return btn;
}

function formatearRecordatoriosCell(cell) {
  var row = cell.getRow().getData();
  var codCar = row.codCar;
  if (!codCar || !recordatoriosCache || recordatoriosCache.length === 0) return '';

  var ahora = new Date();
  var count = recordatoriosCache.filter(function(r) {
    return r.codCar === codCar && new Date(r.fechaDisparo).getTime() > ahora.getTime();
  }).length;

  if (count === 0) return '';
  var span = document.createElement('span');
  span.className = 'btn-notas-cell';
  span.title = count + ' recordatorio(s) activo(s)';
  span.textContent = '\u23F0';
  var badge = document.createElement('span');
  badge.className = 'notas-count-badge';
  badge.textContent = count;
  span.appendChild(badge);
  span.style.cursor = 'pointer';
  span.addEventListener('click', function(e) {
    e.stopPropagation();
    abrirDetallePorCodCar(codCar, row.asunto);
  });
  return span;
}

function formatearProgramadosCell(cell) {
  var row = cell.getRow().getData();
  var threadId = row.threadId;
  if (!threadId || !programadosCache || programadosCache.length === 0) return '';

  var count = programadosCache.filter(function(p) {
    return p.threadId === threadId && p.estado === 'PENDIENTE';
  }).length;

  if (count === 0) return '';
  var span = document.createElement('span');
  span.className = 'btn-notas-cell';
  span.title = count + ' envio(s) programado(s)';
  span.textContent = '\uD83D\uDCE8';
  var badge = document.createElement('span');
  badge.className = 'notas-count-badge';
  badge.textContent = count;
  span.appendChild(badge);
  span.style.cursor = 'pointer';
  span.addEventListener('click', function(e) {
    e.stopPropagation();
    abrirModalProgramadoPorThread(threadId);
  });
  return span;
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
  return result[STORAGE_KEY_PREFS] || (typeof DEFAULT_PREFS_REJILLA !== 'undefined' ? DEFAULT_PREFS_REJILLA : null);
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
  const panelDashboard = document.getElementById('panel-dashboard');
  const actionBar = document.getElementById('action-bar');
  const footer = document.querySelector('footer');
  const hHeader = header ? header.offsetHeight : 0;
  const hControls = controls ? controls.offsetHeight : 0;
  const hBulk = (panelBulk && !panelBulk.classList.contains('hidden')) ? panelBulk.offsetHeight : 0;
  const hFiltros = (panelFiltros && !panelFiltros.classList.contains('hidden')) ? panelFiltros.offsetHeight : 0;
  const hDashboard = (panelDashboard && !panelDashboard.classList.contains('hidden')) ? panelDashboard.offsetHeight : 0;
  const hActionBar = (actionBar && !actionBar.classList.contains('hidden')) ? actionBar.offsetHeight : 0;
  const hFooter = footer ? footer.offsetHeight : 0;
  return window.innerHeight - hHeader - hControls - hBulk - hFiltros - hDashboard - hActionBar - hFooter - 32;
}

function mostrarToast(mensaje, tipo) {
  var contenedor = document.getElementById('toast-container');
  if (!contenedor) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (tipo || 'info');
  toast.textContent = mensaje;
  contenedor.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 5000);
}

function marcarCeldaError(cell) {
  if (!cell || !cell.getElement) return;
  cell.getElement().classList.add('celda-error');
}

function limpiarCeldaError(cell) {
  if (!cell || !cell.getElement) return;
  cell.getElement().classList.remove('celda-error');
}

var _propagandoHilo = false;

async function persistirCambio(cell) {
  // Guard: evitar reentrada cuando fila.update() dispara cellEdited
  if (_propagandoHilo) return;

  const campo = cell.getField();
  const row = cell.getRow().getData();
  const valor = cell.getValue();
  const valorAnterior = cell.getOldValue ? cell.getOldValue() : '';
  const messageId = row.messageId;
  const threadId = row.threadId;

  // Evaluar reglas de accion
  var reglasConfig = configActual && configActual.reglasAcciones;
  var resultadosReglas = typeof evaluarReglas === 'function'
    ? evaluarReglas(reglasConfig, campo, valor, valorAnterior)
    : [];

  // Determinar si hay que propagar al hilo (desde reglas o fallback)
  var debePropagarHilo = resultadosReglas.some(function(r) {
    return r.acciones.some(function(a) { return a.tipo === 'PROPAGAR_HILO'; });
  });

  // Fallback: si no hay reglas configuradas, propagar por defecto
  if (!reglasConfig && (campo === 'fase' || campo === 'estado' || campo === 'codCar')) {
    debePropagarHilo = true;
  }

  var propagarAlHilo = debePropagarHilo && threadId;
  if (propagarAlHilo) {
    var valorPropagar = valor;

    // codCar: nunca propagar vacio — buscar valor existente en el hilo
    if (campo === 'codCar' && !valor) {
      var hermano = registros.find(function(r) { return r.threadId === threadId && r.codCar; });
      if (hermano) {
        valorPropagar = hermano.codCar;
      } else {
        propagarAlHilo = false;
      }
    }

    if (propagarAlHilo) {
      registros.forEach(function(r) {
        if (r.threadId === threadId) r[campo] = valorPropagar;
      });
      if (tabla) {
        _propagandoHilo = true;
        try {
          tabla.getRows().forEach(function(fila) {
            var d = fila.getData();
            if (d.threadId === threadId && d.messageId !== messageId) {
              fila.update({ [campo]: valorPropagar });
            }
          });
        } finally {
          _propagandoHilo = false;
        }
      }
    }
  }

  if (!propagarAlHilo) {
    var idx = registros.findIndex(function(r) { return r.messageId === messageId; });
    if (idx >= 0) registros[idx][campo] = valor;
  }
  await chrome.storage.local.set({ registros });

  const url = obtenerUrlActiva();
  if (url) {
    var accion = propagarAlHilo ? 'actualizarCampoPorThread' : 'actualizarCampo';
    var valorBackend = propagarAlHilo ? valorPropagar : valor;
    var payload = propagarAlHilo
      ? { threadId: threadId, campo: campo, valor: valorBackend }
      : { messageId: messageId, campo: campo, valor: valorBackend };

    var resultado = await ejecutarConRetry(async function() {
      var resp = await fetch(url + '?action=' + accion, {
        method: 'POST',
        credentials: 'omit',
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return { ok: true };
    }, 2);

    if (!resultado.ok) {
      mostrarToast('Error al guardar "' + campo + '". Comprueba la conexion.', 'error');
      marcarCeldaError(cell);
    } else {
      limpiarCeldaError(cell);
    }
  }

  // Registrar cambio en historial (local + backend)
  if ((campo === 'fase' || campo === 'estado') && typeof registrarAccion === 'function') {
    try {
      var claveH = row.codCar || row.threadId || '0';
      var desc = campo === 'fase' ? 'Fase -> ' + valor : 'Estado -> ' + valor;
      almacenHistorial = registrarAccion('FASE', claveH, desc, almacenHistorial, new Date()).almacen;
      chrome.storage.local.set({ [STORAGE_KEY_HISTORIAL]: almacenHistorial });
      syncBackend('registrarHistorial', { clave: claveH, tipo: 'FASE', descripcion: desc });
    } catch (e) { /* silencioso */ }
  }

  // Ejecutar acciones de reglas (excepto PROPAGAR_HILO, ya procesado arriba)
  for (var ri = 0; ri < resultadosReglas.length; ri++) {
    var accReglas = resultadosReglas[ri].acciones;
    for (var ai = 0; ai < accReglas.length; ai++) {
      if (accReglas[ai].tipo !== 'PROPAGAR_HILO') {
        await ejecutarAccionRegla(accReglas[ai], row);
      }
    }
  }

  // Re-renderizar action bar tras cambio de fase/estado
  if (tabla && (campo === 'fase' || campo === 'estado') && typeof renderActionBar === 'function') {
    var seleccionados = tabla.getSelectedData();
    if (seleccionados.length === 1) {
      renderActionBar(seleccionados[0]);
    }
  }
}

async function ejecutarAccionRegla(accion, rowData) {
  var params = accion.params || {};

  switch (accion.tipo) {
    case 'SUGERIR_RECORDATORIO':
      if (typeof aceptarSugerencia === 'function') {
        var aceptar = confirm('Sugerencia: "' + params.texto + '" en ' + params.horas + 'h. ¿Crear recordatorio?');
        if (aceptar) {
          var sug = { texto: params.texto, horasAntes: params.horas };
          var rec = aceptarSugerencia(sug, rowData.codCar || null, new Date(), rowData.asunto || null);
          var stored = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
          var lista = stored[STORAGE_KEY_RECORDATORIOS] || [];
          lista.push(rec);
          await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: lista });
          recordatoriosCache = lista;
          if (typeof renderRecordatorios === 'function') renderRecordatorios();
        }
      }
      break;

    case 'CREAR_RECORDATORIO':
      if (typeof aceptarSugerencia === 'function') {
        var sugAuto = { texto: params.texto, horasAntes: params.horas };
        var recAuto = aceptarSugerencia(sugAuto, rowData.codCar || null, new Date(), rowData.asunto || null);
        var storedAuto = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
        var listaAuto = storedAuto[STORAGE_KEY_RECORDATORIOS] || [];
        listaAuto.push(recAuto);
        await chrome.storage.local.set({ [STORAGE_KEY_RECORDATORIOS]: listaAuto });
        recordatoriosCache = listaAuto;
        if (typeof renderRecordatorios === 'function') renderRecordatorios();
        mostrarToast('Recordatorio creado: ' + params.texto, 'info');
      }
      break;

    case 'MOSTRAR_AVISO':
      mostrarToast(params.mensaje || 'Aviso', 'info');
      break;

    case 'CAMBIAR_FASE':
      if (params.fase && rowData.messageId) {
        var idxF = registros.findIndex(function(r) { return r.messageId === rowData.messageId; });
        if (idxF >= 0) {
          registros[idxF].fase = params.fase;
          await chrome.storage.local.set({ registros: registros });
          var urlF = obtenerUrlActiva();
          if (urlF) {
            fetch(urlF + '?action=actualizarCampo', {
              method: 'POST', credentials: 'omit',
              body: JSON.stringify({ messageId: rowData.messageId, campo: 'fase', valor: params.fase })
            }).catch(function() {});
          }
          if (tabla) await renderTabla();
          mostrarToast('Fase cambiada a ' + params.fase, 'info');
        }
      }
      break;

    case 'CAMBIAR_ESTADO':
      if (params.estado && rowData.messageId) {
        var idxE = registros.findIndex(function(r) { return r.messageId === rowData.messageId; });
        if (idxE >= 0) {
          registros[idxE].estado = params.estado;
          await chrome.storage.local.set({ registros: registros });
          var urlE = obtenerUrlActiva();
          if (urlE) {
            fetch(urlE + '?action=actualizarCampo', {
              method: 'POST', credentials: 'omit',
              body: JSON.stringify({ messageId: rowData.messageId, campo: 'estado', valor: params.estado })
            }).catch(function() {});
          }
          if (tabla) await renderTabla();
          mostrarToast('Estado cambiado a ' + params.estado, 'info');
        }
      }
      break;

    case 'PRESELECCIONAR_PLANTILLA':
      if (params.nombrePlantilla) {
        if (params.programarEnvio && typeof abrirModalRespuestaDesdeRegla === 'function') {
          abrirModalRespuestaDesdeRegla(rowData, params);
        } else if (typeof abrirModalRespuesta === 'function') {
          abrirModalRespuesta();
          setTimeout(function() {
            var plantilla = plantillasGuardadas.find(function(p) {
              return p.alias === params.nombrePlantilla;
            });
            if (plantilla) {
              var select = document.getElementById('respuesta-plantilla');
              if (select) {
                select.value = plantilla.id;
                if (typeof alSeleccionarPlantillaRespuesta === 'function') {
                  alSeleccionarPlantillaRespuesta();
                }
              }
            }
          }, 100);
        }
      }
      break;

    case 'INICIAR_SECUENCIA':
      if (params.nombreSecuencia && typeof crearSecuencia === 'function' &&
          typeof SECUENCIAS_PREDEFINIDAS !== 'undefined') {
        var configSeq = SECUENCIAS_PREDEFINIDAS[params.nombreSecuencia];
        if (configSeq) {
          try {
            var storSeq = await chrome.storage.local.get('tarealog_secuencias');
            var listaSeq = storSeq.tarealog_secuencias || [];
            var nuevaSeq = crearSecuencia(
              rowData.codCar || '0',
              rowData.threadId || '',
              params.nombreSecuencia,
              configSeq.pasos,
              new Date()
            );
            listaSeq.push(nuevaSeq);
            await chrome.storage.local.set({ tarealog_secuencias: listaSeq });
            mostrarToast('Secuencia iniciada: ' + params.nombreSecuencia, 'info');
          } catch (e) { /* silencioso si falta codCar/threadId */ }
        }
      }
      break;
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
  tabla.on('rowSelectionChanged', function() {
    actualizarBotonResponder();
    actualizarBulkPanel();
    // Action bar: mostrar solo cuando hay exactamente 1 fila seleccionada
    var seleccionados = tabla.getSelectedData();
    if (seleccionados.length === 1) {
      renderActionBar(seleccionados[0]);
    } else {
      renderActionBar(null);
      setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
    }
  });
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
      aplicarTodosFiltros();
    });
  } else {
    await tabla.replaceData(registros);
    actualizarConteo();
  }
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

function marcarUltimosDelHilo(regs) {
  // Para cada threadId, guardar el messageId del registro mas reciente
  var ultimoIdPorHilo = {};
  var ultimaFechaPorHilo = {};
  regs.forEach(function(r) {
    if (!r.threadId) return;
    var fecha = r.fechaCorreo ? new Date(r.fechaCorreo).getTime() : 0;
    if (!ultimaFechaPorHilo[r.threadId] || fecha >= ultimaFechaPorHilo[r.threadId]) {
      ultimaFechaPorHilo[r.threadId] = fecha;
      ultimoIdPorHilo[r.threadId] = r.messageId;
    }
  });
  regs.forEach(function(r) {
    if (!r.threadId) { r.esUltimoHilo = true; return; }
    r.esUltimoHilo = r.messageId === ultimoIdPorHilo[r.threadId];
  });
  return regs;
}

async function cargarCachesParaMarcas() {
  // Recordatorios desde storage local
  var stored = await chrome.storage.local.get(STORAGE_KEY_RECORDATORIOS);
  recordatoriosCache = stored[STORAGE_KEY_RECORDATORIOS] || [];

  // Programados desde backend
  var url = obtenerUrlActiva();
  if (url) {
    try {
      var response = await fetch(url + '?action=getProgramados', { credentials: 'omit' });
      var data = await response.json();
      programadosCache = data.programados || [];
    } catch (e) { /* mantener cache anterior */ }
  }
}

async function cargarDatos() {
  configActual = await cargar();
  actualizarFasesDesdeConfig();
  actualizarEstadosDesdeConfig();
  poblarSelectFases();
  poblarSelectEstados();
  await cargarServicios();

  // Cargar caches para marcas en tabla
  await cargarCachesParaMarcas();

  try {
    const cached = await chrome.storage.local.get(['registros', 'ultimoBarrido']);
    if (cached.registros) {
      registros = marcarUltimosDelHilo(cached.registros);
      await renderTabla();
      actualizarFooter(cached.ultimoBarrido);
    }
    const url = obtenerUrlActiva();
    if (url) {
      const response = await fetch(url + '?action=getRegistros', { credentials: 'omit' });
      const data = await response.json();
      registros = marcarUltimosDelHilo(data.registros || []);
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
      await fetch(url + '?action=procesarCorreos', { method: 'POST', credentials: 'omit' });
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
    filtros.forEach(function(f) {
      if (f.func) {
        // Filtro custom: envolver en función de fila para Tabulator
        tabla.addFilter(function(data) {
          return f.func(f.value, data[f.field]);
        });
      } else {
        tabla.addFilter(f.field, f.type, f.value);
      }
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

// Respuesta masiva, plantillas -> panel-plantillas.js
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
  var seleccionados = tabla.getSelectedData();
  if (seleccionados.length === 0) return;

  var chkFase = document.getElementById('chk-bulk-fase');
  var chkEstado = document.getElementById('chk-bulk-estado');
  var fase = chkFase.checked ? document.getElementById('bulk-fase').value : null;
  var estado = chkEstado.checked ? document.getElementById('bulk-estado').value : null;

  // Recopilar threadIds unicos de los seleccionados
  var threadsAfectados = {};
  seleccionados.forEach(function(r) {
    if (r.threadId) threadsAfectados[r.threadId] = true;
  });
  var threadIds = Object.keys(threadsAfectados);

  // Propagar a todo el hilo (local)
  registros.forEach(function(r) {
    if (r.threadId && threadsAfectados[r.threadId]) {
      if (fase !== null) r.fase = fase;
      if (estado !== null) r.estado = estado;
    }
  });

  await chrome.storage.local.set({ registros });
  await renderTabla();
  tabla.deselectRow();

  // Backend: un request por threadId (en vez de por messageId)
  var url = obtenerUrlActiva();
  if (url) {
    threadIds.forEach(function(threadId) {
      if (fase !== null) {
        fetch(url + '?action=actualizarCampoPorThread', {
          method: 'POST', credentials: 'omit',
          body: JSON.stringify({ threadId: threadId, campo: 'fase', valor: fase })
        }).catch(function() {});
      }
      if (estado !== null) {
        fetch(url + '?action=actualizarCampoPorThread', {
          method: 'POST', credentials: 'omit',
          body: JSON.stringify({ threadId: threadId, campo: 'estado', valor: estado })
        }).catch(function() {});
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
        credentials: 'omit',
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

// Recordatorios UI -> panel-recordatorios.js

let programadosCache = [];

// Programados UI, horario -> panel-programados.js

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

// --- Sync backend (fire-and-forget) ---

function syncBackend(action, body) {
  var url = obtenerUrlActiva();
  if (!url) { console.warn('syncBackend: sin URL activa para ' + action); return; }
  fetch(url + '?action=' + action, {
    method: 'POST',
    credentials: 'omit',
    body: JSON.stringify(body)
  }).then(function(resp) {
    if (!resp.ok) console.warn('syncBackend ' + action + ': HTTP ' + resp.status);
    return resp.json();
  }).then(function(data) {
    if (data && !data.ok) console.warn('syncBackend ' + action + ': ' + (data.error || 'error'));
  }).catch(function(e) {
    console.warn('syncBackend ' + action + ' fallo: ' + e.message);
  });
}

function fetchBackend(action) {
  var url = obtenerUrlActiva();
  if (!url) return Promise.resolve(null);
  return fetch(url + '?action=' + action, { credentials: 'omit' })
    .then(function(r) { return r.json(); })
    .catch(function() { return null; });
}


// Dashboard, reporte -> panel-dashboard.js
// Action bar, notas -> panel-acciones.js

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
  document.getElementById('btn-guardar-programado').addEventListener('click', guardarCambiosProgramado);
  document.getElementById('btn-enviar-ahora').addEventListener('click', enviarProgramadoAhora);
  document.getElementById('btn-cancelar-programado-modal').addEventListener('click', cancelarProgramadoDesdeModal);
  document.getElementById('btn-reprogramar').addEventListener('click', reprogramarProgramado);
  document.getElementById('btn-cerrar-programado').addEventListener('click', cerrarModalProgramado);

  // Horario laboral
  document.getElementById('btn-guardar-horario').addEventListener('click', guardarHorarioLaboralUI);

  // Recordatorios
  document.getElementById('btn-toggle-recordatorios').addEventListener('click', togglePanelRecordatorios);
  document.getElementById('btn-guardar-recordatorio').addEventListener('click', guardarRecordatorioUI);
  document.getElementById('btn-cancelar-recordatorio').addEventListener('click', cerrarModalRecordatorio);
  document.getElementById('btn-rec-det-guardar').addEventListener('click', guardarDesdeDetalle);
  document.getElementById('btn-rec-det-snooze').addEventListener('click', snoozeDesdeDetalle);
  document.getElementById('btn-rec-det-completar').addEventListener('click', completarDesdeDetalle);
  document.getElementById('btn-rec-det-cerrar').addEventListener('click', cerrarDetalleRecordatorio);

  // Dashboard
  document.getElementById('btn-toggle-dashboard').addEventListener('click', toggleDashboard);

  // Reporte de turno
  document.getElementById('btn-reporte-turno').addEventListener('click', mostrarReporteTurno);
  document.getElementById('btn-copiar-reporte').addEventListener('click', copiarReporte);
  document.getElementById('btn-cerrar-reporte').addEventListener('click', cerrarModalReporte);

  // Notas
  document.getElementById('btn-agregar-nota').addEventListener('click', agregarNotaUI);
  document.getElementById('btn-cerrar-notas').addEventListener('click', cerrarModalNotas);
  document.getElementById('notas-texto').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') agregarNotaUI();
  });

  // Cargar notas e historial
  await cargarNotas();
  chrome.storage.local.get(STORAGE_KEY_HISTORIAL, function(data) {
    almacenHistorial = data[STORAGE_KEY_HISTORIAL] || {};
  });

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
