# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208
**Camino:** PROYECTO_COMPLETO

---

## Objetivo

Completar TareaLog Copiloto implementando las 5 HUs restantes (HU-09, HU-10, HU-14, HU-15 + integración UI Sprint 4) para cerrar el ciclo operativo: desde la recepción de un correo hasta el cierre documentado de la carga con historial auditable.

**Por qué:** Los Sprints 1-4 cubrieron alertas, recordatorios, acciones contextuales y notas. Falta automatización de seguimiento (secuencias), visibilidad global (dashboard), trazabilidad (historial) y cierre de turno (reporte). Sin esto, el operador sigue dependiendo de tareas manuales repetitivas.

---

## Criterios de Éxito

| Criterio | Métrica | Umbral |
|----------|---------|--------|
| Tests nuevos pasan | npx jest | 100% green |
| Tests existentes no rotos | 169 tests previos | 0 regresiones |
| Cobertura código nuevo | Jest --coverage | >= 80% branches |
| Módulos lógica pura | Archivos nuevos sin DOM | 4 de 4 |
| Integración UI S4 | action-bar + notes en panel | Funcional |

---

## Alcance

### QUÉ SÍ

1. **HU-14: Dashboard "Mi Turno"** — KPIs, mini-gráfico semanal, botón "Empezar gestión" (PRIORIDAD 1)
2. **HU-15: Historial de acciones** — Cronología por carga, filtro por tipo, rotación 30 días (PRIORIDAD 1)
3. **Integración UI Sprint 4** — action-bar.js + notes.js en panel.js/panel.html (PRIORIDAD 1)
4. **HU-09: Secuencias follow-up** — Pasos programados, detención auto, predefinidas (PRIORIDAD 2)
5. **HU-10: Reporte fin de turno** — KPIs día, ventana resumen reutilizada (PRIORIDAD 2)

### QUÉ NO

- Cambios en backend GAS (Codigo.js) — HU-09 usa envíos programados existentes
- Gráficos con librerías externas — mini-gráfico con CSS/HTML puro
- Persistencia servidor para historial — solo chrome.storage.local
- Tests E2E con Puppeteer — solo tests unitarios Jest

---

## Restricciones

- panel.js ya tiene 2,287 líneas — integraciones mínimas delegando a módulos puros
- Patrón dual-compat obligatorio (`module.exports` condicional)
- Storage keys únicas por módulo (registradas en DICCIONARIO_DOMINIO)
- No se crean endpoints GAS nuevos

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| panel.js crece excesivamente | ALTA | MEDIO | Hooks mínimos a módulos puros |
| HU-09 requiere cambios GAS | MEDIA | ALTO | Reutilizar tabla `programados` existente |
| Conflictos storage entre módulos | BAJA | MEDIO | Storage keys documentadas en diccionario |
| Mini-gráfico CSS complejo | BAJA | BAJO | Barras simples con divs |

---

## Estrategia Técnica

Seguir patrón consolidado de 4 sprints:
1. Módulo lógica pura (xxx.js) — sin DOM, sin Chrome API
2. Tests TDD — Red-Green-Refactor estricto
3. Integración panel.js — hooks mínimos
4. Config.js — defaults + auto-migración
5. Dual-compat — `module.exports` condicional

## Priorización

**Núcleo primero:** Integración UI S4 + HU-14 (dashboard) + HU-15 (historial)
**Secundario después:** HU-09 (secuencias) + HU-10 (reporte)

---

## Checklist

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Stakeholders identificados (operador logístico)
- [x] Restricciones técnicas/negocio claras
- [x] Riesgos principales evaluados

---

### PUERTA DE VALIDACIÓN 0: ✅ SUPERADA

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Riesgos evaluados con mitigación

**Estado:** COMPLETADO
