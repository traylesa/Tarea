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

    // Registrar Service Worker con deteccion de updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function(reg) {
        reg.addEventListener('updatefound', function() {
          var nuevo = reg.installing;
          nuevo.addEventListener('statechange', function() {
            if (nuevo.state === 'activated' && navigator.serviceWorker.controller) {
              ToastUI.mostrar('Nueva version disponible', {
                tipo: 'info', duracion: 0,
                accion: { texto: 'Actualizar', fn: function() { location.reload(); } }
              });
            }
          });
        });
      });
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

      // Sincronizar recordatorios desde GAS (merge, no sobreescribir)
      try {
        var dataRec = await API.get('getRecordatorios');
        if (dataRec.recordatorios) {
          var locales = Store._leerJSON('tarealog_recordatorios', []);
          var idsLocales = {};
          locales.forEach(function(r) { idsLocales[r.id] = true; });
          var nuevos = false;
          dataRec.recordatorios.forEach(function(r) {
            if (!r.estado || r.estado === 'ACTIVO') {
              if (!idsLocales[r.id]) {
                locales.push({ id: r.id, codCar: r.clave || r.codCar, texto: r.texto, asunto: r.asunto || '', fechaDisparo: r.fechaDisparo, snoozeCount: 0, origen: r.origen || 'manual' });
                nuevos = true;
              }
            }
          });
          if (nuevos) Store._guardarJSON('tarealog_recordatorios', locales);
        }
      } catch(e) { /* mantener cache local */ }

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

    // Iniciar evaluacion periodica de recordatorios (cada 60s)
    this._iniciarEvaluadorRecordatorios();
  },

  _iniciarEvaluadorRecordatorios: function() {
    if (this._timerRecordatorios) return;
    var self = this;

    // Pedir permiso de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    this._timerRecordatorios = setInterval(function() {
      self._evaluarRecordatoriosPendientes();
    }, 60000);
    // Evaluar inmediatamente
    this._evaluarRecordatoriosPendientes();
  },

  _evaluarRecordatoriosPendientes: function() {
    var lista = Store._leerJSON('tarealog_recordatorios', []);
    if (lista.length === 0) return;

    var ahora = Date.now();
    var vencidos = [];
    var restantes = [];

    lista.forEach(function(r) {
      if (new Date(r.fechaDisparo).getTime() <= ahora) {
        vencidos.push(r);
      } else {
        restantes.push(r);
      }
    });

    if (vencidos.length === 0) return;

    // Actualizar lista local ANTES de notificar (evita re-disparo)
    Store._guardarJSON('tarealog_recordatorios', restantes);

    // Notificar cada vencido
    vencidos.forEach(function(rec) {
      var titulo = 'Recordatorio' + (rec.codCar ? ' — Carga ' + rec.codCar : '');
      var cuerpo = rec.texto || 'Recordatorio pendiente';

      // Web Notification (siempre si permitida)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(titulo, { body: cuerpo, icon: './icons/icon-192.png', tag: rec.id });
        } catch(e) { /* SW context */ }
      }

      // Toast in-app con snooze (siempre si app visible)
      if (typeof ToastUI !== 'undefined') {
        ToastUI.mostrar(titulo + ': ' + cuerpo, {
          tipo: 'alerta',
          duracion: 0,
          accion: { texto: 'Snooze 15m', fn: function() {
            var nuevaFecha = new Date(Date.now() + 15 * 60000).toISOString();
            var snoozeado = {
              id: rec.id, codCar: rec.codCar, texto: rec.texto,
              asunto: rec.asunto, fechaDisparo: nuevaFecha,
              snoozeCount: (rec.snoozeCount || 0) + 1, origen: rec.origen
            };
            var listaActual = Store._leerJSON('tarealog_recordatorios', []);
            listaActual.push(snoozeado);
            Store._guardarJSON('tarealog_recordatorios', listaActual);
          }}
        });
      }

      // Vibrar si disponible
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    // Marcar como completados en GAS
    vencidos.forEach(function(rec) {
      API.post('actualizarEstadoRecordatorio', { id: rec.id, estado: 'COMPLETADO' }).catch(function() {});
    });
  }
};

// Iniciar cuando el DOM este listo
document.addEventListener('DOMContentLoaded', function() {
  App.inicializar();
});
