# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** Recomendacion1_20260215_213710
**Fecha:** 2026-02-15
**Autor:** Claude
**Estado:** PROPUESTO

---

## CAMBIOS PROPUESTOS

### 1. Nuevos campos de configuracion (config.robustez)

**Descripcion:** Parametros de robustez para proteger contra timeouts y sobrecarga.

| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `timeoutBarridoMs` | number | 300000 | Timeout del fetch de barrido periodico (ms) |
| `limiteLoteProcesamiento` | number | 50 | Max mensajes procesados por ejecucion GAS |
| `tamanoTandaEnvio` | number | 15 | Max destinatarios por tanda de envio masivo |

**Usado en:** config.js (defaults), background.js (barrido), panel.js (envio masivo)

### 2. Nuevo campo en respuesta procesarCorreos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `hayMas` | boolean | Indica si quedaron mensajes sin procesar en GAS |

**Usado en:** Codigo.js (respuesta), background.js (alarma continuacion)

### 3. Nuevos terminos glosario

- **Tanda:** Sub-grupo de destinatarios enviados en una sola request al backend GAS (max configurable)
- **Guard de barrido:** Flag `_barridoEnCurso` que impide barridos superpuestos en background.js
- **Toast:** Notificacion temporal flotante en panel para informar exito/error de guardado

---

## APROBACION

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Pendiente
**Fecha aprobacion:** Pendiente
