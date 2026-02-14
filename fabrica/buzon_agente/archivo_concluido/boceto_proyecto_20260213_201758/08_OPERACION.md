# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## MONITOREO

### Métricas clave a vigilar

| Métrica | Fuente | Umbral verde | Umbral rojo |
|---------|--------|-------------|-------------|
| Correos procesados/día | Log_Proceso (COUNT nivel=INFO) | > 10 | 0 (sistema parado) |
| Tasa de vinculación | Hoja_Seguimiento (AUTOMATICA+HILO_HEREDADO / total) | >= 80% | < 60% |
| Alertas de contacto | Hoja_Seguimiento (alerta_contacto=true) | < 5% | > 15% |
| Tiempo de barrido | Log_Proceso (duración) | < 60s | > 120s |
| Errores GAS | Log_Proceso (COUNT nivel=ERROR) | 0 | > 5/día |

### Cómo monitorear

```
1. Abrir Google Sheets → pestaña Log_Proceso
2. Filtrar por fecha = hoy
3. Verificar:
   - Hay registros INFO de barridos cada 15 min
   - No hay registros ERROR repetidos
   - Duración de barridos estable

4. Pestaña Hoja_Seguimiento:
   - Verificar que hay registros nuevos del día
   - Revisar correos con estado_vinculacion = PENDIENTE (candidatos a vinculación manual)
```

### Alertas automáticas del sistema

| Alerta | Trigger | Canal |
|--------|---------|-------|
| SLA Carga urgente | FECHOR - 2h sin envío | Notificación push Chrome |
| Contacto no registrado | email real != email ERP | Notificación push Chrome |
| GAS sin ejecutar > 30min | Sin log INFO en 30 min | Badge en extensión (manual) |

---

## MANTENIMIENTO PERIÓDICO

### Diario
- Revisar popup de extensión: alertas pendientes, correos sin vincular
- Verificar que el badge no muestre alertas no atendidas

### Semanal
- Revisar Log_Proceso por errores recurrentes
- Verificar tasa de vinculación (si baja, revisar regex o nuevos formatos de adjuntos)
- Limpiar correos PENDIENTE antiguos (vincular manualmente o descartar)

### Mensual
- Actualizar CSVs ERP en Drive (subir versiones frescas)
- Revisar hoja DB_Hilos: ejecutar limpieza de hilos > 30 días
- Verificar que Log_Proceso no supere 1000 filas (limpieza automática activa)
- Revisar cuotas de Gmail API en Google Cloud Console

### Cada 6 meses
- Verificar token OAuth de GAS (reautorizar si expiró)
- Actualizar extensión si Chrome depreca APIs de MV3
- Revisar regex de adjuntos si ERP cambió formato

---

## TROUBLESHOOTING

### Extensión no muestra datos
1. Verificar conexión: Opciones → "Test conexión"
2. Si falla: verificar URL de WebApp y token
3. Si URL cambió: redesplegar GAS → obtener nueva URL → actualizar en opciones

### Barrido no procesa correos nuevos
1. Revisar Log_Proceso → buscar errores
2. Verificar ULTIMO_TIMESTAMP en Configuracion (no debe estar en el futuro)
3. Si está corrupto: resetear a fecha de ayer

### Regex no captura adjuntos
1. Verificar nombre del adjunto del correo problemático
2. Si cambió el patrón del ERP: actualizar REGEX_ADJUNTO en hoja Configuracion
3. No requiere redeploy de código

### Alerta de contacto falso positivo
1. Verificar en dbo_VIATELEF/dbo_TELEF si el email está registrado
2. Si falta en CSV: actualizar CSV en Drive
3. El próximo barrido usará datos actualizados

---

## DOCUMENTACIÓN DE USUARIO

### Guía rápida (para equipo de tráfico)

1. **Panel:** Click en icono de extensión → ver tabla de cargas del día
2. **Semáforos:**
   - Verde: Carga con correo enviado correctamente
   - Rojo: Alerta (contacto no registrado o SLA próximo)
   - Gris: Correo administrativo o sin clasificar
3. **Vincular manualmente:** Seleccionar correo pendiente → escribir número de carga → click "Vincular"
4. **Forzar actualización:** Botón "Forzar barrido" para no esperar 15 min
5. **Configuración:** Click derecho en icono → Opciones

---

## CHECKLIST

- [x] Monitoreo definido (5 métricas clave)
- [x] Alertas automáticas activas (SLA + contacto)
- [x] Mantenimiento periódico documentado (diario/semanal/mensual)
- [x] Troubleshooting de problemas comunes
- [x] Documentación de usuario creada
- [x] 0 incidentes críticos en diseño (sistema nuevo)

---

**Estado:** COMPLETADO
