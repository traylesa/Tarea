# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Compl | Dep | Archivos | Entregable |
|---|-------|-------|-----|----------|------------|
| T1 | Tests action-bar (Red) | S | - | tests/TDD/unit/test_action_bar.js | ~15 tests fallando |
| T2 | Modulo action-bar.js (Green) | S | T1 | src/extension/action-bar.js | Tests pasan |
| T3 | Tests notes (Red) | S | - | tests/TDD/unit/test_notes.js | ~18 tests fallando |
| T4 | Modulo notes.js (Green) | S | T3 | src/extension/notes.js | Tests pasan |
| T5 | Refactor ambos modulos | S | T2,T4 | action-bar.js, notes.js | Codigo limpio |
| T6 | Verificar 112 tests existentes | S | T5 | - | 0 regresiones |

---

## 3.2 Orden de Ejecucion

```
T1 (test action-bar) → T2 (action-bar.js) ─┐
                                             ├→ T5 (refactor) → T6 (regresion)
T3 (test notes) → T4 (notes.js) ───────────┘
```

T1/T3 son independientes (se ejecutaran secuencialmente por simplicidad).

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_action_bar.js`:
   - obtenerAccionesPorFase: retorna acciones correctas para cada grupo de fase
   - obtenerAccionesPorFase: retorna vacio para fase desconocida/null
   - obtenerAccionesPorFase: cada accion tiene etiqueta y faseSiguiente
   - obtenerGrupoFase: clasifica fases en grupos correctos
   - GRUPOS_FASE: constante con 6 grupos

2. `test_notes.js`:
   - crearNota: genera nota con todos los campos
   - crearNota: lanza error si texto vacio
   - crearNota: lanza error si limite alcanzado
   - obtenerNotas: retorna notas de un codCar
   - obtenerNotas: retorna vacio si no hay notas
   - obtenerNotas: ordena recientes primero
   - eliminarNota: elimina por id
   - contarNotas: cuenta notas por codCar
   - tieneNotas: retorna boolean

**Orden implementacion (Green):**
1. action-bar.js — ACCIONES_POR_FASE mapa + obtenerAccionesPorFase()
2. notes.js — crearNota + obtenerNotas + eliminarNota + contarNotas + tieneNotas

---

## 3.4 Plan de Testing

- **Unit tests:** test_action_bar.js (~15 tests), test_notes.js (~18 tests)
- **Regresion:** Ejecutar 3 suites existentes (112 tests)
- **Cobertura:** >= 80% branches en ambos modulos
- **E2E:** Manual en Chrome (cargar extension, seleccionar fila, verificar acciones)

---

## 3.5 Migracion de Datos

No aplica. Notas usan storage key nuevo (tarealog_notas), sin conflicto con datos existentes.

---

## 3.6 Definition of Done (DoD)

- [ ] CA-11.1: obtenerAccionesPorFase('29') retorna ["Reclamar POD", "Marcar documentado"]
- [ ] CA-11.2: obtenerAccionesPorFase('12') retorna ["Solicitar posicion", "Avisar destino"]
- [ ] CA-11.4: obtenerAccionesPorFase('30') retorna array vacio
- [ ] CA-11.5: obtenerAccionesPorFase(null) retorna array vacio
- [ ] CA-12.1: crearNota crea nota con timestamp y codCar
- [ ] CA-12.2: obtenerNotas ordena recientes primero
- [ ] CA-12.3: eliminarNota elimina por id
- [ ] CA-12.4: crearNota lanza error si texto vacio
- [ ] CA-12.5: crearNota lanza error si limite 50 alcanzado
- [ ] CA-12.6: obtenerNotas retorna vacio si no hay notas
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del codigo nuevo
- [ ] Sin regresiones en 112 tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Propuesta diccionario actualizada

---

## Checklist

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (que tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

---

**Estado:** COMPLETADO
