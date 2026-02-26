# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## Arquitectura

Nuevo modulo `resilience.js` con logica pura (sin DOM, sin chrome.*). Se integra en background.js y panel.js via funciones importadas. Patron dual-compat existente.

```
src/extension/
├── resilience.js    ← NUEVO: logica pura robustez
├── background.js    ← MODIFICADO: usa fetchConTimeout + guard
├── panel.js         ← MODIFICADO: usa persistirConRetry + tandas
├── panel.css        ← MODIFICADO: estilos toast + celda-error
├── panel.html       ← MODIFICADO: contenedor toast
└── config.js        ← MODIFICADO: 3 nuevos defaults

src/gas/
├── Codigo.js        ← MODIFICADO: parametro limite + hayMas
└── AdaptadorGmail.js ← MODIFICADO: parametro limite
```

---

## Modelo de Datos

### Nuevos defaults en config.js

Nombres verificados en DICCIONARIO_DOMINIO.md (a proponer):

| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `timeoutBarridoMs` | number | 300000 | Timeout fetch barrido (5 min) |
| `limiteLoteProcesamiento` | number | 50 | Max mensajes por ejecucion GAS |
| `tamanoTandaEnvio` | number | 15 | Max destinatarios por tanda masiva |

### No hay nuevas entidades de storage

Los cambios son comportamentales, no de datos.

---

## Interfaces

### resilience.js (logica pura, dual-compat)

```javascript
// Divide array en sub-arrays de tamano fijo
function dividirEnTandas(items, tamano) → array[]

// Limita mensajes y reporta si hay mas
function limitarMensajes(mensajes, limite) → { lote: array, hayMas: boolean }

// Ejecuta fn async con 1 retry. Retorna {ok, error?}
function ejecutarConRetry(fn, maxIntentos) → Promise<{ok, error?}>
```

### Cambios en Codigo.js

```javascript
// ANTES:
function accionProcesarCorreos() { ... }

// DESPUES:
function accionProcesarCorreos(body) {
  var limite = (body && body.limite) || 50;
  // ... procesa hasta `limite` mensajes ...
  return respuestaJson({
    ok: true,
    procesados: N,
    errores: M,
    hayMas: mensajes.length > limite,
    registros: registrosActualizados
  });
}
```

### Cambios en AdaptadorGmail.js

```javascript
// ANTES:
function obtenerMensajesNuevos(ultimoTimestamp) { ... return mensajes; }

// DESPUES:
function obtenerMensajesNuevos(ultimoTimestamp, limite) {
  // ... igual pero con break cuando mensajes.length >= limite ...
  return mensajes; // max `limite` elementos
}
```

### Cambios en background.js

```javascript
// Guard contra barridos superpuestos
var _barridoEnCurso = false;

async function ejecutarBarridoPeriodico() {
  if (_barridoEnCurso) return;
  _barridoEnCurso = true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutBarridoMs || 300000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    // ... procesar respuesta ...
    if (data.hayMas) {
      chrome.alarms.create('BARRIDO_CONTINUACION', { delayInMinutes: 0.1 });
    }
  } finally {
    _barridoEnCurso = false;
  }
}
```

### Cambios en panel.js — persistirCambio

```javascript
async function persistirCambio(cell) {
  // 1. Guardar local (optimista)
  // 2. Enviar a servidor con retry
  const resultado = await ejecutarConRetry(
    () => fetch(url, { method: 'POST', body: JSON.stringify(payload) }),
    2
  );
  if (!resultado.ok) {
    mostrarToast('Error al guardar. Comprueba la conexion.', 'error');
    marcarCeldaError(cell);
  }
}
```

### Cambios en panel.js — enviarRespuestaMasiva

```javascript
async function enviarRespuestaMasiva() {
  const tandas = dividirEnTandas(payload.destinatarios, config.tamanoTandaEnvio || 15);
  let enviados = 0, fallidos = 0;
  for (let i = 0; i < tandas.length; i++) {
    btnEnviar.textContent = 'Enviando tanda ' + (i+1) + '/' + tandas.length + '...';
    const tandaPayload = { ...payload, destinatarios: tandas[i] };
    try {
      await fetch(url, { method: 'POST', body: JSON.stringify(tandaPayload) });
      enviados += tandas[i].length;
    } catch (err) {
      fallidos += tandas[i].length;
    }
  }
  // Mostrar resumen
}
```

---

## Flujos de Ejecucion

### Flujo 1: Barrido con timeout
1. Alarma dispara `ejecutarBarridoPeriodico`
2. Guard: si `_barridoEnCurso` → salir
3. Crear AbortController con timeout 300s
4. fetch con signal
5. Si timeout → AbortError → console.error, limpiar flag
6. Si OK → procesar datos, si `hayMas` → crear alarma continuacion
7. Limpiar flag `_barridoEnCurso`

### Flujo 2: Procesamiento por lotes
1. `accionProcesarCorreos` recibe `{limite: 50}`
2. `obtenerMensajesNuevos(ts, 50)` → max 50 mensajes
3. Procesar los 50
4. Retornar `{hayMas: true/false, registros: [...]}`

### Flujo 3: Guardado con feedback
1. Usuario edita celda
2. Guardar local (optimista)
3. fetch servidor (intento 1)
4. Si falla → retry (intento 2)
5. Si ambos fallan → toast rojo + borde rojo en celda
6. Si retry OK → toast verde

### Flujo 4: Envio masivo por tandas
1. Usuario selecciona N correos y pulsa Enviar
2. `dividirEnTandas(destinatarios, 15)` → K tandas
3. Loop: enviar tanda i, actualizar "Enviando tanda i/K..."
4. Acumular enviados/fallidos
5. Mostrar resumen final

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Todos los nombres verificados en DICCIONARIO_DOMINIO.md (propuesta pendiente)
- [x] Interfaces publicas definidas (4 funciones nuevas)
- [x] Flujos criticos diagramados (4 flujos)
- [x] Validaciones especificadas

---

## >>> PUERTA DE VALIDACION 4 <<<

- [x] Nombres consultados en docs/DICCIONARIO_DOMINIO.md
- [x] Modelos coherentes con arquitectura existente (dual-compat, script tags)
- [x] Interfaces definidas (resilience.js API completa)

---

**Estado:** COMPLETADO
