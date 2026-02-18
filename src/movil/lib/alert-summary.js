/**
 * alert-summary.js - Resumen consolidado de alertas
 * Parte 1: Logica pura (testeable Jest, sin DOM ni Chrome API)
 * Parte 2: UI ventana resumen (solo se ejecuta en alert-summary.html)
 */

// --- LOGICA PURA ---

var CATEGORIAS_REGLA = {
  R5: 'urgente',
  R6: 'urgente',
  R2: 'sinRespuesta',
  R4: 'documentacion',
  R3: 'estancadas'
};

function categorizarAlertas(alertas) {
  var resultado = {
    urgente: [],
    sinRespuesta: [],
    documentacion: [],
    estancadas: []
  };

  if (!alertas || !Array.isArray(alertas)) return resultado;

  alertas.forEach(function(alerta) {
    var cat = CATEGORIAS_REGLA[alerta.regla];
    if (cat && resultado[cat]) {
      resultado[cat].push(alerta);
    }
  });

  return resultado;
}

function calcularKPIs(registros, alertas, ahora) {
  var regs = registros || [];
  var als = alertas || [];

  var codCarsUnicos = {};
  regs.forEach(function(r) {
    if (r.codCar) codCarsUnicos[r.codCar] = true;
  });

  var hoyStr = ahora ? obtenerFechaLocal(ahora) : '';
  var hoy = 0;
  regs.forEach(function(r) {
    if (r.fCarga && r.fCarga.slice(0, 10) === hoyStr) hoy++;
  });

  var sinRespuesta = 0;
  var sinDocs = 0;
  als.forEach(function(a) {
    if (a.regla === 'R2') sinRespuesta++;
    if (a.regla === 'R4') sinDocs++;
  });

  return {
    activas: Object.keys(codCarsUnicos).length,
    hoy: hoy,
    totalAlertas: als.length,
    sinRespuesta: sinRespuesta,
    sinDocs: sinDocs
  };
}

function debeMostrarMatutino(flag, configResumen, ahora) {
  if (!configResumen || !configResumen.activado) return false;

  // Verificar hora: no mostrar antes de hora configurada
  var partes = (configResumen.hora || '08:00').split(':');
  var horaConfig = parseInt(partes[0], 10);
  var minConfig = parseInt(partes[1] || '0', 10);
  if (ahora.getHours() < horaConfig || (ahora.getHours() === horaConfig && ahora.getMinutes() < minConfig)) {
    return false;
  }

  if (!flag) return true;

  var hoyStr = obtenerFechaLocal(ahora);

  // Si hay pospuesto, verificar si ya paso la hora
  if (flag.pospuestoHasta) {
    var pospuesto = new Date(flag.pospuestoHasta);
    if (ahora.getTime() < pospuesto.getTime()) return false;
    return true;
  }

  // Si flag es de hoy y sin posponer, ya se mostro
  if (flag.fecha === hoyStr) return false;

  return true;
}

function crearFlagMostrado(ahora, posponerMinutos) {
  var flag = {
    fecha: obtenerFechaLocal(ahora),
    pospuestoHasta: null
  };

  if (posponerMinutos && posponerMinutos > 0) {
    var futuro = new Date(ahora.getTime() + posponerMinutos * 60000);
    flag.pospuestoHasta = futuro.toISOString();
  }

  return flag;
}

function filtroParaCategoria(categoria, alertas) {
  var als = alertas || [];

  if (categoria === 'urgente') {
    var codCars = [];
    als.forEach(function(a) {
      if ((a.regla === 'R5' || a.regla === 'R6') && a.codCar) {
        codCars.push(a.codCar);
      }
    });
    return codCars.length > 0 ? [{ field: 'codCar', type: 'in', value: codCars }] : [];
  }

  if (categoria === 'sinRespuesta') {
    return [{ field: 'estado', type: '=', value: 'ENVIADO' }];
  }

  if (categoria === 'documentacion') {
    return [{ field: 'fase', type: '=', value: '29' }];
  }

  if (categoria === 'estancadas') {
    var codCarsE = [];
    als.forEach(function(a) {
      if (a.regla === 'R3' && a.codCar) {
        codCarsE.push(a.codCar);
      }
    });
    return codCarsE.length > 0 ? [{ field: 'codCar', type: 'in', value: codCarsE }] : [];
  }

  return [];
}

// --- PARTE UI (solo se ejecuta en alert-summary.html con DOM disponible) ---

var COLORES_CATEGORIA = {
  urgente: '#FF0000',
  sinRespuesta: '#FF8C00',
  documentacion: '#2196F3',
  estancadas: '#9C27B0'
};

var NOMBRES_CATEGORIA = {
  urgente: 'Urgente',
  sinRespuesta: 'Sin respuesta',
  documentacion: 'Documentacion pendiente',
  estancadas: 'Fases estancadas'
};

var ICONOS_CATEGORIA = {
  urgente: '!',
  sinRespuesta: '?',
  documentacion: 'D',
  estancadas: 'E'
};

function renderResumen() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  chrome.storage.local.get(['tarealog_alertas', 'registros'], function(data) {
    var alertas = data.tarealog_alertas || [];
    var registros = data.registros || [];
    var ahora = new Date();

    var categorias = categorizarAlertas(alertas);
    var kpis = calcularKPIs(registros, alertas, ahora);

    var container = document.getElementById('categorias');
    var kpiContainer = document.getElementById('kpis');

    if (!container || !kpiContainer) return;

    // Renderizar categorias
    container.innerHTML = '';
    var hayAlgo = false;

    ['urgente', 'sinRespuesta', 'documentacion', 'estancadas'].forEach(function(cat) {
      var items = categorias[cat];
      if (!items || items.length === 0) return;
      hayAlgo = true;

      var tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-categoria';
      tarjeta.style.borderLeftColor = COLORES_CATEGORIA[cat];

      var header = document.createElement('div');
      header.className = 'tarjeta-header';
      header.innerHTML = '<span class="tarjeta-icono" style="background:' + COLORES_CATEGORIA[cat] + '">' +
        ICONOS_CATEGORIA[cat] + '</span>' +
        '<span class="tarjeta-titulo">' + NOMBRES_CATEGORIA[cat] + ' (' + items.length + ')</span>' +
        '<button class="btn-ver" data-cat="' + cat + '">Ver</button>';

      var cuerpo = document.createElement('div');
      cuerpo.className = 'tarjeta-cuerpo';

      items.forEach(function(alerta) {
        var linea = document.createElement('div');
        linea.className = 'alerta-linea';
        linea.textContent = alerta.mensaje || alerta.titulo;
        cuerpo.appendChild(linea);
      });

      tarjeta.appendChild(header);
      tarjeta.appendChild(cuerpo);
      container.appendChild(tarjeta);
    });

    if (!hayAlgo) {
      container.innerHTML = '<p class="sin-alertas">Sin alertas activas</p>';
    }

    // Renderizar KPIs
    kpiContainer.innerHTML =
      '<span class="kpi"><strong>' + kpis.activas + '</strong> activas</span>' +
      '<span class="kpi"><strong>' + kpis.hoy + '</strong> hoy</span>' +
      '<span class="kpi kpi-alerta"><strong>' + kpis.totalAlertas + '</strong> alertas</span>' +
      '<span class="kpi"><strong>' + kpis.sinRespuesta + '</strong> sin respuesta</span>' +
      '<span class="kpi"><strong>' + kpis.sinDocs + '</strong> sin docs</span>';

    // Event listeners para botones "Ver"
    var botonesVer = container.querySelectorAll('.btn-ver');
    botonesVer.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cat = this.getAttribute('data-cat');
        var filtros = filtroParaCategoria(cat, alertas);
        chrome.runtime.sendMessage({ tipo: 'ABRIR_PANEL_FILTRADO', filtros: filtros });
        window.close();
      });
    });
  });
}

function _initUI() {
  if (typeof document === 'undefined') return;

  document.addEventListener('DOMContentLoaded', function() {
    renderResumen();

    // Boton posponer
    var btnPosponer = document.getElementById('btn-posponer');
    if (btnPosponer) {
      btnPosponer.addEventListener('click', function() {
        var flag = crearFlagMostrado(new Date(), 60);
        chrome.storage.local.set({ tarealog_resumen_flag: flag }, function() {
          window.close();
        });
      });
    }

    // Boton cerrar
    var btnCerrar = document.getElementById('btn-cerrar');
    if (btnCerrar) {
      btnCerrar.addEventListener('click', function() {
        window.close();
      });
    }

    // Boton abrir panel
    var btnPanel = document.getElementById('btn-panel');
    if (btnPanel) {
      btnPanel.addEventListener('click', function() {
        chrome.runtime.sendMessage({ tipo: 'ABRIR_RESUMEN_PANEL' });
        window.close();
      });
    }
  });
}

// Inicializar UI solo si hay DOM (no en Jest)
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  _initUI();
}

// --- Exportar logica pura para tests ---

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    categorizarAlertas: categorizarAlertas,
    calcularKPIs: calcularKPIs,
    debeMostrarMatutino: debeMostrarMatutino,
    crearFlagMostrado: crearFlagMostrado,
    filtroParaCategoria: filtroParaCategoria,
    CATEGORIAS_REGLA: CATEGORIAS_REGLA,
    COLORES_CATEGORIA: COLORES_CATEGORIA,
    NOMBRES_CATEGORIA: NOMBRES_CATEGORIA
  };
}
