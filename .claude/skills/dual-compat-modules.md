# Skill: Modulos Dual-Compatible GAS/Node

**Proposito**: Patron para escribir modulos de logica pura que funcionan tanto en Google Apps Script (sin module system) como en Node.js (para tests Jest).

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

TareaLog tiene **878 tests Jest (38 suites)** que prueban logica pura. El reto: GAS no tiene `require/import`, y Jest necesita `module.exports`. La solucion es el patron dual-compat usado en TODOS los modulos de logica pura.

### Archivos que Usan Este Patron (22 modulos)

| Archivo Extension | Test Jest |
|---|---|
| `constants.js` | `test_constants.js` |
| `date-utils.js` | `test_date_utils.js` |
| `config.js` | `test_config.js` |
| `filters.js` | `test_filters.js` |
| `templates.js` | `test_templates.js` |
| `bulk-reply.js` | `test_bulk_reply.js` |
| `fases-config.js` | `test_fases_config.js` |
| `estados-config.js` | `test_estados_config.js` |
| `scheduled.js` | `test_scheduled.js` |
| `alerts.js` | `test_alerts.js` |
| `alert-summary.js` | `test_alert_summary.js` |
| `gas-services.js` | `test_gas_services.js` |
| `thread-grouping.js` | `test_thread_grouping.js` |
| `reminders.js` | `test_reminders.js` |
| `sequences.js` | `test_sequences.js` |
| `notes.js` | `test_notes.js` |
| `action-bar.js` | `test_action_bar.js` |
| `action-log.js` | `test_action_log.js` |
| `action-rules.js` | `test_action_rules.js` |
| `dashboard.js` | `test_dashboard.js` |
| `shift-report.js` | `test_shift_report.js` |
| `resilience.js` | `test_resilience.js` |
| `kanban.js` | `test_kanban.js` |

---

## Patron Obligatorio

### Estructura del Modulo

```javascript
// === TareaLog — NombreModulo (logica pura) ===

var MI_CONSTANTE = 'valor';

function miFuncion(param) {
  return param + 1;
}

function otraFuncion(datos) {
  return datos.filter(function(d) { return d.activo; });
}

// DUAL-COMPAT: Export condicional al final del archivo
if (typeof module !== 'undefined') {
  module.exports = {
    MI_CONSTANTE: MI_CONSTANTE,
    miFuncion: miFuncion,
    otraFuncion: otraFuncion
  };
}
```

### Estructura del Test

```javascript
// tests/TDD/unit/test_mi_modulo.js
const { miFuncion, otraFuncion } = require('../../../src/extension/mi-modulo.js');

describe('miFuncion', () => {
  test('caso basico', () => {
    expect(miFuncion(1)).toBe(2);
  });
});
```

---

## Reglas Inquebrantables

### 1. SOLO logica pura

```javascript
// MAL — accede al DOM
function obtenerValor() {
  return document.getElementById('campo').value;
}

// BIEN — recibe datos, retorna resultado
function calcular(valor) {
  return valor * 2;
}
```

### 2. Usar `var` y `function` (no `const`/`let`/arrow en scope global)

GAS ejecuta en scope global. `const` en scope global puede causar problemas de hoisting.

```javascript
// BIEN para dual-compat
var ESTADOS = { PENDIENTE: 'PENDIENTE', ENVIADO: 'ENVIADO' };

function formatear(estado) {
  return ESTADOS[estado] || 'Desconocido';
}
```

### 3. Export TODAS las funciones publicas

```javascript
if (typeof module !== 'undefined') {
  module.exports = {
    funcionPublica: funcionPublica,
    _helper: _helper  // Exportar helpers tambien para tests
  };
}
```

### 4. Sin dependencias externas

Los modulos no pueden hacer `require()` entre si (GAS no lo soporta). Cada modulo es independiente. En browser, dependen del orden de script tags.

---

## Consideraciones para Agentes

1. **Nuevo modulo**: Crear en `src/extension/`, anadir `<script>` en `panel.html` ANTES de `panel.js`
2. **Nuevo test**: Crear en `tests/TDD/unit/test_nombre.js`, usar `require('../../../src/extension/nombre.js')`
3. **Ejecutar tests**: `npx jest` o `npx jest tests/TDD/unit/test_nombre.js`
4. **NUNCA** poner logica de DOM en modulos dual-compat
5. **SIEMPRE** terminar con el bloque `if (typeof module !== 'undefined')`
6. **Sincronizar PWA**: Copiar modulo a `src/movil/lib/` + actualizar `CACHE_URLS` en `sw.js`

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Orden de scripts en panel.html | `chrome-extension-mv3.md` |
| Sincronizar modulos a PWA | `pwa-mobile-development.md` (18 copias en lib/) |
| Crear tests TDD | `CLAUDE.md` (global) §TDD |
| Nombres de campos | `docs/DICCIONARIO_DOMINIO.md` |

---

## Tests

```bash
npx jest --no-coverage                    # Todos (878 tests, 38 suites)
npx jest tests/TDD/unit/test_nombre.js   # Individual
```

---

**Actualizada**: 2026-02-25 (v1.2.0: 878 tests/38 suites, +kanban.js en lista)
