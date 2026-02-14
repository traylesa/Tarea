# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** boceto_proyecto_20260213_201758
**Fecha:** 2026-02-13
**Autor:** Claude (Agente)
**Estado:** PENDIENTE APROBACIÓN

---

## CAMBIOS PROPUESTOS

### 1. Entidades/Hojas (Google Sheets)

**Nombre:** `hoja_seguimiento`
**Tipo:** Hoja Google Sheets
**Descripción:** Registro principal de correos vinculados con datos ERP. Una fila por mensaje procesado.
**Campos:** id_registro, thread_id, message_id, fecha_correo, remitente, destinatario, asunto, cod_carga, cod_transportista, nombre_transportista, tipo_tarea, estado_vinculacion, alerta_contacto, email_esperado, fecha_proceso, notas

---

**Nombre:** `db_hilos`
**Tipo:** Hoja Google Sheets
**Descripción:** Cache de mapeo ThreadID → CODCAR para persistencia de contexto en hilos de correo.
**Campos:** thread_id (PK), cod_carga, origen, fecha_creacion

---

**Nombre:** `log_proceso`
**Tipo:** Hoja Google Sheets
**Descripción:** Registro de eventos de procesamiento (barridos, errores, alertas).
**Campos:** timestamp, nivel, modulo, mensaje, datos

---

**Nombre:** `configuracion`
**Tipo:** Hoja Google Sheets
**Descripción:** Pares clave-valor para configuración del sistema (regex, intervalos, timestamps).
**Campos:** clave (PK), valor, descripcion

---

### 2. Campos nuevos

| Campo | Tipo | Entidad | Descripción |
|-------|------|---------|-------------|
| id_registro | string | hoja_seguimiento | ID único auto-generado (timestamp + secuencial) |
| thread_id | string | hoja_seguimiento, db_hilos | ID del hilo Gmail |
| message_id | string | hoja_seguimiento | ID del mensaje Gmail individual |
| cod_carga | string | hoja_seguimiento, db_hilos | Código de carga del ERP (equivale a CODCAR de dbo_PEDCLI) |
| cod_transportista | string | hoja_seguimiento | Código transportista del ERP (equivale a CODTRA/CODIGO) |
| nombre_transportista | string | hoja_seguimiento | Nombre legible del transportista |
| tipo_tarea | enum | hoja_seguimiento | Clasificación del correo |
| estado_vinculacion | enum | hoja_seguimiento | Cómo se vinculó el correo a la carga |
| alerta_contacto | boolean | hoja_seguimiento | Flag de discrepancia email real vs ERP |
| email_esperado | string | hoja_seguimiento | Email registrado en ERP para comparación |
| fecha_proceso | datetime | hoja_seguimiento | Timestamp de procesamiento |
| origen | enum | db_hilos | Cómo se creó el mapeo de hilo |
| nivel | enum | log_proceso | Severidad del evento de log |
| modulo | string | log_proceso | Módulo GAS que generó el evento |

---

### 3. Estados/Enums nuevos

**Nombre:** `TIPO_TAREA`
**Valores:**
- `OPERATIVO` - Correo relacionado con una orden de carga
- `ADMINISTRATIVA` - Correo de documentación (certificados, AEAT, facturas)
- `SIN_CLASIFICAR` - Correo no identificado automáticamente

**Usado en:** hoja_seguimiento.tipo_tarea

---

**Nombre:** `ESTADO_VINCULACION`
**Valores:**
- `AUTOMATICA` - Vinculado por regex de adjunto (Caso A)
- `HILO_HEREDADO` - Vinculado por cache de hilos (Caso B)
- `MANUAL` - Vinculado manualmente por el operador (RF-07)
- `PENDIENTE` - No vinculado, requiere intervención manual

**Usado en:** hoja_seguimiento.estado_vinculacion

---

**Nombre:** `ORIGEN_HILO`
**Valores:**
- `ADJUNTO` - Mapeo creado al detectar PDF de carga en adjunto
- `MANUAL` - Mapeo creado por vinculación manual del operador

**Usado en:** db_hilos.origen

---

**Nombre:** `NIVEL_LOG`
**Valores:**
- `INFO` - Evento informativo (barrido completado, correo procesado)
- `WARN` - Advertencia (correo sin match, CSV antiguo)
- `ERROR` - Error de procesamiento (timeout, API fail)

**Usado en:** log_proceso.nivel

---

### 4. Glosario de Negocio

| Término | Significado canónico |
|---------|---------------------|
| Carga | Orden de transporte identificada por CODCAR en el ERP |
| CODCAR | Código único de carga en dbo_PEDCLI |
| CODTRA | Código de transportista en dbo_PEDCLI/dbo_TRANSPOR |
| CODVIA | Código de viaje/ruta que enlaza con contactos (VIATELEF→TELEF) |
| FECHOR | Fecha/hora límite de la carga (deadline SLA) |
| Hilo | Thread de Gmail que agrupa correos de una conversación |
| Barrido | Ejecución de procesamiento de correos nuevos |
| Vinculación | Acto de asociar un correo a una carga específica |

---

## APROBACIÓN

- [x] Validado contra convenciones del proyecto (snake_case, UPPER_CASE enums)
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Pendiente revisión del usuario
**Fecha aprobación:** ____________

---

**Referencia:** `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
