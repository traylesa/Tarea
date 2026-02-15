# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502

---

## 2.1 Mapa de Impacto

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `src/extension/action-bar.js` | CREAR (~100 lin) | Mapa acciones por fase, logica pura |
| `src/extension/notes.js` | CREAR (~120 lin) | CRUD notas por codCar, logica pura |
| `tests/TDD/unit/test_action_bar.js` | CREAR (~120 lin) | Tests action-bar |
| `tests/TDD/unit/test_notes.js` | CREAR (~150 lin) | Tests notes |
| `src/extension/panel.js` | MODIFICAR | Hookear action bar + icono notas (minimo) |
| `src/extension/panel.html` | MODIFICAR | Contenedor action bar + modal notas |

Lineas estimadas: ~200 nuevas (modulos) + ~270 tests + ~50 integracion panel = ~520 lineas

---

## 2.2 Patrones Existentes a Reutilizar

### Patron 1: Modulo logica pura con dual-compat

Usado en alerts.js, reminders.js, filters.js, templates.js, bulk-reply.js:

```javascript
// Logica pura sin DOM ni Chrome API
var CONSTANTE = { ... };

function funcionPrincipal(params) { ... }

// Dual-compat
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { funcionPrincipal, CONSTANTE };
}
```

### Patron 2: ID unico con timestamp + random

Usado en reminders.js:
```javascript
function _generarId() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
```

### Patron 3: Tests con fecha fija

Usado en test_reminders.js, test_alerts.js:
```javascript
const AHORA = new Date('2026-02-15T10:00:00.000Z');
```

### Patron 4: Config defaults con auto-migracion

En config.js, cada nuevo sub-objeto se anade a getDefaults() y se migra en cargar():
```javascript
if (!guardada.recordatorios) {
  config.recordatorios = defaults.recordatorios;
} else {
  config.recordatorios = { ...defaults.recordatorios, ...guardada.recordatorios };
}
```

---

## 2.3 Tests Existentes

- **112 tests** en 3 suites principales (alerts, alert-summary, reminders): todos pasan
- **17 archivos** test totales (algunos tienen issues con process.exit)
- Tests que podrian romperse: **NINGUNO** — los modulos nuevos son independientes
- Tests de panel.js: no existen (panel es UI, se testea manualmente)

---

## 2.4 Spike Tecnico

No aplica. El patron esta probado en 3 sprints previos (misma arquitectura).

---

## 2.5 Opciones Evaluadas

### Opcion 1: Modulos logica pura (patron sprint 1-3)

- **Descripcion:** action-bar.js y notes.js como modulos puros, integracion minima en panel.js
- **Pros:** Patron probado, testeable, desacoplado, consistente con codebase
- **Cons:** Ninguno significativo
- **Complejidad:** S

### Opcion 2: Todo en panel.js

- **Descripcion:** Agregar funciones directamente en panel.js
- **Pros:** Menos archivos
- **Cons:** panel.js ya tiene 1500 lineas, no testeable, acoplado
- **Complejidad:** M (por la deuda tecnica)

### Opcion 3: Web Components

- **Descripcion:** Crear custom elements para action-bar y notes
- **Pros:** Encapsulacion DOM, reutilizable
- **Cons:** Over-engineering para el contexto, incompatible con patron existente, no dual-compat
- **Complejidad:** L

---

## 2.6 Decision (ADR)

**Opcion seleccionada:** Opcion 1 — Modulos logica pura

**Justificacion:**
- Patron probado exitosamente en 3 sprints (alerts.js, alert-summary.js, reminders.js)
- Testeable con Jest sin mocks de DOM
- Consistente con arquitectura existente
- Menor riesgo de regresion

---

## Checklist

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados
- [x] Spike no necesario (patron probado)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada

---

**Estado:** COMPLETADO
