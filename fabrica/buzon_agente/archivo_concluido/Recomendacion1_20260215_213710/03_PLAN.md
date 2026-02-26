# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dep. | Archivos afectados | Entregable |
|---|-------|-------------|------|-------------------|------------|
| T1 | Agregar defaults robustez en config.js | S | - | `src/extension/config.js` | 3 nuevos defaults |
| T2 | Crear modulo resilience.js (logica pura) | M | T1 | `src/extension/resilience.js` | fetchConTimeout, dividirEnTandas, persistirConRetry |
| T3 | Tests resilience.js | M | T2 | `tests/TDD/unit/test_resilience.js` | 20+ tests |
| T4 | Integrar timeout en background.js | S | T2 | `src/extension/background.js` | AbortController + guard |
| T5 | Agregar limite lote en AdaptadorGmail.js | S | T1 | `src/gas/AdaptadorGmail.js` | Parametro limite |
| T6 | Agregar hayMas en Codigo.js | S | T5 | `src/gas/Codigo.js` | Campo hayMas en respuesta |
| T7 | Feedback guardado en panel.js | M | T2 | `src/extension/panel.js`, `src/extension/panel.css` | Toast + retry + borde rojo |
| T8 | Envio masivo por tandas en panel.js | M | T2 | `src/extension/panel.js` | Division + progreso |
| T9 | Tests integracion lote GAS | S | T5,T6 | `tests/TDD/unit/test_resilience.js` | Tests lote |
| T10 | Agregar help-content.js (tab Ayuda) | S | T7,T8 | `src/extension/help-content.js` | Seccion robustez |

---

## 3.2 Orden de Ejecucion

```
T1 (config defaults)
  └→ T2 (resilience.js logica pura)
       ├→ T3 (tests resilience.js) ← TDD: PRIMERO
       ├→ T4 (integrar en background.js)
       ├→ T7 (feedback guardado panel.js)
       └→ T8 (tandas envio masivo panel.js)
  └→ T5 (limite AdaptadorGmail.js)
       └→ T6 (hayMas Codigo.js)
            └→ T9 (tests lote GAS)
T10 (help-content) ← al final
```

**Paralelismos:** T3 + T4 + T7 + T8 pueden ejecutarse en paralelo tras T2.

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

| # | Test | Archivo | Que valida |
|---|------|---------|------------|
| 1 | `test_fetchConTimeout_cancela_tras_limite` | test_resilience.js | AbortController cancela fetch |
| 2 | `test_fetchConTimeout_respeta_respuesta_rapida` | test_resilience.js | Respuesta normal no se cancela |
| 3 | `test_dividirEnTandas_divide_correctamente` | test_resilience.js | 30 items / 15 = 2 tandas |
| 4 | `test_dividirEnTandas_una_tanda_si_menor` | test_resilience.js | 10 items = 1 tanda |
| 5 | `test_dividirEnTandas_vacio` | test_resilience.js | 0 items = 0 tandas |
| 6 | `test_persistirConRetry_exito_primer_intento` | test_resilience.js | No reintenta si OK |
| 7 | `test_persistirConRetry_exito_segundo_intento` | test_resilience.js | Reintenta 1 vez |
| 8 | `test_persistirConRetry_fallo_ambos` | test_resilience.js | Retorna error tras 2 intentos |
| 9 | `test_limitarMensajes_corta_a_limite` | test_resilience.js | 120 msgs → 50 |
| 10 | `test_limitarMensajes_no_corta_si_menor` | test_resilience.js | 30 msgs → 30 |
| 11 | `test_limitarMensajes_retorna_hayMas` | test_resilience.js | hayMas: true/false |

**Orden de implementacion para hacerlos pasar (Green):**
1. `resilience.js` — funciones puras: dividirEnTandas, limitarMensajes, crearPersistenciaConRetry
2. `config.js` — agregar defaults
3. `background.js` — integrar fetchConTimeout
4. `panel.js` — integrar persistirConRetry y tandas

---

## 3.4 Plan de Testing

- **Unit tests:** `tests/TDD/unit/test_resilience.js` — 15+ tests para logica pura
- **Integration:** Verificar que 368+ tests existentes siguen pasando
- **Manual:** Probar extension en Chrome con servidor GAS real

---

## 3.5 Estrategia de Migracion

No aplica. Son cambios aditivos sin migracion de datos.

**Rollback:** Revertir commit. No hay cambios de schema ni storage.

---

## 3.6 Definition of Done (DoD)

- [ ] CA-1.1: fetch cancela tras 300s (test)
- [ ] CA-1.2: guard impide barridos superpuestos (test)
- [ ] CA-1.3: flag se limpia tras timeout (test)
- [ ] CA-2.1: procesa max 50 mensajes (test)
- [ ] CA-2.2: hayMas=false si < limite (test)
- [ ] CA-2.3: background reacciona a hayMas (integracion)
- [ ] CA-3.1: toast rojo si servidor falla (test)
- [ ] CA-3.2: retry automatico funciona (test)
- [ ] CA-3.3: borde rojo en celda fallida (test)
- [ ] CA-4.1: divide en tandas de 15 (test)
- [ ] CA-4.2: reporta exitos/fallos por tanda (test)
- [ ] CA-4.3: 1 tanda si < limite (test)
- [ ] Tests nuevos >= 15
- [ ] Cobertura >= 80% codigo nuevo
- [ ] Cero regresiones (368+ tests existentes)
- [ ] Nombres verificados en DICCIONARIO_DOMINIO.md

---

## >>> PUERTA DE VALIDACION 3 <<<

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (tests primero, 11 tests listados)
- [x] Plan de testing completo (unit + integracion + manual)
- [x] DoD completo y verificable (16 items medibles)

---

**Estado:** COMPLETADO
