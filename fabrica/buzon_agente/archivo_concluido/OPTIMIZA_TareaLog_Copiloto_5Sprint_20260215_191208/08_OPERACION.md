# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## OBJETIVO

Guía de operación y monitoreo post-deploy para Sprint 5.

---

## Monitoreo

### Storage Keys a Vigilar

| Key | Tipo | Tamaño Esperado | Acción si Crece |
|-----|------|------------------|-----------------|
| `tarealog_historial` | object | < 500KB | rotarHistorial elimina > 30 días |
| `tarealog_secuencias` | array | < 50KB | Secuencias completadas se pueden purgar |
| `tarealog_config` | object | < 10KB | Estable |

### Alarmas Activas

| Alarma | Intervalo | Función |
|--------|-----------|---------|
| tarealog-barrido | 15 min | ejecutarBarridoPeriodico |
| tarealog-resumen-matutino | 60 min | verificarResumenMatutino |
| tarealog-recordatorios | 1 min | verificarRecordatorios |
| tarealog-secuencias | 15 min | verificarSecuencias |

### Consola Service Worker
- Abrir: chrome://extensions/ > TareaLog > Service Worker > Inspect
- Errores frecuentes: `Error verificando secuencias` → revisar storage

---

## Troubleshooting

| Problema | Causa Probable | Solución |
|----------|----------------|----------|
| Dashboard muestra 0 en todo | No hay registros cargados | Ejecutar barrido primero |
| Secuencia no avanza | Alarma no creada | Recargar extensión |
| Historial vacío | Nunca se registró acción | Normal si es primer uso |
| Notificación secuencia no aparece | Permisos notificaciones | Verificar chrome://settings/content/notifications |

---

## Documentación Usuario

- **Dashboard:** Se muestra como widget colapsable en tab Datos (cuando se integre UI completa)
- **Historial:** Cronología de acciones por carga (email, fase, nota, recordatorio)
- **Secuencias:** 3 predefinidas disponibles: Reclamar POD, Confirmar carga, Seguimiento incidencia
- **Reporte:** Resumen automático de actividad del día

---

**Estado:** COMPLETADO
