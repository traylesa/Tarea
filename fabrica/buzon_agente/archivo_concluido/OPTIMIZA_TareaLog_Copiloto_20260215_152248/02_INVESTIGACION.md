# 02 - INVESTIGACIÓN

**Fase:** Investigación del Codebase + Opciones Técnicas
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## 2.1 Mapa de Impacto

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/extension/alerts.js` | CREAR | Motor de reglas puro: evaluar R1-R6, deduplicar, niveles, badge |
| `src/extension/background.js` (142 líneas) | MODIFICAR | Integrar evaluación post-barrido, badge, notificaciones por nivel |
| `src/extension/config.js` (191 líneas) | MODIFICAR | Defaults de umbrales alertas en getDefaults() |
| `src/gas/Codigo.js` (441 líneas) | MODIFICAR | Endpoint getRegistros ya existe, enrichir procesarCorreos con registros |
| `tests/TDD/unit/test_alerts.js` | CREAR | Tests unitarios reglas evaluación |

**Líneas estimadas:** ~250 nuevas (alerts.js) + ~40 modificadas (background.js, config.js) + ~200 tests

### Hallazgo Crítico

`background.js` línea 119-136 llama `procesarCorreos` y espera `data.alertas` y `data.registros` en la respuesta. Sin embargo, `Codigo.js:accionProcesarCorreos()` (línea 88) solo retorna `{ok, procesados, errores}` — **NO retorna registros ni alertas**. Esto es un bug/desconexión existente. La solución: modificar procesarCorreos para que también retorne registros, o hacer un segundo fetch a getRegistros.

---

## 2.2 Patrones Existentes

### Patrón 1: Lógica pura dual-compatible (REUTILIZAR)

```javascript
// SLAChecker.js — patrón a seguir en alerts.js
function checkSLA(cargas, registros, umbralHoras = 2, ahora = new Date()) {
  if (!cargas || !Array.isArray(cargas)) return [];
  // ... lógica pura sin DOM ni Chrome API
}
if (typeof module !== 'undefined') module.exports = { checkSLA };
```

### Patrón 2: Configuración con merge de defaults (REUTILIZAR)

```javascript
// config.js línea 119-124
const config = {
  ...defaults,
  ...guardada,
  patrones: { ...defaults.patrones, ...(guardada.patrones || {}) },
};
```

### Patrón 3: Notificaciones Chrome en background.js (AMPLIAR)

```javascript
// background.js línea 124-131
chrome.notifications.create(`sla-${alerta.codCar}`, {
  type: 'basic', iconUrl: 'icons/icon128.png',
  title: 'URGENTE: Carga por vencer',
  message: `Carga ${alerta.codCar}...`,
  priority: 2
});
```

### Antipatrón a evitar

- **NO** agregar lógica de evaluación directamente en background.js. Mantener en módulo separado (alerts.js)
- **NO** evaluar en GAS (añade latencia, complejidad de deploy, duplica datos)

---

## 2.3 Análisis de Tests Existentes

- `test_sla_checker.js`: 9 tests del patrón que seguiremos. **No se romperá**
- `test_config.js`: 20+ tests de config.js. **Riesgo bajo** si solo añadimos defaults
- Todos los 67+ tests existentes: **Sin riesgo** ya que alerts.js es módulo nuevo independiente

---

## 2.4 Spike Técnico

### ¿Se puede evaluar alertas client-side con datos de registros?

Verificado: los registros en `chrome.storage.local.registros` contienen todos los campos necesarios:
- `estado` → para R1 (cargas sin orden), R2 (silencio)
- `fase` → para R3 (estancamiento), R4 (docs), R5 (incidencias)
- `fechaCorreo` → para cálculo de horas transcurridas
- `fCarga`, `hCarga` → para R1, R6 (proximidad a hora carga)
- `fEntrega` → para R4 (docs pendientes)
- `threadId`, `codCar` → para agrupación y deduplicación

**Resultado:** VIABLE. No necesitamos endpoint GAS adicional.

---

## 2.5 Opciones Evaluadas

### Opción A: Evaluación en GAS (endpoint getResumen)

- **Descripción:** Crear AlertEvaluator.js en GAS que evalúa reglas directamente en Sheets
- **Pros:** Acceso a todos los datos
- **Cons:** +1 llamada API por barrido, requiere clasp push+deploy, 6 min timeout GAS, no funciona offline
- **Complejidad:** L

### Opción B: Evaluación client-side (alerts.js puro)

- **Descripción:** alerts.js evalúa reglas sobre registros ya descargados en storage
- **Pros:** Sin llamadas extra, funciona con cache, testeable en Jest, iteración rápida
- **Cons:** Limitado a datos ya descargados (suficiente para Sprint 1)
- **Complejidad:** M

### Opción C: Híbrido (evaluación client + enriquecimiento GAS)

- **Descripción:** alerts.js evalúa client-side, GAS retorna datos enriquecidos en procesarCorreos
- **Pros:** Lo mejor de ambos mundos
- **Cons:** Más complejo, cambios en 2 capas
- **Complejidad:** L

## 2.6 Criterios de Decisión

| Criterio | Peso | Opción A | Opción B | Opción C |
|----------|------|----------|----------|----------|
| Simplicidad | ALTO | 2 | 5 | 3 |
| Testabilidad | ALTO | 2 | 5 | 4 |
| Sin deploy GAS | MEDIO | 1 | 5 | 3 |
| Datos disponibles | MEDIO | 5 | 4 | 5 |
| Funciona offline | BAJO | 1 | 5 | 3 |
| **TOTAL** | | 11 | **24** | 18 |

## 2.7 Decisión (ADR)

**Opción seleccionada:** B — Evaluación client-side (alerts.js puro)

**Justificación:**
1. Los registros en storage ya contienen todos los campos necesarios para las 6 reglas
2. Evaluación en < 100ms incluso con 500 registros (operaciones filtro/map simples)
3. Testeable 100% en Jest sin mocks de GAS
4. Sin necesidad de deploy GAS adicional
5. Funciona con datos cacheados si hay problema de red
6. Sigue el patrón existente de SLAChecker.js (lógica pura)

**Modificación menor a GAS:** Hacer que procesarCorreos retorne los registros actualizados (ya los tiene disponibles), solucionando el bug existente en background.js.

---

## Puerta de Validación 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con código real
- [x] Tests existentes analizados (0 riesgo de rotura)
- [x] Spike resuelto: evaluación client-side es viable
- [x] 3 opciones evaluadas con pros/cons
- [x] Decisión justificada (Opción B)
