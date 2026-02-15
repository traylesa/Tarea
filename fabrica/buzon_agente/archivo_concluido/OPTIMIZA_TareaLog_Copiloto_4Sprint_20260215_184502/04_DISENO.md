# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502

---

## Arquitectura

```
panel.js (UI) ──→ action-bar.js (logica pura)
    │                 └─ ACCIONES_POR_GRUPO: mapa estatico
    │
    └──────────→ notes.js (logica pura)
                      └─ CRUD sobre almacen { codCar: [notas] }
```

Ambos modulos son logica pura sin DOM. panel.js los consume para renderizar UI.

---

## Modelo de Datos

### ACCION_CONTEXTUAL (nuevo)

Accion rapida asociada a un grupo de fase.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `etiqueta` | string | Texto del boton (ej: "Reclamar POD") |
| `faseSiguiente` | string/null | Fase a la que avanza al ejecutar (null = no cambia) |
| `plantilla` | string/null | Alias de plantilla a preseleccionar (null = ninguna) |

### GRUPO_FASE (nuevo)

Agrupacion de fases para determinar acciones disponibles.

| Grupo | Fases | Acciones |
|-------|-------|----------|
| `espera` | 00, 01, 02 | "Confirmar hora carga", "Retrasar carga" |
| `carga` | 11, 12 | "Solicitar posicion", "Avisar destino" |
| `en_ruta` | 19 | "Verificar ETA", "Avisar destino" |
| `descarga` | 21, 22 | "Confirmar descarga" |
| `vacio` | 29 | "Reclamar POD", "Marcar documentado" |
| `incidencia` | 05, 25 | "Solicitar detalle", "Escalar responsable" |

### NOTA_CARGA (nuevo)

Nota rapida asociada a una carga.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (nota_timestamp_random) |
| `texto` | string | Contenido de la nota |
| `fechaCreacion` | string (ISO) | Timestamp creacion |

### STORAGE_KEYS (nuevas)

| Clave | Tipo | Descripcion |
|-------|------|-------------|
| `tarealog_notas` | object | Mapa `{ [codCar]: NOTA_CARGA[] }` |

---

## Interfaces Publicas

### action-bar.js

```javascript
// Constantes
var ACCIONES_POR_GRUPO = { espera: [...], carga: [...], ... };

// Obtiene grupo de fase (espera, carga, en_ruta, etc.)
function obtenerGrupoFase(codigoFase)  // → string|null

// Retorna acciones disponibles para una fase
function obtenerAccionesPorFase(codigoFase)  // → ACCION_CONTEXTUAL[]
```

### notes.js

```javascript
var MAX_NOTAS_POR_CARGA = 50;

// Crea nota asociada a codCar
function crearNota(texto, codCar, almacen, ahora)  // → { almacen, nota }

// Obtiene notas de un codCar (recientes primero)
function obtenerNotas(codCar, almacen)  // → NOTA_CARGA[]

// Elimina nota por id
function eliminarNota(id, codCar, almacen)  // → almacen actualizado

// Cuenta notas de un codCar
function contarNotas(codCar, almacen)  // → number

// Verifica si codCar tiene notas
function tieneNotas(codCar, almacen)  // → boolean
```

---

## Flujos de Ejecucion

### Flujo 1: Accion contextual

1. Operador selecciona fila en tabla (fase = '29')
2. panel.js llama `obtenerAccionesPorFase('29')`
3. Recibe `[{etiqueta: "Reclamar POD", ...}, {etiqueta: "Marcar documentado", ...}]`
4. Renderiza botones en barra de acciones
5. Click en "Reclamar POD" → preselecciona plantilla + prepara envio

### Flujo 2: Nota rapida

1. Operador hace click en icono nota de fila (codCar 168345)
2. panel.js carga `obtenerNotas(168345, almacen)` → muestra historial
3. Operador escribe texto + Enter
4. panel.js llama `crearNota(texto, 168345, almacen, new Date())`
5. Guarda almacen actualizado en chrome.storage.local

---

## Nombres en Diccionario

**Nombres nuevos a registrar (ver PROPUESTA_DICCIONARIO.md):**
- Entidad: ACCION_CONTEXTUAL
- Entidad: NOTA_CARGA
- Enum: GRUPO_FASE
- Storage: tarealog_notas
- Glosario: accion contextual, nota de carga, grupo de fase

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Nombres propuestos para DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas
- [x] Flujos criticos documentados
- [x] Validaciones especificadas (texto vacio, limite 50)

---

**Estado:** COMPLETADO
