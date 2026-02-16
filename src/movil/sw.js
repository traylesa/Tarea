// sw.js - Service Worker para cache offline y notificaciones
'use strict';

var CACHE_NAME = 'tarealog-v1';
var CACHE_URLS = [
  './',
  './index.html',
  './css/app.css',
  './css/cards.css',
  './css/outdoor.css',
  './manifest.json'
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
