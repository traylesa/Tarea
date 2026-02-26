# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## Arquitectura

No se crean nuevas entidades ni modelos de datos. Se extiende la estructura existente de `COLUMNAS_KANBAN` añadiendo una columna con `fases: []`.

## Cambios en modelo de datos

### COLUMNAS_KANBAN (kanban.js)

```javascript
// ANTES: 7 columnas (espera..documentado)
// DESPUES: 8 columnas (sin_fase + espera..documentado)
var COLUMNAS_KANBAN = [
  { id: 'sin_fase',   nombre: 'Sin Fase',    fases: [],              orden: 0 },
  { id: 'espera',     nombre: 'Espera',      fases: ['00','01','02'], orden: 1 },
  // ...resto sin cambios
];
```

### agruparPorColumna (kanban.js)

```javascript
// ANTES
grupos.sin_columna = [];
// ...
grupos.sin_columna.push(r);

// DESPUES: sin_columna eliminado, sin_fase creado automáticamente por forEach de COLUMNAS_KANBAN
// El else sigue capturando registros sin fase reconocida → van a grupos.sin_fase
```

### resolverFaseAlMover (kanban.js)

```javascript
function resolverFaseAlMover(columnaDestinoId, faseActual) {
  // NUEVO: caso sin_fase retorna '' (limpiar fase)
  if (columnaDestinoId === 'sin_fase') return '';

  var columna = COLUMNAS_KANBAN.find(...);
  if (!columna) return null;
  // ...resto sin cambios
}
```

## Interfaces

### panel-kanban.js
- `var _kanbanMostrarSinFase = true;` — nueva variable toggle
- En `renderKanban().forEach`: `if (col.id === 'sin_fase' && !_kanbanMostrarSinFase) return;`
- Handler para checkbox `chk-kanban-sinfase`
- `_syncCheckboxesKanban`: sincronizar checkbox sin_fase
- `btnTodas/btnNinguna`: incluir _kanbanMostrarSinFase

### panel.html
- Nuevo checkbox: `<label><input type="checkbox" id="chk-kanban-sinfase" checked> Sin Fase</label>`

### kanban.css
```css
.kanban-columna[data-grupo="sin_fase"] {
  background: repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 10px, #f0f1f2 10px, #f0f1f2 20px);
  border-left: 3px solid #90A4AE;
}
```

### movil/views/kanban.js
- Nuevo chip: `{ id: 'sin_fase', label: 'Sin Fase' }` al inicio del array chips
- `_ocultos`: añadir `sin_fase: false` (visible por defecto)

## Nombres en diccionario

Consultado `docs/DICCIONARIO_DOMINIO.md`:
- `sin_fase` — ID interno de columna Kanban (mismo nivel que `espera`, `carga`, etc.)
- No es un nombre de tabla/campo/variable de dominio
- No se requieren cambios al diccionario

## Checklist

- [x] Arquitectura clara y documentada
- [x] Todos los nombres en DICCIONARIO_DOMINIO.md (consultado, sin nuevos)
- [x] Interfaces públicas definidas
- [x] Flujos críticos documentados (drag sin_fase ↔ columnas)

---

**Estado:** COMPLETADO
