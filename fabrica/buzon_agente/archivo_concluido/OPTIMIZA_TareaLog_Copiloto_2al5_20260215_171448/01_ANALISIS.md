# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## 1.1 Resumen Ejecutivo

Sprint 2 implementa la ventana de resumen de alertas para TareaLog. El motor de reglas (alerts.js, 5 reglas, 42 tests) ya evalua alertas tras cada barrido y muestra badge + notificaciones individuales. Falta una vista consolidada que agrupe alertas por categoria (urgente, sin respuesta, documentacion, incidencias), muestre KPIs y permita click-through al panel filtrado. Se implementan HU-01 (resumen matutino automatico) y HU-13 (resumen bajo demanda).

---

## 1.2 Situacion Actual (AS-IS)

- **alerts.js** evalua 5 reglas (R2-R6) y genera array de alertas con nivel, titulo, mensaje
- **background.js** ejecuta `_evaluarYNotificarAlertas()` tras cada barrido periodico
- Badge dinamico en icono de extension (texto + color segun nivel maximo)
- Notificaciones Chrome individuales para alertas CRITICO/ALTO
- Alertas persistidas en `chrome.storage.local.tarealog_alertas`
- **No existe** vista consolidada, ni categorias agrupadas, ni KPIs
- **No existe** resumen matutino automatico al inicio del turno
- **No existe** boton "Resumen" en el panel

---

## 1.3 Situacion Deseada (TO-BE)

- Ventana popup standalone (`alert-summary.html`) que muestra alertas agrupadas por categoria
- Se abre automaticamente 1 vez/dia al primer barrido despues de la hora configurada (resumen matutino)
- Se abre bajo demanda con boton "Resumen" en el panel principal
- Cada categoria es clickable: abre panel con filtros Tabulator aplicados
- KPIs visibles: cargas activas, alertas, sin respuesta, sin docs
- Botones: Posponer 1h, Cerrar, Abrir Panel
- Configuracion: activar/desactivar matutino + hora inicio en tab Config

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Vista alertas | Notificaciones individuales | Ventana consolidada con categorias | alert-summary.js/html/css |
| Resumen matutino | No existe | Automatico 1x/dia al inicio turno | Alarma + flag en storage |
| Resumen bajo demanda | No existe | Boton en panel | Handler + listener en background.js |
| Click-through | No existe | Click categoria -> panel filtrado | Filtros Tabulator + storage temporal |
| KPIs | No existe | Badges con metricas clave | Funcion calcularKPIs |
| Config matutino | No existe | Checkbox + hora en tab Config | config.js defaults + config-ui.js |

---

## 1.5 Historias de Usuario

### HU-01: Resumen matutino

```
COMO operador que acaba de empezar turno
QUIERO ver automaticamente un resumen de la situacion
PARA priorizar mi trabajo sin revisar manualmente cada carga
```

**Criterios de Aceptacion:**

- CA-1.1 (caso feliz — matutino se muestra):
  DADO que es el primer barrido tras horaInicio configurada Y no se ha mostrado hoy
  CUANDO background.js evalua alertas
  ENTONCES se abre ventana resumen con categorias: URGENTE, SIN RESPUESTA, DOCUMENTACION, INCIDENCIAS

- CA-1.2 (caso no-repeticion):
  DADO que el resumen matutino ya se mostro hoy (flag con fecha en storage)
  CUANDO se ejecuta otro barrido
  ENTONCES NO se abre ventana resumen automaticamente

- CA-1.3 (caso desactivado):
  DADO que resumenMatutino.activado = false en config
  CUANDO se ejecuta barrido tras horaInicio
  ENTONCES NO se abre ventana resumen

- CA-1.4 (caso posponer):
  DADO que el resumen matutino se muestra
  CUANDO el operador pulsa "Posponer 1h"
  ENTONCES la ventana se cierra Y se reabrira en 1 hora

- CA-1.5 (caso click-through):
  DADO que el resumen muestra "3 cargas sin orden"
  CUANDO el operador hace click en esa categoria
  ENTONCES se abre/enfoca el panel con filtro de regla R6 aplicado

- CA-1.6 (caso sin alertas):
  DADO que no hay alertas activas
  CUANDO se evalua el resumen matutino
  ENTONCES NO se abre ventana (nada que mostrar)

### HU-13: Resumen bajo demanda

```
COMO operador en medio del turno
QUIERO pedir un resumen rapido con 1 click
PARA tener vision global instantanea sin filtrar
```

**Criterios de Aceptacion:**

- CA-13.1 (caso feliz):
  DADO que hay alertas en storage
  CUANDO el operador pulsa boton "Resumen" en panel
  ENTONCES se abre ventana resumen con datos actualizados

- CA-13.2 (caso sin alertas):
  DADO que no hay alertas en storage
  CUANDO el operador pulsa boton "Resumen"
  ENTONCES se abre ventana con mensaje "Sin alertas activas" y KPIs en 0

- CA-13.3 (caso rendimiento):
  DADO cualquier cantidad de alertas
  CUANDO se abre la ventana resumen
  ENTONCES carga en menos de 3 segundos

---

## 1.6 Requisitos No Funcionales

- **Rendimiento**: Ventana carga < 3 segundos, categorizacion < 50ms
- **Persistencia**: Flag matutino sobrevive cierre de navegador (chrome.storage.local)
- **Compatibilidad**: Chrome 120+ (Manifest V3)
- **Escalabilidad**: Funciona con 0-500 alertas sin degradacion
- **UX**: Tarjetas colapsables, colores por nivel, KPIs clickables

---

## 1.7 Dependencias

- **Depende de:** alerts.js (motor reglas), background.js (barrido periodico), config.js (defaults)
- **Dependen de esto:** Sprints futuros (3-5) reutilizaran ventana resumen para recordatorios, etc.

---

## 1.8 Preguntas Abiertas

Ninguna. El WBS del archivo fuente es suficientemente detallado para proceder.

---

## Puerta de Validacion 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion (ver 00_ESTRATEGIA)
- [x] Sin preguntas abiertas

**Estado:** COMPLETADO
