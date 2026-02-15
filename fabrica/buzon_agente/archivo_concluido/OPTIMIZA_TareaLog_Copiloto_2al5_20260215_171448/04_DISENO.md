# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## Arquitectura

```
┌─ alert-summary.html (ventana standalone) ─────────────────┐
│   <script src="alerts.js">      ← NIVEL, COLORES_BADGE   │
│   <script src="alert-summary.js"> ← logica + UI          │
│   <link href="alert-summary.css">                         │
│                                                           │
│   DOMContentLoaded → renderResumen()                      │
│     └─ chrome.storage.local.get → alertas + registros     │
│     └─ categorizarAlertas(alertas)                        │
│     └─ calcularKPIs(registros, alertas)                   │
│     └─ Pintar tarjetas + KPIs                             │
│                                                           │
│   Click categoria → sendMessage(ABRIR_PANEL_FILTRADO)     │
│   Click posponer  → crearFlagMostrado(ahora, 60)          │
│   Click cerrar    → window.close()                        │
└───────────────────────────────────────────────────────────┘
        ↕ chrome.runtime.sendMessage
┌─ background.js (service worker) ──────────────────────────┐
│   Listener ABRIR_RESUMEN → chrome.windows.create(...)     │
│   Listener ABRIR_PANEL_FILTRADO → guardar filtro + abrir  │
│   Alarma matutina → debeMostrarMatutino() → abrir ventana │
└───────────────────────────────────────────────────────────┘
        ↕ chrome.runtime.sendMessage
┌─ panel.js (panel principal) ──────────────────────────────┐
│   Boton "Resumen" → sendMessage(ABRIR_RESUMEN)            │
│   Al cargar: leer tarealog_filtro_pendiente → aplicar     │
└───────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos

### STORAGE_KEYS nuevas (verificadas contra diccionario)

| Clave | Tipo | Descripcion |
|-------|------|-------------|
| `tarealog_resumen_flag` | `{fecha: string, pospuestoHasta: string\|null}` | Flag matutino: fecha mostrado + hora posponer |
| `tarealog_filtro_pendiente` | `{filtros: array}\|null` | Filtros Tabulator pendientes para click-through |

**Nota:** Ya existen en diccionario: `tarealog_alertas`, `registros`, `tarealog_config`.

### CONFIG: resumenMatutino (nueva seccion en config)

| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `activado` | boolean | true | Habilitar resumen matutino automatico |
| `hora` | string (HH:MM) | '08:00' | Hora inicio turno para trigger matutino |

---

## Interfaces Publicas

### alert-summary.js — Logica pura (testeable Jest)

```javascript
// Agrupa alertas por categoria segun regla
function categorizarAlertas(alertas)
// → { urgente: [], sinRespuesta: [], documentacion: [], estancadas: [] }

// Calcula metricas agregadas
function calcularKPIs(registros, alertas)
// → { activas: N, hoy: N, totalAlertas: N, sinRespuesta: N, sinDocs: N }

// Determina si debe mostrarse el resumen matutino
function debeMostrarMatutino(flag, configResumen, ahora)
// → boolean

// Crea/actualiza flag de mostrado
function crearFlagMostrado(ahora, posponerMinutos)
// → { fecha: 'YYYY-MM-DD', pospuestoHasta: ISO|null }

// Genera array de filtros Tabulator para una categoria
function filtroParaCategoria(categoria, alertas)
// → [{ field: string, type: string, value: any }]
```

### Mensajes Chrome (background.js listeners)

```javascript
{ tipo: 'ABRIR_RESUMEN' }
// → Abre alert-summary.html como ventana popup

{ tipo: 'ABRIR_PANEL_FILTRADO', filtros: [{field, type, value}] }
// → Guarda filtros en storage + abre/enfoca panel
```

---

## Flujos de Ejecucion

### Flujo 1: Resumen matutino automatico

1. Alarma `tarealog-resumen-matutino` se dispara (cada 60 min)
2. background.js verifica: hora actual >= config.resumenMatutino.hora
3. background.js lee flag `tarealog_resumen_flag` de storage
4. Llama `debeMostrarMatutino(flag, config, ahora)`
5. Si true: lee alertas de storage, si hay > 0: `chrome.windows.create({url: 'alert-summary.html', ...})`
6. Escribe flag con `crearFlagMostrado(ahora)`

### Flujo 2: Resumen bajo demanda

1. Operador click "Resumen" en panel
2. panel.js envia `sendMessage({tipo: 'ABRIR_RESUMEN'})`
3. background.js recibe → `chrome.windows.create({url: 'alert-summary.html', ...})`
4. alert-summary.html carga → lee storage → renderiza

### Flujo 3: Click-through (ventana → panel filtrado)

1. Operador click en categoria en ventana resumen
2. alert-summary.js calcula filtros con `filtroParaCategoria(cat, alertas)`
3. Envia `sendMessage({tipo: 'ABRIR_PANEL_FILTRADO', filtros: [...]})`
4. background.js recibe → guarda `tarealog_filtro_pendiente` en storage → `abrirOEnfocarVentana()`
5. panel.js al cargar lee `tarealog_filtro_pendiente` → aplica filtros Tabulator → limpia flag
6. Ventana resumen se cierra con `window.close()`

---

## Propuesta Diccionario

Nombres nuevos a registrar en `docs/DICCIONARIO_DOMINIO.md`:

1. **STORAGE_KEY `tarealog_resumen_flag`** — Flag matutino diario
2. **STORAGE_KEY `tarealog_filtro_pendiente`** — Filtros click-through temporales
3. **CONFIG `resumenMatutino`** — Seccion configuracion resumen automatico

Todos los demas nombres ya existen en el diccionario (NIVEL_ALERTA, REGLA_ALERTA, tarealog_alertas, etc.).

---

## Puerta de Validacion 4

- [x] Arquitectura clara y documentada
- [x] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas (5 funciones + 2 mensajes)
- [x] Flujos criticos documentados (3 flujos)

**Estado:** COMPLETADO
