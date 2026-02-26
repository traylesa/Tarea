# Skill: Chrome Extension Manifest V3

**Proposito**: Patrones especificos de la extension TareaLog en MV3: service worker, ventanas, storage, alarmas y comunicacion entre contextos.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

TareaLog es una extension Chrome MV3 que abre un panel (ventana popup tipo app) para gestionar seguimiento logistico. NO usa popup default del navegador; usa `chrome.windows.create` con `panel.html`.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/manifest.json` | Manifiesto MV3 (permisos, service worker) |
| `src/extension/background.js` | Service worker: alarmas, mensajes, ventanas |
| `src/extension/panel.html` | Ventana principal (tabs: Datos, Tablero, Plantillas, Config, Ayuda) |
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
await chrome.storage.local.set({ registros: datos, ultimoBarrido: new Date().toISOString() });
var result = await chrome.storage.local.get(['registros', 'ultimoBarrido']);
```

---

## Scripts sin Modules

MV3 con CSP restrictiva: los scripts se cargan con `<script src>` en orden (no ES modules). El service worker usa `importScripts()`.

```html
<!-- panel.html — El ORDEN importa (dependencias antes) -->
<!-- Logica pura (sin DOM) -->
<script src="constants.js"></script>       <!-- 1. Constantes globales -->
<script src="date-utils.js"></script>      <!-- 2. Utilidades fecha -->
<script src="fases-config.js"></script>    <!-- 3. Datos fases -->
<script src="estados-config.js"></script>  <!-- 4. Datos estados -->
<script src="config.js"></script>          <!-- 5. Config (storage) -->
<script src="filters.js"></script>         <!-- 6. Filtros -->
<script src="scheduled.js"></script>       <!-- 7. Programados -->
<script src="bulk-reply.js"></script>      <!-- 8. Respuesta masiva -->
<script src="reminders.js"></script>       <!-- 9. Recordatorios -->
<script src="action-rules.js"></script>    <!-- 10. Motor reglas -->
<script src="templates.js"></script>       <!-- 11. Plantillas -->
<script src="alerts.js"></script>          <!-- 12. Alertas -->
<script src="alert-summary.js"></script>   <!-- 13. Resumen alertas -->
<script src="notes.js"></script>           <!-- 14. Notas -->
<script src="action-bar.js"></script>      <!-- 15. Acciones por fase -->
<script src="action-log.js"></script>      <!-- 16. Historial -->
<script src="dashboard.js"></script>       <!-- 17. Dashboard KPIs -->
<script src="shift-report.js"></script>    <!-- 18. Reporte turno -->
<script src="sequences.js"></script>       <!-- 19. Secuencias -->
<script src="resilience.js"></script>      <!-- 20. Robustez -->
<script src="kanban.js"></script>          <!-- 21. Kanban logica pura -->
<script src="lib/sortable/Sortable.min.js"></script> <!-- 22. SortableJS -->

<!-- UI (con DOM) -->
<script src="panel.js"></script>           <!-- Controlador principal -->
<script src="config-ui.js"></script>       <!-- UI config -->
<script src="config-rules-ui.js"></script> <!-- UI reglas -->
<script src="panel-programados.js"></script> <!-- UI programados -->
<script src="panel-recordatorios.js"></script> <!-- UI recordatorios -->
<script src="panel-acciones.js"></script>  <!-- UI acciones -->
<script src="panel-kanban.js"></script>    <!-- UI Kanban tablero -->
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

- `alarms`: Barrido periodico + resumen matutino + recordatorios + secuencias
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

1. **Nuevo script logica pura**: Anadirlo en `panel.html` ANTES de `panel.js` (orden de dependencias)
2. **Nuevo script UI**: Anadirlo DESPUES de `panel.js` (depende de globales de panel)
3. **Service worker**: Solo importar logica pura (sin DOM). Usar `importScripts()`
4. **Storage keys**: Consultar `docs/DICCIONARIO_DOMINIO.md` §Storage
5. **Permisos nuevos**: Anadir en `manifest.json` y documentar por que
6. **Modales**: Seguir patron existente — `<div class="modal hidden">` con toggle de clase
7. **PWA movil**: Al agregar modulo logica pura, sincronizar a `src/movil/lib/`

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Crear modulo logica pura | `dual-compat-modules.md` (patron obligatorio) |
| Kanban tablero (tab) | `kanban-tablero.md` (SortableJS, columnas, persistir) |
| Programados (panel) | `envios-programados.md` (modal, edicion, ERROR) |
| Alertas background | `alertas-proactivas.md` (reglas, badge, notificaciones) |
| Config (tab) | `sistema-configuracion.md` (defaults, sync GAS) |
| Deploy GAS | `gas-deploy.md` (clasp push/deploy) |
| Diccionario | `docs/DICCIONARIO_DOMINIO.md` |
| Sincronizar PWA | `pwa-mobile-development.md` (copiar lib/) |

---

**Actualizada**: 2026-02-25 (v1.2.0: lista scripts completa con kanban, panel-kanban)
