# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## 2.1 Mapa de Impacto

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `src/extension/reminders.js` | NUEVO ~200 lin | Logica pura: CRUD, snooze, sugerencias, presets |
| `tests/TDD/unit/test_reminders.js` | NUEVO ~250 lin | Tests Jest logica pura |
| `src/extension/background.js` | MOD +30 lin | Alarma recordatorios, listener snooze, importScripts |
| `src/extension/config.js` | MOD +10 lin | Defaults sugerencias automaticas |
| `src/extension/panel.js` | MOD +80 lin | Boton Recordar, modal, panel Mis Recordatorios |
| `src/extension/panel.html` | MOD +40 lin | Modal recordar + seccion panel recordatorios |
| `docs/DICCIONARIO_DOMINIO.md` | MOD +15 lin | Entidad RECORDATORIO, storage key |

---

## 2.2 Patrones Existentes a Reutilizar

### Patron dual-compat (GAS/Node)
Usado en alerts.js, config.js, templates.js:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ... };
}
```

### Patron logica pura + UI separada
- alerts.js = logica pura (evaluarAlertas, calcularBadge)
- background.js = integracion Chrome API
- panel.js = UI
**Aplicar:** reminders.js = logica pura, background.js/panel.js = integracion

### Patron alarma periodica
background.js ya usa chrome.alarms con nombre unico:
```javascript
chrome.alarms.create(ALARM_MATUTINO, { periodInMinutes: 60 });
```
**Aplicar:** ALARM_RECORDATORIOS con periodInMinutes: 1

### Patron storage
```javascript
await chrome.storage.local.get('tarealog_alertas');
await chrome.storage.local.set({ tarealog_alertas: alertas });
```
**Aplicar:** tarealog_recordatorios

---

## 2.3 Tests Existentes

- `tests/TDD/unit/test_alerts.js` — 42 tests (patron a seguir)
- `tests/TDD/unit/test_alert_summary.js` — 28 tests
- Total: 70 tests pasando, 0 fallos
- Tests que podrian romperse: NINGUNO (modulo nuevo independiente)

---

## 2.4 Opciones Evaluadas

### Opcion 1: Alarma individual por recordatorio
- **Descripcion:** chrome.alarms.create con nombre unico por cada recordatorio
- **Pros:** Precision exacta en el timing
- **Cons:** MV3 limita a 1 alarma/minuto para crear; con 50 recordatorios es inviable
- **Complejidad:** L

### Opcion 2: Alarma periodica unica (ELEGIDA)
- **Descripcion:** Una sola alarma cada 1 minuto que verifica todos los recordatorios pendientes
- **Pros:** Sin limite de alarmas, simple, probado (patron ya usado para matutino)
- **Cons:** Precision de ±1 minuto (aceptable para recordatorios de operador)
- **Complejidad:** S

### Opcion 3: setTimeout en service worker
- **Descripcion:** Usar setTimeout para cada recordatorio
- **Pros:** Precision exacta
- **Cons:** Service worker MV3 se suspende tras 30s de inactividad; NO funciona
- **Complejidad:** N/A (descartada)

---

## 2.5 Decision (ADR)

**Opcion seleccionada:** Opcion 2 — Alarma periodica unica
**Justificacion:**
- Patron ya probado en background.js (ALARM_MATUTINO cada 60 min)
- Sin limite de alarmas Chrome
- Precision ±1 min aceptable para caso de uso
- Logica de verificacion en reminders.js (pura, testeable)
- Service worker se mantiene vivo por la alarma

---

## Puerta de Validacion 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados
- [x] Al menos 2 opciones evaluadas
- [x] Decision justificada

**Estado:** COMPLETADO
