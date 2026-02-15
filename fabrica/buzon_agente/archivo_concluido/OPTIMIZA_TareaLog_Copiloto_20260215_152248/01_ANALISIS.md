# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## 1.1 Resumen Ejecutivo

TareaLog es una extensión Chrome que procesa correos Gmail vinculados a cargas de transporte. Actualmente el operador debe abrir la extensión para ver el estado. Este expediente añade un motor de alertas proactivas que evalúa registros tras cada barrido y notifica al operador sin que tenga que mirar.

## 1.2 Situación Actual (AS-IS)

- **background.js** ejecuta barrido periódico → llama `procesarCorreos` en GAS → guarda registros en storage
- Solo genera notificaciones SLA básicas (SLAChecker: cargas próximas a vencer sin correo enviado)
- Sin badge dinámico en icono extensión
- Sin deduplicación de alertas (misma alerta puede repetirse cada barrido)
- Sin configuración de umbrales por tipo de alerta
- Operador debe abrir panel y filtrar manualmente para detectar problemas

## 1.3 Situación Deseada (TO-BE)

- Tras cada barrido, un motor de reglas evalúa 6 condiciones sobre los registros
- Genera alertas categorizadas por nivel (CRITICO, ALTO, MEDIO, BAJO)
- Notificaciones Chrome según nivel de urgencia
- Badge dinámico en icono extensión (número + color)
- Deduplicación: misma alerta no se repite dentro del cooldown
- Umbrales configurables por el operador
- Integración transparente: no rompe nada existente

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Alertas SLA | SLAChecker básico (22 líneas) | 6 reglas de evaluación completas | Crear alerts.js con motor de reglas |
| Notificaciones | Solo SLA vencimiento | Por nivel (CRITICO/ALTO/MEDIO) | Ampliar background.js |
| Badge | No existe | Número + color según alertas | Añadir chrome.action.setBadgeText |
| Deduplicación | No existe | Por ID + cooldown | Lógica en alerts.js |
| Config umbrales | No existe | Por regla en config | Ampliar config.js |
| Resumen GAS | No existe | Endpoint getResumen | Nuevo endpoint en Codigo.js |

---

## 1.5 Historias de Usuario (Sprint 1)

### HU-A1: Alertas proactivas de cargas por vencer

```
COMO operador de tráfico
QUIERO que TareaLog me avise cuando una carga sale HOY y no tiene orden enviada
PARA enviar la orden antes de que sea tarde
```

**Criterios de Aceptación:**
- CA-A1.1 (caso feliz):
  DADO registros con fCarga=HOY y codCar sin estado ENVIADO
  CUANDO se ejecuta evaluación post-barrido
  ENTONCES genera alerta nivel CRITICO si faltan < 2h, ALTO si faltan > 2h
- CA-A1.2 (caso sin datos):
  DADO registros sin campo fCarga
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta (silencioso, sin error)
- CA-A1.3 (caso ya gestionado):
  DADO carga HOY con estado ENVIADO en algún registro del mismo codCar
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta (ya tiene orden)

### HU-A2: Alerta de silencio de transportista

```
COMO operador que envió una orden de carga
QUIERO aviso si el transportista no responde en X horas
PARA llamarle o buscar alternativa antes de que sea tarde
```

**Criterios de Aceptación:**
- CA-A2.1 (caso feliz):
  DADO registro con estado=ENVIADO y (ahora - fechaCorreo) > umbralH y sin estado RECIBIDO en threadId
  CUANDO se ejecuta evaluación
  ENTONCES genera alerta nivel ALTO (escala a CRITICO si < 2h para fCarga)
- CA-A2.2 (caso respondido):
  DADO registro ENVIADO con otro registro RECIBIDO en mismo threadId
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta
- CA-A2.3 (caso cooldown):
  DADO alerta ya generada para este threadId en últimas 1h
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta duplicada

### HU-A3: Alerta de fase estancada

```
COMO operador que supervisa decenas de cargas
QUIERO aviso si una carga lleva demasiado tiempo en la misma fase
PARA investigar si hay un problema no reportado
```

**Criterios de Aceptación:**
- CA-A3.1 (caso feliz):
  DADO registro con fase y (ahora - fechaCorreo) > tiempoMaxFase
  CUANDO se ejecuta evaluación
  ENTONCES genera alerta MEDIO (> 1x tiempoMax) o ALTO (> 2x)
- CA-A3.2 (caso sin fase):
  DADO registro sin campo fase
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta
- CA-A3.3 (caso fase cambiada):
  DADO registro que cambió de fase desde última evaluación
  CUANDO se ejecuta evaluación
  ENTONCES alerta previa se cancela automáticamente

### HU-A4: Alerta de documentación pendiente

```
COMO operador responsable del cierre administrativo
QUIERO aviso de cargas entregadas sin documentar
PARA reclamar justificantes a tiempo
```

**Criterios de Aceptación:**
- CA-A4.1 (caso feliz):
  DADO registro con fase=29 (Vacío) y (ahora - fEntrega) > umbralDias
  CUANDO se ejecuta evaluación
  ENTONCES genera alerta MEDIO (> umbral) o ALTO (> 5 días)
- CA-A4.2 (caso documentado):
  DADO registro que pasó a fase=30 (Documentado)
  CUANDO se ejecuta evaluación
  ENTONCES NO genera alerta
- CA-A4.3 (caso sin fEntrega):
  DADO registro fase=29 sin campo fEntrega
  CUANDO se ejecuta evaluación
  ENTONCES usa fechaCorreo como fallback

### HU-A5: Alerta de incidencia activa

```
COMO operador que no puede estar mirando la tabla
QUIERO aviso inmediato cuando se detecte incidencia (fase 05/25)
PARA reaccionar al instante
```

**Criterios de Aceptación:**
- CA-A5.1 (caso feliz):
  DADO registro con fase=05 o fase=25
  CUANDO se ejecuta evaluación
  ENTONCES genera alerta nivel CRITICO inmediata
- CA-A5.2 (caso resuelta):
  DADO registro que cambió de fase 05/25 a otra
  CUANDO se ejecuta evaluación
  ENTONCES alerta se cancela
- CA-A5.3 (caso múltiples):
  DADO 3 registros con incidencia activa
  CUANDO se ejecuta evaluación
  ENTONCES genera 1 alerta agrupada "3 incidencias activas"

### HU-A6: Badge dinámico y notificaciones por nivel

```
COMO operador con múltiples aplicaciones abiertas
QUIERO ver en el icono de TareaLog cuántas alertas hay y su gravedad
PARA saber si necesito abrir TareaLog sin cambiar de ventana
```

**Criterios de Aceptación:**
- CA-A6.1 (caso feliz):
  DADO alertas evaluadas con 2 CRITICAS y 3 ALTAS
  CUANDO se actualiza badge
  ENTONCES icono muestra "5" en rojo
- CA-A6.2 (caso sin alertas):
  DADO 0 alertas activas
  CUANDO se actualiza badge
  ENTONCES badge se limpia (sin número)
- CA-A6.3 (caso notificación):
  DADO alerta nueva nivel CRITICO
  CUANDO se genera notificación Chrome
  ENTONCES muestra título, mensaje, prioridad 2

---

## 1.6 Requisitos No Funcionales

- **Rendimiento**: Evaluación de reglas < 100ms para 500 registros
- **Memoria**: Máximo 100 alertas en storage simultáneamente
- **Compatibilidad**: Chrome 120+ (Manifest V3)
- **Testabilidad**: Lógica pura sin dependencias de Chrome/DOM
- **Dual-compat**: module.exports para Node.js tests

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Registros sin fechas impiden evaluar reglas | MEDIA | ALTO | Cada regla valida datos antes de evaluar |
| Demasiadas alertas abruman operador | ALTA | ALTO | Deduplicación + cooldown + modo concentración |
| getResumen incrementa tiempo de barrido | MEDIA | MEDIO | Evaluación local con datos ya descargados |
| config.js crece demasiado | BAJA | BAJO | Solo defaults de alertas, el resto en alerts.js |

## 1.8 Dependencias

- **Depende de**: background.js (barrido), config.js (configuración), SLAChecker.js (patrón existente)
- **Dependen de esto**: Sprint 2 (ventana resumen consume alertas), Sprint 3 (recordatorios usan misma infra)

## 1.9 Preguntas Abiertas

- Ninguna bloqueante. Decisiones técnicas se resuelven en Fase 02.

---

## Puerta de Validación 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene mínimo 3 criterios de aceptación
- [x] Riesgos identificados con mitigación
- [x] Sin preguntas abiertas bloqueantes
