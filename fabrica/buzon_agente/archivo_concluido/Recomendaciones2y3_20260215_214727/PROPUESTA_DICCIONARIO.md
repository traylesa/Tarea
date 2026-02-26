# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** Recomendaciones2y3_20260215_214727
**Fecha:** 2026-02-15
**Autor:** Claude
**Estado:** PENDIENTE

---

## CAMBIOS PROPUESTOS

### 1. CAMPOS_EDITABLES (nueva constante backend)

**Nombre:** `CAMPOS_EDITABLES`
**Tipo:** Array<string> (constante)
**Ubicacion:** src/gas/Codigo.js
**Descripcion:** Lista blanca de campos que el endpoint actualizarCampo acepta. Protege contra modificacion de campos internos via API.

**Valores:**
- `codCar` - Codigo de carga
- `codTra` - Codigo transportista
- `nombreTransportista` - Nombre transportista
- `tipoTarea` - Tipo de tarea (OPERATIVO, ADMINISTRATIVA, SIN_CLASIFICAR)
- `estado` - Estado del registro
- `fase` - Fase de transporte
- `alerta` - Flag de alerta
- `vinculacion` - Estado de vinculacion
- `referencia` - Referencia externa
- `fCarga` - Fecha de carga
- `hCarga` - Hora de carga
- `fEntrega` - Fecha de entrega
- `hEntrega` - Hora de entrega
- `zona` - Zona origen
- `zDest` - Zona destino

**Campos excluidos (solo lectura):**
messageId, threadId, procesadoAt, emailRemitente, fechaCorreo, interlocutor, asunto, cuerpo, mensajesEnHilo

---

### 2. TAGS_SEGUROS (nueva constante extension)

**Nombre:** `TAGS_SEGUROS`
**Tipo:** Array<string> (constante)
**Ubicacion:** src/extension/templates.js
**Descripcion:** Tags HTML permitidos por sanitizarHtml. Whitelist para prevenir XSS.

**Valores:** p, br, b, i, u, strong, em, a, ul, ol, li, span, div, h1-h6, table, thead, tbody, tr, td, th, img, blockquote, pre, code, hr, sub, sup

---

### 3. ATRIBUTOS_SEGUROS (nueva constante extension)

**Nombre:** `ATRIBUTOS_SEGUROS`
**Tipo:** Array<string> (constante)
**Ubicacion:** src/extension/templates.js
**Descripcion:** Atributos HTML permitidos por sanitizarHtml. Rechaza on* y URLs peligrosas.

**Valores:** href, src, alt, title, class, style, colspan, rowspan, target, width, height

---

## APROBACION

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes en diccionario
- [x] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** ____________
**Fecha aprobacion:** ____________

---

**Referencia:** `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
