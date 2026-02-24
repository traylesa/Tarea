# Skill: Desarrollo Mobile PWA

**Proposito**: Guia tecnica para desarrollar la version movil PWA de TareaLog, consumiendo el backend GAS existente con experiencia mobile-first optimizada para operadores de trafico en campo.
**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-24

---

## Contexto del Proyecto

TareaLog es una extension Chrome para gestion logistica TRAYLESA. La PWA movil es la herramienta secundaria del operador de trafico, que gestiona 20-40 cargas simultaneas desde almacen, muelle o en movimiento. Comparte backend GAS y 14 modulos de logica pura con la extension.

**Principio UX**: "Abrir → 3s saber si hay algo urgente → 2 taps para resolverlo."

**Especificacion completa**: `movil/PROMPT_DESARROLLO_MOVIL.md` (1427 lineas, fuente de verdad)

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/movil/index.html` | SPA entry point, carga modulos via script tags |
| `src/movil/manifest.json` | Web App Manifest (standalone, portrait, theme #1565C0) |
| `src/movil/sw.js` | Service Worker: cache-first estaticos, network-first API |
| `src/movil/js/api.js` | Wrapper fetch() para endpoints GAS |
| `src/movil/js/store.js` | Estado local con localStorage (claves tarealog_*) |
| `src/movil/js/feedback.js` | Vibracion (4 patrones), toasts, feedback haptico |
| `src/movil/js/app.js` | Router SPA, inicializacion, navegacion 3 tabs |
| `src/movil/js/logic/action-resolver.js` | Calcula accion requerida por carga |
| `src/movil/js/views/` | 5 vistas: mi-turno, todo, detalle, programados, config, kanban |
| `src/movil/js/components/` | card, toast, bottom-sheet (UI reutilizable) |
| `src/movil/css/app.css` | Variables CSS + layout mobile-first |
| `src/movil/css/cards.css` | Estilos card (estados, banners alerta) |
| `src/movil/css/outdoor.css` | Modo outdoor (contraste extra, fuentes +25%) |
| `movil/PROMPT_DESARROLLO_MOVIL.md` | Especificacion completa (fuente de verdad) |

---

## Arquitectura PWA

### Service Worker (`sw.js`)

Estrategia dual implementada:
- **Cache-first** para estaticos (HTML, CSS, JS, iconos) via `CACHE_URLS`
- **Network-first** para API GAS (`script.google.com`), con fallback offline que retorna `{ ok: false, error: 'Sin conexion' }`
- Versionado via `CACHE_NAME = 'tarealog-vN'`, limpieza automatica de caches antiguas en `activate`
- Notificaciones push con listener `notificationclick` (accion 'abrir' abre la app)

```javascript
// Al agregar archivos JS, actualizar CACHE_URLS en sw.js
var CACHE_URLS = ['./', './index.html', './css/app.css', /* ... todos los archivos */];
```

**Actualizar version**: Incrementar `CACHE_NAME` al modificar cualquier archivo cacheado.

### Manifest (`manifest.json`)

```json
{
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1565C0",
  "start_url": ".",
  "icons": [{ "src": "icons/icon-192.png", "sizes": "192x192" }, { "src": "icons/icon-512.png", "sizes": "512x512" }]
}
```

**Pendiente**: Generar iconos en `src/movil/icons/` (192px y 512px).

### Registro del Service Worker

En `app.js`, registrar al inicio:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
```

---

## Integracion con Backend GAS

### API Wrapper (`api.js`)

Patron ya implementado: objeto `API` con `configurar(url)`, `get(action)`, `post(action, body)`.

```javascript
// GET: query param ?action=NOMBRE
API.get('getRegistros')       // → { ok, registros[] }
API.get('getProgramados')     // → { ok, programados[] }
API.get('obtenerConfig')      // → { ok, spreadsheetId, spreadsheetNombre }
API.get('getHorarioLaboral')  // → { ok, horario }
API.get('getNotas')           // → { ok, notas[] }
API.get('getRecordatorios')   // → { ok, recordatorios[] }
API.get('getHistorial')       // → { ok, historial[] }

// POST: query param ?action=NOMBRE + body JSON
API.post('procesarCorreos', { limite: 50 })          // Barrido Gmail
API.post('actualizarCampo', { messageId, campo, valor })
API.post('enviarRespuesta', { destinatarios, emailsPorMinuto })
API.post('programarEnvio', { threadId, interlocutor, asunto, cuerpo, cc, bcc, fechaProgramada })
API.post('cancelarProgramado', { id })
API.post('guardarNota', { clave, texto, tipo })
API.post('eliminarNota', { id })
API.post('guardarRecordatorio', { clave, texto, fechaDisparo, preset, origen })
API.post('eliminarRecordatorio', { id })
API.post('registrarHistorial', { clave, tipo, descripcion })
API.post('configurarSpreadsheet', { spreadsheetId })
```

### Manejo de errores

Todos los endpoints retornan `{ ok: false, error: "..." }` en caso de error. `API.get/post` ya lanzan `throw new Error(data.error)`. Envolver en try/catch con feedback:

```javascript
try {
  var data = await API.post('actualizarCampo', { messageId, campo: 'fase', valor: '19' });
  Feedback.vibrar('corto');
  // mostrar toast exito
} catch (e) {
  Feedback.vibrar('error');
  // toast con e.message
}
```

### Throttling envio masivo

`emailsPorMinuto` (default 10, rango 1-30) se envia como parametro en `enviarRespuesta`. El backend GAS respeta el limite. No implementar throttling en cliente.

---

## Reutilizacion de Modulos

18 modulos de logica pura se mantienen como COPIAS en `src/movil/lib/` (NO referencias a `../extension/`). Al modificar un modulo en la extension, SINCRONIZAR manualmente la copia movil:

```html
<script src="./lib/constants.js"></script>
<script src="./lib/date-utils.js"></script>
<script src="./lib/alerts.js"></script>
<script src="./lib/templates.js"></script>
<script src="./lib/filters.js"></script>
<script src="./lib/reminders.js"></script>
<script src="./lib/sequences.js"></script>
<script src="./lib/notes.js"></script>
<script src="./lib/fases-config.js"></script>
<script src="./lib/action-bar.js"></script>
<script src="./lib/dashboard.js"></script>
<script src="./lib/action-log.js"></script>
<script src="./lib/shift-report.js"></script>
<script src="./lib/alert-summary.js"></script>
<script src="./lib/resilience.js"></script>
<script src="./lib/estados-config.js"></script>
<script src="./lib/bulk-reply.js"></script>
<script src="./lib/action-rules.js"></script>
```

**Patron dual-compat**: Cada modulo exporta con `if (typeof module !== 'undefined') module.exports = {...}`, lo que permite usarlos en Jest (Node) y en browser (globales via script tags).

**REGLA**: Al modificar logica pura en `src/extension/`, copiar cambios a `src/movil/lib/` y verificar que no rompa tests Jest.

---

## Patrones UI Mobile

### Navegacion: 5 tabs bottom nav

1. **Mi Turno** (dashboard KPIs turno, resumen estado, grafico semanal)
2. **Todo** (lista unificada + alertas inline + badge numerico + indicadores 📝⏰)
3. **Tablero** (Kanban drag&drop, BottomSheet detalle con acciones rapidas)
4. **Programados** (envios programados + recordatorios activos)
5. **Config** (URL backend, umbrales, modo outdoor, estado inicial, dark mode)

Router SPA en `app.js` con `App.navegar('todo')`. Contenido se renderiza en `#app-contenido`.

### Cards con jerarquia visual

Estructura de una card (`components/card.js`):
1. **Banner accion requerida** (solo si hay alerta) - rojo/naranja segun nivel
2. **codCar + transportista** - identificacion (monospace 20px bold)
3. **Chip fase** (coloreado) + tiempo transcurrido
4. **Indicadores clicables**: 📝 notas (con count), ⏰ recordatorios — click navega a detalle
5. **Botones accion rapida** directos en la card

Ordenacion: CRITICAS primero, luego por `fechaCorreo` descendente.

### Bottom sheet

Componente generico (`components/bottom-sheet.js`) para:
- Selector de fase (coloreado: incidencia=rojo, ok=verde)
- Filtros avanzados (nivel 2)
- Editor de campos editables
- Selector de plantilla

**BottomSheet detalle kanban** (`views/kanban.js:_abrirDetalleMovil`):
- Info basica: codCar, transportista, estado/fase, tiempo relativo
- Indicadores existentes: 📝 notas (count), ⏰ recordatorio (motivo)
- Acciones rapidas: +Nota, +Record., Cambiar fase, Ver detalle completo
- Click indicadores navega a detalle

### Indicadores clicables en tarjetas kanban

Tres indicadores en footer tarjeta, todos clicables:
- **📝 notas** → click navega a detalle (movil) / abre modal notas (extension)
- **⏰ recordatorio** → abre BottomSheet recordatorio (movil) / abre detalle recordatorio (extension)
- **📅 programado** → abre BottomSheet programado (movil) / abre modal programado (extension)

### Filtros 2 niveles

**Nivel 1**: 4 chips sticky bajo busqueda: `[Urgentes(N)]` `[Hoy(N)]` `[Sin leer(N)]` `[+]`
**Nivel 2**: Bottom sheet con transportista, fase, periodo, estado, vinculacion + botones Reset/Aplicar

### Feedback obligatorio (cada accion)

Triple feedback via `feedback.js`:

| Accion | Visual | Haptico | Toast |
|--------|--------|---------|-------|
| Cambiar fase | Chip anima color | `corto` (50ms) | "Fase actualizada a 19" |
| Enviar email | Boton→spinner→check | `doble` (100+100ms) | "Email enviado a Garcia" |
| Error red | Borde rojo | `error` (triple rapido) | "Sin conexion. Reintentando..." |
| Guardar nota | Highlight entrada | `corto` (50ms) | "Nota guardada" |
| Pull-to-refresh | Skeleton shimmer | Ninguno | "(N) cargas actualizadas" |

Toasts destructivos (archivar, eliminar) incluyen boton [Deshacer] con 5s timeout.

---

## Accesibilidad en Campo

### Contraste y tipografia

- Ratio contraste minimo: **7:1** (WCAG AAA)
- Colores Material 700+ para visibilidad bajo sol directo
- Textos: `--text-primary: #000000`, `--text-secondary: #424242`
- Cuerpo: 16px (NO 14), subtexto: 14px (NO 12), codCar: monospace 20px bold

### Tap targets

- **Minimo**: 48x48dp (12mm fisicos) para TODOS los interactivos
- **Botones primarios**: 56x56dp
- **Spacing entre targets**: 8dp minimo
- Acciones principales en **zona inferior** (alcance pulgar mano derecha)

### Modo outdoor (`css/outdoor.css`)

Toggle en Config. Activa clase `body.outdoor`:
- Contraste extra (negro puro sobre blanco puro)
- Fuente +25% (cuerpo 20px, subtexto 16px)
- Bordes gruesos (2px cards, 3px chips)
- Desactiva animaciones complejas
- Padding extra en botones (+8dp)

### Notificaciones adaptadas

- **NO audio** (ruido ambiental lo tapa)
- **SI vibracion** con patrones distinguibles (ver `PATRONES_VIBRACION` en feedback.js)
- **SI badge numerico** en tab Todo (total alertas)
- **SI notificaciones push** con botones de accion directa: `[Abrir carga]` `[Marcar vista]`

---

## Storage Local

Claves `localStorage` (prefijo `tarealog_`):

| Clave | Contenido | Gestionado por |
|-------|-----------|----------------|
| `registros` | Cache registros backend | `Store` |
| `ultimoBarrido` | ISO timestamp | `Store` |
| `tarealog_config` | Configuracion usuario | `Store` |
| `tarealog_plantillas` | Array plantillas | `Store` |
| `tarealog_pie_comun` | Firma HTML global | `Store` |
| `tarealog_alertas` | Alertas evaluadas | `Store` |
| `tarealog_recordatorios` | Lista recordatorios | Backend (GET/POST) |
| `tarealog_notas` | Mapa codCar→NOTA[] | Backend (GET/POST) |
| `tarealog_secuencias` | Secuencias activas | Backend |
| `tarealog_historial` | Mapa codCar→ENTRADA[] | Backend |
| `tarealog_resumen_flag` | Flag matutino diario | `alert-summary.js` |
| `tarealog_filtro_pendiente` | Click-through desde resumen | `alert-summary.js` |

---

## 4 Fases de Desarrollo

### Fase 1: Fundacion (MVP Core)
- F1: Vista Todo (cards agrupadas por codCar, pull-to-refresh, checkbox)
- F2: Detalle carga (header sticky, emails, secciones colapsables, bottom bar)
- F3: Cambio de fase (bottom sheet coloreado + feedback)
- F4: Responder email (modal full-screen, plantillas, pie comun)

### Fase 2: Valor Diferencial
- F5: Alertas inline (5 reglas R2-R6, banners en cards, ordenacion por criticidad)
- F6: Notas rapidas (CRUD via backend, badge en card)
- F7: Accion requerida inteligente (`action-resolver.js`: prioriza alerta > fase > emails > deadline)

### Fase 3: Optimizacion
- F8: Filtros 2 niveles (chips rapidos + bottom sheet avanzados)
- F9: Plantillas avanzadas (CRUD, variables `{{codCar}}`, pie comun, export/import JSON)
- F10: Seleccion multiple (checkboxes, cambio fase masivo, respuesta masiva con rate limit)

### Fase 4: Productividad Avanzada
- F11: Resumen matutino (4 categorias, KPIs, click-through a filtros)
- F12: Recordatorios con snooze (presets, sugerencias por fase, push + botones)
- F13: Envios programados (CRUD, horario laboral, estados)
- F14: Dashboard operativo (KPIs turno, grafico semanal)
- F15: Secuencias follow-up (3 predefinidas + custom, 3 pasos cada una)
- F16: Historial y reporte turno

---

## Consideraciones para Agentes

### ANTES de implementar

1. Leer `movil/PROMPT_DESARROLLO_MOVIL.md` para la seccion especifica de la feature
2. Consultar `docs/DICCIONARIO_DOMINIO.md` para nombres de campos/estados/enums
3. Verificar que modulos compartidos (`src/extension/*.js`) no se modifican sin revisar impacto
4. Identificar en que fase de desarrollo esta la feature (F1-F16)

### DURANTE la implementacion

- **Script tags, NO modules**: Todo carga via `<script>` en orden (dependencias primero)
- **Dual-compat**: Nuevos modulos de logica pura deben exportar con `if (typeof module !== 'undefined')`
- **Store centralizado**: Toda lectura/escritura de localStorage pasa por `Store`
- **Feedback triple**: Toda accion usuario necesita visual + haptico + toast
- **Actualizar `CACHE_URLS`** en `sw.js` al agregar archivos nuevos
- **Incrementar `CACHE_NAME`** al modificar archivos cacheados
- Tests en `tests/TDD/unit/` con patron AAA, mismo setup Jest existente

### DESPUES de implementar

1. Verificar que los 878 tests Jest existentes (38 suites) siguen pasando (`npx jest`)
2. Probar en Chrome DevTools modo responsive (< 640px)
3. Verificar modo outdoor activado/desactivado
4. Comprobar fallback offline (SW devuelve error graceful)
5. Actualizar `CLAUDE.md` si cambia version o estado

---

## Referencias

| Recurso | Ubicacion |
|---------|-----------|
| Especificacion completa | `movil/PROMPT_DESARROLLO_MOVIL.md` |
| Diccionario dominio | `docs/DICCIONARIO_DOMINIO.md` |
| Skill backend GAS | `.claude/skills/gas-deploy.md` |
| Skill extension Chrome | `.claude/skills/chrome-extension-mv3.md` |
| Skill dual-compat | `.claude/skills/dual-compat-modules.md` |
| Tests existentes | `tests/TDD/unit/` (878 tests, 38 suites) |
| Backend GAS | `src/gas/` (11 archivos, clasp deploy) |
