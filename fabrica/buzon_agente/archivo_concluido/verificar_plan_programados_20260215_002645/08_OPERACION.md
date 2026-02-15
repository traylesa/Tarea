# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** verificar_plan_programados_20260215_002645

---

## Monitoreo

### Metricas Clave

| Metrica | Como verificar | Frecuencia |
|---------|---------------|------------|
| Envios procesados/dia | Hoja PROGRAMADOS: contar ENVIADO del dia | Diaria |
| Errores de envio | Hoja PROGRAMADOS: filtrar por ERROR | Diaria |
| Cola pendiente | Hoja PROGRAMADOS: filtrar por PENDIENTE | Cada ejecucion |
| Trigger activo | Editor GAS > Activadores | Semanal |
| Horario laboral correcto | Config tab > Horario laboral | Tras cambios |

### Puntos de Monitoreo en GAS

El trigger `ejecutarBarridoProgramado` registra logs consultables desde el editor GAS:

```
Logger: "Cola programados: X pendientes, procesando Y"
Logger: "Cola programados procesada: Z intentados"
Logger: "Error enviando programado prog_xxx: [detalle]"
Logger: "Fuera de horario laboral, envios programados omitidos"
Logger: "Lock ocupado, otro trigger ya procesa la cola"
```

**Acceso:** Editor GAS > Ejecuciones > Ver logs de `ejecutarBarridoProgramado`

### Alertas Configuradas

No hay sistema de alertas automaticas. Monitoreo manual via:
1. Hoja PROGRAMADOS visible para operadores
2. Panel "Programados" en la extension muestra errores con detalle
3. Popup muestra badge con pendientes

---

## Plan de Soporte

### Problemas Comunes y Resolucion

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| Envio no se ejecuta a la hora | Precision +-15 min del trigger GAS | Normal. Esperar al siguiente ciclo |
| Estado ERROR en programado | threadId invalido o problema Gmail | Ver `errorDetalle` en hoja. Reprogramar si fue temporal |
| "Lock ocupado" en logs | Dos triggers solapados | Normal. El siguiente ciclo procesara |
| No se envian fuera de horario | Configuracion horario laboral | Verificar en Config > Horario laboral |
| Boton Programados sin datos | URL de servicio no configurada | Configurar servicio GAS en tab Config |

### Acciones de Mantenimiento

1. **Limpieza periodica:** Eliminar filas ENVIADO/CANCELADO con mas de 30 dias (manual por ahora)
2. **Verificar trigger:** Comprobar mensualmente que el trigger sigue activo en el editor GAS
3. **Quota Gmail:** Monitorear que no se superan 2,000 envios/dia (Workspace)

---

## PUERTA DE VALIDACION 8

- [x] Monitoreo configurado (logs GAS + hoja visible)
- [x] Plan de soporte documentado

---

**Estado:** COMPLETADO
