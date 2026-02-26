# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO

---

## Arquitectura

### Componentes modificados

```
src/extension/
├── templates.js          # MODIFICAR: sanitizarHtml → whitelist
├── panel.js              # REFACTORIZAR: extraer a módulos
├── panel-tabla.js        # NUEVO: tabla Tabulator + edición inline
├── panel-plantillas.js   # NUEVO: UI plantillas + pie común
├── panel-recordatorios.js # NUEVO: UI recordatorios + modal
├── panel-acciones.js     # NUEVO: UI acciones contextuales + notas
├── panel-dashboard.js    # NUEVO: UI dashboard + reporte
└── panel.html            # MODIFICAR: añadir script tags

src/gas/
├── Codigo.js             # MODIFICAR: validación CAMPOS_EDITABLES
└── Configuracion.js      # MODIFICAR: eliminar fallback spreadsheet
```

### Patrón de módulos panel

Cada módulo panel-*.js sigue el mismo patrón:
1. Variables locales del módulo (no globales)
2. Funciones de inicialización (`init*()`)
3. Event listeners del módulo
4. Funciones auxiliares privadas
5. Export dual-compat al final

Las funciones se comunican via variables globales compartidas en panel.js (tabla, configActual, almacenes).

---

## Interfaces

### sanitizarHtml (templates.js)

```javascript
// Constantes de whitelist
const TAGS_SEGUROS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'blockquote', 'pre', 'code', 'hr', 'sub', 'sup'
]);

const ATRIBUTOS_SEGUROS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'style',
  'colspan', 'rowspan', 'target', 'width', 'height'
]);

const PROTOCOLOS_PELIGROSOS = /^(javascript|data|vbscript):/i;

function sanitizarHtml(html) → string
// Entrada: HTML string (puede ser null/undefined)
// Salida: HTML limpio con solo tags/atributos en whitelist
// Proceso:
//   1. Si vacío/null → retorna ''
//   2. Elimina tags no permitidos (conserva contenido interno)
//   3. En tags permitidos, elimina atributos no permitidos
//   4. En href/src, elimina URLs con protocolos peligrosos
```

### CAMPOS_EDITABLES (Codigo.js)

```javascript
const CAMPOS_EDITABLES = [
  'codCar', 'codTra', 'nombreTransportista',
  'tipoTarea', 'estado', 'fase', 'alerta', 'vinculacion',
  'referencia', 'fCarga', 'hCarga', 'fEntrega', 'hEntrega',
  'zona', 'zDest'
];

function accionActualizarCampo(body) → {ok, error?}
// Validación: body.campo debe estar en CAMPOS_EDITABLES
// Si no permitido: retorna {ok: false, error: "Campo no editable: <campo>"}
```

### obtenerSpreadsheetId (Configuracion.js)

```javascript
function obtenerSpreadsheetId() → string | throws Error
// Sin fallback hardcodeado
// Si no hay ID o está vacío → throw Error("SPREADSHEET_ID no configurado...")
```

---

## Flujos de Ejecución

### Flujo sanitización (al guardar/importar plantilla)
1. Usuario edita cuerpo plantilla o importa JSON
2. Se llama `sanitizarHtml(cuerpo)`
3. Regex parsea tags HTML
4. Tags no en TAGS_SEGUROS → se elimina tag pero conserva texto interior
5. Atributos no en ATRIBUTOS_SEGUROS → se eliminan
6. href/src con protocolo peligroso → se elimina atributo
7. Retorna HTML limpio

### Flujo validación campos (al editar celda)
1. Usuario edita celda en tabla
2. Panel envía `{accion: 'actualizarCampo', messageId, campo, valor}`
3. `accionActualizarCampo` verifica campo en CAMPOS_EDITABLES
4. Si no permitido → retorna `{ok:false, error:"Campo no editable: X"}`
5. Si permitido → llama `actualizarCampo()` y retorna `{ok:true}`

### Flujo modularización panel.js
1. panel.js mantiene: init global, variables compartidas, coordinación
2. Cada panel-*.js se carga antes de panel.js via `<script>` tag
3. panel.js llama `initTabla()`, `initPlantillas()`, etc. en DOMContentLoaded
4. Funciones globales compartidas: `tabla`, `configActual`, `mostrarToast()`

---

## Nombres en Diccionario

Verificación contra `docs/DICCIONARIO_DOMINIO.md`:
- `CAMPOS_EDITABLES` → **NUEVO**, proponer en diccionario
- `TAGS_SEGUROS`, `ATRIBUTOS_SEGUROS`, `PROTOCOLOS_PELIGROSOS` → constantes internas de templates.js, no requieren diccionario (no son entidades de dominio)
- Nombres de archivos panel-*.js → convención interna, no requieren diccionario

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Nombres verificados en DICCIONARIO_DOMINIO.md
- [x] Interfaces públicas definidas
- [x] Flujos críticos documentados
- [x] Validaciones especificadas

---

## PUERTA DE VALIDACIÓN 4

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

---

**Estado:** COMPLETADO
