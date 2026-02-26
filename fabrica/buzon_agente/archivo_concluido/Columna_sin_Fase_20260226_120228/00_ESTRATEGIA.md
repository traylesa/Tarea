# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## Objetivo

Crear una columna "Sin Fase" al inicio del tablero Kanban para que los registros nuevos (fase vacía) sean visibles y clasificables por drag & drop, en vez de desaparecer del tablero.

**Por qué:** Actualmente los registros sin fase van a `grupos.sin_columna` pero nunca se renderizan. El operador no ve estos registros hasta asignarles fase manualmente desde la tabla, perdiendo visibilidad operativa.

## Alcance

### Qué SÍ
- Añadir columna `sin_fase` al inicio de `COLUMNAS_KANBAN`
- Renombrar `sin_columna` → `sin_fase` en lógica de agrupación
- Manejar drag & drop hacia/desde "Sin Fase" (limpiar fase a `''`)
- Toggle de visibilidad (checkbox escritorio, chip móvil)
- Estilo visual diferenciado (bandeja de entrada)
- Tests unitarios para la nueva lógica

### Qué NO
- No se modifica el backend GAS (solo frontend)
- No se crean nuevas fases en el diccionario de dominio
- No se modifica la lógica de filtros (`filtroFases` ya soporta `__SIN_FASE__`)
- No se modifica la tabla Tabulator

## Criterios de éxito

1. `npx jest tests/TDD/unit/test_kanban.js` — todos pasan (existentes + nuevos)
2. `npx jest --no-coverage` — 878+ tests pasan (cero rotos)
3. Registros sin fase aparecen en columna "Sin Fase" del tablero
4. Drag de "Sin Fase" a otra columna asigna fase correcta
5. Drag de otra columna a "Sin Fase" limpia fase a `''`
6. Toggle ocultar/mostrar funciona (escritorio y móvil)

## Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Tests existentes usan `sin_columna` | ALTA | BAJO | Actualizar tests que referencien `sin_columna` → `sin_fase` |
| `resolverFaseAlMover` con fases vacías | MEDIA | MEDIO | Manejar caso `sin_fase` explícitamente (return `''`) |
| Móvil no muestra columna por `_ocultos` default | BAJA | BAJO | Añadir `sin_fase: false` en defaults de `_ocultos` |

## Checklist

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Riesgos evaluados con mitigación

---

**Estado:** COMPLETADO
