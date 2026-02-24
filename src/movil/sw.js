// sw.js - Service Worker para cache offline y notificaciones
'use strict';

var CACHE_NAME = 'tarealog-v22';
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

// Fetch: cache-first para estaticos, network-first para API
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // API requests: network-first
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(JSON.stringify({ ok: false, error: 'Sin conexion' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Estaticos: cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
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
