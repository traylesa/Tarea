# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos | Entregable |
|---|-------|-------------|-------------|----------|------------|
| T1 | Escribir tests unitarios alerts.js | M | - | `tests/TDD/unit/test_alerts.js` | Tests RED |
| T2 | Implementar alerts.js (motor reglas) | M | T1 | `src/extension/alerts.js` | Tests GREEN |
| T3 | Ampliar config.js con defaults alertas | S | - | `src/extension/config.js` | Defaults alertas |
| T4 | Corregir procesarCorreos para retornar registros | S | - | `src/gas/Codigo.js` | Endpoint corregido |
| T5 | Integrar alerts en background.js | M | T2, T3, T4 | `src/extension/background.js` | Badge + notificaciones |
| T6 | Actualizar diccionario dominio | S | T2 | `docs/DICCIONARIO_DOMINIO.md` | Nuevos términos |
| T7 | Refactorizar y limpiar | S | T5 | Todos | Código limpio |

## 3.2 Orden de Ejecución

```
T1 (tests RED) ──→ T2 (alerts.js GREEN) ──→ T7 (refactor)
T3 (config defaults) ──┐                          │
T4 (GAS fix) ──────────┤                          │
                        └──→ T5 (background.js) ──┘
T6 (diccionario) — en paralelo con T5
```

## 3.3 Estrategia TDD

### Tests a escribir PRIMERO (Red)

Archivo: `tests/TDD/unit/test_alerts.js`

1. `test_evaluarAlertas_retorna_array_vacio_sin_registros` — entrada vacía
2. `test_R1_cargaHoySinOrden_genera_alerta_critico` — fCarga=HOY, sin ENVIADO, < 2h
3. `test_R1_cargaHoyConOrden_no_genera_alerta` — fCarga=HOY, con ENVIADO
4. `test_R1_cargaHoySinDatos_no_genera_alerta` — sin fCarga
5. `test_R2_silencioTransportista_genera_alerta_alto` — ENVIADO > 4h sin RECIBIDO
6. `test_R2_conRespuesta_no_genera_alerta` — ENVIADO + RECIBIDO en mismo thread
7. `test_R3_faseEstancada_genera_alerta_medio` — fase > tiempoMax
8. `test_R3_faseEstancada_genera_alerta_alto_si_doble` — fase > 2x tiempoMax
9. `test_R4_docsPendientes_genera_alerta` — fase=29, > umbralDias
10. `test_R5_incidencia_genera_alerta_critico` — fase=05 o 25
11. `test_R5_multiples_incidencias_agrupa` — 3x fase=05 → 1 alerta agrupada
12. `test_R6_cargaHoySinOrdenUrgente_critico` — fCarga HOY < 3h
13. `test_deduplicacion_mismaAlerta_no_repite` — cooldown funciona
14. `test_calcularNivelBadge_rojo_si_critico` — badge color
15. `test_calcularNivelBadge_vacio_si_sin_alertas` — badge vacío

### Orden de implementación (Green)

1. `alerts.js`: `evaluarAlertas(registros, config, alertasPrevias, ahora)`
2. `alerts.js`: Reglas individuales R1-R6 como funciones internas
3. `alerts.js`: `deduplicar(alertasNuevas, alertasPrevias, cooldownMs)`
4. `alerts.js`: `calcularBadge(alertas)`
5. `alerts.js`: `generarNotificaciones(alertasNuevas)`

### Refactorizaciones (Refactor)

- Extraer constantes de niveles y colores
- Simplificar condiciones de reglas con early returns

## 3.4 Plan de Testing

- **Unit tests**: `test_alerts.js` — 15+ tests cubriendo 6 reglas + deduplicación + badge
- **Regresión**: Ejecutar `npx jest` completo (67+ tests existentes + nuevos)
- **Manual**: Cargar extensión, verificar badge y notificaciones con datos reales

## 3.5 Migración de Datos

- No aplica. alerts.js trabaja con datos existentes en storage
- **Rollback**: Revertir cambios en background.js (desactivar evaluación)

## 3.6 Definition of Done (DoD)

- [ ] T1: Tests escritos y fallando (RED)
- [ ] T2: alerts.js implementado, tests pasando (GREEN)
- [ ] T3: config.js tiene defaults de umbrales alertas
- [ ] T4: procesarCorreos retorna registros
- [ ] T5: background.js integra evaluación + badge + notificaciones
- [ ] T6: Diccionario actualizado con términos nuevos
- [ ] T7: Código refactorizado y limpio
- [ ] Todos los 67+ tests existentes siguen pasando
- [ ] Tests nuevos >= 15, cobertura alerts.js >= 80%
- [ ] Sin dependencias DOM ni Chrome API en alerts.js

---

## Puerta de Validación 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable
