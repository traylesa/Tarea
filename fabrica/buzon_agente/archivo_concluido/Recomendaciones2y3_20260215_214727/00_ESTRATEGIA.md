# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO

---

## OBJETIVO

Aplicar las recomendaciones 2 (Seguridad) y 3 (Rendimiento/Modularización) de la revisión de TareaLog:

1. **Seguridad**: Reforzar sanitización HTML, añadir whitelist de campos en backend, eliminar SPREADSHEET_ID hardcodeado
2. **Modularización**: Separar panel.js (2,772 líneas) en módulos coherentes para mantenibilidad futura

**Por qué**: La extensión funciona correctamente pero tiene deuda técnica en seguridad (sanitización HTML insuficiente, backend sin validación de campos) y mantenibilidad (archivo monolítico). Corregir ahora previene problemas conforme crezca el uso.

---

## ALCANCE

### Qué SÍ

- **R2a**: Mejorar `sanitizarHtml()` en templates.js — filtrar `<iframe>`, `javascript:`, atributos peligrosos, entidades HTML codificadas
- **R2b**: Añadir `CAMPOS_EDITABLES` whitelist en Codigo.js/AdaptadorHojas.js
- **R2c**: Eliminar fallback hardcodeado de SPREADSHEET_ID en Configuracion.js, fallar con mensaje claro
- **R3b**: Separar panel.js en módulos temáticos (tabla, recordatorios, acciones, notas, dashboard, UI general)

### Qué NO

- **R3a**: Optimizar búsquedas lineales en Sheets (no es problema con volumen actual <5,000 filas)
- Cambios en la UI visible al usuario
- Cambios en el flujo de datos o endpoints existentes
- Migración a ES modules (se mantiene patrón `<script>` tags)

---

## CRITERIOS DE ÉXITO

1. `sanitizarHtml()` filtra: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `javascript:` en href/src, atributos `on*`
2. `actualizarCampo()` rechaza campos fuera de whitelist con error explícito
3. `obtenerSpreadsheetId()` lanza error si no hay ID configurado (sin fallback)
4. panel.js reducido a <500 líneas (coordinador), lógica extraída a módulos
5. Todos los tests existentes (368+) siguen pasando
6. Tests nuevos con cobertura >=80% del código nuevo

---

## RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Romper sanitización de plantillas existentes | Media | Alto | Tests con casos reales antes y después |
| Romper edición inline en tabla al añadir whitelist | Media | Alto | Test E2E de cada campo editable |
| Separar panel.js cause errores de scope/orden | Alta | Alto | Extraer un módulo a la vez, tests entre cada paso |
| SPREADSHEET_ID sin fallback rompa instalaciones existentes | Baja | Medio | Documentar en ayuda que se debe configurar |

---

## STAKEHOLDERS

- **Operador TRAYLESA**: Usuario final, no debe notar cambios funcionales
- **Desarrollador**: Beneficiado por modularización de panel.js

---

## CHECKLIST

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Stakeholders identificados
- [x] Restricciones técnicas/negocio claras
- [x] Riesgos principales evaluados

---

**Estado:** COMPLETADO
