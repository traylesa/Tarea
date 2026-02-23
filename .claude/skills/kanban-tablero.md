# Skill: Vista Kanban Tablero

**Proposito**: Vista Kanban estilo Trello para visualizar cargas logisticas como tarjetas que se mueven entre columnas (grupos de fase) con swimlanes por estado. Drag & drop via SortableJS en Extension Chrome y PWA Movil.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-23

---

## Archivos Relevantes

| Archivo | Rol | Lineas |
|---------|-----|--------|
| `src/extension/kanban.js` | Logica pura dual-compat (agrupar, mover, conteos) | ~120 |
| `src/extension/panel-kanban.js` | Controlador DOM escritorio (render, SortableJS, persistir) | ~200 |
| `src/extension/kanban.css` | Estilos Trello-like columnas/tarjetas | ~180 |
| `src/extension/lib/sortable/Sortable.min.js` | SortableJS libreria (~14KB) | ext |
| `src/movil/js/views/kanban.js` | Vista PWA movil | ~180 |
| `src/movil/css/kanban.css` | Estilos mobile-first con scroll-snap | ~120 |
| `src/movil/lib/kanban.js` | Copia logica pura para movil | ~120 |
| `tests/TDD/unit/test_kanban.js` | Tests logica pura (~35 tests) | ~200 |

**Tests**: `npx jest tests/TDD/unit/test_kanban.js --no-coverage`

---

## Dominio: Columnas y Tarjetas

### Columnas = Grupos de Fase

```javascript
var COLUMNAS_KANBAN = [
  { id: 'espera',     nombre: 'Espera',      fases: ['00','01','02'], orden: 1, icono: '⏳' },
  { id: 'carga',      nombre: 'Carga',       fases: ['11','12'],     orden: 2, icono: '📦' },
  { id: 'en_ruta',    nombre: 'En Ruta',     fases: ['19'],          orden: 3, icono: '🚛' },
  { id: 'descarga',   nombre: 'Descarga',    fases: ['21','22'],     orden: 4, icono: '📥' },
  { id: 'vacio',      nombre: 'Vacio',       fases: ['29'],          orden: 5, icono: '📄' },
  { id: 'incidencia', nombre: 'Incidencia',  fases: ['05','25'],     orden: 6, icono: '⚠️' },
  { id: 'documentado',nombre: 'Documentado', fases: ['30'],          orden: 7, icono: '✅' }
];
```

Reutiliza `MAPA_FASE_A_GRUPO` de `action-bar.js` (ya en scope global via script tags).

### Swimlanes = Estados (dentro de cada columna)

7 estados: NUEVO, ENVIADO, RECIBIDO, PENDIENTE, GESTIONADO, ALERTA, CERRADO.
Colores desde `src/shared/visual-status.css` (variables CSS existentes).

### Tarjeta = Carga (deduplicada por codCar)

Multiples emails del mismo hilo/carga se deduuplican mostrando el mas reciente.
Cada tarjeta muestra: codCar, transportista, estado (chip), fase (chip), fecha relativa, indicadores (notas, recordatorios, programados).

---

## API Logica Pura (kanban.js)

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `agruparPorColumna` | registros | `{ espera: [...], carga: [...], ..., sin_columna: [...] }` |
| `agruparPorEstado` | registrosColumna, estados | `{ NUEVO: [...], ENVIADO: [...], ... }` |
| `resolverColumnaDestino` | faseActual | String grupo o null |
| `resolverFaseAlMover` | columnaDestinoId, faseActual | String fase (ej: '11') |
| `calcularConteos` | registrosAgrupados | `{ espera: { total: N, porEstado: {...} }, ... }` |
| `deduplicarPorCarga` | registros | Array deduplicado (mas reciente por codCar) |

### Regla de movimiento (resolverFaseAlMover)

- Si fase actual ya pertenece al grupo destino → NO cambia fase
- Si no → asigna la PRIMERA fase del grupo destino (ej: mover a 'carga' → '11')
- Siempre normaliza con padStart(2, '0')

---

## Persistencia de Cambios

### Extension Chrome (panel-kanban.js)

Reutiliza la logica de `persistirCambio()` de panel.js (lineas 519-630):
1. Evalua reglas de accion con `evaluarReglas()`
2. Propaga al hilo via `actualizarCampoPorThread` si aplica
3. Actualiza `registros[]` en memoria + `chrome.storage.local`
4. POST a backend GAS
5. Registra en historial

**Funcion nueva**: `persistirCambioKanban(registro, campo, valor)` — replica la logica sin depender del objeto `cell` de Tabulator.

### PWA Movil (views/kanban.js)

Usa `API.post('actualizarCampoPorThread', payload)` + `Store.guardarRegistros()`.

---

## SortableJS Configuracion

```javascript
new Sortable(dropZone, {
  group: 'kanban',           // Permite mover entre columnas
  animation: 150,            // Animacion suave
  ghostClass: 'sortable-ghost',
  dragClass: 'sortable-drag',
  handle: '.kanban-tarjeta', // Solo tarjetas son draggables
  onEnd: function(evt) {
    var columnaDestino = evt.to.dataset.columna;
    var registroId = evt.item.dataset.messageId;
    // Calcular nueva fase y persistir
  }
});
```

---

## Integracion Extension Chrome

### panel.html
- Tab: `<button class="tab" data-tab="tablero">Tablero</button>` (entre Datos y Plantillas)
- Section: `<section id="tab-tablero" class="tab-content">` con controles + board
- Scripts: `sortable/Sortable.min.js`, `kanban.js`, `panel-kanban.js` (antes de panel.js)
- CSS: `kanban.css` link en head

### panel.js (hook en inicializarTabs, linea 1873)
```javascript
if (tab.dataset.tab === 'tablero') {
  renderKanban();
}
```

### Sincronizacion tab Datos ↔ Tablero
Variable global `registros` es compartida. Cambios en Tablero mutan `registros[]` y al volver a tab Datos, `tabla.replaceData(registros)` refleja cambios.

---

## Integracion PWA Movil

### index.html
- Bottom nav: item "Tablero" con icono (entre Todo y Programados)
- Scripts: `lib/kanban.js`, `lib/sortable/Sortable.min.js`, `js/views/kanban.js`
- CSS: `css/kanban.css`

### app.js (router)
```javascript
case 'kanban':
  VistaKanban.renderizar(contenedor);
  break;
```

---

## CSS: Estilos Trello-like

### Escritorio (kanban.css)
- Board: `display: flex; overflow-x: auto; gap: 8px`
- Columna: `min-width: 220px; max-width: 280px; background: #ebecf0; border-radius: 6px`
- Tarjeta: `background: white; border-radius: 4px; box-shadow: 0 1px 1px; border-left: 3px solid [color-estado]`
- Ghost: `opacity: 0.4; background: #c8dafc`
- Drag: `box-shadow: 0 4px 12px; transform: rotate(2deg)`

### Movil (kanban.css)
- Columnas: `width: 75vw; scroll-snap-align: start`
- Board: `scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`
- Touch targets: minimo 48px
- Tarjetas: padding mayor, fuentes mas grandes

---

## Dependencias Reutilizadas

| Modulo | Funcion usada | Archivo |
|--------|--------------|---------|
| `action-bar.js` | `MAPA_FASE_A_GRUPO`, `obtenerGrupoFase()` | Columnas |
| `visual-status.css` | Variables `--estado-*-bg/fg`, `.chip-estado-*` | Colores |
| `fases-config.js` | `obtenerFasesOrdenadas()` | Orden columnas |
| `estados-config.js` | `getDefaultEstados()` | Swimlanes |
| `dashboard.js` | Patron `_grupoFase()`, `_esCerrado()` | Referencia |
| `constants.js` | Constantes temporales | Deduplicacion |

---

## Consideraciones para Agentes

1. **kanban.js es logica pura**: Sin DOM, sin Chrome API, sin fetch. Solo funciones que reciben datos y retornan resultados.
2. **TDD obligatorio**: Escribir test_kanban.js ANTES de kanban.js
3. **Reutilizar MAPA_FASE_A_GRUPO**: No duplicar el mapa de fases→grupo. Ya existe en action-bar.js y dashboard.js
4. **Patron dual-compat**: `if (typeof module !== 'undefined') module.exports = {...}`
5. **Deduplicar por codCar**: Tarjeta = carga, no mensaje. Tomar registro mas reciente.
6. **Normalizar fase**: Siempre `String(fase).padStart(2, '0')` al mover
7. **persistirCambioKanban**: Replicar logica de panel.js:519-630 SIN depender de `cell` Tabulator
8. **Colores**: Usar visual-status.css, NO hardcodear colores
9. **SortableJS**: Soporta touch nativo, no necesita plugins extra

---

## Referencias

- **Acciones por fase**: `.claude/skills/productividad-avanzada.md` §action-bar
- **Sistema config**: `.claude/skills/sistema-configuracion.md` (persistencia)
- **Motor reglas**: `.claude/skills/motor-reglas-acciones.md` (evaluarReglas al mover)
- **Sheets DB**: `.claude/skills/sheets-database.md` (actualizarCampo endpoint)
- **Chrome MV3**: `.claude/skills/chrome-extension-mv3.md` (panel, scripts, storage)
- **PWA Mobile**: `.claude/skills/pwa-mobile-development.md` (vistas, router, store)
- **Dual-compat**: `.claude/skills/dual-compat-modules.md` (patron module.exports)

---

**Generada por Claude Code**
