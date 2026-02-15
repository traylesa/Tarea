# 02 - INVESTIGACIÓN

**Fase:** Investigación del Codebase + Opciones Técnicas
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## 2.1 Mapa de Impacto

| Archivo | Tipo | Líneas est. | Descripción |
|---------|------|-------------|-------------|
| `src/extension/dashboard.js` | CREAR | ~120 | Lógica pura KPIs, gráfico semanal |
| `src/extension/action-log.js` | CREAR | ~100 | CRUD historial acciones, rotación |
| `src/extension/sequences.js` | CREAR | ~150 | CRUD secuencias follow-up, evaluación pasos |
| `src/extension/shift-report.js` | CREAR | ~80 | Generar datos reporte fin turno |
| `tests/TDD/unit/test_dashboard.js` | CREAR | ~120 | Tests dashboard |
| `tests/TDD/unit/test_action_log.js` | CREAR | ~100 | Tests historial |
| `tests/TDD/unit/test_sequences.js` | CREAR | ~120 | Tests secuencias |
| `tests/TDD/unit/test_shift_report.js` | CREAR | ~80 | Tests reporte |
| `src/extension/panel.html` | MOD | ~15 | Script tags para nuevos módulos + action-bar + notes |
| `src/extension/panel.js` | MOD | ~150 | Hooks dashboard, action-bar, notes, historial |
| `src/extension/background.js` | MOD | ~30 | Alarma secuencias + reporte |
| `src/extension/config.js` | MOD | ~15 | Defaults secuencias + reporte turno |

**Total estimado:** ~1,080 líneas nuevas/modificadas

---

## 2.2 Patrones Existentes a Reutilizar

### Patrón 1: Módulo lógica pura dual-compat (reminders.js)
```javascript
// Funciones puras sin DOM ni Chrome API
function crearRecordatorio(texto, codCar, preset, ahora, listaExistente) {
  if (!texto || !texto.trim()) throw new Error('Texto obligatorio');
  // ... logica pura
  return { id, codCar, texto, fechaCreacion, fechaDisparo, snoozeCount: 0, origen: 'manual' };
}

// Export condicional al final
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { crearRecordatorio, ... };
}
```

### Patrón 2: Storage + render en panel.js
```javascript
const STORAGE_KEY_X = 'tarealog_X';
async function cargarXUI() {
  var stored = await chrome.storage.local.get(STORAGE_KEY_X);
  xCache = stored[STORAGE_KEY_X] || [];
  renderX();
}
```

### Patrón 3: Alarma en background.js
```javascript
const ALARM_X = 'tarealog-x';
chrome.alarms.create(ALARM_X, { periodInMinutes: N });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_X) { await verificarX(); return; }
});
```

### Antipatrones a evitar
- Lógica de negocio en panel.js → delegar siempre a módulo puro
- DOM en archivos lógica pura → rompe tests Jest
- IDs no únicos en storage → usar prefijo módulo

---

## 2.3 Análisis de Tests Existentes

- **Tests relacionados:** test_action_bar.js (27), test_notes.js (30), test_reminders.js (42), test_alerts.js (42), test_alert_summary.js (28)
- **Cobertura zona afectada:** 83-96% (varies por módulo)
- **Tests que podrían romperse:** Ninguno — los 4 módulos nuevos son independientes. La integración UI (panel.js) no tiene tests unitarios.

---

## 2.4 Spike Técnico

**HU-09 (Secuencias):** ¿Se puede reutilizar la tabla `programados` existente?

Resultado: **Viable.** La tabla `programados` en Sheets tiene campos: id, thread_id, cuerpo, fecha_programada, estado. Una secuencia de 3 pasos = 3 filas en programados con fechas escalonadas. La evaluación de "respuesta recibida" se hace en background.js comparando threadId contra registros con estado RECIBIDO.

**HU-10 (Reporte):** ¿Se puede reutilizar alert-summary.html?

Resultado: **Viable con restricciones.** La ventana alert-summary.html tiene estructura fija para alertas. Es más limpio crear la lógica de datos en shift-report.js y reutilizar solo el patrón de ventana popup, no el HTML específico.

---

## 2.5 Opciones Evaluadas

### Opción 1: Módulos puros independientes (RECOMENDADA)
- **Descripción:** Crear 4 módulos JS lógica pura (dashboard, action-log, sequences, shift-report). Cada uno con export dual-compat. Integración mínima en panel.js.
- **Pros:** Patrón probado 4 sprints. Testeable. Bajo acoplamiento.
- **Cons:** panel.js crece ~150 líneas más (hooks UI)
- **Complejidad:** M

### Opción 2: Módulo monolítico sprint5.js
- **Descripción:** Un solo archivo con toda la lógica del sprint.
- **Pros:** Menos archivos
- **Cons:** Rompe principio de responsabilidad única. Difícil testear. Contrario al patrón establecido.
- **Complejidad:** M

### Opción 3: Web Components para UI
- **Descripción:** Crear custom elements para dashboard y historial.
- **Pros:** Encapsulación total, shadow DOM
- **Cons:** Complejidad innecesaria. No hay precedente en el proyecto. Rompe patrón script tags.
- **Complejidad:** L

## 2.6 Criterios de Decisión

| Criterio | Peso | Opción 1 | Opción 2 | Opción 3 |
|----------|------|----------|----------|----------|
| Consistencia con codebase | Alto | 10 | 3 | 2 |
| Testabilidad | Alto | 10 | 5 | 7 |
| Simplicidad | Medio | 9 | 7 | 3 |
| Mantenibilidad | Medio | 9 | 4 | 8 |
| **Total** | | **38** | **19** | **20** |

## 2.7 Decisión (ADR)

**Opción seleccionada:** Opción 1 — Módulos puros independientes
**Justificación:** Es el patrón consolidado en 4 sprints exitosos. Maximiza testabilidad y consistencia. Los 169 tests existentes validan que este enfoque funciona.

---

## PUERTA DE VALIDACIÓN 2: ✅ SUPERADA

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con código real
- [x] Tests existentes analizados
- [x] Spike resuelto (secuencias viables con programados, reporte con ventana nueva)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decisión justificada

**Estado:** COMPLETADO
