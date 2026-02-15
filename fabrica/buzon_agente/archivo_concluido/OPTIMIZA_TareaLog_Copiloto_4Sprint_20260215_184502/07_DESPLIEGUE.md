# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502

---

## Pre-Deployment

### Archivos Nuevos para Extension

Agregar en `panel.html` antes del cierre `</body>`:
```html
<script src="action-bar.js"></script>
<script src="notes.js"></script>
```

### Archivos Nuevos (ya en src/extension/)

- `action-bar.js` — Acciones contextuales por fase (68 lineas)
- `notes.js` — CRUD notas por carga (88 lineas)

### Tests

```
npx jest tests/TDD/unit/test_action_bar.js tests/TDD/unit/test_notes.js
  tests/TDD/unit/test_alerts.js tests/TDD/unit/test_alert_summary.js
  tests/TDD/unit/test_reminders.js

Test Suites: 5 passed, 5 total
Tests:       169 passed, 169 total
```

---

## Deployment

### Pasos

1. **Extension Chrome (local):**
   - Ir a `chrome://extensions/`
   - Click "Recargar" en TareaLog
   - Los nuevos scripts se cargan automaticamente

2. **Backend GAS:** No requiere cambios (Sprint 4 es 100% cliente)

3. **Smoke Tests manuales:**
   - Abrir panel TareaLog
   - Seleccionar fila con fase conocida
   - Verificar que acciones contextuales estan disponibles via consola:
     ```javascript
     obtenerAccionesPorFase('29')
     // → [{etiqueta: "Reclamar POD", ...}, {etiqueta: "Marcar documentado", ...}]
     ```
   - Verificar notas via consola:
     ```javascript
     var r = crearNota('Test', 168345, {}, new Date());
     obtenerNotas(168345, r.almacen);
     // → [{id: "nota_...", texto: "Test", ...}]
     ```

---

## Rollback Plan

- Eliminar `<script>` tags de action-bar.js y notes.js de panel.html
- Recargar extension
- Los modulos son independientes, no afectan funcionalidad existente

---

## Checklist

- [x] Archivos nuevos creados en src/extension/
- [x] Tests pasando (169/169)
- [x] Sin dependencias GAS
- [x] Rollback plan documentado
- [x] Smoke tests documentados

---

**Estado:** COMPLETADO (pendiente integracion UI en panel.js — solo logica pura desplegada)
