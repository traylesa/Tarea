# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** verificar_plan_programados_20260215_002645
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

**Verificar y validar** el plan existente de "Envios Programados de Email" para la extension TareaLog. No se trata de implementar desde cero (la feature ya esta implementada), sino de:

1. **Verificar** que el plan es el mas adecuado para el proyecto
2. **Auditar** que la implementacion existente es conforme al plan
3. **Identificar** optimizaciones desde perspectiva tecnica y de usuario
4. **Completar** piezas faltantes (tests de scheduled.js)

**Por que es importante:** La feature de envios programados es critica para la operativa logistica de TRAYLESA. Un envio mal programado o un bug en la cola puede causar retrasos en comunicaciones con transportistas.

---

## ALCANCE

### Que SI
- Revision del plan vs implementacion real
- Verificacion de patrones GAS (LockService, triggers, rate limit)
- Auditoria de la UI (panel + popup) para programados
- Tests unitarios faltantes (scheduled.js)
- Propuestas de optimizacion UX
- Verificacion del diccionario de dominio

### Que NO
- Reescritura del backend GAS
- Cambios en la arquitectura fundamental (cola en Sheets)
- Implementacion de features no previstas (archivado, notificaciones push)
- Migracion a otras tecnologias

---

## CRITERIOS DE EXITO

1. 100% de los archivos del plan estan implementados y funcionan
2. Tests unitarios de scheduled.js con cobertura >= 80%
3. 0 tests existentes rotos tras cambios
4. Lista priorizada de optimizaciones documentada
5. Diccionario de dominio actualizado con entidades de programados

---

## RESTRICCIONES

- **GAS:** Max 20 triggers/script, ejecucion max 6 min, precision +-15 min
- **Gmail:** 2,000 envios/dia (Workspace), rate limit configurable
- **Sheets:** Lento para grandes volumenes pero visual y auditable
- **Extension:** Manifest V3, scripts sin modules (orden de carga importa)
- **Horario:** Trigger solo ejecuta en horario laboral configurable

---

## RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Precision trigger +-15 min | Alta | Bajo | Documentado en UI, aceptable para logistica |
| Timeout 6 min con cola grande | Media | Medio | Limite 20 envios/ciclo ya implementado |
| Race conditions entre triggers | Baja | Alto | LockService.getScriptLock() ya implementado |
| Hoja PROGRAMADOS crece sin limite | Media | Bajo | Pendiente: funcion archivado >30 dias |
| Rate limit Google | Baja | Alto | emailsPorMinuto con Utilities.sleep() |

---

## CHECKLIST

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados (operadores logistica TRAYLESA)
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados

---

**Estado:** COMPLETADO
