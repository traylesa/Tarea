# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## Arquitectura

```
background.js (Service Worker)
│
├─ ejecutarBarridoPeriodico()
│   ├─ fetch(procesarCorreos) → GAS retorna registros
│   ├─ chrome.storage.local.set({ registros })
│   │
│   ├─ alerts.evaluarAlertas(registros, config, alertasPrevias, ahora)
│   │   ├─ R1: cargaHoySinOrden(registros, ahora)
│   │   ├─ R2: silencioTransportista(registros, config.alertas, ahora)
│   │   ├─ R3: faseEstancada(registros, config.alertas, ahora)
│   │   ├─ R4: docsPendientes(registros, config.alertas, ahora)
│   │   ├─ R5: incidenciaActiva(registros)
│   │   └─ R6: cargaHoySinOrdenUrgente(registros, ahora)
│   │
│   ├─ alerts.deduplicar(alertasNuevas, alertasPrevias, cooldownMs)
│   ├─ alerts.calcularBadge(alertasActivas) → { texto, color }
│   │   └─ chrome.action.setBadgeText/BackgroundColor
│   │
│   └─ alerts.generarNotificaciones(alertasNuevas) → [{id, opts}]
│       └─ chrome.notifications.create(id, opts)
│
└─ chrome.storage.local.set({ alertasActivas })
```

---

## Modelo de Datos

### Estructura: Alerta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único: `{regla}_{codCar o threadId}` |
| `regla` | string | Código regla: R1-R6 |
| `nivel` | enum(NIVEL_ALERTA) | CRITICO, ALTO, MEDIO, BAJO |
| `titulo` | string | Título corto para notificación |
| `mensaje` | string | Descripción detallada |
| `codCar` | number/null | Código carga asociada |
| `threadId` | string/null | Hilo asociado |
| `timestamp` | string (ISO) | Momento de generación |

### Enum: NIVEL_ALERTA

- `CRITICO` — Rojo, notificación prominente, prioridad 2
- `ALTO` — Naranja, notificación estándar, prioridad 1
- `MEDIO` — Azul, notificación silenciosa, prioridad 0
- `BAJO` — Verde, solo badge

### Estructura: Badge

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `texto` | string | Número de alertas ('' si 0) |
| `color` | string | '#FF0000' (critico), '#FF8C00' (alto), '#2196F3' (medio), '#4CAF50' (bajo) |

### Config: alertas (nuevo campo en getDefaults)

```javascript
alertas: {
  activado: true,
  silencioUmbralH: 4,        // R2: horas sin respuesta
  estancamientoMaxH: {       // R3: horas max por fase
    '12': 3,                 // Cargando: 3h
    '19': 24,                // En ruta: 24h
    '22': 3                  // Descargando: 3h
  },
  docsUmbralDias: 2,         // R4: días sin documentar
  cooldownMs: 3600000        // 1 hora entre alertas iguales
}
```

### Storage: nuevas claves

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `tarealog_alertas` | array(Alerta) | Alertas activas |

---

## Interfaces Públicas (alerts.js)

```javascript
/**
 * Evalúa todas las reglas sobre registros y retorna alertas nuevas.
 * @param {Array} registros - Registros de seguimiento
 * @param {Object} config - Configuración con config.alertas
 * @param {Array} alertasPrevias - Alertas del barrido anterior
 * @param {Date} ahora - Momento actual (inyectable para tests)
 * @returns {Array<Alerta>} Alertas generadas (ya deduplicadas)
 */
function evaluarAlertas(registros, config, alertasPrevias, ahora)

/**
 * Filtra alertas repetidas dentro del cooldown.
 * @param {Array} nuevas - Alertas recién evaluadas
 * @param {Array} previas - Alertas del barrido anterior
 * @param {number} cooldownMs - Milisegundos de cooldown
 * @returns {Array} Alertas no duplicadas
 */
function deduplicar(nuevas, previas, cooldownMs)

/**
 * Calcula texto y color del badge según alertas activas.
 * @param {Array} alertas - Alertas activas
 * @returns {{ texto: string, color: string }}
 */
function calcularBadge(alertas)

/**
 * Genera lista de notificaciones Chrome a crear.
 * @param {Array} alertas - Alertas nuevas (no duplicadas)
 * @returns {Array<{ id: string, opciones: Object }>}
 */
function generarNotificaciones(alertas)
```

---

## Flujo de Ejecución

1. `chrome.alarms` dispara → `ejecutarBarridoPeriodico()`
2. Fetch `procesarCorreos` en GAS → obtiene registros actualizados
3. Guardar registros en `chrome.storage.local`
4. Leer alertas previas de `chrome.storage.local`
5. `evaluarAlertas(registros, config, alertasPrevias, ahora)` → alertas nuevas
6. `deduplicar(alertasNuevas, alertasPrevias, cooldownMs)` → alertas únicas
7. `calcularBadge(alertasUnicas)` → aplicar `chrome.action.setBadgeText/Color`
8. `generarNotificaciones(alertasUnicas)` → crear `chrome.notifications`
9. Guardar alertas en `chrome.storage.local`

---

## Nombres a registrar en Diccionario

| Nombre | Tipo | Dominio |
|--------|------|---------|
| `NIVEL_ALERTA` | enum | Estados |
| `tarealog_alertas` | storage key | Storage |
| `alertas` | config field | Configuración |

---

## Puerta de Validación 4

- [x] Arquitectura clara y documentada
- [x] Nombres preparados para docs/DICCIONARIO_DOMINIO.md
- [x] Interfaces públicas definidas (4 funciones)
- [x] Flujos críticos documentados
- [x] Modelos coherentes con arquitectura existente
