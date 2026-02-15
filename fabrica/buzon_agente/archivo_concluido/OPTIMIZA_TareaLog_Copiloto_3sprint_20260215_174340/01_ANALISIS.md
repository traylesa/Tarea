# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## 1.1 Resumen Ejecutivo

Sprint 3 implementa recordatorios con snooze para operadores de trafico. Permite crear recordatorios manuales asociados a cargas y recibir sugerencias automaticas al cambiar fase. Persistencia via chrome.storage.local + chrome.alarms.

---

## 1.2 Situacion Actual (AS-IS)

- Sprint 1: Motor alertas proactivas (5 reglas R2-R6), 42 tests
- Sprint 2: Resumen matutino + bajo demanda (ventana popup), 28 tests
- El operador recibe alertas pasivas pero NO puede programar recordatorios propios
- No hay forma de "posponer" una tarea para mas tarde
- Al cambiar una fase no se sugiere ningun seguimiento

---

## 1.3 Situacion Deseada (TO-BE)

- Boton "Recordar" en cada fila de la tabla para crear recordatorio
- Modal con texto libre y presets de tiempo
- Notificacion Chrome al cumplirse con botones snooze (15min, 1h, manana)
- Panel "Mis recordatorios" visible con countdown
- Sugerencias automaticas al cambiar fase
- Todo persistente (sobrevive cierre navegador)

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Recordatorios | No existen | Manuales + sugeridos | reminders.js nuevo |
| Persistencia | Solo alertas en storage | + recordatorios | storage key nueva |
| Alarmas Chrome | 2 (barrido + matutino) | + 1 recordatorios | Alarma periodica nueva |
| Notificaciones | Solo alertas | + recordatorios con botones | Listener botones snooze |
| Config | Alertas + resumen | + sugerencias por fase | Defaults nuevos |

---

## 1.5 Historias de Usuario

### HU-07: Recordatorios manuales con snooze

```
COMO operador que tiene que hacer algo "dentro de un rato"
QUIERO programar un recordatorio asociado a una carga con opciones de posponer
PARA no depender de mi memoria con 60+ cargas activas
```

**Criterios de Aceptacion:**

- CA-7.1 (caso feliz — crear):
  DADO una fila de carga visible en la tabla
  CUANDO el operador pulsa "Recordar" e introduce texto + selecciona "En 2h"
  ENTONCES se crea recordatorio con id unico, texto, codCar, fechaDisparo = ahora+2h

- CA-7.2 (caso feliz — notificar):
  DADO un recordatorio programado para las 11:00
  CUANDO el reloj alcanza las 11:00
  ENTONCES se muestra notificacion Chrome con titulo, texto y botones [Snooze 15min] [Snooze 1h] [Hecho]

- CA-7.3 (caso feliz — snooze):
  DADO una notificacion de recordatorio activa
  CUANDO el operador pulsa "Snooze 15min"
  ENTONCES fechaDisparo se actualiza a ahora+15min y snoozeCount incrementa en 1

- CA-7.4 (caso feliz — completar):
  DADO una notificacion de recordatorio activa
  CUANDO el operador pulsa "Hecho"
  ENTONCES el recordatorio se elimina del storage

- CA-7.5 (caso borde — persistencia):
  DADO un recordatorio activo
  CUANDO el navegador se cierra y se reabre
  ENTONCES el recordatorio sigue activo via chrome.alarms

- CA-7.6 (caso borde — limite):
  DADO 50 recordatorios activos
  CUANDO se intenta crear uno nuevo
  ENTONCES se muestra error "Limite de recordatorios alcanzado"

- CA-7.7 (panel):
  DADO recordatorios activos
  CUANDO el operador abre "Mis recordatorios"
  ENTONCES ve lista con texto, carga, countdown y boton eliminar

### HU-08: Recordatorios automaticos sugeridos

```
COMO operador que a veces olvida hacer seguimiento
QUIERO que el sistema sugiera recordatorios basados en la fase de la carga
PARA que el seguimiento sea proactivo sin esfuerzo
```

**Criterios de Aceptacion:**

- CA-8.1 (caso feliz — sugerencia):
  DADO una carga que cambia a fase "19 Cargado"
  CUANDO se detecta el cambio de fase
  ENTONCES se genera sugerencia "Verificar descarga" con hora estimada

- CA-8.2 (caso feliz — aceptar):
  DADO una sugerencia de recordatorio
  CUANDO el operador acepta
  ENTONCES se crea recordatorio con origen='sugerido' y comportamiento identico a manual

- CA-8.3 (caso feliz — descartar):
  DADO una sugerencia de recordatorio
  CUANDO el operador descarta
  ENTONCES no se crea recordatorio y la sugerencia desaparece

- CA-8.4 (caso config):
  DADO sugerencias desactivadas en config
  CUANDO cambia una fase
  ENTONCES no se genera ninguna sugerencia

---

## 1.6 Requisitos No Funcionales

- **Rendimiento:** Crear recordatorio < 100ms, evaluar pendientes < 50ms
- **Persistencia:** Sobrevivir cierre navegador (chrome.storage + chrome.alarms)
- **Limite:** Max 50 recordatorios activos simultaneos
- **Compatibilidad:** Chrome 120+ (MV3)

---

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| chrome.alarms limite 1/min | MEDIA | ALTO | Alarma periodica unica cada 1 min |
| Storage crece indefinido | BAJA | MEDIO | Limitar a 50 + auto-limpiar completados |
| panel.js crece demasiado | MEDIA | MEDIO | Toda logica en reminders.js |

---

## 1.8 Dependencias

- **Depende de:** Sprint 1 (alerts.js para patron), Sprint 2 (background.js alarmas)
- **Es base para:** Sprint 4 (acciones contextuales podrian crear recordatorios)

---

## Puerta de Validacion 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas

**Estado:** COMPLETADO
