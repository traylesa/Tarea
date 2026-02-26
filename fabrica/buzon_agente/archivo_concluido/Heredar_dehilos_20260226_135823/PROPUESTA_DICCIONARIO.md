# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** Heredar_dehilos_20260226_135823
**Fecha:** 2026-02-26
**Autor:** Claude
**Estado:** APROBADO (integrado)

---

## Cambios Propuestos

### 1. Nuevo valor en TIPOS_ACCION_REGLA

**Nombre:** `HEREDAR_DEL_HILO`

**Descripcion:** Tipo de accion para el motor de reglas parametrizable que hereda un campo desde el ultimo registro del mismo threadId (hilo Gmail).

**Params:**
- `campo` (string): Campo a heredar ('fase', 'estado', 'codCar'). Default: el campo de la condicion.

**Usado en:** `src/extension/action-rules.js` (TIPOS_ACCION_REGLA), `src/extension/panel.js` (ejecutarAccionRegla)

**Verificacion:**
- `TIPOS_ACCION_REGLA` ya existe en diccionario (seccion 3: Estados/Enums implicitamente via el motor de reglas)
- `HEREDAR_DEL_HILO` sigue la convencion UPPER_CASE con guiones bajos
- No conflicta con ningun nombre existente

---

## Nota

Todos los demas nombres usados en esta implementacion ya existen en el diccionario:
- `fase`, `estado`, `codCar`, `threadId` → tabla seguimiento
- `HILO` → enum TIPO_VINCULACION
- `obtenerEstadoInicial` → Configuracion.js
- `ALERTA` → enum ESTADO_REGISTRO

---

## Aprobacion

- [x] Validado contra convenciones del proyecto
- [x] No conflicto con nombres existentes
- [x] Documentado completamente
- [x] Integrado en diccionario central

**Aprobado por:** Claude (auto-aprobado - nombre sigue convenciones)
**Fecha:** 2026-02-26
