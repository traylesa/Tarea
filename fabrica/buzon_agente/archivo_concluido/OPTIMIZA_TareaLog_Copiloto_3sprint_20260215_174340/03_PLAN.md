# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| 1 | Tests RED: CRUD recordatorios | M | - | tests/TDD/unit/test_reminders.js |
| 2 | Tests RED: snooze + presets | S | - | tests/TDD/unit/test_reminders.js |
| 3 | Tests RED: sugerencias por fase | S | - | tests/TDD/unit/test_reminders.js |
| 4 | Tests RED: evaluarPendientes | S | - | tests/TDD/unit/test_reminders.js |
| 5 | GREEN: reminders.js logica pura | M | 1-4 | src/extension/reminders.js |
| 6 | REFACTOR: limpiar reminders.js | S | 5 | src/extension/reminders.js |
| 7 | Integrar config.js defaults | S | 5 | src/extension/config.js |
| 8 | Integrar background.js alarma | S | 5 | src/extension/background.js |
| 9 | UI: modal + panel en panel.html/js | M | 5 | src/extension/panel.html, panel.js |
| 10 | Diccionario dominio | S | 5 | docs/DICCIONARIO_DOMINIO.md |

---

## 3.2 Orden de Ejecucion

1. Tareas 1-4 (tests RED) — paralelo
2. Tarea 5 (GREEN: implementar)
3. Tarea 6 (REFACTOR)
4. Tareas 7-10 (integracion) — paralelo

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `crearRecordatorio` — crea con id, texto, codCar, fechaDisparo, origen
2. `crearRecordatorio` — valida texto obligatorio
3. `crearRecordatorio` — valida limite 50
4. `obtenerActivos` — filtra solo pendientes (fechaDisparo futuro)
5. `obtenerActivos` — ordena por fechaDisparo ascendente
6. `eliminarRecordatorio` — elimina por id
7. `completarRecordatorio` — marca como completado
8. `aplicarSnooze` — incrementa snoozeCount, actualiza fechaDisparo
9. `aplicarSnooze` — presets: 15min, 1h, manana
10. `calcularFechaDisparo` — presets: 15min, 30min, 1h, 2h, 4h
11. `calcularFechaDisparo` — preset manana 9am
12. `evaluarPendientes` — detecta recordatorios vencidos
13. `evaluarPendientes` — ignora futuros
14. `evaluarPendientes` — retorna vacio si no hay
15. `generarSugerencia` — fase 19 genera "Verificar descarga"
16. `generarSugerencia` — fase 29 genera "Reclamar POD"
17. `generarSugerencia` — fase sin config retorna null
18. `generarSugerencia` — sugerencias desactivadas retorna null
19. `aceptarSugerencia` — crea recordatorio con origen='sugerido'

**Orden Green:** reminders.js implementa cada funcion en orden

---

## 3.4 Plan de Testing

- **Unit tests:** test_reminders.js (~25 tests)
  - CRUD: crear, obtener, eliminar, completar
  - Snooze: aplicar, presets
  - Pendientes: evaluar vencidos
  - Sugerencias: generar, aceptar, config
- **Regresion:** 70 tests existentes deben seguir pasando

---

## 3.5 Definition of Done (DoD)

- [ ] CA-7.1: crearRecordatorio genera id, texto, codCar, fechaDisparo
- [ ] CA-7.2: evaluarPendientes detecta recordatorios vencidos
- [ ] CA-7.3: aplicarSnooze actualiza fechaDisparo y snoozeCount
- [ ] CA-7.4: completarRecordatorio elimina del array
- [ ] CA-7.5: Alarma ALARM_RECORDATORIOS en background.js
- [ ] CA-7.6: Limite 50 recordatorios con error
- [ ] CA-7.7: obtenerActivos retorna lista ordenada
- [ ] CA-8.1: generarSugerencia para fases 19, 29
- [ ] CA-8.2: aceptarSugerencia crea recordatorio
- [ ] CA-8.3: generarSugerencia retorna null si desactivado
- [ ] CA-8.4: Config sugerencias en defaults
- [ ] Tests >= 25 nuevos pasando
- [ ] Cobertura >= 80% reminders.js
- [ ] 0 regresiones en 70 tests existentes
- [ ] Nombres en diccionario dominio

---

## Puerta de Validacion 3

- [x] Todas las tareas tienen complejidad y dependencia
- [x] Estrategia TDD definida (que tests primero)
- [x] DoD completo y verificable

**Estado:** COMPLETADO
