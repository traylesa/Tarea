# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** FiltosyMensajes_20260213_225601
**Fecha:** 2026-02-13 22:56:01
**Autor:** Claude / Usuario
**Estado:** PENDIENTE

---

## 📖 INSTRUCCIONES

**REGLA FUNDAMENTAL:** Ningún nombre nuevo de tabla/campo/variable/estado puede aparecer en el código sin estar registrado en el diccionario central primero.

**PROCESO OBLIGATORIO:**

1. **Antes de crear nombres nuevos:**
   - Abrir `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
   - Verificar que el nombre NO existe
   - Documentar aquí el cambio propuesto

2. **Documentar cambio:**
   - Nombre completo (tabla, campo, enum, etc.)
   - Tipo de dato / tipo de cambio
   - Validaciones / restricciones
   - Descripción clara del propósito

3. **Aprobar cambio:**
   - Usuario/arquitecto revisa esta propuesta
   - Usuario actualiza `docs/DICCIONARIO_DOMINIO.md` manualmente
   - Usuario registra en historial de cambios del diccionario
   - Usuario marca este cambio como APROBADO

4. **Solo entonces implementar en código**

---

## 💡 EJEMPLOS

### Ejemplo: Nueva Tabla

**Nombre:** `nombre_tabla`

**Descripción:** [Para qué se usa]

**Campos:**
- `id` (uuid, PK)
- `campo_1` (tipo, restricciones)
- `campo_2` (tipo, restricciones)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

**Índices:**
- PK en `id`
- INDEX en `campo_1`

**Relaciones:**
- FK a `tabla_existente.id`

---

### Ejemplo: Nuevo Enum/Estado

**Nombre:** `ENUM_NAME_VALOR`

**Valores:**
- `VALOR_1` - Descripción significado
- `VALOR_2` - Descripción significado
- `VALOR_3` - Descripción significado

**Usado en:** [Tabla X, campo Y]

---

## ✏️ CAMBIOS PROPUESTOS

*(Documentar aquí tus propuestas siguiendo el formato de ejemplos)*

### 1. [Título del cambio]

[Descripción completa]

---

## ✅ APROBACIÓN

- [ ] Validado contra convenciones del proyecto
- [ ] No conflicto con nombres existentes en diccionario
- [ ] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** ____________
**Fecha aprobación:** ____________

---

**Referencia:** `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
