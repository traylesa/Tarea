# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208
**Fecha:** 2026-02-15
**Autor:** Claude / Sprint 5
**Estado:** APROBADO

---

## CAMBIOS PROPUESTOS

### 1. Entidad ENTRADA_HISTORIAL (NUEVA)

Entrada de accion en el historial auditable de una carga.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (hist_timestamp_random) |
| `codCar` | number | Codigo de carga |
| `tipo` | enum(TIPO_ACCION) | Tipo de accion |
| `descripcion` | string | Texto descriptivo |
| `fechaCreacion` | string (ISO) | Timestamp |

### 2. Enum TIPO_ACCION (NUEVO)

- `EMAIL` - Email enviado/recibido
- `FASE` - Cambio de fase
- `RECORDATORIO` - Recordatorio creado/completado
- `NOTA` - Nota anadida

**Usado en:** ENTRADA_HISTORIAL.tipo

### 3. Entidad SECUENCIA_FOLLOWUP (NUEVA)

Secuencia de emails automatica para reclamar documentos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (seq_timestamp_random) |
| `codCar` | number | Codigo de carga |
| `threadId` | string | ID hilo Gmail |
| `nombre` | string | Nombre predefinido |
| `estado` | enum(ESTADO_SECUENCIA) | Estado global |
| `pasos` | array(PASO_SECUENCIA) | Pasos (max 3) |
| `fechaCreacion` | string (ISO) | Timestamp |

### 4. Entidad PASO_SECUENCIA (NUEVA)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `orden` | number | 1, 2 o 3 |
| `plantilla` | string | Alias plantilla |
| `horasEspera` | number | Horas desde inicio |
| `estado` | enum(ESTADO_PASO) | Estado del paso |
| `fechaProgramada` | string (ISO) | Fecha ejecucion |

### 5. Enum ESTADO_SECUENCIA (NUEVO)

- `ACTIVA` - Secuencia en curso
- `COMPLETADA` - Todos los pasos ejecutados
- `DETENIDA` - Detenida por respuesta recibida
- `CANCELADA` - Cancelada manualmente

### 6. Enum ESTADO_PASO (NUEVO)

- `PENDIENTE` - Esperando ejecucion
- `EJECUTADO` - Email enviado
- `DETENIDO` - Detenido por respuesta
- `CANCELADO` - Cancelado por usuario

### 7. Storage Keys Nuevas

| Clave | Tipo | Descripcion |
|-------|------|-------------|
| `tarealog_historial` | object | Mapa `{ [codCar]: ENTRADA_HISTORIAL[] }` |
| `tarealog_secuencias` | array(SECUENCIA_FOLLOWUP) | Secuencias activas |

### 8. Glosario Nuevos Terminos

- **Historial de acciones:** Cronologia auditable de todas las acciones realizadas sobre una carga (emails, cambios fase, recordatorios, notas)
- **Secuencia de follow-up:** Serie de emails automaticos (max 3 pasos) que se envian si no hay respuesta, con detencion automatica al recibir respuesta
- **Dashboard Mi Turno:** Panel de control personal con KPIs, grafico semanal y acceso rapido a cargas pendientes
- **Reporte fin de turno:** Resumen automatico de actividad del dia con cargas gestionadas, incidencias y pendientes

---

## APROBACION

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [x] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Agente Sprint 5
**Fecha aprobacion:** 2026-02-15
