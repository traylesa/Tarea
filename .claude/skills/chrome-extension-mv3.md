# Skill: Chrome Extension Manifest V3

**Proposito**: Patrones especificos de la extension TareaLog en MV3: service worker, ventanas, storage, alarmas y comunicacion entre contextos.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-15

---

## Contexto del Proyecto

TareaLog es una extension Chrome MV3 que abre un panel (ventana popup tipo app) para gestionar seguimiento logistico. NO usa popup default del navegador; usa `chrome.windows.create` con `panel.html`.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/manifest.json` | Manifiesto MV3 (permisos, service worker) |
| `src/extension/background.js` | Service worker: alarmas, mensajes, ventanas |
| `src/extension/panel.html` | Ventana principal (~2000 lineas JS) |
| `src/extension/popup.html` | Popup ligero (vista rapida) |
| `src/extension/alert-summary.html` | Ventana resumen de alertas |

---

## Arquitectura de la Extension

```
[background.js] ←→ [panel.html/js]
     ↕                    ↕
chrome.alarms       chrome.storage.local
chrome.windows           fetch → GAS
chrome.notifications
     ↕
[alert-summary.html] ←→ chrome.runtime.sendMessage
```

### Patron: Ventana como App (no popup)

```javascript
// background.js — Abrir ventana unica, reutilizar si existe
let panelWindowId = null;

async function abrirOEnfocarVentana() {
  if (panelWindowId !== null) {
    try {
      await chrome.windows.update(panelWindowId, { focused: true });
      return;
    } catch { panelWindowId = null; }
  }
  var win = await chrome.windows.create({
    url: 'panel.html', type: 'popup', width: 800, height: 600
  });
  panelWindowId = win.id;
}

chrome.action.onClicked.addListener(() => abrirOEnfocarVentana());
```

### Patron: Comunicacion background ↔ panel

```javascript
// panel.js → background.js
chrome.runtime.sendMessage({ tipo: 'RECREAR_ALARMA', intervaloMinutos: 5 });

// background.js: escuchar mensajes
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'ABRIR_RESUMEN') abrirVentanaResumen();
});
```

### Patron: Storage compartido

```javascript
// Todos los contextos comparten chrome.storage.local
await chrome.storage.local.set({ registros: datos, ultimoBarrido: new Date().toISOString() });
var result = await chrome.storage.local.get(['registros', 'ultimoBarrido']);
```

---

## Scripts sin Modules

MV3 con CSP restrictiva: los scripts se cargan con `<script src>` en orden (no ES modules). El service worker usa `importScripts()`.

```html
<!-- panel.html — El ORDEN importa -->
<script src="fases-config.js"></script>   <!-- 1. Datos puros -->
<script src="config.js"></script>          <!-- 2. Config (storage) -->
<script src="filters.js"></script>         <!-- 3. Logica pura -->
<script src="scheduled.js"></script>       <!-- 4. Logica pura -->
<script src="bulk-reply.js"></script>      <!-- 5. Logica pura -->
<script src="panel.js"></script>           <!-- 6. UI (usa todo lo anterior) -->
<script src="config-ui.js"></script>       <!-- 7. UI config (usa panel.js) -->
```

```javascript
// background.js (service worker)
importScripts('alerts.js');
importScripts('alert-summary.js');
```

---

## Permisos Necesarios

```json
{
  "permissions": ["alarms", "notifications", "storage"],
  "host_permissions": [
    "https://script.google.com/*",
    "https://script.googleusercontent.com/*"
  ]
}
```

- `alarms`: Barrido periodico + resumen matutino
- `notifications`: Alertas proactivas al usuario
- `storage`: Registros, config, plantillas, preferencias tabla
- `host_permissions`: Fetch a Web App GAS (ambos dominios necesarios por redirect)

---

## Errores Comunes

### Error 1: Service worker se descarga

En MV3, el service worker es efimero. NO guardar estado en variables globales que necesiten persistir. Usar `chrome.storage.local`.

### Error 2: fetch a GAS falla con CORS

GAS redirige de `script.google.com` a `script.googleusercontent.com`. Necesitas AMBOS en `host_permissions`.

### Error 3: CSP bloquea inline scripts

MV3 no permite `<script>` inline ni `eval()`. Todo el JS debe estar en archivos separados.

---

## Consideraciones para Agentes

1. **Nuevo script**: Anadirlo en `panel.html` ANTES de `panel.js` (orden de dependencias)
2. **Service worker**: Solo importar logica pura (sin DOM). Usar `importScripts()`
3. **Storage keys**: Consultar `docs/DICCIONARIO_DOMINIO.md` §Storage
4. **Permisos nuevos**: Anadir en `manifest.json` y documentar por que
5. **Modales**: Seguir patron existente — `<div class="modal hidden">` con toggle de clase

---

## Referencias

- **Docs Chrome MV3**: https://developer.chrome.com/docs/extensions/develop
- **Arquitectura**: `docs/ARCHITECTURE.md` §Extension Chrome
- **Diccionario**: `docs/DICCIONARIO_DOMINIO.md`

---

**Generada por /genera-skills**
