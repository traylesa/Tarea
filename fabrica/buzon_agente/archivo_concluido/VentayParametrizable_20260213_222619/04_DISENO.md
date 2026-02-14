# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## Arquitectura de Componentes

```
[Usuario clic icono]
       |
       v
[background.js] ──── chrome.action.onClicked ────→ chrome.windows.create('panel.html')
       |                                                      |
       |── chrome.alarms (intervalo desde config)             v
       |── ejecutarBarridoPeriodico()                  [panel.html]
       |      (lee GAS_URL de config)                     |     |
       |                                            [Tab Datos] [Tab Config]
       v                                               |           |
[config.js] ◄─── chrome.storage.local ───→     [panel.js]    [config-ui.js]
  getDefaults()                                 (tabla Tabul.) (form config)
  validar()                                     (lee config)   (valida+guarda)
  cargar()
  guardar()
```

## Modelo de Datos

### Estructura de Configuracion en chrome.storage.local

Clave: `logitask_config`

```javascript
{
  gasUrl: '',                              // URL del servicio GAS
  intervaloMinutos: 15,                    // Intervalo barrido (1-1440)
  rutaCsvErp: '',                          // Ruta archivos CSV del ERP
  patrones: {
    codcarAdjunto: 'Carga_0*(\\d+)\\.pdf', // Patron extraccion CODCAR
    keywordsAdmin: 'certificado|hacienda|347|aeat|factura'
  },
  ventana: {
    width: 800,                            // Ancho ventana
    height: 600,                           // Alto ventana
    left: null,                            // Posicion X (null = centrado)
    top: null                              // Posicion Y (null = centrado)
  }
}
```

**Consulta diccionario:** Los nombres `gasUrl`, `intervaloMinutos`, `rutaCsvErp`, `codcarAdjunto`, `keywordsAdmin` son nuevos para la extension. `codcar` y keywords_admin ya existen en el diccionario (seccion Validaciones). Se documentaran en PROPUESTA_DICCIONARIO.md.

## Interfaces Publicas

### config.js (modulo puro, sin dependencias DOM)

```javascript
// Retorna configuracion por defecto completa
function getDefaults() -> Object

// Valida configuracion. Retorna {valido: bool, errores: string[]}
function validar(config) -> {valido, errores}

// Carga config de storage, mergeando con defaults
async function cargar() -> Object

// Guarda config validada en storage
async function guardar(config) -> void

// Constantes exportadas
const STORAGE_KEY_CONFIG = 'logitask_config'
const MIN_INTERVALO = 1
const MAX_INTERVALO = 1440
```

### background.js

```javascript
// Abre ventana nueva o enfoca existente
async function abrirOEnfocarVentana() -> void

// Guarda posicion/tamano de ventana al cerrar
async function guardarEstadoVentana(windowId) -> void

// Barrido periodico (lee config para GAS_URL)
async function ejecutarBarridoPeriodico() -> void
```

### config-ui.js

```javascript
// Inicializa formulario de configuracion
async function inicializarConfigUI() -> void

// Guarda configuracion desde formulario
async function guardarConfigDesdeUI() -> void

// Muestra errores de validacion
function mostrarErrores(errores) -> void
```

## Flujos de Ejecucion

### Flujo 1: Abrir ventana

1. Usuario hace clic en icono de extension
2. background.js recibe `chrome.action.onClicked`
3. Si `panelWindowId` es null o ventana no existe → `chrome.windows.create()` con config.ventana
4. Si ventana ya existe → `chrome.windows.update(id, {focused: true})`
5. Al cerrar ventana → guardar posicion/tamano en config

### Flujo 2: Guardar configuracion

1. Usuario abre tab Configuracion
2. config-ui.js carga config actual via `cargar()` y llena formulario
3. Usuario modifica campos y pulsa Guardar
4. config-ui.js lee formulario, llama `validar(config)`
5. Si errores → muestra errores en UI, no guarda
6. Si valido → llama `guardar(config)` + muestra confirmacion
7. Si intervalo cambio → envia mensaje a background para recrear alarma

### Flujo 3: Barrido periodico

1. Alarma se dispara cada N minutos
2. background.js carga config via `cargar()`
3. Si `gasUrl` vacio → retorna sin hacer nada
4. Fetch a gasUrl + accion
5. Procesa resultado (alertas, registros)

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Nombres consultados en DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados
- [x] Validaciones especificadas

---

## PUERTA DE VALIDACION 4: SUPERADA

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md (codcar, keywords existentes; nuevos en propuesta)
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas
