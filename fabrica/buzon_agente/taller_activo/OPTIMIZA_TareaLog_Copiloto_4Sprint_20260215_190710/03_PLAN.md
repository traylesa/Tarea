# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_190710
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

Crear plan detallado con desglose de tareas, estrategia TDD y Definition of Done verificable.

---

## ENTRADAS

- 00_ESTRATEGIA.md (objetivo y alcance)
- 01_ANALISIS.md (HUs y criterios de aceptación)
- 02_INVESTIGACION.md (decisión técnica + mapa impacto)

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos afectados | Entregable |
|---|-------|-------------|-------------|-------------------|------------|
| 1 | [Tarea] | S/M/L | - | [rutas] | [Resultado] |
| 2 | [Tarea] | S/M/L | 1 | [rutas] | [Resultado] |

Complejidad: S (< 30 min) / M (30 min - 2h) / L (> 2h)

## 3.2 Orden de Ejecución

1. Tarea [X] → Tarea [Y] → Tarea [Z]
2. [Paralelismos posibles]

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**
1. test_[nombre]: [qué valida] → archivo: tests/[ruta]
2. test_[nombre]: [qué valida] → archivo: tests/[ruta]

**Orden de implementación para hacerlos pasar (Green):**
1. [Módulo/archivo] - [qué implementar]
2. [Módulo/archivo] - [qué implementar]

**Refactorizaciones previstas (Refactor):**
- [Mejora 1]

## 3.4 Plan de Testing

- **Unit tests:** [qué testear, dónde]
- **Integration tests:** [qué testear, dónde]
- **E2E tests:** [qué testear, dónde] (si aplica)

## 3.5 Estrategia de Migración de Datos (si aplica)

- Migraciones necesarias: [listar]
- Rollback plan: [cómo revertir]

## 3.6 Definition of Done (DoD)

Checklist específica para ESTE expediente (derivada de criterios de aceptación):
- [ ] CA-1.1: [criterio verificable derivado de HU-1]
- [ ] CA-1.2: [criterio verificable derivado de HU-1]
- [ ] CA-1.3: [criterio verificable derivado de HU-1]
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Sin regresiones en tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Documentación actualizada

---

## >>> PUERTA DE VALIDACION 3 <<<

NO avanzar a Fase 4/5 hasta verificar:
- [ ] Todas las tareas tienen complejidad, dependencia y archivos
- [ ] Estrategia TDD definida (qué tests primero)
- [ ] Plan de testing completo
- [ ] DoD completo y verificable (cada item medible)

---

**Estado:** NO INICIADO
