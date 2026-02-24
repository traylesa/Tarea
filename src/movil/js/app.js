// app.js - Router hash, inicializacion, bottom nav
'use strict';

var App = {
  _vistaActual: 'mi-turno',

  inicializar: function() {
    var config = Store.obtenerConfig();
    if (config.gasUrl) {
      API.configurar(config.gasUrl);
    }

    // Modo outdoor persistente
    if (localStorage.getItem('tarealog_outdoor') === '1') {
      document.body.classList.add('outdoor');
    }

    // Modo oscuro persistente
    if (localStorage.getItem('tarealog_darkmode') === '1') {
      document.body.classList.add('darkmode');
    }

    // Listener hash change
    window.addEventListener('hashchange', function() {
      App.renderizar();
    });

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
    }

    // Render inicial
    if (!window.location.hash) window.location.hash = '#mi-turno';
    this.renderizar();

    // Auto-refresh si hay gasUrl
    if (config.gasUrl) {
      this._cargarDatosIniciales();
    }
  },

  navegar: function(ruta) {
    window.location.hash = '#' + ruta;
  },

  renderizar: function() {
    var hash = window.location.hash.replace('#', '') || 'mi-turno';
    var partes = hash.split('/');
    var vista = partes[0];
    var param = partes[1] || null;

    this._vistaActual = vista;
    var contenedor = document.getElementById('app-contenido');
    if (!contenedor) return;
    contenedor.removeAttribute('style');

    switch (vista) {
      case 'mi-turno':
        VistaMiTurno.renderizar(contenedor);
        break;
      case 'todo':
        VistaTodo.renderizar(contenedor);
        break;
      case 'detalle':
        VistaDetalle.renderizar(contenedor, param);
        break;
      case 'kanban':
        VistaKanban.renderizar(contenedor);
        break;
      case 'programados':
        VistaProgramados.renderizar(contenedor);
        break;
      case 'config':
        VistaConfig.renderizar(contenedor);
        break;
      default:
        VistaMiTurno.renderizar(contenedor);
    }

    this._actualizarNav(vista);
    this._actualizarBadges();
  },

  _actualizarNav: function(vistaActual) {
    var items = document.querySelectorAll('.bottom-nav-item');
    items.forEach(function(item) {
      var ruta = item.dataset.ruta;
      item.classList.toggle('activo', ruta === vistaActual);
    });
  },

  _actualizarBadges: function() {
    var alertas = Store.obtenerAlertas();
    var urgentes = alertas.filter(function(a) {
      return a.nivel === 'CRITICO' || a.nivel === 'ALTO';
    }).length;

    var badgeTodo = document.getElementById('badge-todo');
    if (badgeTodo) {
      badgeTodo.textContent = urgentes || '';
      badgeTodo.style.display = urgentes > 0 ? '' : 'none';
    }
  },

  _cargarDatosIniciales: async function() {
    // Cargar datos del cache primero (offline-first)
    var cached = Store.obtenerRegistros();
    if (cached.length > 0) {
      this.renderizar();
    }

    // Luego intentar actualizar
    try {
      var data = await API.get('getRegistros');
      if (data.registros) {
        Store.guardarRegistros(data.registros);
      }

      // Evaluar alertas
      if (typeof evaluarAlertas === 'function') {
        var alertas = evaluarAlertas(Store.obtenerRegistros(), Store.obtenerConfig());
        Store.guardarAlertas(alertas);
      }

      this.renderizar();

      // Resumen matutino
      if (typeof debeMostrarMatutino === 'function' && typeof ResumenMatutino !== 'undefined') {
        var config = Store.obtenerConfig();
        var flag = Store._leerJSON('tarealog_resumen_flag', null);
        if (debeMostrarMatutino(flag, config.resumenMatutino || { activado: true, hora: '08:00' }, new Date())) {
          ResumenMatutino.mostrar(Store.obtenerAlertas(), config);
        }
      }
    } catch (e) {
      // Offline: usar cache
      if (cached.length === 0) {
        ToastUI.mostrar('Sin conexion y sin cache', { tipo: 'error' });
      }
    }
  }
};

// Iniciar cuando el DOM este listo
document.addEventListener('DOMContentLoaded', function() {
  App.inicializar();
});
