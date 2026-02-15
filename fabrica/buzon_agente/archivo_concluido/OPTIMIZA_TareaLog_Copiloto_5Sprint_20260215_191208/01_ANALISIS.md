# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## 1.1 Resumen Ejecutivo

Sprint 5 cierra TareaLog Copiloto con 5 HUs: dashboard personal (HU-14), historial de acciones (HU-15), secuencias de follow-up (HU-09), reporte fin de turno (HU-10), e integración UI de action-bar + notes del Sprint 4. Crea 4 módulos lógica pura nuevos + ~62 tests.

## 1.2 Situación Actual (AS-IS)

- 19 archivos JS propios (~5,800 líneas), 169 tests pasando
- action-bar.js (69 lín, 27 tests) y notes.js (89 lín, 30 tests) listos pero **sin integrar en UI**
- No hay dashboard de KPIs — el operador debe contar manualmente
- No hay historial de acciones — no se puede auditar qué se hizo con una carga
- No hay secuencias automáticas — el operador reclama documentos manualmente cada vez
- No hay reporte fin de turno — el operador cierra jornada sin resumen formal

## 1.3 Situación Deseada (TO-BE)

- Dashboard "Mi Turno" como primera vista con KPIs y gráfico semanal
- Historial auditable por carga con cronología de acciones
- Secuencias de follow-up que envían emails automáticamente si no hay respuesta
- Reporte fin de turno con cargas gestionadas y pendientes
- Action-bar y notas visibles e interactivas en la tabla del panel

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Visibilidad KPIs | Ninguna | Dashboard con métricas | dashboard.js + UI |
| Trazabilidad | Solo notas manuales | Historial auto por carga | action-log.js + UI |
| Follow-up docs | Manual repetitivo | Secuencias automáticas | sequences.js + background |
| Cierre turno | Informal | Reporte automático | shift-report.js + alarma |
| UI action-bar/notes | Lógica sin UI | Integrada en panel | panel.js + panel.html |

---

## 1.5 Historias de Usuario

### HU-14: Dashboard "Mi Turno"

```
COMO operador que empieza su jornada
QUIERO una vista resumen visual como primera pantalla
PARA saber instantáneamente qué requiere mi atención
```

**Criterios de Aceptación:**

- CA-14.1 (caso feliz — KPIs):
  DADO que el operador abre el panel con registros cargados
  CUANDO se renderiza el dashboard
  ENTONCES muestra: cargas activas por grupo de fase, alertas urgentes, recordatorios pendientes hoy, cargas cerradas hoy/semana

- CA-14.2 (caso feliz — gráfico):
  DADO que hay datos de cargas cerradas de los últimos 7 días
  CUANDO se calcula el mini-gráfico
  ENTONCES muestra barras proporcionales por día con valores numéricos

- CA-14.3 (caso borde — sin datos):
  DADO que no hay registros cargados
  CUANDO se renderiza el dashboard
  ENTONCES muestra KPIs en 0 y mensaje "Sin datos disponibles"

- CA-14.4 (caso feliz — empezar gestión):
  DADO que hay cargas sin gestionar
  CUANDO el operador pulsa "Empezar gestión"
  ENTONCES filtra la tabla mostrando solo cargas sin GESTIONADO

### HU-15: Historial de acciones

```
COMO operador al que le preguntan por una carga
QUIERO ver cronología de todas las acciones realizadas
PARA responder rápido a supervisores o clientes
```

**Criterios de Aceptación:**

- CA-15.1 (caso feliz — registro):
  DADO que el operador realiza una acción (email, cambio fase, recordatorio, nota)
  CUANDO se ejecuta la acción
  ENTONCES se registra en historial con timestamp, tipo y descripción

- CA-15.2 (caso feliz — consulta):
  DADO que una carga tiene historial de acciones
  CUANDO el operador expande la carga
  ENTONCES ve cronología ordenada desc con formato "DD/MM HH:mm | Tipo: Descripción"

- CA-15.3 (caso feliz — filtro):
  DADO que hay múltiples tipos de acciones en el historial
  CUANDO el operador filtra por tipo (email, fase, recordatorio, nota)
  ENTONCES solo muestra acciones de ese tipo

- CA-15.4 (caso borde — rotación):
  DADO que hay entradas con más de 30 días de antigüedad
  CUANDO se ejecuta rotación
  ENTONCES elimina entradas > 30 días manteniendo las recientes

### HU-09: Secuencia de follow-up

```
COMO operador que tiene que reclamar documentos repetidamente
QUIERO programar una secuencia de emails automática
PARA que los documentos se reclamen sin intervención manual repetitiva
```

**Criterios de Aceptación:**

- CA-9.1 (caso feliz — crear):
  DADO que el operador selecciona una carga en fase vacio (29)
  CUANDO lanza secuencia "Reclamar POD"
  ENTONCES se crean 3 pasos: solicitar (día 1), recordar (día 3), escalar (día 7)

- CA-9.2 (caso feliz — detención automática):
  DADO que hay una secuencia activa con pasos pendientes
  CUANDO se recibe respuesta en el threadId de la carga
  ENTONCES la secuencia se detiene automáticamente

- CA-9.3 (caso feliz — cancelación manual):
  DADO que hay una secuencia activa
  CUANDO el operador la cancela
  ENTONCES se marcan todos los pasos pendientes como cancelados

- CA-9.4 (caso borde — máximo pasos):
  DADO que se intenta crear secuencia con más de 3 pasos
  CUANDO se valida
  ENTONCES rechaza con error "Máximo 3 pasos por secuencia"

### HU-10: Reporte fin de turno

```
COMO operador que termina su jornada
QUIERO recibir un resumen automático de lo gestionado y pendiente
PARA tener cierre de turno limpio
```

**Criterios de Aceptación:**

- CA-10.1 (caso feliz — generación):
  DADO que llega la hora configurada de fin de turno
  CUANDO se genera el reporte
  ENTONCES contiene: cargas gestionadas hoy, incidencias activas, recordatorios pendientes

- CA-10.2 (caso feliz — KPIs):
  DADO que hay actividad del día
  CUANDO se calculan KPIs
  ENTONCES muestra: cargas cerradas, emails enviados, tiempo promedio

- CA-10.3 (caso borde — sin actividad):
  DADO que no hubo actividad en el turno
  CUANDO se genera reporte
  ENTONCES muestra "Sin actividad registrada" con KPIs en 0

### Integración UI Sprint 4

```
COMO operador usando el panel de datos
QUIERO ver acciones contextuales y notas por carga
PARA actuar rápidamente según la fase de cada carga
```

**Criterios de Aceptación:**

- CA-S4.1 (caso feliz — action-bar):
  DADO que el operador selecciona una fila de la tabla
  CUANDO la carga está en fase con acciones definidas
  ENTONCES aparece barra con botones de acciones contextuales

- CA-S4.2 (caso feliz — notes):
  DADO que una carga tiene notas
  CUANDO el operador ve la tabla
  ENTONCES hay indicador visual (icono) que abre modal con historial de notas

- CA-S4.3 (caso borde — sin fase):
  DADO que una carga no tiene fase asignada
  CUANDO se consultan acciones
  ENTONCES no se muestra barra de acciones

---

## 1.6 Requisitos No Funcionales

- **Rendimiento:** Dashboard calcula KPIs en < 50ms para 500 registros
- **Storage:** Historial con rotación automática (max 30 días, ~500KB estimado)
- **Compatibilidad:** Chrome 120+ (Manifest V3)
- **Testabilidad:** Lógica pura sin DOM, cobertura >= 80%

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| panel.js supera 2,500 líneas | ALTA | MEDIO | Delegar 100% lógica a módulos puros |
| Secuencias requieren endpoint GAS | MEDIA | ALTO | Usar tabla `programados` existente |
| Storage excede cuota Chrome | BAJA | ALTO | Rotación 30 días en historial |
| Conflicto alarmas background | BAJA | MEDIO | Nombres únicos, reusar alarmas existentes |

## 1.8 Dependencias

- **Depende de:** config.js (auto-migración), alert-summary.js (HU-10 reutiliza ventana), programados/scheduled.js (HU-09 usa cola)
- **Dependen de esto:** Ninguno (sprint final)

## 1.9 Preguntas Abiertas

Ninguna. Todas las HUs tienen especificación suficiente.

---

## PUERTA DE VALIDACIÓN 1: ✅ SUPERADA

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene mínimo 3 criterios de aceptación
- [x] Riesgos identificados con mitigación
- [x] Sin preguntas abiertas

**Estado:** COMPLETADO
