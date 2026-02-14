# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** FiltosyMensajes_20260214_000831
**Camino:** MINI_PROYECTO

---

## Arquitectura de Cambios

Solo se modifican archivos existentes. No se crean modulos nuevos.

```
src/extension/
├── filters.js          # + filtroGlobal(), contarFiltrosActivos()
├── bulk-reply.js       # + generarPrevisualizacion(), obtenerFirmasDisponibles()
├── panel.html          # + input global, badge, preview en modal, selector firma
├── panel.js            # + integracion nuevas funciones
└── panel.css           # + estilos badge, input global
```

---

## Interfaces Nuevas

### filters.js (funciones nuevas)

```javascript
// Genera funcion filtro que busca texto en todos los campos dados
function filtroGlobal(texto, campos)
// texto: string - texto a buscar
// campos: string[] - lista de nombres de campo a buscar
// return: function(rowData) => boolean

// Cuenta cuantos filtros estan activos
function contarFiltrosActivos(filtrosTabulator, tieneGlobal, tieneRangoFechas)
// filtrosTabulator: number - cantidad de filtros Tabulator activos
// tieneGlobal: boolean - si el filtro global tiene texto
// tieneRangoFechas: boolean - si hay rango de fechas seleccionado
// return: number
```

### bulk-reply.js (funciones nuevas)

```javascript
// Genera HTML de previsualizacion con datos del primer registro
function generarPrevisualizacion(registros, plantilla, sanitizar)
// registros: array de registros seleccionados
// plantilla: {asunto, cuerpo, firma}
// sanitizar: function(html) => html limpio
// return: {asuntoPreview: string, cuerpoPreview: string}

// Retorna lista de firmas disponibles de las plantillas guardadas
function obtenerFirmasDisponibles(plantillas)
// plantillas: array de plantillas guardadas
// return: [{id, alias, firma}] (solo las que tienen firma no vacia)
```

---

## Cambios en UI (panel.html)

### Input filtro global
Agregar antes de la tabla, en la barra de controles:
```html
<input type="text" id="filtro-global" placeholder="Buscar en todos los campos..." title="Busqueda rapida">
```

### Badge filtros activos
Agregar en la barra de controles:
```html
<span id="badge-filtros" class="badge-filtros hidden">0 filtros</span>
```

### Columna Asunto
Agregar en crearColumnas() despues de Email:
```javascript
{
  title: 'Asunto', field: 'asunto', width: 150,
  headerFilter: 'input',
  formatter: cell => cell.getValue() || '--',
  headerMenu: columnVisibilityMenu
}
```

### Previsualizacion en modal respuesta
Agregar en #modal-respuesta:
```html
<button id="btn-preview-respuesta" class="btn-secundario">Previsualizar</button>
<div id="preview-respuesta" class="hidden">
  <h4>Previsualizacion</h4>
  <div id="preview-respuesta-contenido"></div>
</div>
```

### Selector firma en modal respuesta
Reemplazar textarea firma por:
```html
<label>Firma:
  <select id="respuesta-firma-selector">
    <option value="">Sin firma</option>
    <option value="__custom__">Personalizada</option>
  </select>
</label>
<textarea id="respuesta-firma" rows="2" class="hidden"></textarea>
```

---

## Flujos de Ejecucion

### Flujo: Filtro global + filtros coordinados
1. Usuario escribe en #filtro-global
2. Debounce 300ms -> obtener texto
3. Si texto != '', generar filtro con filtroGlobal(texto, CAMPOS_BUSCABLES)
4. Agregar como filtro custom a Tabulator (no pisar los demas)
5. Actualizar conteo y badge

### Flujo: Limpiar todo
1. Click "Limpiar todo"
2. tabla.clearFilter() - limpia todos los filtros Tabulator
3. tabla.clearHeaderFilter() - limpia headerFilters
4. #filtro-global.value = ''
5. #filtro-fecha-inicio.value = '', #filtro-fecha-fin.value = ''
6. Limpiar inputs de filtros avanzados
7. Actualizar conteo y badge

### Flujo: Previsualizacion en modal respuesta
1. Click "Previsualizar" en modal respuesta
2. Obtener registros seleccionados
3. Leer asunto/cuerpo/firma del modal
4. generarPrevisualizacion(registros, plantilla, sanitizarHtml)
5. Mostrar resultado en #preview-respuesta-contenido

---

## Diccionario: Nombres Nuevos

No se crean nombres nuevos de dominio. Las funciones nuevas usan nombres descriptivos en camelCase siguiendo convenciones existentes:

| Funcion | Modulo | Tipo |
|---------|--------|------|
| `filtroGlobal` | filters.js | funcion |
| `contarFiltrosActivos` | filters.js | funcion |
| `generarPrevisualizacion` | bulk-reply.js | funcion |
| `obtenerFirmasDisponibles` | bulk-reply.js | funcion |

Estos son nombres de funciones internas, no campos de dominio. No requieren entrada en diccionario.

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Todos los nombres verificados en DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados

## PUERTA DE VALIDACION 4

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md (no se requieren nuevos)
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

---

**Estado:** COMPLETADO
