# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dep. | Archivos | Entregable |
|---|-------|-------------|------|----------|------------|
| 1 | dashboard.js — lógica pura KPIs + gráfico | M | - | src/extension/dashboard.js | Módulo exportable |
| 2 | test_dashboard.js — tests TDD | M | - | tests/TDD/unit/test_dashboard.js | ~15 tests |
| 3 | action-log.js — CRUD historial + rotación | M | - | src/extension/action-log.js | Módulo exportable |
| 4 | test_action_log.js — tests TDD | M | - | tests/TDD/unit/test_action_log.js | ~15 tests |
| 5 | sequences.js — CRUD secuencias + evaluación | M | - | src/extension/sequences.js | Módulo exportable |
| 6 | test_sequences.js — tests TDD | M | - | tests/TDD/unit/test_sequences.js | ~20 tests |
| 7 | shift-report.js — datos reporte turno | S | - | src/extension/shift-report.js | Módulo exportable |
| 8 | test_shift_report.js — tests TDD | S | - | tests/TDD/unit/test_shift_report.js | ~12 tests |
| 9 | config.js — defaults secuencias + reporte | S | - | src/extension/config.js | Auto-migración |
| 10 | panel.html — script tags nuevos módulos | S | 1,3,5,7 | src/extension/panel.html | 6 scripts añadidos |
| 11 | panel.js — integración UI (dashboard, action-bar, notes, historial) | L | 1,3,10 | src/extension/panel.js | Hooks UI |
| 12 | background.js — alarma secuencias + reporte | S | 5,7 | src/extension/background.js | 2 alarmas nuevas |

## 3.2 Orden de Ejecución

1. **Tests primero (Red):** T2 + T4 + T6 + T8 (en paralelo)
2. **Código mínimo (Green):** T1 + T3 + T5 + T7 (hacer pasar tests)
3. **Config:** T9 (defaults nuevos)
4. **Integración:** T10 (panel.html) → T11 (panel.js) → T12 (background.js)
5. **Refactor:** Revisar y simplificar

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_dashboard.js`: calcularKPIsTurno, calcularGraficoSemanal, calcularCargasPorGrupo
2. `test_action_log.js`: registrarAccion, obtenerHistorial, filtrarPorTipo, rotarHistorial
3. `test_sequences.js`: crearSecuencia, evaluarPasos, detenerSecuencia, cancelarSecuencia
4. `test_shift_report.js`: generarDatosReporte, calcularKPIsDia, formatearReporte

**Orden Green:**
1. dashboard.js → hacer pasar test_dashboard
2. action-log.js → hacer pasar test_action_log
3. sequences.js → hacer pasar test_sequences
4. shift-report.js → hacer pasar test_shift_report

## 3.4 Plan de Testing

- **Unit tests:** 4 suites nuevas (~62 tests) en tests/TDD/unit/
- **Integration tests:** No aplica (módulos puros sin dependencias cruzadas)
- **E2E tests:** No aplica (verificación manual cargando extensión)

## 3.5 Migración de Datos

- **Storage:** Nuevas keys (tarealog_historial, tarealog_secuencias) — no hay datos previos a migrar
- **Config:** Auto-migración en cargar() inyecta defaults si no existen
- **Rollback:** Eliminar keys de storage, quitar script tags

## 3.6 Definition of Done (DoD)

### Dashboard (HU-14)
- [ ] calcularKPIsTurno retorna cargas activas, alertas, recordatorios, cerradas
- [ ] calcularGraficoSemanal retorna array 7 días con conteos
- [ ] Sin datos retorna zeros

### Historial (HU-15)
- [ ] registrarAccion crea entrada con timestamp, tipo, descripción
- [ ] obtenerHistorial retorna ordenado DESC
- [ ] filtrarPorTipo filtra por email/fase/recordatorio/nota
- [ ] rotarHistorial elimina > 30 días

### Secuencias (HU-09)
- [ ] crearSecuencia crea 1-3 pasos con fechas escalonadas
- [ ] evaluarPasos detecta pasos pendientes que toca ejecutar
- [ ] detenerSecuencia marca pendientes como detenidos si hay respuesta
- [ ] Máximo 3 pasos validado

### Reporte (HU-10)
- [ ] generarDatosReporte calcula cargas gestionadas, incidencias, pendientes
- [ ] calcularKPIsDia retorna cerradas, emails, tiempoPromedio
- [ ] Sin actividad retorna zeros

### Integración UI S4
- [ ] action-bar.js y notes.js incluidos en panel.html
- [ ] Barra acciones visible al seleccionar fila con fase
- [ ] Icono notas visible en tabla

### General
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] 0 regresiones en 169 tests existentes
- [ ] Nombres verificados en DICCIONARIO_DOMINIO

---

## PUERTA DE VALIDACIÓN 3: ✅ SUPERADA

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (qué tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

**Estado:** COMPLETADO
