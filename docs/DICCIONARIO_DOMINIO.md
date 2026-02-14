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
| cod_car | number | NULLABLE | Codigo carga |
| cod_tra | string | NULLABLE | Codigo transportista |
| nombre_transportista | string | NULLABLE | Nombre del ERP |
| email_remitente | string | NOT NULL | Email real |
| email_erp | string | NULLABLE | Email registrado en ERP |
| asunto | string | | Asunto del correo |
| fecha_correo | datetime | | Fecha del correo |
| tipo_tarea | enum(TIPO_TAREA) | | Tipo de tarea |
| estado | enum(ESTADO_REGISTRO) | | Estado del registro |
| alerta | string | NULLABLE | Tipo de alerta |
| vinculacion | enum(TIPO_VINCULACION) | | Metodo de vinculacion |
| fase | enum(FASE_TRANSPORTE) | NULLABLE | Fase logistica del transporte (codigo 00-30) |
| procesado_at | datetime | | Fecha procesamiento |
| f_carga | string (date) | NULLABLE | Fecha de salida/carga (PEDCLI.FECSAL) |
| h_carga | string (time) | NULLABLE | Hora de salida/carga (PEDCLI.FECHORSAL) |
| f_entrega | string (date) | NULLABLE | Fecha de llegada/entrega (PEDCLI.FECLLE) |
| h_entrega | string (time) | NULLABLE | Hora de llegada/entrega (PEDCLI.FECHORLLE) |
| zona | string | NULLABLE | Zona de origen (PEDCLI.ZONA) |
| z_dest | string | NULLABLE | Zona de destino (PEDCLI.ZONADES) |

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

### TIPO_ALERTA
- `ALERTA_CONTACTO_NO_REGISTRADO` - Email no coincide con ERP
- `ALERTA_SIN_CONTACTO_ERP` - Transportista sin email en ERP
- `ALERTA_SLA_VENCIMIENTO` - Carga proxima a vencer sin correo

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

---

## 6. Historial de Cambios

- **2026-02-13:** Diccionario inicial creado por /inicializa
- **2026-02-14:** Agregados tipos CONFIG_FASE_TRANSPORTE y CONFIG_EXPORTACION (fases configurables + export/import)
- **2026-02-14:** Agregados campos logisticos en seguimiento: f_carga, h_carga, f_entrega, h_entrega, zona, z_dest (expediente MasCampoyOpt_filtros)
- **2026-02-14:** Agregado campo `fase` en tabla `seguimiento` y enum `FASE_TRANSPORTE` (12 valores, codigos 00-30)
- **2026-02-13:** Agregadas entidades db_hilos, seguimiento, enums TIPO_TAREA, ESTADO_REGISTRO, TIPO_VINCULACION, TIPO_ALERTA, validaciones y glosario completo (expediente boceto_proyecto_20260213_213008)

---

**Ultima actualizacion:** 2026-02-14
**Mantenido por:** Coordinacion entre expedientes
**Consultas:** Antes de crear CUALQUIER nombre nuevo en codigo/diseno
