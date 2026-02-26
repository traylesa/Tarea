# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## OBJETIVO

Corregir 4 vulnerabilidades de robustez en TareaLog que pueden causar fallos silenciosos en uso real: (1) barrido sin timeout, (2) procesamiento masivo sin limite de lote, (3) guardado optimista sin feedback de error, (4) envio masivo sin proteccion contra timeout.

**Por que:** La extension funciona bien en condiciones normales, pero en escenarios de carga real (lunes post-vacaciones con 200+ correos, conexion inestable, envios a 30+ transportistas) puede fallar silenciosamente sin que el operador lo note, causando perdida de datos y desincronizacion cliente-servidor.

---

## ALCANCE

### QUE SI

1. **Timeout en barrido**: AbortController con limite de 5 minutos en fetch de background.js
2. **Procesamiento por lotes**: Limitar a 50 mensajes por ejecucion en Codigo.js/AdaptadorGmail.js
3. **Feedback de guardado**: Indicador visual cuando el servidor falla al persistir cambio en panel.js
4. **Proteccion envio masivo**: Dividir en tandas de 15 destinatarios con progreso visible

### QUE NO

- No se cambia la arquitectura general (sigue siendo fetch + GAS Web App)
- No se implementa cola offline ni retry automatico persistente
- No se migra a WebSockets ni long-polling
- No se cambian endpoints existentes (solo se agregan parametros)

---

## CRITERIOS DE EXITO

| # | Criterio | Metrica |
|---|----------|---------|
| 1 | Barrido cancela tras 5min | Test: fetch con timeout AbortController |
| 2 | GAS procesa max 50 mensajes/ejecucion | Test: lote limitado, resto queda para siguiente ciclo |
| 3 | Error de guardado visible al usuario | Test: feedback visual si fetch falla |
| 4 | Envio masivo funciona con 30+ destinatarios | Test: division en tandas de 15 |
| 5 | Cero tests existentes rotos | Suite completa: 368+ tests pasan |

---

## RESTRICCIONES

- **GAS 6 minutos max**: Tiempo maximo de ejecucion Google Apps Script
- **MV3 service worker**: No hay DOM en background.js, solo APIs Chrome
- **Sin modules**: Scripts via `<script>` tags, orden importa
- **Dual-compat**: Logica pura debe funcionar en GAS y Node (para tests Jest)

---

## RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| AbortController no soportado en MV3 service worker | Baja | Alto | Verificado: MV3 soporta AbortController nativo |
| Lote de 50 deja correos sin procesar permanentemente | Media | Medio | Siguiente barrido automatico los procesa |
| Feedback de error confunde al usuario | Baja | Bajo | Mensaje claro: "No se pudo guardar en servidor. Reintentando..." |
| Division en tandas causa emails duplicados | Media | Alto | Deduplicar por threadId procesado antes de enviar |

---

## CHECKLIST

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados (operador logistico TRAYLESA)
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados con mitigacion

---

**Estado:** COMPLETADO
