# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## Arquitectura de Modulos

```
src/extension/
├── filters.js          # Logica pura: construir filtros Tabulator
├── templates.js        # Logica pura: CRUD plantillas + interpolacion
├── gas-services.js     # Logica pura: CRUD servicios GAS multi-URL
├── thread-grouping.js  # Logica pura: config agrupacion Tabulator
├── bulk-reply.js       # Logica pura: payload respuesta masiva
├── help-content.js     # Datos: contenido secciones ayuda
├── config.js           # Existente: configuracion (se extiende)
├── config-ui.js        # Existente: UI config (se extiende)
├── panel.js            # Existente: panel principal (se extiende)
├── panel.html          # Existente: HTML (se extiende)
├── panel.css           # Existente: estilos (se extiende)
└── background.js       # Existente: service worker (sin cambios)
```

**Principio:** Cada modulo nuevo es logica pura sin dependencias DOM. Exporta via `module.exports` para tests y se usa como global en browser.

---

## Modelo de Datos (chrome.storage.local)

### Nuevos campos en storage

#### `logitask_gas_services` (NUEVO)
```javascript
{
  services: [
    { id: "svc_1", alias: "Produccion", url: "https://..." },
    { id: "svc_2", alias: "Testing", url: "https://..." }
  ],
  activeServiceId: "svc_1"
}
```

#### `logitask_plantillas` (NUEVO)
```javascript
{
  plantillas: [
    {
      id: "tpl_1",
      alias: "Confirmacion recepcion",
      asunto: "Re: {{asunto}}",
      cuerpo: "<p>Estimado {{nombreTransportista}},</p><p>Confirmamos recepcion...</p>",
      firma: "<p>--<br>Departamento Logistica</p>",
      created_at: "2026-02-13T...",
      updated_at: "2026-02-13T..."
    }
  ]
}
```

#### `logitask_ayuda_estado` (NUEVO)
```javascript
{
  ultimaSeccion: "filtros"
}
```

### Variables interpolables en plantillas

Derivadas del modelo `seguimiento` del diccionario:

| Variable | Campo origen | Ejemplo |
|----------|-------------|---------|
| `{{codCar}}` | codCar | 168345 |
| `{{nombreTransportista}}` | nombreTransportista | "Transportes Garcia SL" |
| `{{codTra}}` | codTra | "TRA001" |
| `{{emailRemitente}}` | emailRemitente | "garcia@email.com" |
| `{{asunto}}` | asunto | "Re: Carga 168345" |
| `{{fechaCorreo}}` | fechaCorreo | "13/02/2026 15:30" |
| `{{estado}}` | estado | "ENVIADO" |
| `{{tipoTarea}}` | tipoTarea | "OPERATIVO" |

---

## Interfaces Publicas

### filters.js

```javascript
// Construye array de filtros Tabulator desde definicion usuario
function construirFiltros(definiciones)
// definiciones: [{campo, operador, valor}]
// return: [{field, type, value}] (formato Tabulator)

// Construye filtro de rango de fechas
function filtroRangoFechas(fechaInicio, fechaFin)
// return: funcion filtro custom para Tabulator

// Retorna baterias predefinidas
function obtenerBaterias()
// return: {nombre: string, filtros: [{field, type, value}]}[]

// Limpia todos los filtros (retorna array vacio)
function limpiarFiltros()
// return: []
```

### templates.js

```javascript
// CRUD
function crearPlantilla(alias, asunto, cuerpo, firma)
// return: plantilla con id generado

function editarPlantilla(id, cambios)
// return: plantilla actualizada

function eliminarPlantilla(id, plantillas)
// return: array sin la plantilla eliminada

// Interpolacion
function interpolar(texto, variables)
// return: texto con {{var}} reemplazadas

function obtenerVariablesDisponibles()
// return: [{nombre, descripcion}]

// Sanitizacion
function sanitizarHtml(html)
// return: html sin scripts ni eventos inline
```

### gas-services.js

```javascript
function agregarServicio(alias, url, servicios)
// return: servicios actualizado con nuevo servicio

function eliminarServicio(id, servicios)
// return: servicios sin el eliminado

function obtenerServicioActivo(datos)
// return: {id, alias, url} del servicio activo

function cambiarServicioActivo(id, datos)
// return: datos con activeServiceId actualizado

function validarUrlServicio(url)
// return: {valido: boolean, error?: string}
```

### thread-grouping.js

```javascript
function obtenerConfigAgrupacion(activa)
// return: objeto config para Tabulator groupBy

function toggleAgrupacion(estadoActual)
// return: nuevo estado (boolean)
```

### bulk-reply.js

```javascript
function construirPayload(registros, plantilla, variables)
// return: {destinatarios: [], asunto, cuerpo, firma}

function validarSeleccion(registros)
// return: {valido: boolean, error?: string}
```

### help-content.js

```javascript
function obtenerSecciones()
// return: [{id, titulo, contenido}]

function obtenerSeccion(id)
// return: {id, titulo, contenido} o null
```

---

## Flujos de Ejecucion

### Flujo 1: Filtrado avanzado
1. Usuario expande panel filtros (click en "Filtros")
2. Selecciona campo + operador + valor
3. Click "Aplicar" -> `construirFiltros()` genera array
4. `tabla.setFilter(filtros)` aplica en Tabulator
5. Si hay rango fechas, se agrega filtro custom
6. Conteo se actualiza en footer

### Flujo 2: Respuesta masiva
1. Usuario selecciona filas con checkbox
2. Click "Responder seleccionados"
3. `validarSeleccion()` verifica hay seleccion
4. Modal muestra destinatarios + selector plantilla
5. Al seleccionar plantilla, `interpolar()` rellena cuerpo
6. Usuario puede editar antes de enviar
7. Click "Enviar" -> `construirPayload()` genera datos
8. `fetch(gasUrl + '?action=enviarRespuesta', {body: payload})`
9. Exito: marcar como GESTIONADO. Error: mostrar mensaje.

### Flujo 3: Cambio de servicio GAS
1. En tab Config, usuario ve lista de servicios
2. Click "Agregar" -> form alias + URL
3. `validarUrlServicio()` + `agregarServicio()`
4. En dropdown principal, selecciona servicio
5. `cambiarServicioActivo()` + recargar datos

---

## Diccionario: Nombres Nuevos

Todos los nombres de campos y variables usados arriba ya existen en `docs/DICCIONARIO_DOMINIO.md` (tabla `seguimiento`, enums existentes). Los nuevos son solo claves de storage:

| Nombre | Tipo | Descripcion |
|--------|------|-------------|
| `logitask_gas_services` | storage key | Coleccion servicios GAS con alias |
| `logitask_plantillas` | storage key | Coleccion plantillas respuesta |
| `logitask_ayuda_estado` | storage key | Estado panel de ayuda |

Estos son claves internas de chrome.storage, no campos de dominio. No requieren entrada en diccionario de dominio.

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Todos los nombres verificados en DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados
- [x] Validaciones especificadas

## PUERTA DE VALIDACION 4

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

---

**Estado:** COMPLETADO
