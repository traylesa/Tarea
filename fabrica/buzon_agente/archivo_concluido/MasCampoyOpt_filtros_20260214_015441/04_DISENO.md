# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## Arquitectura

Sin cambios en la arquitectura general. Se amplían 4 archivos existentes:

```
src/extension/
├── filters.js      ← Nuevas funciones puras (operadores, filtros temporales, fases, bulk)
├── panel.js        ← Columnas nuevas, UI cards/bulk/checkboxes, CAMPOS_BUSCABLES
├── panel.html      ← Nuevos controles DOM
└── panel.css       ← Estilos nuevos componentes
```

**Principio:** Lógica pura en `filters.js` (testeable), DOM solo en `panel.js`.

---

## Modelo de Datos

### Campos nuevos en registro de seguimiento

Consultado `docs/DICCIONARIO_DOMINIO.md`. Los campos nuevos siguen convención camelCase (JavaScript) del proyecto.

| Campo | Origen PEDCLI | Tipo | Default | Descripción |
|-------|--------------|------|---------|-------------|
| `fCarga` | FECSAL | string (date) | null | Fecha de salida/carga |
| `hCarga` | FECHORSAL | string (time) | null | Hora de salida/carga |
| `fEntrega` | FECLLE | string (date) | null | Fecha de llegada/entrega |
| `hEntrega` | FECHORLLE | string (time) | null | Hora de llegada/entrega |
| `zona` | ZONA | string | null | Zona de origen |
| `zDest` | ZONADES | string | null | Zona de destino |

**Nota:** `fase` ya existe en el modelo y diccionario (FASE_TRANSPORTE, códigos 00-30).

---

## Interfaces (funciones públicas en filters.js)

### Nuevas funciones

```javascript
// T1: Operadores de comparación (ampliar construirFiltros)
// construirFiltros() ya existe - se amplía con operadores: '<', '<=', '>', '>='
// Cada operador usa comparación nativa de JS (funciona con números y strings)

// T2: Filtros temporales
function filtroRangoCarga(hoy) → Function
// Retorna función (valor) => boolean que filtra fCarga entre hoy y hoy+1

function filtroRangoDescarga(hoy) → Function
// Retorna función (valor) => boolean que filtra fEntrega entre hoy-1 y hoy

// T3: Filtro por fases seleccionadas
function filtroFases(fasesActivas) → Function
// Retorna función (valor) => boolean que verifica si fase está en fasesActivas[]
// Si fasesActivas está vacío, retorna () => false (nada coincide)
// Si fasesActivas contiene TODAS las fases, retorna () => true

// T4: Edición masiva (lógica pura)
function aplicarCambioMasivo(registros, idsSeleccionados, campo, valor) → Object[]
// Retorna nueva copia del array registros con el campo actualizado
// Solo modifica registros cuyo messageId esté en idsSeleccionados
// Inmutable: no modifica el array original
```

### Funciones existentes modificadas

```javascript
// construirFiltros(definiciones) - ampliar switch con 4 operadores nuevos
// Operadores nuevos mapean a Tabulator types: '<', '<=', '>', '>='
```

---

## Componentes UI nuevos (panel.html)

### 1. Cards de Fases (dentro de panel-filtros)

```
[Marcar Todas] [Desmarcar Todas]
[00 Espera] [01 Espera Carga] [05 Incidencia] [11 En Carga] ...
```
- Cada card es un botón toggle (activa/inactiva)
- Cards críticas (05, 25) tienen estilo rojo
- Selección múltiple: se filtran registros cuya fase esté en las cards activas

### 2. Filtros Temporales (dentro de panel-filtros)

```
☐ Rango Carga: [hoy] → [mañana]   ☐ Rango Descarga: [ayer] → [hoy]
```
- Checkbox habilita/deshabilita el filtro
- Inputs date pre-populados con fechas por defecto
- Editables manualmente

### 3. Panel Edición Masiva (debajo de controls)

```
☑ Fase: [ComboBox fases]  ☑ Estado: [ComboBox estados]  [Aplicar a seleccionados (N)]
```
- Checkbox habilita el combo correspondiente
- Botón muestra conteo de seleccionados
- Deshabilitado si 0 seleccionados

### 4. Columnas nuevas en rejilla

| Columna | Field | Width | Formatter | headerFilter |
|---------|-------|-------|-----------|-------------|
| FCarga | fCarga | 90 | fecha dd/mm/yyyy | input |
| HCarga | hCarga | 60 | hora HH:MM | - |
| FEntrega | fEntrega | 90 | fecha dd/mm/yyyy | input |
| HEntrega | hEntrega | 60 | hora HH:MM | - |
| Zona | zona | 80 | text o "--" | input |
| ZDest | zDest | 80 | text o "--" | input |

---

## Flujos de Ejecución

### Flujo 1: Filtro temporal por checkbox
1. Usuario marca checkbox "Rango Carga"
2. Se calculan fechas: inicio=hoy 00:00, fin=mañana 23:59
3. Se aplica filtroRangoCarga(hoy) sobre campo fCarga
4. Tabla se actualiza, conteo se recalcula

### Flujo 2: Cards de fases
1. Usuario hace click en card "11 En Carga"
2. Card se marca como activa (toggle)
3. Se recalcula array fasesActivas
4. Se aplica filtroFases(fasesActivas) a la tabla
5. Si todas activas → se elimina filtro de fases

### Flujo 3: Edición masiva
1. Usuario selecciona N filas via checkbox de fila
2. Panel bulk muestra "Aplicar a seleccionados (N)"
3. Usuario elige Fase o Estado en ComboBox
4. Click en "Aplicar"
5. aplicarCambioMasivo() genera nuevos registros
6. Se actualiza tabla, chrome.storage y backend GAS

---

## Propuesta Diccionario

Los campos nuevos (fCarga, hCarga, fEntrega, hEntrega, zona, zDest) necesitan registro en el diccionario. Documentado en PROPUESTA_DICCIONARIO.md de este expediente.

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Todos los nombres verificados en DICCIONARIO_DOMINIO.md
- [x] Interfaces públicas definidas
- [x] Flujos críticos documentados
- [x] Validaciones especificadas (tolerancia null/undefined)

### PUERTA DE VALIDACIÓN 4: APROBADA

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md (propuesta documentada)
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas
