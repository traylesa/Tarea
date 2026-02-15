# 01 - ANALISIS

**Fase:** Analisis de Requisitos
**Expediente:** verificar_plan_programados_20260215_002645

---

## 1.1 Resumen Ejecutivo

La feature de envios programados permite a los operadores de TRAYLESA programar respuestas masivas para fecha/hora futura. Un trigger periodico (cada 5 min) procesa la cola dentro de horario laboral configurable. La implementacion ya esta completa en backend GAS y frontend (panel + popup). Falta: tests de scheduled.js y actualizacion del diccionario de dominio.

---

## 1.2 Situacion Actual (AS-IS)

La feature esta **100% implementada** en codigo:

### Backend GAS (3 archivos modificados)
- `Configuracion.js`: HOJA_PROGRAMADOS, HEADERS_PROGRAMADOS, horario laboral
- `AdaptadorHojas.js`: 4 funciones CRUD programados
- `Codigo.js`: 5 endpoints + trigger extendido con LockService

### Frontend Panel (4 archivos)
- `panel.html`: checkbox programar en modal, panel colapsable, config horario
- `panel.js`: ~170 lineas nuevas (programar, cargar, cancelar, horario UI)
- `panel.css`: estilos programados
- `scheduled.js`: modulo logica pura (6 funciones, dual-compat)

### Frontend Popup (2 archivos)
- `popup.html`: panel programados con filtro y tabla
- `popup.js`: funciones popup + fix luxon sorter

### Tests
- **Faltante critico:** No existe `test_scheduled.js`

---

## 1.3 Situacion Deseada (TO-BE)

1. Tests de scheduled.js escritos y pasando (>= 80% cobertura)
2. Diccionario de dominio actualizado con entidad PROGRAMADOS
3. Conformidad plan vs implementacion verificada al 100%
4. Optimizaciones UX documentadas y priorizadas

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Backend GAS | Implementado | Verificado | Auditoria pendiente |
| Frontend panel | Implementado | Verificado | Auditoria pendiente |
| Frontend popup | Implementado | Verificado | Auditoria pendiente |
| Tests scheduled.js | No existen | >= 80% cobertura | Escribir tests |
| Diccionario dominio | Sin entidad PROGRAMADOS | Actualizado | Agregar entidad |
| Optimizaciones UX | No documentadas | Priorizadas | Analizar y documentar |

---

## 1.5 Historias de Usuario

### HU-01: Programar envio masivo
```
COMO operador de logistica
QUIERO programar respuestas masivas para fecha/hora futura
PARA enviar comunicaciones a transportistas en horarios optimos
```

**Criterios de Aceptacion:**
- CA-1.1 (caso feliz): DADO que selecciono registros y marco "Programar envio" CUANDO elijo fecha futura y confirmo ENTONCES se crea registro PENDIENTE en hoja PROGRAMADOS
- CA-1.2 (caso error): DADO que intento programar con fecha pasada CUANDO confirmo ENTONCES veo error "La fecha debe ser futura"
- CA-1.3 (caso borde): DADO que programo 30 envios simultaneos CUANDO el trigger ejecuta ENTONCES procesa max 20 por ciclo y el resto queda para el siguiente

### HU-02: Ver y gestionar cola de programados
```
COMO operador de logistica
QUIERO ver el estado de mis envios programados y cancelar pendientes
PARA mantener control sobre comunicaciones planificadas
```

**Criterios de Aceptacion:**
- CA-2.1 (caso feliz): DADO que abro panel Programados CUANDO hay envios ENTONCES veo tabla con Estado, Interlocutor, Asunto, Fecha programada, Enviado, Acciones
- CA-2.2 (filtro): DADO que filtro por "Pendientes" CUANDO hay pendientes ENTONCES solo veo registros PENDIENTE
- CA-2.3 (cancelar): DADO que pulso "Cancelar" en pendiente CUANDO confirmo ENTONCES estado cambia a CANCELADO

### HU-03: Configurar horario laboral
```
COMO administrador del sistema
QUIERO configurar dias y horas en que se ejecutan envios programados
PARA evitar comunicaciones fuera de horario laboral
```

**Criterios de Aceptacion:**
- CA-3.1 (caso feliz): DADO que configuro Lun-Vie 07-21 CUANDO guardo ENTONCES el trigger respeta esos limites
- CA-3.2 (fuera horario): DADO que es sabado y hay pendientes CUANDO trigger ejecuta ENTONCES omite envios y log "Fuera de horario laboral"
- CA-3.3 (persistencia): DADO que cambio horario desde UI CUANDO actualizo ENTONCES se persiste en PropertiesService

### HU-04: Ver programados desde popup
```
COMO operador de logistica
QUIERO ver programados desde el popup de la extension
PARA consultar rapidamente sin abrir panel completo
```

**Criterios de Aceptacion:**
- CA-4.1 (caso feliz): DADO que pulso "Programados" en popup CUANDO hay envios ENTONCES veo tabla compacta con filtro
- CA-4.2 (cancelar): DADO que cancelo desde popup CUANDO confirmo ENTONCES se cancela y tabla se refresca
- CA-4.3 (badge): DADO que hay N pendientes CUANDO abro popup ENTONCES boton muestra "Programados (N)"

---

## 1.6 Requisitos No Funcionales

| RNF | Descripcion | Estado |
|-----|-------------|--------|
| Concurrencia | LockService evita doble procesamiento | Implementado |
| Rate limit | emailsPorMinuto con Utilities.sleep() | Implementado |
| Timeout | Max 20 envios/ciclo | Implementado |
| Auditabilidad | Cola en Sheets visible y editable | Implementado |
| Horario | Solo envia en horario laboral configurable | Implementado |
| Testabilidad | Logica pura en scheduled.js con dual-compat | Implementado, sin tests |

---

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Precision trigger +-15 min | Alta | Bajo | Aceptable para logistica |
| Timeout cola grande | Media | Medio | Limite 20/ciclo |
| Race conditions | Baja | Alto | LockService |
| Hoja crece sin limite | Media | Bajo | Futuro archivado |
| Rate limit Google | Baja | Alto | sleep() configurable |

---

## 1.8 Dependencias

- **De las que depende:** enviarRespuesta() (AdaptadorGmail), construirPayload() (bulk-reply), PropertiesService
- **Que dependen de esto:** Ninguna feature depende de programados

---

## 1.9 Preguntas Abiertas

- Ninguna. Todas las decisiones del plan estan implementadas y son coherentes.

---

## PUERTA DE VALIDACION 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
