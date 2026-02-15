# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## Plan de Monitoreo

### Puntos de verificación

| Qué verificar | Cómo | Frecuencia |
|---------------|------|-----------|
| Service worker sin errores | chrome://extensions → "Inspect" background | Diario primera semana |
| Badge se actualiza | Observar icono tras barrido | Cada barrido |
| Notificaciones llegan | Verificar centro notificaciones Chrome | Cuando hay alertas |
| Storage no crece excesivamente | chrome.storage.local.get('tarealog_alertas') | Semanal |
| Tests siguen pasando | `npx jest tests/TDD/unit/test_alerts.js` | Pre-cambios |

### Indicadores de salud

- Badge muestra número correcto de alertas activas
- Notificaciones CRITICO/ALTO se generan para incidencias y cargas urgentes
- Deduplicación funciona (misma alerta no se repite cada barrido)
- config.js carga correctamente defaults de alertas

---

## Plan de Soporte

### Problemas comunes

| Problema | Diagnóstico | Solución |
|----------|------------|----------|
| Badge no aparece | Verificar service worker console | Recargar extensión |
| Demasiadas notificaciones | Verificar cooldownMs en config | Aumentar cooldownMs |
| Alertas no se generan | Verificar `config.alertas.activado` | Activar en config |
| Error `evaluarAlertas is not a function` | importScripts no carga alerts.js | Verificar que alerts.js existe en directorio extensión |

### Escalado

- Bugs en alerts.js → Corregir + añadir test que cubra el caso
- Falsos positivos → Ajustar umbrales en config.alertas
- Performance → Limitar registros evaluados (últimos N días)

---

## Puerta de Validación 8

- [x] Monitoreo configurado (puntos de verificación)
- [x] Plan de soporte documentado (problemas + soluciones)
