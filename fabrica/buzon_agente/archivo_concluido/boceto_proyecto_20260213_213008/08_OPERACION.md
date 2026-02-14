# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## PLAN DE MONITOREO

### Metricas Clave

| Metrica | Fuente | Umbral | Alerta si |
|---------|--------|--------|-----------|
| Barridos ejecutados/dia | GAS Execution Log | >= 96 (cada 15 min) | < 80 |
| Correos procesados/barrido | Hoja SEGUIMIENTO | Variable | Error rate > 5% |
| Vinculaciones automaticas | Hoja SEGUIMIENTO | >= 85% | < 70% |
| Alertas SLA generadas | Hoja SEGUIMIENTO | Variable | > 10/dia (anomalo) |
| Tiempo ejecucion GAS | GAS Execution Log | < 6 min | > 4 min |

### Donde Monitorear

1. **Google Apps Script Dashboard:**
   - Menu: Extensiones → Apps Script → Ejecuciones
   - Ver: Errores, tiempos, quotas

2. **Hoja SEGUIMIENTO:**
   - Filtrar por `procesado_at` del dia
   - Verificar ratio vinculacion AUTOMATICA vs SIN_VINCULAR

3. **Extension Chrome:**
   - Console del Service Worker (chrome://extensions → background page)
   - Errores de red en DevTools

### Alertas Configuradas

| Alerta | Condicion | Canal | Accion |
|--------|-----------|-------|--------|
| Error GAS | Exception en ejecucion | Email (GAS trigger) | Revisar logs |
| Quota GAS | > 80% uso diario | Manual (dashboard) | Optimizar lotes |
| Extension error | Error en fetch | Console | Verificar GAS_URL |

---

## PLAN DE SOPORTE

### Nivel 1: Auto-servicio (Usuario)

| Problema | Solucion |
|----------|----------|
| Panel no carga | Cerrar y reabrir extension |
| Datos desactualizados | Click "Ejecutar Ahora" |
| Vinculacion incorrecta | Usar "Forzar Vinculacion" |

### Nivel 2: Soporte tecnico

| Problema | Solucion |
|----------|----------|
| GAS no ejecuta | Verificar triggers en dashboard |
| CSVs desactualizados | Re-importar desde ERP |
| Token expirado | Re-autorizar GAS (OAuth) |
| Extension no conecta | Verificar GAS_URL en codigo |

### Nivel 3: Desarrollo

| Problema | Solucion |
|----------|----------|
| Regex no detecta patron | Actualizar CARGA_REGEX en EmailParser.js |
| Nuevo campo ERP | Actualizar ERPReader + tests |
| Cambio estructura CSV | Actualizar parseo + validacion headers |

---

## CHECKLIST

- [x] Monitoreo definido (metricas + umbrales)
- [x] Plan de soporte documentado (3 niveles)
- [x] Alertas configurables identificadas

---

## PUERTA DE VALIDACION 8

- [x] Monitoreo configurado (plan documentado)
- [x] Plan de soporte documentado

---

**Estado:** COMPLETADO
**Puerta de validacion 8:** SUPERADA
