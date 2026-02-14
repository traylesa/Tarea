# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos afectados | Entregable |
|---|-------|-------------|-------------|-------------------|------------|
| T1 | Ampliar operadores en construirFiltros() | S | - | filters.js, test_filters.js | 4 operadores nuevos (<, <=, >, >=) |
| T2 | Agregar filtros temporales (carga/descarga) | M | - | filters.js, test_filters.js | filtroCarga(), filtroDescarga() |
| T3 | Función filtro por fases seleccionadas | S | - | filters.js, test_filters.js | filtroFases(fasesActivas) |
| T4 | Función edición masiva (lógica pura) | M | - | filters.js, test_filters.js | aplicarCambioMasivo() |
| T5 | Ampliar CAMPOS_BUSCABLES con campos nuevos | S | - | panel.js | Array ampliado |
| T6 | Agregar columnas nuevas a crearColumnas() | M | T5 | panel.js | 6 columnas nuevas |
| T7 | UI cards de fases en panel-filtros | M | T3 | panel.html, panel.js, panel.css | Componente cards |
| T8 | UI filtros temporales con checkboxes | M | T2 | panel.html, panel.js, panel.css | Checkboxes + inputs date |
| T9 | UI edición masiva (bulk panel) | M | T4 | panel.html, panel.js, panel.css | Panel con ComboBox + botón |
| T10 | Ampliar select operadores en HTML | S | T1 | panel.html | 4 opciones nuevas |
| T11 | Agregar campos nuevos al select de filtros | S | T6 | panel.html | Opciones zona, zDest, fCarga, fEntrega |

Complejidad: S (< 30 min) / M (30 min - 2h) / L (> 2h)

---

## 3.2 Orden de Ejecución

**Paralelo 1 (lógica pura - TDD):** T1, T2, T3, T4 (independientes)
**Paralelo 2 (UI):** T5 → T6 → T7, T8, T9, T10, T11

**Secuencia recomendada:**
1. T1 (operadores) → T10 (HTML operadores)
2. T2 (filtros temporales) → T8 (UI checkboxes)
3. T3 (filtro fases) → T7 (cards UI)
4. T4 (edición masiva) → T9 (bulk panel UI)
5. T5 (CAMPOS_BUSCABLES) → T6 (columnas) → T11 (select filtros)

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_operadores_comparacion`: Operadores <, <=, >, >= en construirFiltros → `tests/TDD/unit/test_filters.js`
2. `test_filtro_rango_carga`: filtroCarga con hoy/mañana → `tests/TDD/unit/test_filters.js`
3. `test_filtro_rango_descarga`: filtroDescarga con ayer/hoy → `tests/TDD/unit/test_filters.js`
4. `test_filtro_fases`: filtroFases con array de fases activas → `tests/TDD/unit/test_filters.js`
5. `test_aplicar_cambio_masivo`: aplicarCambioMasivo actualiza N registros → `tests/TDD/unit/test_filters.js`
6. `test_campos_buscables_ampliados`: filtroGlobal busca en campos nuevos → `tests/TDD/unit/test_filters.js`

**Orden de implementación para hacerlos pasar (Green):**

1. filters.js - Agregar operadores <, <=, >, >= a construirFiltros()
2. filters.js - Crear filtroCarga(campo, hoy) y filtroDescarga(campo, hoy)
3. filters.js - Crear filtroFases(fasesActivas)
4. filters.js - Crear aplicarCambioMasivo(registros, seleccionados, campo, valor)
5. panel.js - Ampliar CAMPOS_BUSCABLES
6. panel.js + panel.html + panel.css - UI completa

**Refactorizaciones previstas (Refactor):**
- Extraer constantes de fechas por defecto
- Consolidar lógica de filtrado temporal

---

## 3.4 Plan de Testing

- **Unit tests:** Todos los tests en `tests/TDD/unit/test_filters.js` (lógica pura)
- **Integration tests:** No aplica (extensión Chrome no tiene framework de integración configurado)
- **Manual smoke test:** Verificar UI en panel.html cargado como extensión

---

## 3.5 Estrategia de Migración de Datos

- **No requiere migración:** Los campos nuevos se agregan como opcionales
- **Datos existentes en chrome.storage:** Compatibles (nuevos campos serán undefined → se renderizan como "--")
- **Rollback:** Revertir archivos modificados; datos en storage siguen funcionando sin campos nuevos

---

## 3.6 Definition of Done (DoD)

- [ ] CA-1.1: Columnas fCarga, hCarga, fEntrega, hEntrega, zona, zDest visibles en rejilla
- [ ] CA-1.2: Campos undefined/null muestran "--"
- [ ] CA-2.1: Checkbox "Rango Carga" filtra fCarga entre hoy y mañana
- [ ] CA-2.2: Desactivar checkbox elimina filtro temporal
- [ ] CA-3.1: Cards de fase filtran registros al hacer click
- [ ] CA-3.2: "Marcar Todas" muestra todos los registros
- [ ] CA-4.1: Edición masiva actualiza N registros seleccionados
- [ ] CA-4.2: Botón "Aplicar" deshabilitado si 0 seleccionados
- [ ] CA-5.1: Operadores <, <=, >, >= funcionan en filtros personalizados
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Sin regresiones en tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md

---

## PUERTA DE VALIDACIÓN 3: APROBADA

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (qué tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable (cada item medible)
