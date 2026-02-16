# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## Arquitectura

```
src/movil/
├── index.html              ← SPA entry + manifest + scripts
├── manifest.json           ← PWA manifest (A2HS)
├── sw.js                   ← Service Worker (cache, offline)
├── css/
│   ├── app.css             ← Variables CSS + layout mobile-first
│   ├── cards.css           ← Card de carga (estados, alertas, fases)
│   └── outdoor.css         ← Modo outdoor (contraste, fuentes)
├── js/
│   ├── app.js              ← Router hash, inicializacion, bottom nav
│   ├── api.js              ← Wrapper fetch() para GAS endpoints
│   ├── store.js            ← Estado local (localStorage + cache)
│   ├── feedback.js         ← Vibracion, toasts, haptico
│   ├── views/
│   │   ├── todo.js         ← Lista cargas + alertas + pull-refresh
│   │   ├── detalle.js      ← Detalle carga + emails + bottom bar
│   │   ├── programados.js  ← Envios + recordatorios
│   │   └── config.js       ← Configuracion + outdoor toggle
│   ├── components/
│   │   ├── card.js         ← Card carga (banner, chip, indicadores)
│   │   ├── bottom-sheet.js ← Bottom sheet modal generico
│   │   └── toast.js        ← Toast con auto-dismiss + undo
│   └── logic/
│       └── action-resolver.js ← Calcula "accion requerida" por carga
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### Modulos reutilizados (via script tags desde ../extension/)

```
constants.js → date-utils.js → alerts.js, filters.js, dashboard.js,
                                reminders.js, sequences.js, action-log.js,
                                shift-report.js, alert-summary.js
(standalone) → templates.js, notes.js, action-bar.js, resilience.js
```

---

## Interfaces Publicas

### API (js/api.js)

```javascript
const API = {
  baseUrl: '',

  configurar(url)                          // Setear URL base GAS
  async get(action)                        // GET ?action=NOMBRE → {ok, ...data}
  async post(action, body)                 // POST ?action=NOMBRE + JSON body → {ok, ...data}
}
```

### Store (js/store.js)

```javascript
const Store = {
  // Registros
  obtenerRegistros()                       // → array registros (cache)
  guardarRegistros(registros)              // Persiste en localStorage
  obtenerRegistrosPorCarga(codCar)         // Filtra por codCar

  // Config
  obtenerConfig()                          // → objeto config con defaults
  guardarConfig(config)                    // Persiste

  // Plantillas
  obtenerPlantillas()                      // → array plantillas
  guardarPlantillas(plantillas)            // Persiste

  // Alertas
  obtenerAlertas()                         // → array alertas evaluadas
  guardarAlertas(alertas)                  // Persiste

  // Pie comun
  obtenerPieComun()                        // → string HTML
  guardarPieComun(html)                    // Persiste

  // Timestamps
  obtenerUltimoBarrido()                   // → ISO string o null
  guardarUltimoBarrido(iso)                // Persiste
}
```

### Feedback (js/feedback.js)

```javascript
const Feedback = {
  vibrar(tipo)                             // tipo: 'corto'|'doble'|'largo'|'triple'|'error'
  toast(mensaje, opciones)                 // opciones: {tipo, duracion, deshacer}
  eliminarToast(id)                        // Cierra toast por ID
}
```

### Action Resolver (js/logic/action-resolver.js)

```javascript
function resolverAccion(registro, alertas, config)
// Retorna: { tipo, texto, color, accion } o null
// Prioridad: alerta CRITICA > alerta ALTA > accion fase > deadline > null
```

### App Router (js/app.js)

```javascript
const App = {
  inicializar()                            // Registra rutas, carga config, render
  navegar(ruta, params)                    // Cambia hash + renderiza vista
  renderizar()                             // Renderiza vista actual segun hash
}
// Rutas: #todo, #detalle/:codCar, #programados, #config
```

---

## Modelo de Datos (Storage)

Reutiliza las mismas claves que la extension Chrome (ver DICCIONARIO_DOMINIO.md §STORAGE_KEYS):

| Clave localStorage | Tipo | Uso en PWA |
|---------------------|------|------------|
| `tarealog_config` | object | Config completa |
| `tarealog_plantillas` | object | Plantillas respuesta |
| `tarealog_pie_comun` | string | Firma global |
| `tarealog_alertas` | array | Alertas evaluadas |
| `tarealog_recordatorios` | array | Recordatorios activos |
| `tarealog_notas` | object | Mapa notas por codCar |
| `tarealog_secuencias` | array | Secuencias activas |
| `tarealog_historial` | object | Mapa historial por codCar |
| `tarealog_resumen_flag` | object | Flag matutino |
| `tarealog_filtro_pendiente` | object | Filtros click-through |
| `registros` | array | Cache registros backend |
| `ultimoBarrido` | string | ISO timestamp ultimo barrido |

**No se crean nombres nuevos.** Todos ya existen en el diccionario.

---

## Nombres Nuevos (Propuesta Diccionario)

Solo se necesita un modulo nuevo: `action-resolver.js`. La funcion `resolverAccion` y su retorno:

| Nombre | Tipo | Descripcion |
|--------|------|-------------|
| `ACCION_REQUERIDA` | object | `{tipo, texto, color, accion}` — accion calculada para card |
| `resolverAccion` | function | Determina accion requerida por registro + alertas |

Estos nombres siguen las convenciones existentes (camelCase para funciones, UPPER_CASE para tipos).

---

## Flujos de Ejecucion

### Inicializacion

```
1. index.html carga scripts (constants → date-utils → modulos → app.js)
2. App.inicializar() lee config de Store
3. Si hay gasUrl → carga registros de cache → renderiza vista Todo
4. Si no hay gasUrl → redirige a vista Config
5. Registra SW (sw.js)
6. Evalua resumen matutino (debeMostrarMatutino)
```

### Pull-to-Refresh

```
1. Evento touchstart/touchmove/touchend en contenedor
2. Si pull > umbral → mostrar skeleton loading
3. POST procesarCorreos (limite: 50)
4. Si hayMas → esperar 6s → POST procesarCorreos (siguiente lote)
5. GET getRegistros → Store.guardarRegistros
6. Evaluar alertas (evaluarAlertas)
7. Re-renderizar lista con datos nuevos
8. Toast "(N) cargas actualizadas"
```

### Cambio de Fase

```
1. Tap [Cambiar fase] → BottomSheet con opciones fase
2. Seleccionar fase → POST actualizarCampo(messageId, 'fase', valor)
3. OK → Feedback.vibrar('corto') + Toast "Fase actualizada a XX"
4. Actualizar registro local en Store
5. Re-renderizar card
6. Si fase tiene sugerencia recordatorio → mostrar bottom sheet sugerencia
```

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Todos los nombres en DICCIONARIO_DOMINIO.md (solo 2 nuevos propuestos)
- [x] Interfaces publicas definidas (API, Store, Feedback, ActionResolver, App)
- [x] Flujos criticos diagramados (init, pull-refresh, cambio fase)

## PUERTA DE VALIDACION 4

- [x] Nombres en docs/DICCIONARIO_DOMINIO.md
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

**Estado:** COMPLETADO
