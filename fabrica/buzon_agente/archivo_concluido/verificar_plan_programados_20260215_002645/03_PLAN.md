# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** verificar_plan_programados_20260215_002645

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos | Entregable |
|---|-------|-------------|-------------|----------|------------|
| 1 | Escribir tests scheduled.js (TDD Red) | M | - | `tests/TDD/unit/test_scheduled.js` | Tests fallando |
| 2 | Verificar que scheduled.js pasa tests (Green) | S | 1 | `src/extension/scheduled.js` | Tests pasando |
| 3 | Actualizar diccionario de dominio | S | - | `docs/DICCIONARIO_DOMINIO.md` | Entidad PROGRAMADOS documentada |
| 4 | Verificar tests existentes no rotos | S | 2 | - | 0 regresiones |
| 5 | Documentar optimizaciones UX | S | - | `02_INVESTIGACION.md` | Lista priorizada |

---

## 3.2 Orden de Ejecucion

1. Tareas 1 y 3 en paralelo (independientes)
2. Tarea 2 depende de 1
3. Tarea 4 depende de 2
4. Tarea 5 independiente

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

```
tests/TDD/unit/test_scheduled.js
```

1. `formatearEstadoProgramado('PENDIENTE')` retorna icono + clase + texto correcto
2. `formatearEstadoProgramado('ENVIADO')` retorna datos de enviado
3. `formatearEstadoProgramado('ERROR')` retorna datos de error
4. `formatearEstadoProgramado('CANCELADO')` retorna datos de cancelado
5. `formatearEstadoProgramado('DESCONOCIDO')` retorna fallback con icono interrogacion
6. `formatearEstadoProgramado(null)` retorna fallback
7. `filtrarProgramados(lista, 'TODOS')` retorna lista completa
8. `filtrarProgramados(lista, 'PENDIENTE')` retorna solo pendientes
9. `filtrarProgramados(lista, null)` retorna lista completa
10. `filtrarProgramados([], 'PENDIENTE')` retorna array vacio
11. `ordenarPorFechaProgramada(lista)` ordena descendente por fecha
12. `ordenarPorFechaProgramada([])` retorna array vacio
13. `ordenarPorFechaProgramada` no muta original (inmutabilidad)
14. `formatearFechaCorta(isoString)` retorna formato DD/MM/YYYY HH:mm
15. `formatearFechaCorta('')` retorna '--'
16. `formatearFechaCorta(null)` retorna '--'
17. `formatearFechaCorta('invalida')` retorna string original
18. `contarPorEstado(lista)` retorna conteo correcto por estado
19. `contarPorEstado([])` retorna todos en 0

**Orden implementacion para hacerlos pasar (Green):**
- scheduled.js ya esta implementado — los tests deben pasar inmediatamente

**Refactorizaciones previstas (Refactor):**
- Ninguna necesaria, el codigo es limpio y sigue patrones del proyecto

---

## 3.4 Plan de Testing

- **Unit tests:** `tests/TDD/unit/test_scheduled.js` — 19 tests cubriendo las 6 funciones exportadas
- **Integration tests:** No aplica (logica pura sin dependencias externas)
- **E2E tests:** Verificacion manual listada en plan original (9 pasos)

---

## 3.5 Migracion de Datos

No aplica. La hoja PROGRAMADOS se crea automaticamente al primer acceso via `obtenerHoja()`.

---

## 3.6 Definition of Done (DoD)

- [ ] Tests de scheduled.js escritos y pasando (19 tests)
- [ ] Cobertura >= 80% de scheduled.js
- [ ] 0 tests existentes rotos
- [ ] Diccionario de dominio actualizado con entidad PROGRAMADOS
- [ ] Conformidad plan vs implementacion verificada al 100%
- [ ] Optimizaciones UX documentadas

---

## PUERTA DE VALIDACION 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (19 tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

---

**Estado:** COMPLETADO
