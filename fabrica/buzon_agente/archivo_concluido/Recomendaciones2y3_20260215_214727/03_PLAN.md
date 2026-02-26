# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Comp. | Dep. | Archivos afectados | Entregable |
|---|-------|-------|------|-------------------|------------|
| T1 | Reescribir sanitizarHtml con whitelist | M | - | src/extension/templates.js | Función segura |
| T2 | Tests sanitización HTML | M | - | tests/TDD/unit/test_templates.js | 15+ tests |
| T3 | Añadir CAMPOS_EDITABLES en backend | S | - | src/gas/Codigo.js | Whitelist + validación |
| T4 | Tests whitelist campos | S | - | tests/TDD/unit/test_campos_editables.js | 8+ tests |
| T5 | Eliminar fallback SPREADSHEET_ID | S | - | src/gas/Configuracion.js | Error sin fallback |
| T6 | Tests spreadsheet obligatorio | S | - | tests/TDD/unit/test_configuracion.js | 5+ tests |
| T7 | Extraer panel-tabla.js | L | T1 | src/extension/panel-tabla.js, panel.js, panel.html | Módulo tabla |
| T8 | Extraer panel-plantillas.js | M | T7 | src/extension/panel-plantillas.js, panel.js, panel.html | Módulo plantillas |
| T9 | Extraer panel-recordatorios.js | M | T8 | src/extension/panel-recordatorios.js, panel.js, panel.html | Módulo recordatorios |
| T10 | Extraer panel-acciones.js | M | T9 | src/extension/panel-acciones.js, panel.js, panel.html | Módulo acciones+notas |
| T11 | Extraer panel-dashboard.js | S | T10 | src/extension/panel-dashboard.js, panel.js, panel.html | Módulo dashboard |
| T12 | Actualizar panel.html scripts | S | T11 | src/extension/panel.html | Tags script nuevos |

Complejidad: S (<30 min) / M (30 min - 2h) / L (>2h)

## 3.2 Orden de Ejecución

**Bloque 1 (Seguridad, paralelo):**
1. T2 → T1 (TDD: tests sanitización → implementar)
2. T4 → T3 (TDD: tests whitelist → implementar)
3. T6 → T5 (TDD: tests spreadsheet → implementar)

**Bloque 2 (Modularización, secuencial):**
4. T7 → T8 → T9 → T10 → T11 → T12

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**
1. `test_templates.js`: sanitizarHtml — tags peligrosos, URLs maliciosas, atributos on*, tags seguros preservados, null/vacío
2. `test_campos_editables.js`: validarCampoEditable — campos permitidos, prohibidos, vacíos, inexistentes
3. `test_configuracion.js`: obtenerSpreadsheetId — con ID, sin ID, ID vacío

**Orden de implementación (Green):**
1. templates.js — reescribir sanitizarHtml con whitelist
2. Codigo.js — añadir CAMPOS_EDITABLES + validación en accionActualizarCampo
3. Configuracion.js — eliminar fallback

**Refactorizaciones (Refactor):**
- Extraer constantes TAGS_SEGUROS, ATRIBUTOS_SEGUROS a inicio de templates.js
- Modularización panel.js (T7-T12) es la refactorización principal

## 3.4 Plan de Testing

- **Unit tests**: test_templates.js (sanitización), test_campos_editables.js (whitelist), test_configuracion.js (spreadsheet)
- **Regresión**: Ejecutar suite completa (368+ tests) tras cada bloque
- **E2E manual**: Verificar que panel abre y funciona tras modularización

## 3.5 Estrategia de Migración

- Sin migración de datos
- Rollback: revertir git commit (cambios son solo refactor + hardening)

## 3.6 Definition of Done (DoD)

- [ ] CA-1.1: sanitizarHtml preserva `<b>`, `<p>`, `<a href="https://...">` intactos
- [ ] CA-1.2: sanitizarHtml elimina `<iframe>`, `<script>`, `<object>`, `<embed>`, `<form>`
- [ ] CA-1.3: sanitizarHtml limpia `javascript:` en href preservando tag `<a>`
- [ ] CA-1.4: sanitizarHtml elimina atributos `on*` con y sin comillas
- [ ] CA-1.5: sanitizarHtml retorna '' para null/undefined/vacío
- [ ] CA-2.1: actualizarCampo acepta campos editables (fase, estado, codCar, etc.)
- [ ] CA-2.2: actualizarCampo rechaza campos internos (messageId, threadId, procesadoAt)
- [ ] CA-2.3: actualizarCampo rechaza campo vacío/undefined
- [ ] CA-3.1: obtenerSpreadsheetId retorna ID si configurado
- [ ] CA-3.2: obtenerSpreadsheetId lanza error si no configurado
- [ ] CA-3.3: obtenerSpreadsheetId lanza error si ID vacío
- [ ] CA-4.1: Panel funciona idéntico tras modularización
- [ ] CA-4.2: panel.js < 500 líneas
- [ ] Tests nuevos escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Sin regresiones en tests existentes (368+)
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md

---

## PUERTA DE VALIDACIÓN 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (qué tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

---

**Estado:** COMPLETADO
