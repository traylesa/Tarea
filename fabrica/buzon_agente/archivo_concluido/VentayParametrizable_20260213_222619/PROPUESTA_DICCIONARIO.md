# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** VentayParametrizable_20260213_222619
**Fecha:** 2026-02-13
**Autor:** Claude
**Estado:** PROPUESTO

---

## CAMBIOS PROPUESTOS

### 1. Estructura de Configuracion de Extension (logitask_config)

**Nombre clave storage:** `logitask_config`

**Descripcion:** Configuracion parametrizable de la extension Chrome, persistida en chrome.storage.local.

**Campos:**

| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| gasUrl | string | '' | URL del servicio Google Apps Script desplegado |
| intervaloMinutos | number | 15 | Intervalo de barrido automatico (1-1440 minutos) |
| rutaCsvErp | string | '' | Ruta local a archivos CSV del ERP |
| patrones.codcarAdjunto | string (regex) | `Carga_0*(\\d+)\\.pdf` | Patron regex extraccion CODCAR de adjuntos |
| patrones.keywordsAdmin | string (regex) | `certificado\|hacienda\|347\|aeat\|factura` | Patron regex keywords administrativos |
| ventana.width | number | 800 | Ancho ventana panel |
| ventana.height | number | 600 | Alto ventana panel |
| ventana.left | number/null | null | Posicion X (null = centrado) |
| ventana.top | number/null | null | Posicion Y (null = centrado) |

**Validaciones:**
- gasUrl: vacio O URL valida (https://)
- intervaloMinutos: entero entre 1 y 1440
- patrones.*: regex valida (new RegExp() no lanza error)
- ventana.*: numeros positivos

**Usado en:** config.js, background.js, panel.js, config-ui.js

**Relacion con diccionario existente:**
- `codcarAdjunto` reutiliza patron de `Validaciones > CODCAR de adjunto`
- `keywordsAdmin` reutiliza patron de `Validaciones > Keywords admin`

---

## APROBACION

- [x] Validado contra convenciones del proyecto (camelCase para JS)
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** Pendiente
**Fecha aprobacion:** Pendiente
