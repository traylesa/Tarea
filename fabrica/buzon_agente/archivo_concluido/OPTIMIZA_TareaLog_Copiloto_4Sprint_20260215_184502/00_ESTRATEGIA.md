# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502
**Camino:** PROYECTO_COMPLETO

---

## Objetivo

Implementar Sprint 4 de TareaLog Copiloto: **micro-acciones rapidas** que eliminan friccion operativa.

Transformar la interaccion del operador con las cargas de "buscar que hacer y navegar menus" a "1 click y listo", mediante:

1. **HU-11: Acciones Contextuales por Fase** — Barra de acciones dinamica que cambia segun la fase actual de la carga, ejecutando plantilla + cambio de fase en 1 click.
2. **HU-12: Notas Rapidas en Cargas** — Sistema de notas asociadas a codCar con historial cronologico, para capturar contexto de llamadas/WhatsApp sin salir de TareaLog.

**Por que ahora:** Los Sprints 1-3 resolvieron "que el sistema vigile por ti" (alertas, resumen, recordatorios). Sprint 4 resuelve "actuar rapido sin friccion" — el operador ya sabe QUE hacer, ahora necesita hacerlo en 1 click.

---

## Alcance

### QUE SI

- Modulo `action-bar.js`: mapa de acciones por grupo de fase, logica pura testeable
- Modulo `notes.js`: CRUD notas por codCar, logica pura testeable
- Tests TDD para ambos modulos (>= 80% cobertura)
- Integracion en panel.js/panel.html (action bar al seleccionar, icono nota por fila)
- Persistencia notas en chrome.storage.local
- Acciones configurables por fase

### QUE NO

- NO se implementa HU-09 (Secuencias follow-up) — Sprint 5
- NO se implementa HU-10 (Reporte fin turno) — Sprint 5
- NO se implementa HU-14 (Dashboard Mi Turno) — Sprint 5
- NO se implementa HU-15 (Historial acciones) — Sprint 5
- NO se modifica backend GAS — Sprint 4 es 100% cliente
- NO se implementa busqueda global en notas (CA-12.5) — evaluar en Sprint 5

---

## Criterios de Exito

| # | Criterio | Metrica |
|---|----------|---------|
| 1 | Tests nuevos pasan | 100% verde |
| 2 | Tests existentes no rotos | 112 tests verdes |
| 3 | Cobertura action-bar.js | >= 80% branches |
| 4 | Cobertura notes.js | >= 80% branches |
| 5 | Acciones correctas por fase | 6 grupos de fase cubiertos |
| 6 | CRUD notas funcional | crear, listar, eliminar |

---

## Restricciones

- Extension Chrome MV3 (service worker, no background persistente)
- Sin modules JS (scripts via `<script>` tags, orden importa)
- Dual-compat GAS/Node para tests Jest
- panel.js ya tiene ~1500 lineas — integracion minima

---

## Riesgos y Mitigacion

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| panel.js complejo, dificil integrar | MEDIA | MEDIO | Logica en modulos puros, panel solo hookea eventos |
| Conflicto con plantillas existentes | BAJA | BAJO | Acciones reutilizan plantillas, no crean nuevas |
| Storage saturado con notas | BAJA | BAJO | Limite 50 notas/carga con rotacion |
| Mapa acciones incompleto | MEDIA | BAJO | Configurable, facil de extender |

---

## Checklist

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Riesgos evaluados con mitigacion

---

**Estado:** COMPLETADO
