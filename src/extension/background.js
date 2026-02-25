// Importar modulos de logica pura en service worker
importScripts('resilience.js');
importScripts('constants.js');
importScripts('date-utils.js');
importScripts('alerts.js');
importScripts('alert-summary.js');
importScripts('reminders.js');
importScripts('sequences.js');
importScripts('shift-report.js');

const ALARM_NAME = 'tarealog-barrido';
const ALARM_MATUTINO = 'tarealog-resumen-matutino';
const ALARM_RECORDATORIOS = 'tarealog-recordatorios';
const ALARM_SECUENCIAS = 'tarealog-secuencias';
const STORAGE_KEY_CONFIG = 'tarealog_config';

let panelWindowId = null;

function getDefaults() {
  return {
    gasUrl: '',
    intervaloMinutos: 15,
    rutaCsvErp: '',
    patrones: {
      codcarAdjunto: 'Carga_0*(\\d+)\\.pdf',
      keywordsAdmin: 'certificado|hacienda|347|aeat|factura'
    },
    ventana: { width: 800, height: 600, left: null, top: null }
  };
}

async function cargarConfig() {
  const defaults = getDefaults();
  const result = await chrome.storage.local.get(STORAGE_KEY_CONFIG);
  const guardada = result[STORAGE_KEY_CONFIG];
  if (!guardada) return defaults;
  return {
    ...defaults,
    ...guardada,
    patrones: { ...defaults.patrones, ...(guardada.patrones || {}) },
    ventana: { ...defaults.ventana, ...(guardada.ventana || {}) }
  };
}

async function abrirOEnfocarVentana() {
  if (panelWindowId !== null) {
    try {
      const win = await chrome.windows.get(panelWindowId);
      if (win) {
        await chrome.windows.update(panelWindowId, { focused: true });
        return;
      }
    } catch {
      panelWindowId = null;
    }
  }

  const config = await cargarConfig();
  const opts = {
    url: 'panel.html',
    type: 'popup',
    width: config.ventana.width,
    height: config.ventana.height
  };
  if (config.ventana.left !== null) opts.left = config.ventana.left;
  if (config.ventana.top !== null) opts.top = config.ventana.top;

  const win = await chrome.windows.create(opts);
  panelWindowId = win.id;
}

async function guardarEstadoVentana(windowId) {
  if (windowId !== panelWindowId) return;
  try {
    const win = await chrome.windows.get(windowId);
    const config = await cargarConfig();
    config.ventana = {
      width: win.width,
      height: win.height,
      left: win.left,
      top: win.top
    };
    await chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: config });
  } catch {
    // Ventana ya cerrada, ignorar
  }
}

async function abrirVentanaResumen() {
  await chrome.windows.create({
    url: 'alert-summary.html',
    type: 'popup',
    width: 450,
    height: 500
  });
}

chrome.action.onClicked.addListener(() => {
  abrirOEnfocarVentana();
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) {
    panelWindowId = null;
  }
});

chrome.windows.onBoundsChanged.addListener((win) => {
  if (win.id === panelWindowId) {
    guardarEstadoVentana(win.id);
  }
});

// Crear/recrear alarmas — necesario en onInstalled Y al arrancar el SW
async function asegurarAlarmas() {
  const config = await cargarConfig();
  const existentes = await chrome.alarms.getAll();
  var nombres = existentes.map(function(a) { return a.name; });

  if (nombres.indexOf(ALARM_NAME) === -1) {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: config.intervaloMinutos });
  }
  if (nombres.indexOf(ALARM_MATUTINO) === -1) {
    chrome.alarms.create(ALARM_MATUTINO, { periodInMinutes: 60 });
  }
  if (nombres.indexOf(ALARM_RECORDATORIOS) === -1) {
    chrome.alarms.create(ALARM_RECORDATORIOS, { periodInMinutes: 1 });
  }
  if (nombres.indexOf(ALARM_SECUENCIAS) === -1) {
    chrome.alarms.create(ALARM_SECUENCIAS, { periodInMinutes: 15 });
  }
}

chrome.runtime.onInstalled.addListener(() => { asegurarAlarmas(); });

// Recrear alarmas cada vez que el SW arranca (pueden perderse en MV3)
asegurarAlarmas();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await ejecutarBarridoPeriodico();
    return;
  }
  if (alarm.name === ALARM_MATUTINO) {
    await verificarResumenMatutino();
    return;
  }
  if (alarm.name === ALARM_RECORDATORIOS) {
    await verificarRecordatorios();
    return;
  }
  if (alarm.name === ALARM_SECUENCIAS) {
    await verificarSecuencias();
    return;
  }
  if (alarm.name === ALARM_BARRIDO_CONTINUACION) {
    await ejecutarBarridoPeriodico();
    return;
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'RECREAR_ALARMA') {
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: msg.intervaloMinutos
      });
    });
  }
  if (msg.tipo === 'ABRIR_RESUMEN') {
    abrirVentanaResumen();
  }
  if (msg.tipo === 'ABRIR_PANEL_FILTRADO') {
    chrome.storage.local.set({ tarealog_filtro_pendiente: { filtros: msg.filtros } }, () => {
      abrirOEnfocarVentana();
    });
  }
  if (msg.tipo === 'ABRIR_RESUMEN_PANEL') {
    abrirOEnfocarVentana();
  }
  if (msg.tipo === 'RECORDATORIO_CREADO') {
    // Forzar verificacion inmediata si se crea recordatorio cercano
    verificarRecordatorios();
  }
});

async function verificarResumenMatutino() {
  const config = await cargarConfig();
  if (!config.resumenMatutino || !config.resumenMatutino.activado) return;

  const ahora = new Date();
  const stored = await chrome.storage.local.get(['tarealog_resumen_flag', 'tarealog_alertas']);
  const flag = stored.tarealog_resumen_flag || null;
  const alertas = stored.tarealog_alertas || [];

  if (typeof debeMostrarMatutino !== 'function') return;
  if (!debeMostrarMatutino(flag, config.resumenMatutino, ahora)) return;
  if (alertas.length === 0) return;

  // Marcar como mostrado
  const nuevoFlag = crearFlagMostrado(ahora);
  await chrome.storage.local.set({ tarealog_resumen_flag: nuevoFlag });

  await abrirVentanaResumen();
}

var _barridoEnCurso = false;
const ALARM_BARRIDO_CONTINUACION = 'tarealog-barrido-cont';

async function ejecutarBarridoPeriodico() {
  if (_barridoEnCurso) return;
  _barridoEnCurso = true;

  const config = await cargarConfig();
  if (!config.gasUrl) {
    _barridoEnCurso = false;
    return;
  }

  var timeoutMs = (config.robustez && config.robustez.timeoutBarridoMs) || 300000;
  var limite = (config.robustez && config.robustez.limiteLoteProcesamiento) || 50;

  try {
    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, timeoutMs);

    const response = await fetch(config.gasUrl + '?action=procesarCorreos', {
      method: 'POST',
      credentials: 'omit',
      signal: controller.signal,
      body: JSON.stringify({ limite: limite })
    });
    clearTimeout(timer);

    const data = await response.json();
    const registros = data.registros || [];

    await chrome.storage.local.set({
      registros: registros,
      ultimoBarrido: new Date().toISOString()
    });

    await _evaluarYNotificarAlertas(registros, config);

    if (data.hayMas) {
      chrome.alarms.create(ALARM_BARRIDO_CONTINUACION, { delayInMinutes: 0.1 });
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Barrido cancelado por timeout (' + timeoutMs + 'ms)');
    } else {
      console.error('Error en barrido periodico:', error);
    }
  } finally {
    _barridoEnCurso = false;
  }
}

async function verificarRecordatorios() {
  if (typeof evaluarPendientes !== 'function') return;

  try {
    var stored = await chrome.storage.local.get('tarealog_recordatorios');
    var lista = stored.tarealog_recordatorios || [];
    if (lista.length === 0) return;

    var ahora = new Date();
    var vencidos = evaluarPendientes(lista, ahora);
    if (vencidos.length === 0) return;

    for (var i = 0; i < vencidos.length; i++) {
      var rec = vencidos[i];
      chrome.notifications.create('rec_' + rec.id, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Recordatorio' + (rec.codCar ? ' — Carga ' + rec.codCar : ''),
        message: rec.texto + (rec.asunto ? '\n' + rec.asunto : ''),
        buttons: [
          { title: 'Snooze 15min' },
          { title: 'Hecho' }
        ],
        requireInteraction: true,
        priority: 2
      });
    }

    // Eliminar vencidos de la lista (se recrean con snooze si el usuario elige)
    var idsVencidos = vencidos.map(function(r) { return r.id; });
    var restantes = lista.filter(function(r) { return idsVencidos.indexOf(r.id) === -1; });
    // Guardar vencidos en key temporal para snooze
    await chrome.storage.local.set({
      tarealog_recordatorios: restantes,
      tarealog_recordatorios_vencidos: vencidos
    });
  } catch (error) {
    console.error('Error verificando recordatorios:', error);
  }
}

chrome.notifications.onButtonClicked.addListener(async (notifId, btnIdx) => {
  if (!notifId.startsWith('rec_')) return;
  var recId = notifId.replace('rec_', '');

  var stored = await chrome.storage.local.get(['tarealog_recordatorios', 'tarealog_recordatorios_vencidos']);
  var lista = stored.tarealog_recordatorios || [];
  var vencidos = stored.tarealog_recordatorios_vencidos || [];
  var rec = vencidos.find(function(r) { return r.id === recId; });

  if (btnIdx === 0 && rec) {
    // Snooze 15min: re-agregar con nueva fecha
    var nuevaLista = lista.concat([rec]);
    nuevaLista = aplicarSnooze(recId, '15min', nuevaLista, new Date());
    await chrome.storage.local.set({ tarealog_recordatorios: nuevaLista });
  }
  // btnIdx === 1 = Hecho: ya fue eliminado de la lista

  chrome.notifications.clear(notifId);
});

async function verificarSecuencias() {
  if (typeof evaluarPasos !== 'function') return;
  if (typeof obtenerSecuenciasActivas !== 'function') return;

  try {
    var stored = await chrome.storage.local.get('tarealog_secuencias');
    var lista = stored.tarealog_secuencias || [];
    var activas = obtenerSecuenciasActivas(lista);
    if (activas.length === 0) return;

    var ahora = new Date();
    var cambio = false;

    for (var i = 0; i < activas.length; i++) {
      var sec = activas[i];
      var pendientes = evaluarPasos(sec, ahora);
      if (pendientes.length > 0) {
        cambio = true;
        // Marcar pasos como ejecutados
        for (var j = 0; j < sec.pasos.length; j++) {
          for (var k = 0; k < pendientes.length; k++) {
            if (sec.pasos[j].orden === pendientes[k].orden) {
              sec.pasos[j].estado = 'EJECUTADO';
            }
          }
        }
        // Verificar si todos ejecutados
        var todosEjecutados = sec.pasos.every(function(p) { return p.estado === 'EJECUTADO'; });
        if (todosEjecutados) sec.estado = 'COMPLETADA';

        chrome.notifications.create('seq_' + sec.id + '_' + pendientes[0].orden, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Secuencia: ' + sec.nombre,
          message: 'Paso ' + pendientes[0].orden + ' listo para enviar (carga ' + sec.codCar + ')',
          requireInteraction: true
        });
      }
    }

    if (cambio) {
      await chrome.storage.local.set({ tarealog_secuencias: lista });
    }
  } catch (error) {
    console.error('Error verificando secuencias:', error);
  }
}

async function _evaluarYNotificarAlertas(registros, config) {
  if (!config.alertas || !config.alertas.activado) return;
  if (typeof evaluarAlertas !== 'function') return;

  try {
    const stored = await chrome.storage.local.get('tarealog_alertas');
    const previas = stored.tarealog_alertas || [];

    const alertas = evaluarAlertas(registros, config, previas, new Date());

    // Badge
    const badge = calcularBadge(alertas);
    chrome.action.setBadgeText({ text: badge.texto });
    chrome.action.setBadgeBackgroundColor({ color: badge.color });

    // Notificaciones Chrome
    const notifs = generarNotificaciones(alertas);
    for (const n of notifs) {
      chrome.notifications.create(n.id, n.opciones);
    }

    // Persistir alertas activas
    await chrome.storage.local.set({ tarealog_alertas: alertas });
  } catch (error) {
    console.error('Error evaluando alertas:', error);
  }
}
