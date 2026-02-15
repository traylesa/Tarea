# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Camino:** PROYECTO_COMPLETO
**Estado:** COMPLETADO

---

## Objetivo

**Transformar TareaLog de herramienta pasiva (hay que ir a mirarla) a copiloto proactivo (avisa, recuerda y facilita)** para el operador de tráfico de TRAYLESA, reduciendo olvidos, eliminando cambios innecesarios de aplicación y dando visión instantánea del estado operativo.

### Por qué

El operador gestiona 30-80 cargas simultáneas con 6+ aplicaciones abiertas. TareaLog actual requiere que el operador abra la extensión y busque activamente los problemas. Cuando detecta un problema, a menudo ya ha pasado tiempo valioso. El sistema debe **vigilar por el operador** y avisarle proactivamente.

---

## Alcance

### QUÉ SÍ (Sprint 1 — Fundacional, implementación en este expediente)

| ID | Componente | Descripción |
|----|-----------|-------------|
| S1-1 | **alerts.js** | Motor de reglas de evaluación (R1-R6): SLA, silencio, estancamiento, docs, incidencias, cargas sin orden |
| S1-2 | **Endpoint getResumen** | GAS evalúa condiciones en Sheets y retorna resumen categorizado |
| S1-3 | **background.js ampliado** | Integrar evaluación post-barrido + notificaciones por nivel + badge dinámico |
| S1-4 | **config.js ampliado** | Configuración de umbrales y activaciones por regla |
| S1-5 | **Tests unitarios** | test_alerts.js con cobertura >= 80% |

### QUÉ SÍ (Sprints 2-5 — Documentados como roadmap futuro)

- Sprint 2: Ventana resumen (alert-summary.html/css/js) + resumen matutino
- Sprint 3: Recordatorios con snooze (reminders.js)
- Sprint 4: Acciones contextuales + notas (action-bar.js, notes.js)
- Sprint 5: Secuencias follow-up + dashboard + reporte EOD

### QUÉ NO

- No se modifica la tabla Tabulator existente en este sprint
- No se implementa historial de acciones (HU-15) en Sprint 1
- No se tocan plantillas ni respuesta masiva existentes
- No se implementa integración GPS ni WhatsApp
- No se crea app móvil ni PWA

---

## Criterios de Éxito

| # | Criterio | Métrica | Umbral |
|---|----------|---------|--------|
| CE-1 | Tests nuevos pasan | Jest green | 100% |
| CE-2 | Tests existentes intactos | 67+ tests previos | 0 rotos |
| CE-3 | Cobertura código nuevo | Jest --coverage | >= 80% |
| CE-4 | Módulos lógica pura | Sin dependencias DOM/Chrome | 100% |
| CE-5 | Dual-compatible | Node.js + GAS | Exports condicionales |
| CE-6 | Reglas evaluadas | R1-R6 implementadas | 6/6 |
| CE-7 | Badge dinámico | Color + conteo alertas | Funcional |
| CE-8 | Notificaciones Chrome | Por nivel (CRITICO/ALTO) | Funcional |

---

## Restricciones

- **Manifest V3**: Permisos ya declarados (alarms, notifications, storage). No se necesitan nuevos
- **Sin módulos ES**: Scripts via `<script>` tags, orden importa. Dual-compat con module.exports
- **Lógica pura**: Nuevos módulos sin DOM ni Chrome API directo (inyección de dependencias)
- **GAS limits**: 6 min ejecución máx, 100 fetch/día para UrlFetch, PropertiesService para config

---

## Riesgos y Mitigación

| # | Riesgo | Prob | Impacto | Mitigación |
|---|--------|------|---------|------------|
| R1 | panel.js (2145 líneas) crece más | ALTA | ALTO | Lógica nueva en alerts.js separado. Panel solo consume |
| R2 | background.js duplica llamadas con getResumen | MEDIA | MEDIO | Integrar en barrido existente, no llamada separada |
| R3 | chrome.storage.local tiene límite 10MB | BAJA | ALTO | Alertas efímeras, rotación max 100 |
| R4 | Datos de Sheets insuficientes para reglas | MEDIA | ALTO | Validar antes de evaluar. Sin datos = silencioso |
| R5 | Notificaciones Chrome molestas | ALTA | ALTO | Deduplicación por ID + cooldown configurable |

---

## Checklist Puerta de Validación

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Stakeholders identificados (operador tráfico TRAYLESA)
- [x] Restricciones técnicas/negocio claras
- [x] Riesgos principales evaluados con mitigación
