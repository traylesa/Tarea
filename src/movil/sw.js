// sw.js - Service Worker para cache offline y notificaciones
'use strict';

var CACHE_NAME = 'tarealog-v32';
var CACHE_URLS = [
  './',
  './index.html',
  './css/app.css',
  './css/cards.css',
  './css/outdoor.css',
  './css/mi-turno.css',
  './css/kanban.css',
  './css/dark-mode.css',
  './manifest.json',
  './js/app.js',
  './js/api.js',
  './js/store.js',
  './js/feedback.js',
  './js/logic/action-resolver.js',
  './js/components/toast.js',
  './js/components/bottom-sheet.js',
  './js/components/card.js',
  './js/components/resumen-matutino.js',
  './js/views/mi-turno.js',
  './js/views/todo.js',
  './js/views/detalle.js',
  './js/views/programados.js',
  './js/views/config.js',
  './js/views/kanban.js',
  './lib/constants.js',
  './lib/date-utils.js',
  './lib/alerts.js',
  './lib/templates.js',
  './lib/filters.js',
  './lib/reminders.js',
  './lib/sequences.js',
  './lib/notes.js',
  './lib/fases-config.js',
  './lib/estados-config.js',
  './lib/action-bar.js',
  './lib/action-rules.js',
  './lib/bulk-reply.js',
  './lib/dashboard.js',
  './lib/action-log.js',
  './lib/shift-report.js',
  './lib/alert-summary.js',
  './lib/resilience.js',
  './lib/kanban.js',
  './lib/sortable/Sortable.min.js'
];

// Instalar: cachear archivos estaticos
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejas
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first para todo, cache solo como fallback offline
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Actualizar cache con respuesta fresca
      if (response.ok) {
        var copia = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, copia);
        });
      }
      return response;
    }).catch(function() {
      // Sin red: servir desde cache
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Sin conexion', { status: 503 });
      });
    })
  );
});

// Notificacion click
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var accion = e.action;
  if (accion === 'abrir') {
    e.waitUntil(clients.openWindow('./'));
  }
});
