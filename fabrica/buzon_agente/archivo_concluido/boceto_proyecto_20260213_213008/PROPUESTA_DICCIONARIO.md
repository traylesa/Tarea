# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** boceto_proyecto_20260213_213008
**Fecha:** 2026-02-13
**Autor:** Claude / Agente
**Estado:** APROBADO (auto-aprobado para expediente greenfield)

---

## CAMBIOS PROPUESTOS

### 1. Hoja DB_HILOS (cache de hilos)

**Nombre:** `db_hilos`
**Descripcion:** Cache oculta que vincula hilos de Gmail con codigos de carga

**Campos:**
- `thread_id` (string, PK) - ID del hilo Gmail
- `cod_car` (number, not null) - Codigo de carga vinculado
- `created_at` (datetime, not null) - Fecha creacion
- `updated_at` (datetime, not null) - Ultima actualizacion

---

### 2. Hoja SEGUIMIENTO (registro principal)

**Nombre:** `seguimiento`
**Descripcion:** Registro principal de correos procesados con vinculacion a cargas

**Campos:**
- `id` (number, PK, autoincremental)
- `message_id` (string, unique) - ID mensaje Gmail
- `thread_id` (string) - ID hilo Gmail
- `cod_car` (number, nullable) - Codigo carga
- `cod_tra` (string, nullable) - Codigo transportista
- `nombre_transportista` (string, nullable) - Nombre del ERP
- `email_remitente` (string, not null) - Email real
- `email_erp` (string, nullable) - Email registrado en ERP
- `asunto` (string) - Asunto del correo
- `fecha_correo` (datetime) - Fecha del correo
- `tipo_tarea` (enum) - Tipo de tarea
- `estado` (enum) - Estado del registro
- `alerta` (string, nullable) - Tipo de alerta
- `vinculacion` (enum) - Metodo de vinculacion
- `procesado_at` (datetime) - Fecha procesamiento

---

### 3. Enum TIPO_TAREA

**Nombre:** `TIPO_TAREA`
**Valores:**
- `OPERATIVO` - Correo relacionado con orden de carga
- `ADMINISTRATIVA` - Correo administrativo (certificados, AEAT, facturas)
- `SIN_CLASIFICAR` - No se pudo determinar tipo

**Usado en:** seguimiento.tipo_tarea

---

### 4. Enum ESTADO_REGISTRO

**Nombre:** `ESTADO_REGISTRO`
**Valores:**
- `ENVIADO` - Correo enviado al transportista
- `RECIBIDO` - Respuesta recibida del transportista
- `GESTIONADO` - Correo procesado y gestionado
- `ALERTA` - Requiere atencion

**Usado en:** seguimiento.estado

---

### 5. Enum TIPO_VINCULACION

**Nombre:** `TIPO_VINCULACION`
**Valores:**
- `AUTOMATICA` - Vinculado por adjunto PDF (Caso A)
- `HILO` - Heredado por ThreadID (Caso B)
- `MANUAL` - Vinculado manualmente por usuario
- `SIN_VINCULAR` - Sin vinculacion a carga

**Usado en:** seguimiento.vinculacion

---

### 6. Enum TIPO_ALERTA

**Nombre:** `TIPO_ALERTA`
**Valores:**
- `ALERTA_CONTACTO_NO_REGISTRADO` - Email no coincide con ERP
- `ALERTA_SIN_CONTACTO_ERP` - Transportista sin email en ERP
- `ALERTA_SLA_VENCIMIENTO` - Carga proxima a vencer sin correo

**Usado en:** seguimiento.alerta

---

### 7. Glosario de Negocio

- **CODCAR** - Codigo de carga (clave principal de ordenes)
- **CODTRA** - Codigo de transportista
- **CODVIA** - Codigo de viaje (enlace a contactos)
- **FECHOR** - Fecha hora limite de la carga
- **ThreadID** - Identificador unico del hilo de correo en Gmail

---

## APROBACION

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [x] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Agente (auto-aprobado, proyecto greenfield)
**Fecha aprobacion:** 2026-02-13
