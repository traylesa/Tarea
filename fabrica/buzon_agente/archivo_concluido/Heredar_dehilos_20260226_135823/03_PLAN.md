# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** Heredar_dehilos_20260226_135823
**Camino:** PROYECTO_COMPLETO
**Fecha:** 2026-02-26

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos | Entregable |
|---|-------|-------------|-------------|----------|------------|
| T1 | Tests herencia processMessage | S | - | tests/TDD/unit/test_herencia_hilos.js | Tests RED |
| T2 | Tests HEREDAR_DEL_HILO action-rules | S | - | tests/TDD/unit/test_action_rules.js | Tests RED |
| T3 | obtenerUltimoRegistroPorThread | S | T1 | src/gas/AdaptadorHojas.js | Funcion nueva |
| T4 | Herencia en processMessage | S | T1,T3 | src/gas/Main.js | Logica herencia |
| T5 | HEREDAR_DEL_HILO en action-rules | S | T2 | src/extension/action-rules.js | Tipo + validacion + default |
| T6 | Case HEREDAR_DEL_HILO en panel.js | S | T5 | src/extension/panel.js | Ejecucion regla |
| T7 | UI HEREDAR_DEL_HILO en config-rules-ui | S | T5 | src/extension/config-rules-ui.js | Params en modal |

---

## 3.2 Orden de Ejecucion

1. **T1 + T2** (paralelo): Escribir todos los tests primero (RED)
2. **T3**: Implementar obtenerUltimoRegistroPorThread (GREEN para T1 parcial)
3. **T4**: Herencia en processMessage (GREEN para T1 completo)
4. **T5**: HEREDAR_DEL_HILO en action-rules (GREEN para T2)
5. **T6 + T7** (paralelo): Case en panel.js + UI en config-rules-ui

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_herencia_hilos.js` (nuevo):
   - processMessage con threadId existente hereda fase/estado
   - processMessage sin threadId previo usa defaults
   - processMessage con alerta NO hereda estado (usa ALERTA)
   - processMessage hereda codCar cuando ThreadManager no lo tiene
   - obtenerUltimoRegistroPorThread retorna null si no hay datos
   - obtenerUltimoRegistroPorThread retorna el mas reciente por fecha

2. `test_action_rules.js` (ampliar):
   - TIPOS_ACCION_REGLA incluye HEREDAR_DEL_HILO (9 tipos)
   - NOMBRES_ACCION_REGLA tiene entrada para HEREDAR_DEL_HILO
   - validarRegla acepta HEREDAR_DEL_HILO
   - generarReglasDefault incluye regla herencia inactiva (8 reglas)
   - evaluarReglas con vinculacion=HILO retorna reglas

**Orden implementacion para hacerlos pasar (Green):**
1. AdaptadorHojas.js: +obtenerUltimoRegistroPorThread
2. Main.js: +logica herencia en processMessage
3. action-rules.js: +HEREDAR_DEL_HILO + regla default

---

## 3.4 Plan de Testing

- **Unit tests:** test_herencia_hilos.js (~10 tests), test_action_rules.js (+6 tests)
- **Integration tests:** No necesarios (logica pura)
- **Prueba manual:** Enviar correo a hilo clasificado, verificar en Kanban

---

## 3.5 Migracion de Datos

No necesaria. Los registros existentes no se modifican. La herencia solo aplica a correos nuevos procesados despues del cambio.

---

## 3.6 Definition of Done (DoD)

- [ ] CA-1.1: processMessage hereda fase/estado de hilo existente
- [ ] CA-1.2: Alerta prevalece sobre herencia de estado
- [ ] CA-1.3: Sin hilo previo, usa defaults
- [ ] CA-1.4: codCar de ThreadManager no se sobreescribe
- [ ] CA-2.1: Regla HEREDAR_DEL_HILO ejecuta herencia
- [ ] CA-2.2: Sin hermano, no modifica nada
- [ ] CA-2.3: validarRegla acepta HEREDAR_DEL_HILO
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del codigo nuevo
- [ ] Sin regresiones: 882+ tests pasando
- [ ] Nombres verificados en DICCIONARIO_DOMINIO.md
- [ ] Documentacion actualizada

---

## Puerta de Validacion 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (que tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable (cada item medible)

---

**Estado:** COMPLETADO
