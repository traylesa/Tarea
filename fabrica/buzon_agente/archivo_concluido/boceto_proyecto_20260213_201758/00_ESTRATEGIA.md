# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

Construir **LogiTask Orchestrator**, un sistema híbrido (Extensión de Chrome + Google Apps Script) que reconcilia datos del ERP (CSVs exportados) con comunicaciones reales (Gmail) para automatizar el seguimiento de Órdenes de Carga, detectar desviaciones en contactos y gestionar documentación administrativa del equipo de tráfico de TRAYLESA.

### Por qué es importante

- El equipo de tráfico gestiona ~500 cargas/mes cruzando manualmente correos con datos ERP
- Los errores de envío a contactos incorrectos generan retrasos y costes
- No hay visibilidad centralizada del estado de comunicaciones por carga
- La documentación administrativa (certificados, AEAT 347) se pierde entre hilos de correo

---

## CRITERIOS DE ÉXITO

1. **Vinculación automática >= 85%** de correos a su CODCAR correspondiente mediante análisis de adjuntos, hilos y patrones
2. **Detección de contactos erróneos** comparando remitente/destinatario real vs email registrado en ERP
3. **Panel de control funcional** en extensión Chrome con vista de cargas (verde/rojo/gris)
4. **Alertas de SLA** cuando una carga está a < 2h de FECHOR sin correo enviado
5. **UTF-8 + separador `;`** en toda exportación CSV para compatibilidad Windows/España

---

## ALCANCE

### SÍ incluye
- Extensión Chrome (Manifest V3) como orquestador/interfaz
- Google Apps Script como backend de procesamiento Gmail
- Cruce de datos ERP (dbo_PEDCLI, dbo_TRANSPOR, dbo_VIATELEF, dbo_TELEF)
- Cache de hilos (ThreadID → CODCAR) para persistencia de conversaciones
- Panel visual con estados por carga
- Vinculación manual (fallback para correos no identificados)
- Alertas de SLA y contacto no registrado

### NO incluye (fuera de alcance)
- Modificación del ERP origen
- Envío automático de correos (solo lectura/monitoreo)
- Procesamiento OCR de PDFs adjuntos
- Integración con sistemas contables
- App móvil

---

## STAKEHOLDERS

| Rol | Interés | Impacto |
|-----|---------|---------|
| Equipo de tráfico | Usuarios directos, reducir trabajo manual | ALTO |
| Dirección logística | Visibilidad de estado de cargas | MEDIO |
| Transportistas | Afectados indirectamente (comunicación) | BAJO |
| IT/Mantenimiento | Soporte técnico del sistema | MEDIO |

---

## RESTRICCIONES

1. **Plataforma:** Chrome como navegador obligatorio (extensión MV3)
2. **Backend:** Google Apps Script (gratuito, sin servidor propio)
3. **Datos ERP:** Solo lectura via CSVs exportados manualmente a Google Drive
4. **Gmail API:** Cuotas de Google (100 queries/100s para lectura)
5. **Sin base de datos propia:** Hojas de cálculo Google como almacenamiento
6. **Encoding:** UTF-8 obligatorio, separador `;` para CSVs España

---

## RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cuotas Gmail API excedidas | MEDIA | ALTO | Batch processing, intervalos de 15min, caché agresiva |
| CSVs ERP desactualizados | ALTA | MEDIO | Timestamp de última carga visible, alerta si > 24h |
| Regex no cubre todos los patrones de adjuntos | MEDIA | MEDIO | Vinculación manual como fallback, log de no-matches |
| Google Apps Script timeout (6min) | BAJA | ALTO | Procesamiento incremental, paginación, checkpoints |
| Cambio en formato de correos de transportistas | MEDIA | BAJO | Patrones regex configurables, no hardcoded |

---

## NOTA SOBRE CLASIFICACIÓN

La clasificación automática marcó este expediente como "BUG/CRITICA". Esto es **incorrecto**: se trata de un **proyecto nuevo completo** (EPIC). El camino PROYECTO_COMPLETO asignado sí es correcto.

---

**Estado:** COMPLETADO
