# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## Monitoreo

### Alarmas Activas en Service Worker

| Alarma | Intervalo | Función |
|--------|-----------|---------|
| `tarealog-barrido` | configurable (default 15min) | ejecutarBarridoPeriodico |
| `tarealog-resumen-matutino` | 60min | verificarResumenMatutino |
| `tarealog-recordatorios` | 1min | verificarRecordatorios |

### Storage Keys a Monitorear

| Key | Tipo | Descripción |
|-----|------|-------------|
| `tarealog_recordatorios` | Array | Lista de recordatorios activos |
| `tarealog_recordatorios_vencidos` | Array | Temporal para snooze |
| `tarealog_config` | Object | Incluye recordatorios.sugerenciasActivadas |

### Verificación de Salud

```javascript
// En consola del service worker:
chrome.storage.local.get('tarealog_recordatorios', r => console.log(r));
chrome.alarms.getAll(a => console.log(a));
```

---

## Documentación Usuario

### Crear un Recordatorio
1. Abrir panel TareaLog
2. Clic en botón "Recordatorios" (barra de controles)
3. Clic en "Nuevo recordatorio"
4. Escribir texto descriptivo
5. Seleccionar tiempo (15min, 30min, 1h, 2h, 4h, mañana)
6. Clic "Guardar"

### Gestionar Notificaciones
- **Snooze 15min**: Pospone el recordatorio 15 minutos
- **Hecho**: Elimina el recordatorio definitivamente

### Sugerencias Automáticas
- Al cambiar una carga a fase 19: se crea recordatorio "Verificar descarga" (8h)
- Al cambiar a fase 29: se crea recordatorio "Reclamar POD" (24h)
- Desactivar en Config → Recordatorios → Sugerencias activadas: No

---

## Posibles Incidencias

| Incidencia | Causa probable | Solución |
|------------|---------------|----------|
| No aparecen notificaciones | Permisos Chrome bloqueados | Verificar chrome://settings/content/notifications |
| Recordatorio no se dispara | Service worker dormido | Verificar alarma en chrome://extensions → service worker |
| Lista vacía tras reinicio | Storage limpiado | Verificar chrome.storage.local |
| Sugerencias no aparecen | Config desactivada | Verificar tarealog_config.recordatorios.sugerenciasActivadas |

---

## Puerta de Validación 8

- [x] Alarmas documentadas
- [x] Storage keys documentados
- [x] Guía de usuario escrita
- [x] Troubleshooting de incidencias documentado

**Estado:** COMPLETADO
