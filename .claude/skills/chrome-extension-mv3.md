# Skill: Chrome Extension Manifest V3

**Proposito**: Patrones especificos de la extension TareaLog en MV3: service worker, ventanas, storage, alarmas y comunicacion entre contextos.

**Version**: 1.1.0 | **Ultima actualizacion**: 2026-02-21

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
<!-- panel.html — El ORDEN importa (dependencias antes) -->
<script src="constants.js"></script>       <!-- 1. Constantes globales -->
<script src="date-utils.js"></script>      <!-- 2. Utilidades fecha -->
<script src="fases-config.js"></script>    <!-- 3. Datos fases -->
<script src="estados-config.js"></script>  <!-- 4. Datos estados -->
<script src="config.js"></script>          <!-- 5. Config (storage) -->
<script src="filters.js"></script>         <!-- 6. Logica pura -->
<script src="scheduled.js"></script>       <!-- 7. Logica pura -->
<script src="bulk-reply.js"></script>      <!-- 8. Logica pura -->
<script src="reminders.js"></script>       <!-- 9. Recordatorios -->
<script src="action-rules.js"></script>    <!-- 10. Motor reglas -->
<script src="templates.js"></script>       <!-- 11. Plantillas -->
<script src="alerts.js"></script>          <!-- 12. Alertas -->
<script src="panel.js"></script>           <!-- 13. UI principal -->
<script src="config-ui.js"></script>       <!-- 14. UI config -->
<script src="config-rules-ui.js"></script> <!-- 15. UI reglas -->
<script src="panel-programados.js"></script> <!-- 16. UI programados -->
<script src="panel-recordatorios.js"></script> <!-- 17. UI recordatorios -->
<script src="panel-acciones.js"></script>  <!-- 18. UI acciones -->
```

```javascript
// background.js (service worker)
importScripts('constants.js', 'date-utils.js');
importScripts('alerts.js', 'alert-summary.js');
importScripts('reminders.js', 'sequences.js', 'shift-report.js');
importScripts('scheduled.js');
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
