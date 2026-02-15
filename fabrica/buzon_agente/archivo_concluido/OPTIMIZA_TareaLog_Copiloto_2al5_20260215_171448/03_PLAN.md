# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dep. | Archivos | Entregable |
|---|-------|-------------|------|----------|------------|
| T1 | Tests logica pura (RED) | M | - | `tests/TDD/unit/test_alert_summary.js` | 20+ tests que fallan |
| T2 | Implementar logica pura (GREEN) | M | T1 | `src/extension/alert-summary.js` | Tests pasan, funciones puras |
| T3 | Config defaults + auto-migracion | S | - | `src/extension/config.js` | resumenMatutino en getDefaults() |
| T4 | HTML + CSS ventana resumen | M | - | `src/extension/alert-summary.html`, `alert-summary.css` | Ventana standalone |
| T5 | UI ventana resumen (render + handlers) | M | T2,T4 | `src/extension/alert-summary.js` (parte UI) | Ventana renderiza alertas |
| T6 | Integracion background.js | M | T2,T3 | `src/extension/background.js` | Alarma matutina + listeners |
| T7 | Integracion panel.js + panel.html | S | T6 | `src/extension/panel.js`, `panel.html` | Boton Resumen + filtro pendiente |
| T8 | Config UI (checkbox + hora) | S | T3 | `src/extension/config-ui.js`, `panel.html` | Seccion matutino en Config |
| T9 | Refactor + validacion final | S | T1-T8 | Todos | Tests verdes, cobertura OK |

---

## 3.2 Orden de Ejecucion

```
T1 (tests RED) ──→ T2 (logica GREEN) ──→ T5 (UI ventana) ──→ T9 (validacion)
T3 (config) ────────────────────────────→ T6 (background) ──→ T7 (panel)
T4 (HTML/CSS) ──────────────────────────→ T5 (UI ventana)
T3 (config) ────────────────────────────→ T8 (config-ui)
```

Paralelismos: T1 || T3 || T4 pueden ejecutarse en paralelo.

---

## 3.3 Estrategia TDD

### Tests a escribir PRIMERO (Red):

**Archivo:** `tests/TDD/unit/test_alert_summary.js`

1. `categorizarAlertas` (5 tests):
   - Alertas vacias retorna objeto con arrays vacios
   - Agrupa R5/R6 en urgente
   - Agrupa R2 en sinRespuesta
   - Agrupa R4 en documentacion
   - Agrupa R3 en estancadas

2. `calcularKPIs` (5 tests):
   - Registros vacios retorna KPIs en 0
   - Cuenta cargas activas (registros unicos por codCar)
   - Cuenta alertas totales
   - Cuenta sin respuesta (alertas R2)
   - Cuenta sin docs (alertas R4)

3. `debeMostrarMatutino` (5 tests):
   - Sin flag en storage retorna true
   - Flag de hoy retorna false
   - Flag de ayer retorna true
   - Flag pospuesto (hora futura) retorna false
   - Config desactivado retorna false

4. `crearFlagMostrado` (2 tests):
   - Crea flag con fecha de hoy
   - Crea flag pospuesto con hora futura

5. `filtroParaCategoria` (4 tests):
   - Categoria urgente genera filtros correctos
   - Categoria sinRespuesta genera filtro estado=ENVIADO
   - Categoria documentacion genera filtro fase=29
   - Categoria estancadas genera filtros por fase

### Orden implementacion (Green):

1. `categorizarAlertas(alertas)` — clasificar por regla
2. `calcularKPIs(registros, alertas)` — metricas agregadas
3. `debeMostrarMatutino(flag, config, ahora)` — logica flag diario
4. `crearFlagMostrado(ahora, posponerMinutos)` — crear/actualizar flag
5. `filtroParaCategoria(categoria, alertas)` — generar filtros Tabulator

---

## 3.4 Plan de Testing

- **Unit tests:** 21 tests en `tests/TDD/unit/test_alert_summary.js` cubriendo 5 funciones puras
- **E2E manual:** Verificar flujo matutino, bajo demanda, click-through, posponer
- **Regresion:** Ejecutar `npx jest tests/TDD/unit/test_alerts.js` para confirmar 42 tests previos siguen verdes

---

## 3.5 Definition of Done (DoD)

- [ ] CA-1.1: Ventana resumen se abre automaticamente al primer barrido tras hora configurada
- [ ] CA-1.2: No se repite el mismo dia (flag con fecha)
- [ ] CA-1.3: No se abre si config desactivado
- [ ] CA-1.4: Posponer cierra ventana y reprograma
- [ ] CA-1.5: Click en categoria abre panel con filtro aplicado
- [ ] CA-1.6: No se abre si no hay alertas
- [ ] CA-13.1: Boton "Resumen" en panel abre ventana
- [ ] CA-13.2: Sin alertas muestra mensaje vacio con KPIs en 0
- [ ] CA-13.3: Carga < 3 segundos
- [ ] Tests TDD: 20+ tests escritos y pasando
- [ ] Cobertura >= 80% branches en alert-summary.js (logica pura)
- [ ] 0 tests existentes rotos (42 alerts.js + otros)
- [ ] Nombres verificados en diccionario de dominio

---

## Puerta de Validacion 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (21 tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

**Estado:** COMPLETADO
