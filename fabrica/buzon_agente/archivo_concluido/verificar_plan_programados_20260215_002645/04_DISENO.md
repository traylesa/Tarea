# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** verificar_plan_programados_20260215_002645

---

## Arquitectura

```
[Extension Chrome]                    [Google Apps Script]
     |                                      |
panel.js / popup.js                   Codigo.js (Web App)
     |                                   |        |
scheduled.js (logica pura)    AdaptadorHojas.js  AdaptadorGmail.js
     |                              |                 |
  filtrar/formatear         Hoja PROGRAMADOS    enviarRespuesta()
  ordenar/contar            (cola en Sheets)
                                    |
                            Trigger cada 5 min
                            _procesarColaProgramados()
                                    |
                            LockService + horario laboral
```

**Flujo principal:**
1. Usuario selecciona registros y marca "Programar envio" en modal
2. Frontend POST a `?action=programarEnvio` con payload + fechaProgramada
3. Backend valida (fecha futura, campos requeridos) y guarda en hoja PROGRAMADOS con estado PENDIENTE
4. Trigger ejecuta cada 5 min: verifica horario laboral -> lee pendientes cuya fecha ya paso -> envia con enviarRespuesta() -> marca ENVIADO o ERROR
5. Frontend puede consultar GET `?action=getProgramados` y cancelar POST `?action=cancelarProgramado`

---

## Modelo de Datos

### Entidad: programados (hoja PROGRAMADOS en Sheets)

**NOTA:** Verificado contra `docs/DICCIONARIO_DOMINIO.md` — la entidad NO esta registrada. Se propone agregar.

| Campo | Tipo | Restriccion | Descripcion |
|-------|------|-------------|-------------|
| id | string | PK | ID unico (prog_timestamp_random) |
| threadId | string | NOT NULL | ID del hilo Gmail al que responder |
| interlocutor | string | | Emails destinatarios principales |
| asunto | string | | Asunto del correo |
| cuerpo | string (HTML) | NOT NULL | Cuerpo HTML del mensaje |
| cc | string | | Destinatarios CC |
| bcc | string | | Destinatarios BCC |
| fechaProgramada | string (ISO) | NOT NULL | Fecha/hora programada para envio |
| estado | enum(ESTADO_PROGRAMADO) | NOT NULL | Estado actual del envio |
| fechaEnvio | string (ISO) | | Fecha/hora real de envio (si enviado) |
| errorDetalle | string | | Mensaje de error (si fallo) |
| creadoPor | string | | Email del usuario que programo |
| creadoAt | string (ISO) | | Timestamp de creacion |

### Enum: ESTADO_PROGRAMADO

| Valor | Descripcion |
|-------|-------------|
| PENDIENTE | Envio programado, esperando trigger |
| ENVIADO | Correo enviado exitosamente |
| ERROR | Fallo al enviar (ver errorDetalle) |
| CANCELADO | Cancelado por usuario antes de enviar |

### Entidad: horario_laboral (PropertiesService)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| dias | array(number) | Dias de la semana (0=dom, 1=lun...6=sab) |
| horaInicio | number | Hora inicio (0-23) |
| horaFin | number | Hora fin (1-24) |

---

## Interfaces Publicas

### Backend GAS (Codigo.js)

```javascript
// GET ?action=getProgramados -> { ok, programados[] }
// POST ?action=programarEnvio -> { ok, id }
//   body: { threadId, cuerpo, fechaProgramada, interlocutor?, asunto?, cc?, bcc? }
// POST ?action=cancelarProgramado -> { ok }
//   body: { id }
// GET ?action=getHorarioLaboral -> { ok, horario }
// POST ?action=guardarHorarioLaboral -> { ok, horario }
//   body: { horario: { dias, horaInicio, horaFin } }
```

### Frontend (scheduled.js) — Logica pura

```javascript
formatearEstadoProgramado(estado)  // -> { icono, clase, texto, html }
filtrarProgramados(lista, filtro)  // -> lista filtrada
ordenarPorFechaProgramada(lista)   // -> lista ordenada desc
formatearFechaCorta(isoString)     // -> 'DD/MM/YYYY HH:mm' | '--'
contarPorEstado(lista)             // -> { PENDIENTE, ENVIADO, ERROR, CANCELADO }
```

---

## Propuesta Diccionario de Dominio

Se debe agregar a `docs/DICCIONARIO_DOMINIO.md`:

1. **Tabla `programados`** con 13 campos
2. **Enum `ESTADO_PROGRAMADO`** con 4 valores
3. **Glosario:** "Envio programado", "Horario laboral", "Cola de programados"
4. **Storage keys:** ninguna nueva (programados viven en Sheets, horario en PropertiesService)

---

## PUERTA DE VALIDACION 4

- [x] Arquitectura clara y documentada
- [x] Nombres verificados — FALTA en diccionario, propuesta documentada
- [x] Interfaces publicas definidas
- [x] Flujos criticos documentados

---

**Estado:** COMPLETADO
