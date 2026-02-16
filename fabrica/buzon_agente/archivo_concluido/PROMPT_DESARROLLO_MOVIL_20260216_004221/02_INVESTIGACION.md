# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## 2.1 Mapa de Impacto

### Archivos NUEVOS a crear (src/movil/)

| Archivo | Lineas est. | Descripcion |
|---------|-------------|-------------|
| `src/movil/index.html` | ~150 | SPA entry point + manifest link + script tags |
| `src/movil/manifest.json` | ~30 | Web App Manifest PWA |
| `src/movil/sw.js` | ~80 | Service Worker (cache, notificaciones) |
| `src/movil/css/app.css` | ~400 | Estilos mobile-first + variables CSS |
| `src/movil/css/cards.css` | ~200 | Estilos card de carga (estados, alertas) |
| `src/movil/css/outdoor.css` | ~60 | Modo outdoor (alto contraste) |
| `src/movil/js/app.js` | ~120 | Entry point, router, inicializacion |
| `src/movil/js/api.js` | ~80 | Wrapper fetch() para endpoints GAS |
| `src/movil/js/store.js` | ~150 | Estado local (registros, config, IndexedDB) |
| `src/movil/js/feedback.js` | ~60 | Vibracion, toasts, animaciones |
| `src/movil/js/views/todo.js` | ~200 | Vista lista cargas + alertas inline |
| `src/movil/js/views/detalle.js` | ~180 | Vista detalle carga |
| `src/movil/js/views/programados.js` | ~100 | Vista envios + recordatorios |
| `src/movil/js/views/config.js` | ~80 | Vista configuracion |
| `src/movil/js/components/card.js` | ~100 | Card de carga |
| `src/movil/js/components/bottom-sheet.js` | ~80 | Bottom sheet generico |
| `src/movil/js/components/toast.js` | ~50 | Notificaciones toast |
| `src/movil/js/logic/action-resolver.js` | ~60 | Determina "accion requerida" por carga |
| **Total estimado** | **~2180** | |

### Archivos EXISTENTES reutilizados (sin modificar)

| Archivo | Lineas | Dual-compat | Deps |
|---------|--------|-------------|------|
| `src/extension/constants.js` | 116 | Si | Ninguna |
| `src/extension/date-utils.js` | 99 | Si | constants |
| `src/extension/alerts.js` | 282 | Si | date-utils, constants |
| `src/extension/templates.js` | 126 | Si | Ninguna |
| `src/extension/filters.js` | 180 | Si | date-utils |
| `src/extension/reminders.js` | 140 | Si | date-utils, constants |
| `src/extension/sequences.js` | 185 | Si | constants |
| `src/extension/notes.js` | 90 | Si | Ninguna |
| `src/extension/action-bar.js` | 70 | Si | Ninguna |
| `src/extension/dashboard.js` | 114 | Si | date-utils, constants |
| `src/extension/action-log.js` | 97 | Si | constants |
| `src/extension/shift-report.js` | 76 | Si | Ninguna |
| `src/extension/alert-summary.js` | 298 | Si | date-utils (UI parcial) |
| `src/extension/resilience.js` | 51 | Si | Ninguna |

**Los 14 modulos son 100% dual-compat (module.exports) y logica pura (sin DOM/Chrome API).**

### Tests EXISTENTES (NO se rompen)

| Test | Tests | Cobertura |
|------|-------|-----------|
| `tests/TDD/unit/test_alerts.js` | 42 | 83% branches |
| `tests/TDD/unit/test_templates.js` | ~15 | Alta |
| `tests/TDD/unit/test_reminders.js` | 42 | 89% branches |
| `tests/TDD/unit/test_dashboard.js` | 10 | Alta |
| `tests/TDD/unit/test_action_log.js` | 15 | Alta |
| `tests/TDD/unit/test_shift_report.js` | 11 | Alta |
| **Total existentes** | **368** | No se rompen (nuevo codigo) |

---

## 2.2 Patrones Existentes a Reutilizar

### Patron 1: Dual-compat (todos los modulos)
```javascript
// Patron para cargar via <script> tag (browser) o require (Node/Jest)
if (typeof module !== 'undefined') module.exports = { funcion1, funcion2 };
```

### Patron 2: Script tags con orden de dependencias
```html
<!-- Orden importa: constants → date-utils → modulos que dependen -->
<script src="constants.js"></script>
<script src="date-utils.js"></script>
<script src="alerts.js"></script>
```

### Patron 3: Funciones puras sin side effects
```javascript
// crearNota retorna {almacen, nota} sin mutar original
function crearNota(almacen, codCar, texto) {
  const nota = { id: generarId(), texto, fechaCreacion: new Date().toISOString() };
  const copia = { ...almacen };
  copia[codCar] = [...(copia[codCar] || []), nota];
  return { almacen: copia, nota };
}
```

### Patron 4: API wrapper simple
```javascript
// Patron del prompt: GET con ?action=, POST con body JSON
async get(action) {
  const res = await fetch(`${this.baseUrl}?action=${action}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data;
}
```

### Antipatrones a evitar
- **No usar chrome.storage** (no disponible en PWA) → usar localStorage/IndexedDB
- **No usar chrome.alarms** → usar setTimeout/setInterval + SW timers
- **No usar chrome.notifications** → usar Notification API del browser
- **No mezclar UI con logica** (alert-summary.js lo hace, evitar en PWA)

---

## 2.3 Opciones Evaluadas

### Opcion 1: PWA Vanilla JS (Recomendada)
- **Descripcion:** HTML5 + CSS3 + JS ES6+ sin framework, Service Worker para cache/notificaciones, IndexedDB para datos offline
- **Pros:** Sin dependencias, coherente con proyecto existente, sin build step, carga rapida, reutiliza modulos directamente via script tags
- **Cons:** Mas codigo boilerplate para reactividad UI, no tiene virtual DOM
- **Complejidad:** M

### Opcion 2: PWA con Alpine.js
- **Descripcion:** Alpine.js (~15KB) para reactividad declarativa, resto igual
- **Pros:** Reactividad declarativa sin build step, curva aprendizaje baja
- **Cons:** Dependencia externa (contra RNF-08), patron diferente al existente
- **Complejidad:** M

### Opcion 3: PWA con Preact + Vite
- **Descripcion:** Preact (~3KB) con Vite como bundler
- **Pros:** Virtual DOM eficiente, componentes JSX, HMR en desarrollo
- **Cons:** Requiere build step, npm, patron diferente al proyecto, deps externas
- **Complejidad:** L

### Criterios de Decision

| Criterio | Peso | Vanilla JS | Alpine.js | Preact+Vite |
|----------|------|-----------|-----------|-------------|
| Sin dependencias (RNF-08) | Alto | 10 | 7 | 3 |
| Coherencia con proyecto | Alto | 10 | 6 | 4 |
| Sin build step | Alto | 10 | 10 | 2 |
| Reutilizacion modulos | Alto | 10 | 9 | 6 |
| Velocidad desarrollo | Medio | 6 | 8 | 9 |
| Rendimiento runtime | Medio | 8 | 8 | 9 |
| **Total ponderado** | | **54** | **48** | **33** |

---

## 2.4 Decision (ADR)

**Opcion seleccionada:** PWA Vanilla JS

**Justificacion:**
1. 0 dependencias externas (cumple RNF-08 al 100%)
2. Coherente con patron del proyecto (script tags, dual-compat)
3. Sin build step (archivos estaticos servibles desde cualquier hosting)
4. Los 14 modulos de logica pura se cargan directamente via `<script>` tag
5. Service Worker nativo para cache offline y notificaciones
6. IndexedDB nativo para almacenamiento sin limite 5MB
7. El operador no necesita reactividad compleja; la UI es simple (lista, detalle, formularios)

**Grafo de dependencias para carga:**
```
constants.js → date-utils.js → {alerts, filters, dashboard, reminders}.js
                              → {action-log, sequences, shift-report, alert-summary}.js
(standalone) → {templates, notes, action-bar, resilience}.js
```

---

## 2.5 Spike Tecnico: CORS con GAS

**Hipotesis:** GAS Web App desplegada como "Anyone can access" permite CORS.
**Resultado:** Confirmado. GAS devuelve headers `Access-Control-Allow-Origin: *` por defecto en deployments publicos. No se necesita proxy.

**Nota:** GAS redirige a URL de contenido en la respuesta. Se debe usar `fetch()` con `redirect: 'follow'` (comportamiento default).

---

## PUERTA DE VALIDACION 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados (no se rompen, nuevo codigo)
- [x] Spike resuelto (CORS OK)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada (Vanilla JS)

**Estado:** COMPLETADO
