const ALARM_NAME = 'logitask-barrido';
const STORAGE_KEY_CONFIG = 'logitask_config';

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
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await ejecutarBarridoPeriodico();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'RECREAR_ALARMA') {
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: msg.intervaloMinutos
      });
    });
  }
});

async function ejecutarBarridoPeriodico() {
  const config = await cargarConfig();
  if (!config.gasUrl) return;

  try {
    const response = await fetch(config.gasUrl + '?action=procesarCorreos', { method: 'POST' });
    const data = await response.json();

    if (data.alertas && data.alertas.length > 0) {
      for (const alerta of data.alertas) {
        chrome.notifications.create(`sla-${alerta.codCar}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'URGENTE: Carga por vencer',
          message: `Carga ${alerta.codCar} a punto de vencer (${alerta.horasRestantes.toFixed(1)}h restantes)`,
          priority: 2
        });
      }
    }

    await chrome.storage.local.set({
      registros: data.registros || [],
      ultimoBarrido: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en barrido periodico:', error);
  }
}
