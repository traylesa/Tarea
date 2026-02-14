# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Fecha:** 2026-02-14
**Autor:** Agente Claude
**Estado:** APROBADO (auto-aprobado para implementación)

---

## CAMBIOS PROPUESTOS

### 1. Nuevos campos en tabla `seguimiento`

Campos logísticos importados desde tabla PEDCLI del ERP.

| Campo | Tipo | Restricción | Origen PEDCLI | Descripción |
|-------|------|-------------|---------------|-------------|
| `f_carga` / `fCarga` (JS) | string (date) | NULLABLE | FECSAL | Fecha de salida/carga |
| `h_carga` / `hCarga` (JS) | string (time) | NULLABLE | FECHORSAL | Hora de salida/carga |
| `f_entrega` / `fEntrega` (JS) | string (date) | NULLABLE | FECLLE | Fecha de llegada/entrega |
| `h_entrega` / `hEntrega` (JS) | string (time) | NULLABLE | FECHORLLE | Hora de llegada/entrega |
| `zona` | string | NULLABLE | ZONA | Zona de origen |
| `z_dest` / `zDest` (JS) | string | NULLABLE | ZONADES | Zona de destino |

**Convención:** snake_case en BD, camelCase en JavaScript (consistente con proyecto).

**No conflicto:** Ninguno de estos nombres existe en el diccionario actual.

---

## APROBACIÓN

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [x] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Agente Claude (auto-implementación)
**Fecha aprobación:** 2026-02-14
