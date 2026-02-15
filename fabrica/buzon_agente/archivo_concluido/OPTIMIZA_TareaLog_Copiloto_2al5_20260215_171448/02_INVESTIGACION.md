# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## 2.1 Mapa de Impacto

| Archivo | Tipo | Lineas est. | Descripcion |
|---------|------|-------------|-------------|
| `src/extension/alert-summary.js` | CREAR | ~280 | Logica pura (categorizacion, KPIs, flag matutino) + UI ventana |
| `src/extension/alert-summary.html` | CREAR | ~80 | Ventana standalone popup |
| `src/extension/alert-summary.css` | CREAR | ~120 | Estilos ventana resumen |
| `tests/TDD/unit/test_alert_summary.js` | CREAR | ~200 | Tests Jest logica pura |
| `src/extension/background.js` | MODIFICAR | +30 lin | Alarma matutina, listener ABRIR_RESUMEN/ABRIR_PANEL_FILTRADO |
| `src/extension/config.js` | MODIFICAR | +8 lin | Defaults resumenMatutino + auto-migracion |
| `src/extension/panel.html` | MODIFICAR | +2 lin | Boton Resumen en #controls |
| `src/extension/panel.js` | MODIFICAR | +15 lin | Handler boton Resumen + lectura filtro pendiente |
| `src/extension/config-ui.js` | MODIFICAR | +20 lin | Checkbox + input hora matutino |

**Total estimado:** ~750 lineas nuevas/modificadas

---

## 2.2 Patrones Existentes a Reutilizar

### Patron 1: Dual-compat (module.exports)
```javascript
// alerts.js linea 274
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { evaluarAlertas, deduplicar, calcularBadge, ... };
}
```
Se reutilizara en alert-summary.js para exportar logica pura.

### Patron 2: chrome.windows.create (background.js linea 58)
```javascript
const win = await chrome.windows.create({
  url: 'panel.html', type: 'popup', width: ..., height: ...
});
```
Se reutilizara para abrir alert-summary.html.

### Patron 3: Listener de mensajes (background.js linea 107)
```javascript
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'RECREAR_ALARMA') { ... }
});
```
Se ampliara con tipos ABRIR_RESUMEN y ABRIR_PANEL_FILTRADO.

### Patron 4: Auto-migracion config (config.js linea 136)
```javascript
if (!guardada.alertas) {
  config.alertas = defaults.alertas;
} else {
  config.alertas = { ...defaults.alertas, ...guardada.alertas };
}
```
Se replicara para `resumenMatutino`.

### Patron 5: getDefaults con alertas (config.js linea 63)
```javascript
alertas: { activado: true, silencioUmbralH: 4, ... }
```
Se anadira `resumenMatutino: { activado: true, hora: '08:00' }` al mismo nivel.

---

## 2.3 Tests Existentes

- **42 tests en test_alerts.js**: Cubren evaluarAlertas, deduplicar, calcularBadge, generarNotificaciones
- **Cobertura actual**: 83%+ branches en alerts.js
- **Tests que podrian romperse**: NINGUNO. alert-summary.js es archivo nuevo que consume output de alerts.js sin modificarlo
- **Riesgo cero**: No se modifica alerts.js

---

## 2.4 Spike Tecnico

No necesario. Todos los mecanismos requeridos ya tienen precedentes funcionales:
- `chrome.windows.create` -> background.js (abrirOEnfocarVentana)
- `chrome.storage.local` -> config.js, background.js
- `chrome.alarms` -> background.js (ALARM_NAME barrido)
- `chrome.runtime.sendMessage/onMessage` -> background.js, panel.js

---

## 2.5 Opciones Evaluadas

### Opcion 1: Ventana standalone (chrome.windows.create)
- **Descripcion:** alert-summary.html como ventana popup independiente
- **Pros:** Visible encima de otras apps, no interfiere con panel, tamano controlable
- **Cons:** Requiere comunicacion via messages
- **Complejidad:** M

### Opcion 2: Tab nueva en panel.html
- **Descripcion:** Agregar tab "Resumen" al panel existente
- **Pros:** Sin archivo HTML nuevo, comunicacion directa
- **Cons:** No se ve automaticamente (hay que abrir panel), no aparece "sola"
- **Complejidad:** S

### Opcion 3: Chrome notification expandida
- **Descripcion:** Usar chrome.notifications con tipo "list" para mostrar categorias
- **Pros:** Minimo codigo, nativo OS
- **Cons:** Limitado a 4 items, no clickable por categoria, no KPIs, no personalizable
- **Complejidad:** S

---

## 2.6 Decision (ADR)

**Opcion seleccionada:** Opcion 1 — Ventana standalone

**Justificacion:**
1. Es la unica que satisface HU-01 (resumen matutino automatico visible sin abrir panel)
2. Consistente con el diseno del archivo fuente (alert-summary.html standalone)
3. Reutiliza patron probado de chrome.windows.create
4. Permite tamano personalizable (450x500) y contenido rico (tarjetas, KPIs, botones)
5. Opcion 2 no cumple "aparece solo" y Opcion 3 es muy limitada

---

## Puerta de Validacion 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados (ninguno se rompe)
- [x] Spike resuelto (no necesario, precedentes existen)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada

**Estado:** COMPLETADO
