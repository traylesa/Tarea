# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## 1.1 Resumen Ejecutivo

TareaLog funciona correctamente en condiciones normales, pero carece de protecciones contra escenarios de carga real: barridos sin timeout, procesamiento ilimitado en GAS, guardado optimista sin feedback, y envio masivo sin control de tandas. Estas 4 vulnerabilidades causan fallos silenciosos que el operador no detecta.

---

## 1.2 Situacion Actual (AS-IS)

| Componente | Comportamiento actual | Problema |
|------------|----------------------|----------|
| `background.js:ejecutarBarridoPeriodico` | `fetch()` sin timeout ni AbortController | Se cuelga indefinidamente si servidor tarda |
| `Codigo.js:accionProcesarCorreos` | Procesa TODOS los mensajes nuevos sin limite | Timeout GAS (6min) con 200+ correos |
| `AdaptadorGmail.js:obtenerMensajesNuevos` | Retorna todos los mensajes sin limite | Alimenta el problema de lote ilimitado |
| `panel.js:persistirCambio` | `.catch(() => {})` ignora errores servidor | Desincronizacion cliente-servidor silenciosa |
| `panel.js:enviarRespuestaMasiva` | Envia TODOS los seleccionados en 1 request | Timeout GAS con 30+ hilos por Utilities.sleep |

---

## 1.3 Situacion Deseada (TO-BE)

| Componente | Comportamiento deseado |
|------------|----------------------|
| `background.js` | fetch con AbortController (300s), guard contra barridos superpuestos |
| `Codigo.js` | Acepta parametro `limite` (default 50), retorna `hayMas: true` si quedaron pendientes |
| `AdaptadorGmail.js` | `obtenerMensajesNuevos(timestamp, limite)` con parametro limite |
| `panel.js:persistirCambio` | Toast de error si servidor falla, 1 retry automatico, borde rojo en celda |
| `panel.js:enviarRespuestaMasiva` | Division en tandas de 15, progreso "Enviando tanda 2/3..." |

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Timeout fetch | Sin timeout | AbortController 300s | Agregar AbortController + guard |
| Lote procesamiento | Ilimitado | Max 50/ejecucion | Parametro limite en GAS |
| Feedback guardado | `.catch(() => {})` | Toast + retry + borde rojo | UI feedback + retry |
| Envio masivo | 1 request todos | Tandas de 15 | Division + progreso |
| Config defaults | No existen | 3 nuevos defaults | Agregar en config.js |

---

## 1.5 Historias de Usuario

### HU-1: Timeout en barrido periodico

```
COMO operador logistico
QUIERO que el barrido se cancele automaticamente si tarda mas de 5 minutos
PARA que la extension no se quede colgada y pueda reintentar en el siguiente ciclo
```

**Criterios de Aceptacion:**

- CA-1.1 (caso feliz):
  DADO que el barrido esta en ejecucion
  CUANDO pasan 300 segundos sin respuesta
  ENTONCES el fetch se cancela y se registra en console.error

- CA-1.2 (caso concurrencia):
  DADO que un barrido esta en ejecucion
  CUANDO la alarma dispara otro barrido
  ENTONCES el segundo se ignora (guard `barridoEnCurso`)

- CA-1.3 (caso recuperacion):
  DADO que el barrido fallo por timeout
  CUANDO llega el siguiente ciclo
  ENTONCES se ejecuta normalmente (flag limpio)

---

### HU-2: Procesamiento por lotes en GAS

```
COMO sistema backend
QUIERO procesar maximo 50 mensajes por ejecucion
PARA no exceder el limite de 6 minutos de Google Apps Script
```

**Criterios de Aceptacion:**

- CA-2.1 (caso con exceso):
  DADO que hay 120 mensajes nuevos
  CUANDO se ejecuta accionProcesarCorreos
  ENTONCES procesa 50 y responde con `hayMas: true`

- CA-2.2 (caso sin exceso):
  DADO que hay 30 mensajes nuevos
  CUANDO se ejecuta accionProcesarCorreos
  ENTONCES procesa los 30 y responde con `hayMas: false`

- CA-2.3 (caso continuacion):
  DADO que la respuesta indica `hayMas: true`
  CUANDO background.js la recibe
  ENTONCES programa barrido adicional inmediato

---

### HU-3: Feedback de error en guardado

```
COMO operador logistico
QUIERO ver un indicador cuando un cambio no se guardo en el servidor
PARA saber que debo reintentar o que hay un problema de conexion
```

**Criterios de Aceptacion:**

- CA-3.1 (caso error):
  DADO que edito un campo en la tabla
  CUANDO el servidor responde con error o no responde
  ENTONCES aparece toast rojo "Error al guardar. Reintentando..." durante 5s

- CA-3.2 (caso retry exitoso):
  DADO que el primer intento fallo
  CUANDO el retry automatico funciona
  ENTONCES muestra toast verde "Guardado correctamente"

- CA-3.3 (caso fallo total):
  DADO que ambos intentos fallaron
  CUANDO se muestra el error final
  ENTONCES la celda se marca con borde rojo (desincronizada)

---

### HU-4: Envio masivo por tandas

```
COMO operador logistico
QUIERO que los envios masivos se dividan en tandas de 15
PARA que no falle por timeout cuando envio a muchos transportistas
```

**Criterios de Aceptacion:**

- CA-4.1 (caso con tandas):
  DADO que selecciono 30 correos para respuesta masiva
  CUANDO pulso "Enviar"
  ENTONCES se envian en 2 tandas mostrando "Enviando tanda 1/2..."

- CA-4.2 (caso tanda falla):
  DADO que una tanda falla
  CUANDO el servidor devuelve error
  ENTONCES muestra cuantos se enviaron OK y cuantos fallaron

- CA-4.3 (caso sin tandas):
  DADO que selecciono 10 correos (< limite)
  CUANDO pulso "Enviar"
  ENTONCES se envian en 1 tanda sin cambio visible

---

## 1.6 Requisitos No Funcionales

| # | Requisito | Valor |
|---|-----------|-------|
| RNF-1 | Timeout configurable | Default 300s, via config.js |
| RNF-2 | Limite lote configurable | Default 50, via config.js |
| RNF-3 | Tamano tanda configurable | Default 15, via config.js |
| RNF-4 | Cero regresiones | 368+ tests existentes siguen pasando |
| RNF-5 | Compatibilidad dual | Logica pura testeable en Node (Jest) |

---

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| AbortController en MV3 | Baja | Alto | Soportado nativamente en Chromium |
| Correos sin procesar permanentemente | Media | Medio | Siguiente barrido los procesa automaticamente |
| Toast de error confunde usuario | Baja | Bajo | Mensaje claro y autoexplicativo |
| Tandas causan duplicados | Media | Alto | Deduplicar por threadId procesado |

---

## 1.8 Dependencias

**Este expediente depende de:**
- `config.js`: Agregar 3 nuevos defaults
- `background.js`: Modificar barrido
- `Codigo.js` + `AdaptadorGmail.js`: Lote en backend
- `panel.js` + `panel.css`: UI feedback

**Dependen de este expediente:**
- Ninguno (mejora de robustez independiente)

---

## 1.9 Preguntas Abiertas

Ninguna. Los 4 problemas y sus soluciones estan bien definidos.

---

## >>> PUERTA DE VALIDACION 1 <<<

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion (caso feliz + error + borde)
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
