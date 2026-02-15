# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448
**Camino:** PROYECTO_COMPLETO

---

## Objetivo

Implementar el Sprint 2 de TareaLog: **Ventana de Resumen de Alertas** (HU-01 + HU-13), transformando las alertas proactivas ya evaluadas por alerts.js en una vista consolidada para el operador de trafico.

**Por que:** El Sprint 1 implemento el motor de reglas (R2-R6) con 42 tests y notificaciones Chrome individuales, pero el operador carece de una vista unificada que agrupe alertas por categoria, muestre KPIs y permita navegar directamente a los registros relevantes. El operador necesita pasar de "me llegan avisos sueltos" a "veo todo de un vistazo al empezar el turno".

---

## Alcance

### QUE SI (Sprint 2)

1. **alert-summary.js** — Logica pura: categorizacion de alertas, calculo de KPIs, control flag matutino, generacion de filtros Tabulator por categoria
2. **alert-summary.html + alert-summary.css** — Ventana standalone popup con tarjetas por categoria y badges KPI
3. **Integracion background.js** — Alarma matutina, listeners ABRIR_RESUMEN y ABRIR_PANEL_FILTRADO, click-through a panel
4. **Integracion panel.js + panel.html** — Boton "Resumen", lectura de filtro pendiente al cargar
5. **config.js** — Defaults `resumenMatutino: {activado, hora}` + auto-migracion
6. **config-ui.js** — Checkbox + input hora para resumen matutino en tab Config
7. **Tests Jest** — 20+ tests para logica pura (>80% cobertura branches)

### QUE NO (Fuera de Sprint 2)

- HU-07/08: Recordatorios con snooze (Sprint 3)
- HU-11/12: Acciones contextuales + notas (Sprint 4)
- HU-09/10: Secuencias follow-up + dashboard (Sprint 5)
- Cambios en backend GAS
- Nuevos endpoints GAS
- Modificacion de alerts.js existente (las 5 reglas ya funcionan)

---

## Criterios de Exito

| # | Criterio | Metrica |
|---|----------|---------|
| 1 | Tests nuevos pasan | 20+ tests, 0 fallos |
| 2 | Tests existentes no rotos | 42 tests alerts.js siguen pasando |
| 3 | Cobertura logica pura | >= 80% branches en alert-summary.js |
| 4 | Ventana resumen funcional | Abre con categorias y KPIs desde boton panel |
| 5 | Click-through operativo | Click en categoria abre panel con filtro aplicado |
| 6 | Resumen matutino automatico | Se abre 1 vez/dia al inicio de turno, no se repite |
| 7 | Config persistente | Activar/desactivar y hora se guardan y cargan |

---

## Restricciones

- **Manifest V3**: Service worker, no background page persistente
- **Sin modules**: Scripts via `<script>` tags, orden importa
- **Dual-compat**: `module.exports` para Jest + global para Chrome
- **chrome.storage.local**: Unico mecanismo de persistencia en extension
- **Extension_pages CSP**: `script-src 'self'` — no inline scripts

---

## Riesgos y Mitigacion

| Riesgo | Prob. | Impacto | Mitigacion |
|--------|-------|---------|------------|
| Service worker no puede abrir ventanas popup | Baja | Alto | chrome.windows.create ya funciona en background.js (precedente: abrirOEnfocarVentana) |
| alert-summary.html no tiene acceso a chrome.storage | Baja | Medio | Es extension_page, tiene acceso completo a Chrome APIs |
| Flag matutino se pierde al cerrar navegador | Baja | Bajo | Se almacena en chrome.storage.local (persistente) |
| Conflicto importScripts en background.js | Media | Medio | alert-summary.js solo se usa en ventana standalone, background.js solo necesita listeners de mensajes |

---

## Checklist Puerta de Validacion

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Riesgos evaluados con mitigacion

**Estado:** COMPLETADO
