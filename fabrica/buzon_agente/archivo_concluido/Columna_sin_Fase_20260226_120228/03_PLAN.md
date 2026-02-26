# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos afectados |
|---|-------|-------------|-------------|-------------------|
| T1 | Tests RED: columna sin_fase en COLUMNAS_KANBAN | S | - | test_kanban.js |
| T2 | Tests RED: agruparPorColumna usa sin_fase | S | T1 | test_kanban.js |
| T3 | Tests RED: resolverFaseAlMover('sin_fase', x) retorna '' | S | T1 | test_kanban.js |
| T4 | GREEN: Añadir sin_fase a COLUMNAS_KANBAN + renombrar | S | T1-T3 | kanban.js |
| T5 | GREEN: resolverFaseAlMover maneja sin_fase | S | T4 | kanban.js |
| T6 | Actualizar tests existentes (sin_columna → sin_fase) | S | T4 | test_kanban.js |
| T7 | REFACTOR: Verificar todos tests GREEN | S | T4-T6 | - |
| T8 | Toggle escritorio: variable + checkbox + handler | S | T7 | panel-kanban.js, panel.html |
| T9 | CSS: estilo columna sin_fase | S | T7 | kanban.css |
| T10 | Chip móvil: añadir sin_fase a chips | S | T7 | movil/views/kanban.js |

## 3.2 Orden de Ejecución

1. T1 → T2 → T3 (tests RED)
2. T4 → T5 → T6 → T7 (GREEN + actualizar tests)
3. T8 + T9 + T10 (paralelos, UI)

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**
1. `COLUMNAS_KANBAN[0].id === 'sin_fase'`
2. `COLUMNAS_KANBAN.length === 8`
3. `agruparPorColumna` con fase vacía → `grupos.sin_fase` (no `sin_columna`)
4. `resolverFaseAlMover('sin_fase', '19')` → retorna `''`
5. `resolverFaseAlMover('espera', '')` → retorna `'00'`
6. `calcularConteos` incluye `sin_fase`

**Código mínimo para GREEN:**
- Modificar COLUMNAS_KANBAN, agruparPorColumna, resolverFaseAlMover

**Refactor:**
- Limpiar, verificar suite completa

## 3.4 Plan de Testing

- **Unit tests:** test_kanban.js (5+ tests nuevos + 5 actualizados)
- **Manual:** Recargar extensión, verificar drag & drop en tablero

## 3.5 Estrategia de Migración

No aplica. Solo cambio frontend, sin datos persistentes afectados.

## 3.6 Definition of Done

- [ ] CA-1.1: Registro fase vacía aparece en sin_fase
- [ ] CA-1.2: Registro fase null aparece en sin_fase
- [ ] CA-1.3: Registro fase desconocida aparece en sin_fase
- [ ] CA-2.1: Drag sin_fase→espera cambia fase a '00'
- [ ] CA-3.1: Drag en_ruta→sin_fase limpia fase a ''
- [ ] CA-4.1: Toggle oculta columna sin_fase
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Sin regresiones en tests existentes (878+)
- [ ] Nombres verificados en DICCIONARIO_DOMINIO.md

---

## Puerta de Validación 3

- [x] Todas las tareas tienen complejidad y dependencia
- [x] Estrategia TDD definida (qué tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

---

**Estado:** COMPLETADO
