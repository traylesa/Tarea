# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## Archivos Nuevos

| Archivo | Tipo | Líneas |
|---------|------|--------|
| `src/extension/reminders.js` | Lógica pura | 120 |
| `tests/TDD/unit/test_reminders.js` | Tests Jest | 270 |

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/extension/background.js` | +55 líneas (alarma, verificar, notificar, snooze) |
| `src/extension/config.js` | +10 líneas (defaults recordatorios, auto-migración) |
| `src/extension/panel.js` | +90 líneas (modal, panel, render, sugerencias) |
| `src/extension/panel.html` | +35 líneas (modal, panel, botón, script tag) |
| `docs/DICCIONARIO_DOMINIO.md` | +25 líneas (entidad RECORDATORIO, storage keys) |

---

## Plan de Despliegue

### Extensión Chrome (local)
```bash
# 1. Verificar tests
npx jest tests/TDD/unit/ --verbose

# 2. Cargar extensión en Chrome
# chrome://extensions → Modo desarrollador → Cargar descomprimida → src/extension/

# 3. Verificar service worker carga sin errores
# Inspeccionar service worker → Console → sin errores
```

### Backend GAS
No se requieren cambios en GAS para Sprint 3. Los recordatorios son 100% cliente (storage local + alarmas Chrome).

---

## Smoke Tests Manuales

| Test | Pasos | Esperado |
|------|-------|----------|
| Crear recordatorio | Clic "Recordatorios" → "Nuevo" → texto + preset → Guardar | Aparece en lista |
| Notificación | Crear con preset "15min", esperar | Notificación Chrome aparece |
| Snooze | Clic "Snooze 15min" en notificación | Recordatorio reaparece en 15min |
| Hecho | Clic "Hecho" en notificación | Recordatorio eliminado |
| Sugerencia auto | Cambiar fase a 19 en tabla | Recordatorio creado automáticamente |
| Panel colapsable | Clic botón "Recordatorios" | Panel se muestra/oculta |
| Persistencia | Cerrar y reabrir extensión | Recordatorios siguen en lista |

---

## Rollback

Si se detectan problemas:
1. Revertir `src/extension/reminders.js` (eliminar archivo)
2. Revertir cambios en background.js, config.js, panel.js, panel.html
3. `git checkout HEAD~1 -- src/extension/` (si hay commit)

---

## Puerta de Validación 7

- [x] Archivos nuevos y modificados identificados
- [x] Plan de despliegue documentado
- [x] Smoke tests definidos
- [x] Rollback plan documentado
- [x] No requiere cambios en backend GAS

**Estado:** COMPLETADO
