# DICCIONARIO DE DOMINIO - PruebaInicializa4

**Proposito:** Fuente unica de verdad para nombres de tablas, campos, variables, estados y enums del proyecto.

**Ubicacion:** Este archivo es UNICO y esta en `docs/` como parte del sistema Hub and Spoke de documentacion.

**Coordinacion:** Todos los expedientes deben:
1. **Consultar este archivo** antes de crear nombres nuevos
2. **Proponer cambios** en `PROPUESTA_DICCIONARIO.md` de su expediente
3. **Actualizar este archivo central** una vez aprobado el cambio

---

## 1. Convenciones de Nombres

### Tablas/Entidades
- **snake_case** minusculas
- Plural para colecciones: `usuarios`, `pedidos`
- Singular para entidades: `configuracion`, `sistema`

### Campos/Atributos
- **snake_case** minusculas
- Descriptivos y autoexplicativos
- `id` siempre como clave primaria
- Timestamps: `created_at`, `updated_at`, `deleted_at`

### Estados/Enums
- **UPPER_CASE** con guiones bajos
- Descriptivos del estado: `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`
- Agrupados por dominio: `ESTADO_PEDIDO_*`, `ESTADO_USUARIO_*`

### Variables/Funciones (codigo)
- **camelCase** para JavaScript/TypeScript
- **snake_case** para Python
- Nombres verbos para funciones: `obtenerUsuario()`, `validarEmail()`
- Nombres sustantivos para variables: `usuario`, `totalPedidos`

---

## 2. Tablas/Entidades

### db_hilos
Cache oculta que vincula hilos de Gmail con codigos de carga.

| Campo | Tipo | Restriccion | Descripcion |
|-------|------|-------------|-------------|
| thread_id | string | PK | ID del hilo Gmail |
| cod_car | number | NOT NULL | Codigo de carga vinculado |
| created_at | datetime | NOT NULL | Fecha creacion |
| updated_at | datetime | NOT NULL | Ultima actualizacion |

### seguimiento
Registro principal de correos procesados con vinculacion a cargas.

| Campo | Tipo | Restriccion | Descripcion |
|-------|------|-------------|-------------|
| id | number | PK, AUTO | ID autoincremental |
| message_id | string | UNIQUE | ID mensaje Gmail |
| thread_id | string | | ID hilo Gmail |
| mensajes_en_hilo | number | DEFAULT 1 | Cantidad de mensajes en el hilo Gmail |
| cod_car | number | NULLABLE | Codigo carga |
| cod_tra | string | NULLABLE | Codigo transportista |
| nombre_transportista | string | NULLABLE | Nombre del ERP |
| email_remitente | string | NOT NULL | Email real del remitente |
| email_erp | string | NULLABLE | Email registrado en ERP |
| asunto | string | | Asunto del correo |
| fecha_correo | datetime | | Fecha del correo |
| tipo_tarea | enum(TIPO_TAREA) | | Tipo de tarea |
| estado | enum(ESTADO_REGISTRO) | | Estado del registro |
| alerta | string | NULLABLE | Tipo de alerta |
| vinculacion | enum(TIPO_VINCULACION) | | Metodo de vinculacion |
| referencia | string | NULLABLE | Referencia de la carga (PEDCLI.REFERENCIA) |
| fase | enum(FASE_TRANSPORTE) | NULLABLE | Fase logistica del transporte (codigo 00-30) |
| para | string | NULLABLE | Destinatarios TO del correo (separados por coma) |
| cc | string | NULLABLE | Destinatarios CC del correo |
| cco | string | NULLABLE | Destinatarios BCC del correo |
| interlocutor | string | NULLABLE | Emails de/para excluyendo email propio (calculado) |
| cuerpo | string | NULLABLE | Cuerpo del mensaje en texto plano |
| procesado_at | datetime | | Fecha procesamiento |
| f_carga | string (date) | NULLABLE | Fecha de salida/carga (PEDCLI.FECSAL) |
| h_carga | string (time) | NULLABLE | Hora de salida/carga (PEDCLI.FECHORSAL) |
| f_entrega | string (date) | NULLABLE | Fecha de llegada/entrega (PEDCLI.FECLLE) |
| h_entrega | string (time) | NULLABLE | Hora de llegada/entrega (PEDCLI.FECHORLLE) |
| zona | string | NULLABLE | Zona de origen (PEDCLI.ZONA) |
| z_dest | string | NULLABLE | Zona de destino (PEDCLI.ZONADES) |

**Campo calculado `interlocutor`:** Se obtiene uniendo `from` + `to`, extrayendo emails limpios, eliminando el email propio (cuenta GAS desplegada via `Session.getEffectiveUser()`) y deduplicando.

---

## 3. Estados/Enums

### TIPO_TAREA
- `OPERATIVO` - Correo relacionado con orden de carga
- `ADMINISTRATIVA` - Correo administrativo (certificados, AEAT, facturas)
- `SIN_CLASIFICAR` - No se pudo determinar tipo

### ESTADO_REGISTRO
- `ENVIADO` - Correo enviado al transportista
- `RECIBIDO` - Respuesta recibida del transportista
- `GESTIONADO` - Correo procesado y gestionado
- `ALERTA` - Requiere atencion

### TIPO_VINCULACION
- `AUTOMATICA` - Vinculado por adjunto PDF (Caso A)
- `HILO` - Heredado por ThreadID (Caso B)
- `MANUAL` - Vinculado manualmente por usuario
- `SIN_VINCULAR` - Sin vinculacion a carga

### FASE_TRANSPORTE
Estado operativo de la carga fisica en el transporte.

| Codigo | Nombre | Grupo |
|--------|--------|-------|
| `00` | Espera | Espera |
| `01` | Espera en Carga | Espera |
| `02` | Espera en Descarga | Espera |
| `05` | Incidencia (pre-carga) | Incidencia |
| `11` | En Carga | Carga |
| `12` | Cargando | Carga |
| `19` | Cargado | Carga |
| `21` | En Descarga | Descarga |
| `22` | Descargando | Descarga |
| `25` | Incidencia (descarga) | Incidencia |
| `29` | Vacio | Descarga |
| `30` | Documentado | Final |

**Criticos:** `05` y `25` (Incidencias) requieren atencion inmediata.

### CONFIG_FASE_TRANSPORTE
Configuracion de una fase de transporte individual (objeto configurable desde UI).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `codigo` | string (2 chars) | Codigo unico de la fase (ej: '05') |
| `nombre` | string | Nombre descriptivo (ej: '05 Incidencia') |
| `orden` | number | Posicion de ordenacion (0-99) |
| `es_critica` | boolean | Si requiere atencion inmediata (badge rojo) |
| `clase_css` | string | Clase visual: '', 'fase-incidencia', 'fase-ok' |
| `activa` | boolean | Si aparece en selects y cards |

### CONFIG_EXPORTACION
Estructura del archivo JSON de exportacion/importacion de configuracion.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `version` | string | Version del formato (ej: '1.0.0') |
| `fecha_exportacion` | string (ISO) | Timestamp de la exportacion |
| `config` | object | Configuracion completa de la extension |

### PLANTILLA_RESPUESTA
Plantilla reutilizable para respuestas masivas a correos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico generado (tpl_timestamp_counter) |
| `alias` | string | Nombre descriptivo de la plantilla |
| `asunto` | string | Asunto con variables interpolables (ej: `Re: {{asunto}}`) |
| `cuerpo` | string (HTML) | Cuerpo HTML con variables interpolables |
| `firma` | string (HTML) | Obsoleto — reemplazado por pie comun global |
| `created_at` | string (ISO) | Fecha de creacion |
| `updated_at` | string (ISO) | Fecha de ultima modificacion |

**Plantillas predefinidas (3):** Consulta hora carga, Solicitud docs descarga, Recordatorio docs pendientes.

### EXPORTACION_PLANTILLAS
Estructura del archivo JSON de exportacion/importacion de plantillas.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `version` | number | Version del formato (1) |
| `plantillas` | array(PLANTILLA_RESPUESTA) | Lista de plantillas |
| `pieComun` | string (HTML) | OPCIONAL — Pie comun si el usuario elige incluirlo |

### STORAGE_KEYS
Claves usadas en `chrome.storage.local` para persistencia de la extension.

| Clave | Tipo | Descripcion |
|-------|------|-------------|
| `tabulatorPrefs` | object | Preferencias tabla (columnas, orden, visibilidad) |
| `tarealog_gas_services` | object | Servicios GAS configurados y activo |
| `tarealog_plantillas` | object | `{ plantillas: PLANTILLA_RESPUESTA[] }` |
| `tarealog_pie_comun` | string (HTML) | Pie comun global para todas las plantillas |
| `tarealog_config` | object | Configuracion general de la extension |
| `tarealog_ayuda_estado` | object | Ultima seccion de ayuda visitada |
| `tarealog_spreadsheet` | string | ID del spreadsheet configurado |
| `registros` | array | Cache local de registros de seguimiento |
| `ultimoBarrido` | string (ISO) | Timestamp del ultimo barrido |
| `tarealog_alertas` | array(Alerta) | Alertas proactivas activas evaluadas por motor de reglas |
| `tarealog_resumen_flag` | object | Flag matutino: `{fecha: string, pospuestoHasta: string\|null}` |
| `tarealog_filtro_pendiente` | object\|null | Filtros Tabulator pendientes para click-through desde ventana resumen |
| `tarealog_recordatorios` | array(RECORDATORIO) | Lista de recordatorios activos del operador |
| `tarealog_recordatorios_vencidos` | array(RECORDATORIO) | Temporal: recordatorios vencidos pendientes de snooze/completar |
| `tarealog_notas` | object | Mapa `{ [codCar]: NOTA_CARGA[] }` — notas rapidas por carga |
| `tarealog_historial` | object | Mapa `{ [codCar]: ENTRADA_HISTORIAL[] }` — historial acciones por carga |
| `tarealog_secuencias` | array(SECUENCIA_FOLLOWUP) | Secuencias de follow-up activas |

### TIPO_ALERTA
- `ALERTA_CONTACTO_NO_REGISTRADO` - Email no coincide con ERP
- `ALERTA_SIN_CONTACTO_ERP` - Transportista sin email en ERP
- `ALERTA_SLA_VENCIMIENTO` - Carga proxima a vencer sin correo

### NIVEL_ALERTA
Nivel de urgencia de una alerta proactiva evaluada por el motor de reglas.
- `CRITICO` - Rojo, notificacion prominente (prioridad 2). Ej: incidencia activa, carga < 2h sin orden
- `ALTO` - Naranja, notificacion estandar (prioridad 1). Ej: sin respuesta > umbral, carga HOY sin orden
- `MEDIO` - Azul, notificacion silenciosa. Ej: fase estancada > tiempoMax
- `BAJO` - Verde, solo badge. Ej: informativo

### REGLA_ALERTA
Identificadores de reglas de evaluacion de alertas proactivas.
- `R2` - Silencio transportista: ENVIADO > umbralH sin RECIBIDO en threadId
- `R3` - Fase estancada: (ahora - fechaCorreo) > tiempoMaxFase
- `R4` - Documentacion pendiente: fase=29 + (ahora - fEntrega) > umbralDias
- `R5` - Incidencia activa: fase IN [05, 25]
- `R6` - Carga HOY sin orden: fCarga=HOY + sin ENVIADO

### RECORDATORIO
Aviso programado asociado a una carga, con snooze y persistencia.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (rec_timestamp_random) |
| `codCar` | number/null | Codigo de carga asociado |
| `texto` | string | Texto del recordatorio |
| `fechaCreacion` | string (ISO) | Timestamp de creacion |
| `fechaDisparo` | string (ISO) | Cuando debe dispararse la notificacion |
| `snoozeCount` | number | Veces pospuesto (default 0) |
| `origen` | string | 'manual' (creado por operador) o 'sugerido' (propuesto al cambiar fase) |

### ACCION_CONTEXTUAL
Accion rapida asociada a un grupo de fase de transporte.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `etiqueta` | string | Texto del boton de accion |
| `faseSiguiente` | string/null | Fase destino al ejecutar (null = no cambia) |
| `plantilla` | string/null | Alias de plantilla a preseleccionar |

### GRUPO_FASE
Agrupacion de fases de transporte para determinar acciones contextuales disponibles.

| Valor | Fases incluidas | Descripcion |
|-------|----------------|-------------|
| `espera` | 00, 01, 02 | Fases de espera pre-carga |
| `carga` | 11, 12 | Fases de proceso de carga |
| `en_ruta` | 19 | Cargado / en transito |
| `descarga` | 21, 22 | Fases de descarga |
| `vacio` | 29 | Descargado, pendiente documentacion |
| `incidencia` | 05, 25 | Incidencias pre/post carga |

### NOTA_CARGA
Nota rapida asociada a un codigo de carga para contexto operativo.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (nota_timestamp_random) |
| `texto` | string | Contenido de la nota |
| `fechaCreacion` | string (ISO) | Timestamp de creacion |

### ENTRADA_HISTORIAL
Entrada de accion en el historial auditable de una carga.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (hist_timestamp_random) |
| `codCar` | number | Codigo de carga |
| `tipo` | enum(TIPO_ACCION) | Tipo de accion |
| `descripcion` | string | Texto descriptivo |
| `fechaCreacion` | string (ISO) | Timestamp |

### TIPO_ACCION
Tipo de accion registrada en el historial de una carga.
- `EMAIL` - Email enviado/recibido
- `FASE` - Cambio de fase
- `RECORDATORIO` - Recordatorio creado/completado
- `NOTA` - Nota anadida

### SECUENCIA_FOLLOWUP
Secuencia de emails automatica para reclamar documentos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (seq_timestamp_random) |
| `codCar` | number | Codigo de carga |
| `threadId` | string | ID hilo Gmail |
| `nombre` | string | Nombre predefinido (ej: "Reclamar POD") |
| `estado` | enum(ESTADO_SECUENCIA) | Estado global |
| `pasos` | array(PASO_SECUENCIA) | Pasos de la secuencia (max 3) |
| `fechaCreacion` | string (ISO) | Timestamp |

### PASO_SECUENCIA
Paso individual de una secuencia de follow-up.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `orden` | number | 1, 2 o 3 |
| `plantilla` | string | Alias plantilla a usar |
| `horasEspera` | number | Horas desde inicio secuencia |
| `estado` | enum(ESTADO_PASO) | PENDIENTE/EJECUTADO/DETENIDO/CANCELADO |
| `fechaProgramada` | string (ISO) | Fecha para ejecutar |

### ESTADO_SECUENCIA
Estado global de una secuencia de follow-up.
- `ACTIVA` - Secuencia en curso
- `COMPLETADA` - Todos los pasos ejecutados
- `DETENIDA` - Detenida por respuesta recibida
- `CANCELADA` - Cancelada manualmente

### ESTADO_PASO
Estado de un paso individual de secuencia.
- `PENDIENTE` - Esperando ejecucion
- `EJECUTADO` - Email enviado
- `DETENIDO` - Detenido por respuesta
- `CANCELADO` - Cancelado por usuario

### SUGERENCIA_RECORDATORIO
Configuracion de sugerencias automaticas por fase.

| Fase | Texto | Horas |
|------|-------|-------|
| `19` (Cargado) | Verificar descarga | 8 |
| `29` (Vacio) | Reclamar POD | 24 |

### ESTADO_PROGRAMADO
Estado del envio en la cola de programados.
- `PENDIENTE` - Envio programado, esperando que el trigger lo procese
- `ENVIADO` - Correo enviado exitosamente por el trigger
- `ERROR` - Fallo al enviar (detalle en campo errorDetalle)
- `CANCELADO` - Cancelado por usuario antes de ser enviado

### programados
Cola de envios programados de email (hoja PROGRAMADOS en Sheets).

| Campo | Tipo | Restriccion | Descripcion |
|-------|------|-------------|-------------|
| id | string | PK | ID unico (prog_timestamp_random) |
| thread_id | string | NOT NULL | ID del hilo Gmail al que responder |
| interlocutor | string | | Emails destinatarios principales |
| asunto | string | | Asunto del correo |
| cuerpo | string (HTML) | NOT NULL | Cuerpo HTML del mensaje |
| cc | string | | Destinatarios CC |
| bcc | string | | Destinatarios BCC |
| fecha_programada | string (ISO) | NOT NULL | Fecha/hora programada para envio |
| estado | enum(ESTADO_PROGRAMADO) | NOT NULL | Estado actual del envio |
| fecha_envio | string (ISO) | | Fecha/hora real de envio (si enviado) |
| error_detalle | string | | Mensaje de error (si fallo) |
| creado_por | string | | Email del usuario que programo |
| created_at | string (ISO) | | Timestamp de creacion |

### HORARIO_LABORAL
Configuracion de horario en que el trigger procesa envios programados (almacenado en PropertiesService).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| dias | array(number) | Dias de la semana (0=dom, 1=lun...6=sab) |
| horaInicio | number | Hora inicio (0-23) |
| horaFin | number | Hora fin (1-24) |

---

## 4. Validaciones

- **NIF:** 8 digitos + 1 letra (regex: `/\b[0-9]{8}[A-Z]\b/`)
- **CIF:** 1 letra + 8 digitos (regex: `/\b[A-Z][0-9]{8}\b/`)
- **CODCAR de adjunto:** Patron `Carga_0*(\d+)\.pdf` (case insensitive)
- **Keywords admin:** `certificado|hacienda|347|aeat|factura` (case insensitive)

---

## 5. Glosario de Negocio

- **Expediente:** Unidad de trabajo en la fabrica agentica
- **CODCAR:** Codigo de carga - clave principal de ordenes en el ERP
- **CODTRA:** Codigo de transportista - identifica empresa de transporte
- **CODVIA:** Codigo de viaje - enlace a contactos del transportista
- **FECHOR:** Fecha hora limite de la carga (campo ERP)
- **ThreadID:** Identificador unico del hilo de correo en Gmail
- **SLA:** Service Level Agreement - acuerdo de nivel de servicio (2h antes de FECHOR)
- **Barrido:** Ejecucion periodica del procesamiento de correos
- **Vinculacion:** Asociacion entre un correo y un codigo de carga
- **Interlocutor:** Persona(s) con quien se interactua en un correo, calculado como todos los emails de "de" y "para" excluyendo el email propio de la cuenta GAS
- **Pie comun:** Firma/despedida HTML compartida que se anade automaticamente a todas las plantillas de respuesta
- **Referencia:** Codigo de referencia del cliente asociado a una carga (viene de PEDCLI)
- **Plantilla de respuesta:** Modelo reutilizable de email con variables interpolables ({{codCar}}, {{asunto}}, etc.)
- **Respuesta masiva:** Envio de un mismo mensaje a multiples hilos seleccionados, incluyendo todos los participantes (to, cc, cco) excepto email propio
- **Envio programado:** Correo configurado para enviarse automaticamente en una fecha/hora futura via trigger periodico
- **Horario laboral:** Ventana de dias y horas en que el trigger procesa envios programados (configurable desde UI)
- **Cola de programados:** Hoja PROGRAMADOS en Sheets que almacena envios pendientes, enviados, con error o cancelados
- **Alerta proactiva:** Aviso generado automaticamente por el motor de reglas tras cada barrido, categorizado por nivel de urgencia (CRITICO/ALTO/MEDIO/BAJO)
- **Motor de reglas:** Modulo alerts.js que evalua 5 reglas (R2-R6) sobre registros de seguimiento para detectar situaciones que requieren atencion
- **Deduplicacion:** Mecanismo que evita repetir la misma alerta dentro de un periodo de cooldown configurable
- **Badge dinamico:** Indicador numerico + color en el icono de la extension Chrome que muestra cantidad y gravedad de alertas activas
- **Resumen matutino:** Ventana popup automatica que se abre 1 vez/dia al inicio del turno con alertas agrupadas por categoria
- **Resumen bajo demanda:** Misma ventana de resumen pero abierta manualmente con boton en panel
- **Recordatorio:** Aviso programado por el operador (o sugerido por el sistema) asociado a una carga, con opciones de snooze y persistencia via chrome.alarms
- **Snooze:** Posponer un recordatorio por un periodo predefinido (15min, 1h, manana)
- **Sugerencia de recordatorio:** Recordatorio propuesto automaticamente al cambiar fase de una carga (ej: Cargado→Verificar descarga)
- **Accion contextual:** Boton de accion rapida que aparece al seleccionar una carga, cambiando segun la fase actual (ej: fase 29 muestra "Reclamar POD")
- **Nota de carga:** Anotacion breve asociada a un codCar para registrar contexto de llamadas, WhatsApp u observaciones del operador
- **Grupo de fase:** Clasificacion de fases de transporte en categorias operativas (espera, carga, en_ruta, descarga, vacio, incidencia) para determinar acciones disponibles
- **Historial de acciones:** Cronologia auditable de todas las acciones realizadas sobre una carga (emails, cambios fase, recordatorios, notas) con rotacion a 30 dias
- **Secuencia de follow-up:** Serie de emails automaticos (max 3 pasos) que se envian si no hay respuesta, con detencion automatica al recibir respuesta en threadId
- **Dashboard Mi Turno:** Panel de control personal con KPIs (cargas activas, alertas, recordatorios, cerradas), grafico semanal y acceso rapido a cargas pendientes
- **Reporte fin de turno:** Resumen automatico de actividad del dia con cargas gestionadas, incidencias activas y recordatorios pendientes

---

## 6. Historial de Cambios

- **2026-02-15:** Sprint 5: Agregadas entidades ENTRADA_HISTORIAL, SECUENCIA_FOLLOWUP, PASO_SECUENCIA, enums TIPO_ACCION, ESTADO_SECUENCIA, ESTADO_PASO, storage keys tarealog_historial/tarealog_secuencias, glosario historial/secuencia/dashboard/reporte
- **2026-02-15:** Sprint 4: Agregadas entidades ACCION_CONTEXTUAL, NOTA_CARGA, enum GRUPO_FASE, storage key tarealog_notas, glosario accion contextual/nota de carga/grupo de fase
- **2026-02-15:** Sprint 3: Agregada entidad RECORDATORIO, SUGERENCIA_RECORDATORIO, storage keys tarealog_recordatorios/tarealog_recordatorios_vencidos, glosario recordatorio/snooze/sugerencia
- **2026-02-15:** Agregados enums NIVEL_ALERTA y REGLA_ALERTA, storage key tarealog_alertas, glosario alertas proactivas/motor de reglas/deduplicacion/badge dinamico
- **2026-02-15:** Agregada entidad programados (cola envios), enum ESTADO_PROGRAMADO, config HORARIO_LABORAL, glosario envio programado/horario laboral/cola programados
- **2026-02-14:** Agregados campos enriquecidos en seguimiento: mensajes_en_hilo, referencia, para, cc, cco, interlocutor, cuerpo
- **2026-02-14:** Agregadas entidades PLANTILLA_RESPUESTA, EXPORTACION_PLANTILLAS, STORAGE_KEYS
- **2026-02-14:** Agregados conceptos glosario: interlocutor, pie comun, referencia, plantilla de respuesta, respuesta masiva
- **2026-02-14:** Documentada logica campo calculado `interlocutor` (from+to minus email propio)
- **2026-02-14:** Agregados tipos CONFIG_FASE_TRANSPORTE y CONFIG_EXPORTACION (fases configurables + export/import)
- **2026-02-14:** Agregados campos logisticos en seguimiento: f_carga, h_carga, f_entrega, h_entrega, zona, z_dest
- **2026-02-14:** Agregado campo `fase` en tabla `seguimiento` y enum `FASE_TRANSPORTE` (12 valores, codigos 00-30)
- **2026-02-13:** Agregadas entidades db_hilos, seguimiento, enums TIPO_TAREA, ESTADO_REGISTRO, TIPO_VINCULACION, TIPO_ALERTA, validaciones y glosario completo
- **2026-02-13:** Diccionario inicial creado por /inicializa

---

**Ultima actualizacion:** 2026-02-15
**Mantenido por:** Coordinacion entre expedientes
**Consultas:** Antes de crear CUALQUIER nombre nuevo en codigo/diseno
