# Skill: Modulos Dual-Compatible GAS/Node

**Proposito**: Patron para escribir modulos de logica pura que funcionan tanto en Google Apps Script (sin module system) como en Node.js (para tests Jest).

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-15

---

## Contexto del Proyecto

TareaLog tiene 67+ tests Jest que prueban logica pura. El reto: GAS no tiene `require/import`, y Jest necesita `module.exports`. La solucion es el patron dual-compat usado en TODOS los modulos de logica pura.

### Archivos que Usan Este Patron

| Archivo Extension | Test Jest |
|---|---|
| `filters.js` | `test_filters.js` |
| `templates.js` | `test_templates.js` |
| `bulk-reply.js` | `test_bulk_reply.js` |
| `fases-config.js` | `test_fases_config.js` |
| `scheduled.js` | `test_scheduled.js` |
| `alerts.js` | `test_alerts.js` |
| `gas-services.js` | `test_gas_services.js` |
| `thread-grouping.js` | `test_thread_grouping.js` |

---

## Patron Obligatorio

### Estructura del Modulo

```javascript
// === TareaLog — NombreModulo (logica pura) ===

// Variables/constantes del modulo
var MI_CONSTANTE = 'valor';

// Funciones puras (sin DOM, sin Chrome API, sin GAS API)
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

// OK dentro de funciones
function procesarLista(lista) {
  var resultado = [];
  lista.forEach(function(item) {
    resultado.push(item.nombre);
  });
  return resultado;
}
```

### 3. Export TODAS las funciones publicas

```javascript
// MAL — funcion oculta para tests
function _helper(x) { return x; }

// BIEN si es publica (testeable)
if (typeof module !== 'undefined') {
  module.exports = {
    funcionPublica: funcionPublica,
    _helper: _helper  // Exportar helpers tambien para tests
  };
}
```

### 4. Sin dependencias externas

Los modulos no pueden hacer `require()` entre si (GAS no lo soporta). Cada modulo es independiente.

---

## Ejemplo Completo: scheduled.js

```javascript
var ESTADOS_PROGRAMADO = {
  PENDIENTE:  { icono: '\u23F3', clase: 'prog-pendiente',  texto: 'Pendiente' },
  ENVIADO:    { icono: '\u2705', clase: 'prog-enviado',    texto: 'Enviado' },
  ERROR:      { icono: '\u274C', clase: 'prog-error',      texto: 'Error' },
  CANCELADO:  { icono: '\u26D4', clase: 'prog-cancelado',  texto: 'Cancelado' }
};

function formatearEstadoProgramado(estado) {
  var info = ESTADOS_PROGRAMADO[estado] || { icono: '?', clase: '', texto: estado };
  return { icono: info.icono, clase: info.clase, texto: info.texto };
}

function filtrarProgramados(lista, filtro) {
  if (!filtro || filtro === 'TODOS') return lista;
  return lista.filter(function(p) { return p.estado === filtro; });
}

if (typeof module !== 'undefined') {
  module.exports = {
    ESTADOS_PROGRAMADO: ESTADOS_PROGRAMADO,
    formatearEstadoProgramado: formatearEstadoProgramado,
    filtrarProgramados: filtrarProgramados
  };
}
```

---

## Consideraciones para Agentes

1. **Nuevo modulo**: Crear en `src/extension/`, anadir `<script>` en `panel.html` ANTES de `panel.js`
2. **Nuevo test**: Crear en `tests/TDD/unit/test_nombre.js`, usar `require('../../../src/extension/nombre.js')`
3. **Ejecutar tests**: `npx jest` o `npx jest tests/TDD/unit/test_nombre.js`
4. **NUNCA** poner logica de DOM en modulos dual-compat
5. **SIEMPRE** terminar con el bloque `if (typeof module !== 'undefined')`

---

## Referencias

- **Tests existentes**: `tests/TDD/unit/` (67+ tests)
- **Documentacion TDD**: `CLAUDE.md` (global) §TDD
- **Package.json**: Configuracion Jest

---

**Generada por /genera-skills**
