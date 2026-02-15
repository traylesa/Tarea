# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502
**Fecha:** 2026-02-15
**Autor:** Claude / Sprint 4
**Estado:** APROBADO (auto-integrado)

---

## CAMBIOS PROPUESTOS

### 1. Entidad ACCION_CONTEXTUAL

Accion rapida asociada a un grupo de fase de transporte.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `etiqueta` | string | Texto del boton de accion |
| `faseSiguiente` | string/null | Fase destino al ejecutar (null = no cambia) |
| `plantilla` | string/null | Alias de plantilla a preseleccionar |

### 2. Enum GRUPO_FASE

Agrupacion de fases de transporte para determinar acciones contextuales disponibles.

| Valor | Fases incluidas | Descripcion |
|-------|----------------|-------------|
| `espera` | 00, 01, 02 | Fases de espera pre-carga |
| `carga` | 11, 12 | Fases de proceso de carga |
| `en_ruta` | 19 | Cargado / en transito |
| `descarga` | 21, 22 | Fases de descarga |
| `vacio` | 29 | Descargado, pendiente documentacion |
| `incidencia` | 05, 25 | Incidencias pre/post carga |

### 3. Entidad NOTA_CARGA

Nota rapida asociada a un codigo de carga para contexto operativo.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (nota_timestamp_random) |
| `texto` | string | Contenido de la nota |
| `fechaCreacion` | string (ISO) | Timestamp de creacion |

### 4. Storage Key: tarealog_notas

| Clave | Tipo | Descripcion |
|-------|------|-------------|
| `tarealog_notas` | object | Mapa `{ [codCar]: NOTA_CARGA[] }` — notas por carga |

### 5. Glosario

- **Accion contextual:** Boton de accion rapida que aparece al seleccionar una carga, cambiando segun la fase actual (ej: fase 29 muestra "Reclamar POD")
- **Nota de carga:** Anotacion breve asociada a un codCar para registrar contexto de llamadas, WhatsApp u observaciones del operador
- **Grupo de fase:** Clasificacion de fases de transporte en categorias operativas (espera, carga, en_ruta, descarga, vacio, incidencia) para determinar acciones disponibles

---

## APROBACION

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [x] Integrado en `docs/DICCIONARIO_DOMINIO.md`
