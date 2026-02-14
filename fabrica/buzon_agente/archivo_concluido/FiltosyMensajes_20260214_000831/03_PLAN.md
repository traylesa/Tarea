# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion
**Expediente:** FiltosyMensajes_20260214_000831
**Camino:** MINI_PROYECTO

---

## WBS (Work Breakdown Structure)

### T1: Filtro global de busqueda (S)
- **Archivo:** filters.js
- **Cambio:** Agregar funcion `filtroGlobal(texto, campos)` que genera filtro custom Tabulator
- **Test primero:** test_filters.js - nuevos tests para filtroGlobal
- **Dependencia:** Ninguna

### T2: HeaderFilter en columna Asunto (S)
- **Archivo:** panel.js (funcion crearColumnas)
- **Cambio:** Agregar columna "Asunto" con field 'asunto' y headerFilter: 'input'
- **Test primero:** test_filters.js - test integracion con nueva columna
- **Dependencia:** Ninguna

### T3: Contador de filtros activos (S)
- **Archivo:** filters.js
- **Cambio:** Agregar funcion `contarFiltrosActivos(tabla, tieneGlobal, tieneRangoFechas)` que retorna numero
- **Test primero:** test_filters.js - tests para contarFiltrosActivos
- **Dependencia:** Ninguna

### T4: Limpiar todos los filtros mejorado (S)
- **Archivo:** filters.js + panel.js
- **Cambio:** `limpiarTodoCompleto()` que limpia global + avanzados + headerFilters + fechas
- **Test primero:** test_filters.js - test para limpiarTodoCompleto
- **Dependencia:** T1

### T5: Previsualizacion en modal respuesta (S)
- **Archivo:** bulk-reply.js + panel.js + panel.html
- **Cambio:** Agregar `generarPrevisualizacion(registros, plantilla)` y seccion HTML en modal
- **Test primero:** test_bulk_reply.js - tests para generarPrevisualizacion
- **Dependencia:** Ninguna

### T6: Firma elegible en modal respuesta (S)
- **Archivo:** bulk-reply.js + panel.js + panel.html
- **Cambio:** Agregar `obtenerFirmasDisponibles(plantillas)` y selector en modal
- **Test primero:** test_bulk_reply.js - tests para obtenerFirmasDisponibles
- **Dependencia:** Ninguna

### T7: Integracion UI (M)
- **Archivos:** panel.html, panel.js, panel.css
- **Cambio:** Agregar input global, badge filtros, boton limpiar todo, previsualizacion modal, selector firma
- **Dependencia:** T1-T6

---

## Estrategia TDD

### Orden de tests (Red primero)

1. **test_filters.js** (ampliar):
   - `test_filtroGlobal_busca_en_todos_los_campos`
   - `test_filtroGlobal_case_insensitive`
   - `test_filtroGlobal_texto_vacio_retorna_true`
   - `test_contarFiltrosActivos_sin_filtros_retorna_0`
   - `test_contarFiltrosActivos_con_global_y_avanzados`

2. **test_bulk_reply.js** (ampliar):
   - `test_generarPrevisualizacion_interpola_datos_primer_registro`
   - `test_generarPrevisualizacion_sanitiza_html`
   - `test_obtenerFirmasDisponibles_retorna_firmas_unicas`
   - `test_obtenerFirmasDisponibles_sin_plantillas_retorna_vacio`

---

## Definition of Done (DoD)

- [ ] Todos los tests nuevos pasan (Red -> Green)
- [ ] Tests existentes no rotos (0 regresiones)
- [ ] Cobertura >= 80% del codigo nuevo
- [ ] Nombres verificados en DICCIONARIO_DOMINIO.md
- [ ] Filtro global funciona en todos los campos
- [ ] HeaderFilter en columna Asunto operativo
- [ ] Badge de filtros activos visible
- [ ] Boton limpiar todo resetea absolutamente todos los filtros
- [ ] Previsualizacion HTML en modal de respuesta funciona
- [ ] Selector de firma en modal de respuesta operativo
- [ ] Codigo refactorizado (paso Blue de TDD)

---

## Estimaciones

| Tarea | Complejidad | Estimacion |
|-------|-------------|------------|
| T1 | S | Rapido |
| T2 | S | Rapido |
| T3 | S | Rapido |
| T4 | S | Rapido |
| T5 | S | Rapido |
| T6 | S | Rapido |
| T7 | M | Medio |

---

## CHECKLIST

- [x] Todas las tareas listadas
- [x] Estimaciones completas
- [x] Plan de testing

## PUERTA DE VALIDACION 3

- [x] Todas las tareas tienen complejidad y dependencia
- [x] Estrategia TDD definida (que tests primero)
- [x] DoD completo y verificable

---

**Estado:** COMPLETADO
