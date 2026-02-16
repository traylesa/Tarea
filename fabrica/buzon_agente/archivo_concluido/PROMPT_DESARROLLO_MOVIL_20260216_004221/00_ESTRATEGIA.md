# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

**Que:** Crear una PWA (Progressive Web App) mobile-first para TareaLog que permita a los operadores de trafico de TRAYLESA gestionar cargas de transporte desde el movil.

**Por que:** Los operadores necesitan una herramienta movil para situaciones fuera de oficina (almacen, muelle, en movimiento). La extension Chrome solo funciona en escritorio. La app movil debe responder a la pregunta: "Hay algo urgente que atender?" en 3 segundos y resolver en 2 taps.

**Como:** PWA con Vanilla JS (sin framework) que consume el backend GAS existente. Reutiliza la logica pura ya testeada de la extension Chrome. Se sirve como archivos estaticos (GitHub Pages o similar).

---

## ALCANCE

### QUE SI

- PWA instalable (manifest + service worker)
- Vista unificada de cargas con cards y alertas inline
- Detalle de carga con emails, notas, historial
- Cambio de fase con acciones contextuales
- Respuesta a email con plantillas interpolables
- Alertas proactivas (5 reglas R2-R6) inline en cards
- Filtros rapidos (chips) + avanzados (bottom sheet)
- Seleccion multiple con acciones masivas
- Notas rapidas por carga
- Recordatorios con snooze y presets
- Envios programados (ver, cancelar)
- Resumen matutino automatico
- Dashboard KPIs del turno
- Secuencias follow-up predefinidas
- Historial de acciones y reporte turno
- Modo outdoor (alto contraste)
- Cache offline con IndexedDB
- Responsive: movil + tablet (split view)

### QUE NO

- No se modifica el backend GAS (consumir endpoints existentes)
- No se requiere autenticacion propia (GAS es publico)
- No se desarrolla para desktop (redirige a extension Chrome)
- No se crea backend nuevo ni servidor propio
- No se usan frameworks pesados (React, Vue, Angular)
- No se implementa chat en tiempo real ni WebSockets
- No se integra con sistemas externos adicionales al GAS

---

## CRITERIOS DE EXITO

1. **Tiempo de triaje:** Operador identifica cargas urgentes en < 3 segundos al abrir app
2. **Taps para resolver:** Maximo 2 taps para accion principal (cambiar fase, responder)
3. **Carga inicial:** < 2 segundos en 4G
4. **Pull-to-refresh:** < 5 segundos (procesarCorreos + getRegistros)
5. **Offline:** Muestra datos cacheados sin conexion
6. **Instalable:** Add to Home Screen funcional en Android/iOS
7. **Tests:** >= 80% cobertura en logica pura
8. **Accesibilidad:** Contraste 7:1 WCAG AAA, tap targets 48x48dp
9. **Feedback:** Triple (visual + haptico + toast) en cada accion

---

## STAKEHOLDERS

- **Operadores de trafico TRAYLESA:** Usuarios principales (20-40 cargas/dia)
- **Jefes de trafico:** Supervision operativa
- **Desarrollador:** Mantenimiento y evolucion

---

## RESTRICCIONES

- **Backend fijo:** Solo endpoints GAS existentes (no se pueden agregar)
- **Sin build step:** Vanilla JS, sin bundler (coherente con proyecto existente)
- **Rate limiting GAS:** Limite de ejecuciones, usar lotes y throttling
- **Patron script tags:** Coherente con extension Chrome (dual-compat)
- **Sin servidor propio:** Solo archivos estaticos
- **Entorno dificil:** Sol directo, guantes, una mano, ruido

---

## RIESGOS

| # | Riesgo | Probabilidad | Impacto | Mitigacion |
|---|--------|-------------|---------|------------|
| 1 | CORS con GAS | Baja | Alto | GAS permite CORS por defecto; verificar en spike |
| 2 | Rendimiento con muchos registros (500+) | Media | Alto | Paginacion virtual, cache IndexedDB, limitar lote a 50 |
| 3 | Service Worker en iOS limitado | Media | Medio | Degradacion elegante sin push notifications en iOS |
| 4 | GAS rate limiting | Media | Medio | Throttle 6s entre lotes, cooldown alertas, lotes de 50 |
| 5 | Tamano de datos en localStorage | Baja | Medio | Usar IndexedDB para registros (sin limite 5MB) |
| 6 | Offline sync conflicts | Baja | Bajo | Read-only offline; sync al reconectar, no escritura offline |
| 7 | Notificaciones push sin backend propio | Alta | Medio | Usar timers locales + Notification API (no push server) |

---

## ESTRATEGIA DE DESARROLLO

**Enfoque incremental en 4 fases de producto:**

1. **Fase 1 - Fundacion (MVP):** Vista cargas, detalle, cambio fase, responder email
2. **Fase 2 - Valor diferencial:** Alertas proactivas inline, notas, accion requerida
3. **Fase 3 - Optimizacion:** Filtros, plantillas avanzadas, seleccion multiple
4. **Fase 4 - Productividad:** Resumen matutino, recordatorios, programados, dashboard, secuencias

**Principio de reutilizacion:** 12 modulos de logica pura de la extension Chrome se reutilizan directamente (alerts.js, templates.js, filters.js, reminders.js, sequences.js, notes.js, action-bar.js, dashboard.js, action-log.js, shift-report.js, alert-summary.js, resilience.js).

---

## SALIDAS

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Criterios de exito medibles
- [x] Riesgos evaluados con mitigacion

## CHECKLIST

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados

---

## PUERTA DE VALIDACION 0

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Riesgos evaluados con mitigacion

**Estado:** COMPLETADO
