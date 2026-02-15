// Importar modulos de logica pura en service worker
importScripts('alerts.js');
importScripts('alert-summary.js');
importScripts('reminders.js');

const ALARM_NAME = 'tarealog-barrido';
const ALARM_MATUTINO = 'tarealog-resumen-matutino';
const ALARM_RECORDATORIOS = 'tarealog-recordatorios';
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

chrome.runtime.onInstalled.addListener(async () => {
  const config = await cargarConfig();
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: config.intervaloMinutos
  });
  // Alarma matutina: verificar cada 60 minutos
  chrome.alarms.create(ALARM_MATUTINO, {
    periodInMinutes: 60
  });
  // Alarma recordatorios: verificar cada 1 minuto
  chrome.alarms.create(ALARM_RECORDATORIOS, {
    periodInMinutes: 1
  });
});

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

async function ejecutarBarridoPeriodico() {
  const config = await cargarConfig();
  if (!config.gasUrl) return;

  try {
    const response = await fetch(config.gasUrl + '?action=procesarCorreos', { method: 'POST' });
    const data = await response.json();
    const registros = data.registros || [];

    await chrome.storage.local.set({
      registros: registros,
      ultimoBarrido: new Date().toISOString()
    });

    // Evaluar alertas proactivas sobre registros
    await _evaluarYNotificarAlertas(registros, config);
  } catch (error) {
    console.error('Error en barrido periodico:', error);
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
        message: rec.texto,
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
