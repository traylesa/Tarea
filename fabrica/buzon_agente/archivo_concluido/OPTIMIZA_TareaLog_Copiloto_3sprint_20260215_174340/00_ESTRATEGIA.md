# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## Objetivo

Implementar Sprint 3 de TareaLog: **Recordatorios con Snooze** (HU-07 + HU-08). Transformar la extension de herramienta pasiva a copiloto activo que recuerda al operador tareas pendientes asociadas a cargas.

**Por que:** El operador gestiona 30-80 cargas simultaneas con 6+ aplicaciones abiertas. Depende de su memoria para seguimiento. Los recordatorios eliminan olvidos y reducen cambios de contexto.

---

## Alcance

### QUE SI
- **HU-07:** Recordatorios manuales con snooze
  - Boton "Recordar" en cada fila de la tabla
  - Modal con texto libre + presets de tiempo (15min, 30min, 1h, 2h, 4h, Manana 9am)
  - Notificacion Chrome al cumplirse con botones snooze
  - Persistencia via chrome.alarms + chrome.storage.local
  - Panel "Mis recordatorios" con activos y countdown
  - Indicador en fila si carga tiene recordatorio activo
- **HU-08:** Recordatorios automaticos sugeridos
  - Sugerencias al cambiar fase (Cargado→verificar descarga, Vacio→reclamar POD)
  - Operador acepta, ajusta hora o descarta
  - Aceptados se comportan como manuales
  - Configurable: activar/desactivar sugerencias por fase

### QUE NO
- HU-09 (Secuencias follow-up) → Sprint 5
- HU-11 (Acciones contextuales) → Sprint 4
- HU-12 (Notas rapidas) → Sprint 4
- Cambios en backend GAS (recordatorios 100% client-side)
- Cambios en manifest.json (permisos ya declarados)

---

## Criterios de Exito

| Criterio | Metrica |
|----------|---------|
| Tests nuevos | >= 25 tests Jest pasando |
| Cobertura | >= 80% branches en reminders.js |
| Tests existentes | 70 tests sin regresion |
| Archivos nuevos | reminders.js + test_reminders.js |
| Archivos modificados | background.js, config.js, panel.js, panel.html |

---

## Riesgos y Mitigacion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| chrome.alarms limite 1 alarma/min en MV3 | MEDIA | ALTO | Usar alarma periodica unica que verifica recordatorios pendientes |
| Storage local lleno con muchos recordatorios | BAJA | MEDIO | Limitar a 50 activos, auto-limpiar completados |
| panel.js ya tiene ~2000 lineas | MEDIA | MEDIO | Logica pura en reminders.js, solo UI minima en panel.js |
| Conflicto con alarmas existentes | BAJA | BAJO | Nombre unico ALARM_RECORDATORIOS |

---

## Checklist

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Riesgos evaluados con mitigacion

**Estado:** COMPLETADO
