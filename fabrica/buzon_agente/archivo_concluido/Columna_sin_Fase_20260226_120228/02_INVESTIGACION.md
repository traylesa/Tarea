# 02 - INVESTIGACIÓN

**Fase:** Investigación del Codebase + Opciones Técnicas
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## 2.1 Mapa de Impacto

| Archivo | Ruta exacta | Líneas afectadas | Tipo cambio | Descripción |
|---------|-------------|-----------------|-------------|-------------|
| kanban.js | src/extension/kanban.js | 6-14, 44-60, 84-95 | modificar | +columna, renombrar sin_columna, resolverFaseAlMover |
| panel-kanban.js | src/extension/panel-kanban.js | 6-12, 167-170, 641-716 | modificar | +variable toggle, skip en forEach, handler |
| kanban.css | src/extension/kanban.css | fin | modificar | +estilo columna sin_fase |
| panel.html | src/extension/panel.html | 475-480 | modificar | +checkbox "Sin Fase" |
| kanban.js (móvil) | src/movil/js/views/kanban.js | 38-48 | modificar | +chip sin_fase |
| test_kanban.js | tests/TDD/unit/test_kanban.js | múltiples | modificar | Actualizar + añadir tests |

Líneas de código estimadas a modificar/crear: ~60

## 2.2 Patrones Existentes

**Toggle columna (panel-kanban.js:6-8):**
```javascript
var _kanbanMostrarEspera = true;
var _kanbanMostrarVacio = true;
var _kanbanMostrarDocumentado = false;
```
Reutilizar mismo patrón para `_kanbanMostrarSinFase = true`.

**Estilo diferenciado (kanban.css:110-114):**
```css
.kanban-columna[data-grupo="incidencia"] { background: #fce4e4; }
.kanban-columna[data-grupo="documentado"] { opacity: 0.7; }
```
Reutilizar para `[data-grupo="sin_fase"]` con fondo gris punteado.

**Chip móvil (movil/views/kanban.js:38-48):**
```javascript
var chips = [
  { id: 'nada', label: 'Nada' },
  { id: 'cerrado', label: 'Cerrado' },
  // ...
];
```
Añadir `{ id: 'sin_fase', label: 'Sin Fase' }` al array.

## 2.3 Análisis de Tests Existentes

- **Tests relacionados:** `tests/TDD/unit/test_kanban.js` (37 tests en 9 describes)
- **Tests que se romperán:**
  - `test('tiene 7 columnas')` → actualizar a 8
  - `test('incluye las 7 columnas esperadas')` → actualizar IDs
  - `test('sin fase va a sin_columna')` → renombrar a sin_fase
  - `test('fase desconocida va a sin_columna')` → renombrar
  - `test('incluye sin_columna en conteos')` → renombrar

## 2.4 Spike Técnico

No necesario. El patrón es idéntico a las columnas existentes.

## 2.5 Opciones Evaluadas

### Opción A: Columna en COLUMNAS_KANBAN con fases: []
- **Descripción:** Añadir `{ id: 'sin_fase', fases: [], orden: 0 }` al inicio del array
- **Pros:** Mínimo cambio, colapso/conteos/drag automáticos, coherente con patrón
- **Cons:** Requiere renombrar sin_columna → sin_fase
- **Complejidad:** S

### Opción B: Grupo separado fuera de COLUMNAS_KANBAN
- **Descripción:** Mantener sin_columna como grupo especial, renderizar manualmente antes del forEach
- **Pros:** No cambia estructura COLUMNAS_KANBAN
- **Cons:** Duplica lógica de renderizado, no tiene colapso/conteos automáticos
- **Complejidad:** M

### Opción C: Columna virtual con filtro especial
- **Descripción:** Añadir filtro que muestre registros sin fase en panel separado
- **Pros:** No modifica kanban.js
- **Cons:** No integra drag & drop, rompe UX de tablero
- **Complejidad:** M

## 2.6 Criterios de Decisión

| Criterio | Peso | Opción A | Opción B | Opción C |
|----------|------|----------|----------|----------|
| Mínimo cambio | Alto | 9 | 5 | 6 |
| Coherencia patrón | Alto | 10 | 4 | 3 |
| Drag & drop auto | Alto | 10 | 6 | 0 |
| Colapso/conteos | Medio | 10 | 3 | 0 |

## 2.7 Decisión (ADR)

**Opción seleccionada:** A — Columna en COLUMNAS_KANBAN con fases: []

**Justificación:** Es el cambio más limpio y coherente. Las funciones `calcularConteos`, `calcularConteosDual`, colapso y drag & drop funcionan automáticamente. Solo `resolverFaseAlMover` necesita un caso especial para retornar `''`.

---

## Puerta de Validación 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con código real
- [x] Tests existentes analizados (qué podría romperse)
- [x] Spike resuelto (no necesario)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decisión justificada

---

**Estado:** COMPLETADO
