# Prompt: Desarrollo App Movil TareaLog

## 1. CONTEXTO DEL PROYECTO

**TareaLog** es una herramienta de gestion logistica para la empresa de transporte TRAYLESA. Permite a los operadores de trafico monitorizar cargas de transporte a traves del correo electronico (Gmail), clasificar mensajes automaticamente, asignar fases de transporte, responder masivamente y recibir alertas proactivas.

**Objetivo de la app movil:** Crear una version mobile-first que consuma el mismo backend GAS (Google Apps Script) existente, permitiendo a los operadores gestionar cargas desde el movil con una experiencia nativa-like.

**Dominio logistico:** Cada "carga" (codCar) representa un envio de mercancia que pasa por fases: espera -> carga -> en ruta -> descarga -> vacio -> documentado. Los operadores gestionan decenas de cargas simultaneas via email con transportistas.

### 1.1 Perfil del Usuario en Campo

**Usuario principal:** Operador de trafico de TRAYLESA.

**Contexto de uso real:**
- Gestiona 20-40 cargas simultaneas a diario
- Usa el movil como herramienta secundaria (la principal es la extension Chrome en PC)
- Puede estar en oficina, almacen, muelle de carga o en movimiento
- Con frecuencia opera con una sola mano
- Entorno con sol directo, ruido industrial, posibles guantes
- Nivel tecnico: medio-bajo (no tecnico, pero habituado a apps de gestion)
- Urgencia constante: necesita saber QUE requiere atencion AHORA, no solo ver datos

**Necesidad principal:** "Quiero abrir la app y en 3 segundos saber si hay algo urgente que atender."

**Necesidad secundaria:** "Si hay algo urgente, quiero resolverlo en 2 taps maximo."

---

## 2. BACKEND EXISTENTE (Google Apps Script Web App)

### 2.1 URL Base

La URL del backend es configurable por el usuario. Formato tipico:
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```
Se almacena en la configuracion local como `gasUrl`.

### 2.2 Autenticacion

El backend GAS usa autenticacion implicita de Google. Las peticiones se hacen con `fetch()` sin headers de auth adicionales (la Web App esta desplegada como "Execute as me, Anyone can access"). No requiere OAuth del lado cliente.

### 2.3 Endpoints GET

Todos los GET usan query parameter `?action=NOMBRE`.

#### GET `?action=getRegistros`
Devuelve todos los registros de la hoja SEGUIMIENTO.
```json
// Response
{
  "ok": true,
  "registros": [
    {
      "messageId": "18d5a3b2c4e5f6g7",
      "threadId": "18d5a3b2c4e5f6g7",
      "mensajesEnHilo": 3,
      "codCar": 12345,
      "codTra": "TR001",
      "nombreTransportista": "Transportes Garcia S.L.",
      "emailRemitente": "garcia@transport.com",
      "emailErp": "garcia@transport.com",
      "asunto": "Re: Carga 12345 - Entrega Madrid",
      "fechaCorreo": "2026-02-15T10:30:00.000Z",
      "tipoTarea": "OPERATIVO",
      "estado": "RECIBIDO",
      "fase": "19",
      "alerta": null,
      "vinculacion": "AUTOMATICA",
      "referencia": "REF-2026-001",
      "para": "operador@traylesa.com",
      "cc": "jefe@traylesa.com",
      "cco": "",
      "interlocutor": "garcia@transport.com",
      "cuerpo": "Texto plano del email...",
      "fCarga": "2026-02-15",
      "hCarga": "08:00",
      "fEntrega": "2026-02-16",
      "hEntrega": "14:00",
      "zona": "MAD",
      "zDest": "BCN",
      "procesadoAt": "2026-02-15T10:35:00.000Z"
    }
  ]
}
```

#### GET `?action=obtenerConfig`
```json
// Response
{
  "ok": true,
  "spreadsheetId": "1AbC_dEf...",
  "spreadsheetNombre": "TareaLog - Seguimiento 2026",
  "gmailQuery": "(in:inbox OR in:sent) newer_than:7d"
}
```

#### GET `?action=getProgramados`
```json
// Response
{
  "ok": true,
  "programados": [
    {
      "id": "prog_1708012345_abc1",
      "threadId": "18d5a3b2c4e5f6g7",
      "interlocutor": "garcia@transport.com",
      "asunto": "Re: Carga 12345",
      "cuerpo": "<p>Contenido HTML del email</p>",
      "cc": "jefe@traylesa.com",
      "bcc": "",
      "fechaProgramada": "2026-02-16T09:00:00.000Z",
      "estado": "PENDIENTE",
      "fechaEnvio": "",
      "errorDetalle": "",
      "creadoPor": "operador@traylesa.com",
      "creadoAt": "2026-02-15T16:00:00.000Z"
    }
  ]
}
```

#### GET `?action=getHorarioLaboral`
```json
// Response
{
  "ok": true,
  "horario": {
    "dias": [1, 2, 3, 4, 5],
    "horaInicio": 7,
    "horaFin": 21
  }
}
```

#### GET `?action=getNotas`
```json
// Response
{
  "ok": true,
  "notas": [
    {
      "clave": "12345",
      "id": "nota_1708012345_abc1",
      "texto": "Transportista confirmo llegada a las 14h",
      "fechaCreacion": "2026-02-15T10:00:00.000Z",
      "tipo": "CARGA"
    }
  ]
}
```

#### GET `?action=getRecordatorios`
```json
// Response
{
  "ok": true,
  "recordatorios": [
    {
      "id": "rec_1708012345_abc1",
      "clave": "12345",
      "texto": "Verificar descarga",
      "fechaDisparo": "2026-02-15T18:00:00.000Z",
      "preset": "4h",
      "origen": "sugerido",
      "estado": "ACTIVO"
    }
  ]
}
```

#### GET `?action=getHistorial`
```json
// Response
{
  "ok": true,
  "historial": [
    {
      "id": "hist_1708012345_abc1",
      "clave": "12345",
      "tipo": "EMAIL",
      "descripcion": "Enviado email confirmacion carga",
      "fechaCreacion": "2026-02-15T09:30:00.000Z"
    }
  ]
}
```

### 2.4 Endpoints POST

Todos los POST envian `?action=NOMBRE` como query param y body JSON.

#### POST `?action=procesarCorreos`
Ejecuta barrido de Gmail, procesa mensajes nuevos y retorna registros actualizados.
```json
// Request body
{ "limite": 50 }

// Response
{
  "ok": true,
  "procesados": 12,
  "errores": 0,
  "hayMas": false,
  "registros": [ /* array completo de registros actualizados */ ]
}
```
Si `hayMas: true`, hay mas mensajes por procesar (llamar de nuevo).

#### POST `?action=actualizarCampo`
Actualiza un campo editable de un registro.
```json
// Request body
{
  "messageId": "18d5a3b2c4e5f6g7",
  "campo": "fase",
  "valor": "19"
}

// Response
{ "ok": true }
```
**Campos editables:** `codCar`, `codTra`, `nombreTransportista`, `tipoTarea`, `estado`, `fase`, `alerta`, `vinculacion`, `referencia`, `fCarga`, `hCarga`, `fEntrega`, `hEntrega`, `zona`, `zDest`

#### POST `?action=vincularManual`
Vincula un hilo de Gmail a un codigo de carga.
```json
// Request body
{
  "threadId": "18d5a3b2c4e5f6g7",
  "codCar": "12345"
}

// Response
{ "ok": true }
```

#### POST `?action=enviarRespuesta`
Envia respuestas a uno o varios hilos de Gmail (reply-all excluyendo email propio).
```json
// Request body
{
  "destinatarios": [
    {
      "email": "garcia@transport.com",
      "threadId": "18d5a3b2c4e5f6g7",
      "asunto": "Re: Carga 12345",
      "cuerpo": "<p>Confirmamos recepcion</p>",
      "para": "garcia@transport.com",
      "cc": "jefe@traylesa.com",
      "cco": ""
    }
  ],
  "emailsPorMinuto": 10
}

// Response
{
  "ok": true,
  "resultados": [
    { "threadId": "18d5a3b2c4e5f6g7", "enviado": true }
  ],
  "emailsPorMinuto": 10
}
```

#### POST `?action=configurarSpreadsheet`
```json
// Request body
{ "spreadsheetId": "1AbC_dEf..." }

// Response
{ "ok": true, "nombre": "TareaLog - Seguimiento 2026" }
```

#### POST `?action=configurarGmailQuery`
```json
// Request body
{ "gmailQuery": "(in:inbox OR in:sent) newer_than:7d" }

// Response
{ "ok": true, "gmailQuery": "(in:inbox OR in:sent) newer_than:7d" }
```

#### POST `?action=programarEnvio`
Programa un email para envio futuro (cola procesada cada 5 min en horario laboral).
```json
// Request body
{
  "threadId": "18d5a3b2c4e5f6g7",
  "interlocutor": "garcia@transport.com",
  "asunto": "Re: Carga 12345",
  "cuerpo": "<p>Contenido</p>",
  "cc": "",
  "bcc": "",
  "fechaProgramada": "2026-02-16T09:00:00.000Z"
}

// Response
{ "ok": true, "id": "prog_1708012345_abc1" }
```

#### POST `?action=cancelarProgramado`
```json
// Request body
{ "id": "prog_1708012345_abc1" }

// Response
{ "ok": true }
```
Solo se pueden cancelar envios con estado `PENDIENTE`.

#### POST `?action=guardarHorarioLaboral`
```json
// Request body
{
  "horario": {
    "dias": [1, 2, 3, 4, 5],
    "horaInicio": 7,
    "horaFin": 21
  }
}

// Response
{ "ok": true, "horario": { "dias": [1,2,3,4,5], "horaInicio": 7, "horaFin": 21 } }
```

#### POST `?action=guardarNota`
```json
// Request body
{
  "clave": "12345",
  "texto": "Transportista confirmo llegada",
  "tipo": "CARGA"
}

// Response
{ "ok": true, "id": "nota_1708012345_abc1" }
```

#### POST `?action=eliminarNota`
```json
// Request body
{ "id": "nota_1708012345_abc1" }

// Response
{ "ok": true }
```

#### POST `?action=guardarRecordatorio`
```json
// Request body
{
  "clave": "12345",
  "texto": "Verificar descarga",
  "fechaDisparo": "2026-02-15T18:00:00.000Z",
  "preset": "4h",
  "origen": "manual"
}

// Response
{ "ok": true, "id": "rec_1708012345_abc1" }
```

#### POST `?action=eliminarRecordatorio`
```json
// Request body
{ "id": "rec_1708012345_abc1" }

// Response
{ "ok": true }
```

#### POST `?action=actualizarEstadoRecordatorio`
```json
// Request body
{
  "id": "rec_1708012345_abc1",
  "estado": "COMPLETADO"
}

// Response
{ "ok": true }
```

#### POST `?action=registrarHistorial`
```json
// Request body
{
  "clave": "12345",
  "tipo": "EMAIL",
  "descripcion": "Enviado email confirmacion carga"
}

// Response
{ "ok": true, "id": "hist_1708012345_abc1" }
```

### 2.5 Formato de Errores

Todos los endpoints retornan el mismo formato en caso de error:
```json
{ "ok": false, "error": "Descripcion del error" }
```

---

## 3. ESTRUCTURAS DE DATOS

### 3.1 Registro (fila de SEGUIMIENTO)

| Campo | Tipo | Descripcion | Editable |
|-------|------|-------------|----------|
| `messageId` | string | ID unico del mensaje Gmail | No |
| `threadId` | string | ID del hilo Gmail | No |
| `mensajesEnHilo` | number | Cantidad de mensajes en el hilo | No |
| `codCar` | number/null | Codigo de carga (ej: 12345) | Si |
| `codTra` | string/null | Codigo transportista (ej: "TR001") | Si |
| `nombreTransportista` | string/null | Nombre del transportista | Si |
| `emailRemitente` | string | Email de quien envio el correo | No |
| `emailErp` | string/null | Email registrado en ERP para ese transportista | No |
| `asunto` | string | Asunto del correo | No |
| `fechaCorreo` | string (ISO) | Fecha/hora del correo | No |
| `tipoTarea` | string (enum) | Clasificacion automatica | Si |
| `estado` | string (enum) | Estado de gestion | Si |
| `fase` | string (enum) | Fase de transporte actual | Si |
| `alerta` | string/null | Tipo de alerta si existe | Si |
| `vinculacion` | string (enum) | Como se vinculo a la carga | Si |
| `referencia` | string/null | Referencia de la carga | Si |
| `para` | string | Destinatarios TO del correo | No |
| `cc` | string | Destinatarios CC | No |
| `cco` | string | Destinatarios BCC | No |
| `interlocutor` | string | Emails externos (sin el propio) | No |
| `cuerpo` | string | Texto plano del correo | No |
| `fCarga` | string | Fecha de carga (YYYY-MM-DD) | Si |
| `hCarga` | string | Hora de carga (HH:MM) | Si |
| `fEntrega` | string | Fecha de entrega | Si |
| `hEntrega` | string | Hora de entrega | Si |
| `zona` | string | Zona origen | Si |
| `zDest` | string | Zona destino | Si |
| `procesadoAt` | string (ISO) | Fecha de procesamiento | No |

### 3.2 Enums y Valores Validos

#### tipoTarea
| Valor | Descripcion |
|-------|-------------|
| `OPERATIVO` | Email relacionado con carga (tiene adjunto Carga_XXXXX.pdf) |
| `ADMINISTRATIVA` | Email administrativo (certificados, hacienda, facturas) |
| `SIN_CLASIFICAR` | No se pudo clasificar automaticamente |

#### estado
| Codigo | Nombre | Icono | Clase CSS |
|--------|--------|-------|-----------|
| `ENVIADO` | Enviado | (verde) | `estado-ok` |
| `RECIBIDO` | Recibido | (verde) | `estado-ok` |
| `GESTIONADO` | Gestionado | (verde) | `estado-ok` |
| `ALERTA` | Alerta | (rojo) | `estado-alerta` |

#### vinculacion
| Valor | Descripcion |
|-------|-------------|
| `AUTOMATICA` | Detectado codCar en adjuntos |
| `HILO` | Heredado de otro mensaje del mismo hilo |
| `MANUAL` | Asignado manualmente por el usuario |
| `SIN_VINCULAR` | Sin carga asignada |

#### alerta (campo del registro)
| Valor | Descripcion |
|-------|-------------|
| `null` | Sin alerta |
| `ALERTA_SIN_CONTACTO_ERP` | No hay email registrado en ERP para el transportista |
| `ALERTA_CONTACTO_NO_REGISTRADO` | Email del remitente no coincide con el ERP |

### 3.3 Fases de Transporte

| Codigo | Nombre | Orden | Es Critica | Clase CSS | Grupo |
|--------|--------|-------|------------|-----------|-------|
| (vacio) | -- | 0 | No | | |
| `00` | 00 Espera | 1 | No | | espera |
| `01` | 01 Espera en Carga | 2 | No | | espera |
| `02` | 02 Espera en Descarga | 3 | No | | espera |
| `05` | 05 Incidencia | 4 | **Si** | `fase-incidencia` | incidencia |
| `11` | 11 En Carga | 5 | No | | carga |
| `12` | 12 Cargando | 6 | No | | carga |
| `19` | 19 Cargado | 7 | No | `fase-ok` | en_ruta |
| `21` | 21 En Descarga | 8 | No | | descarga |
| `22` | 22 Descargando | 9 | No | | descarga |
| `25` | 25 Incidencia | 10 | **Si** | `fase-incidencia` | incidencia |
| `29` | 29 Vacio | 11 | No | | vacio |
| `30` | 30 Documentado | 12 | No | `fase-ok` | |

### 3.4 Grupos de Fase y Acciones Contextuales

Cada grupo de fase tiene acciones disponibles para el usuario:

| Grupo | Fases | Acciones |
|-------|-------|----------|
| **espera** | 00, 01, 02 | "Confirmar hora carga" (plantilla), "Retrasar carga" |
| **carga** | 11, 12 | "Solicitar posicion", "Avisar destino" |
| **en_ruta** | 19 | "Verificar ETA", "Avisar destino" |
| **descarga** | 21, 22 | "Confirmar descarga" (cambia fase a 29) |
| **vacio** | 29 | "Reclamar POD" (plantilla), "Marcar documentado" (cambia fase a 30) |
| **incidencia** | 05, 25 | "Solicitar detalle", "Escalar responsable" |

Las acciones pueden tener:
- `faseSiguiente`: fase a la que cambia automaticamente al ejecutar (ej: "Confirmar descarga" -> fase 29)
- `plantilla`: nombre de plantilla de email sugerida

### 3.5 Envio Programado

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (prog_TIMESTAMP_RANDOM) |
| `threadId` | string | Hilo Gmail al que responder |
| `interlocutor` | string | Email destino principal |
| `asunto` | string | Asunto del email |
| `cuerpo` | string | Contenido HTML |
| `cc` | string | Copia (opcional) |
| `bcc` | string | Copia oculta (opcional) |
| `fechaProgramada` | string (ISO) | Fecha/hora de envio |
| `estado` | enum | PENDIENTE, ENVIADO, CANCELADO, ERROR |
| `fechaEnvio` | string (ISO) | Fecha real de envio (si aplica) |
| `errorDetalle` | string | Mensaje de error (si aplica) |
| `creadoPor` | string | Email del creador |
| `creadoAt` | string (ISO) | Fecha de creacion |

### 3.6 Nota

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `clave` | string | codCar como string |
| `id` | string | ID unico (nota_TIMESTAMP_RANDOM) |
| `texto` | string | Contenido de la nota |
| `fechaCreacion` | string (ISO) | Fecha de creacion |
| `tipo` | string | Siempre "CARGA" por ahora |

Limite: 50 notas por carga.

### 3.7 Recordatorio

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (rec_TIMESTAMP_RANDOM) |
| `clave` | string | codCar como string (opcional) |
| `texto` | string | Texto del recordatorio |
| `fechaDisparo` | string (ISO) | Cuando debe dispararse |
| `preset` | string | Preset usado: 15min, 30min, 1h, 2h, 4h, manana |
| `origen` | string | "manual" o "sugerido" |
| `estado` | string | ACTIVO, COMPLETADO |

Limite: 50 recordatorios activos.

**Presets de tiempo:**
| Preset | Minutos |
|--------|---------|
| `15min` | 15 |
| `30min` | 30 |
| `1h` | 60 |
| `2h` | 120 |
| `4h` | 240 |
| `manana` | Dia siguiente a las 09:00 UTC |

**Sugerencias automaticas por fase:**
| Fase | Texto sugerido | Horas |
|------|---------------|-------|
| `19` (Cargado) | "Verificar descarga" | 8h |
| `29` (Vacio) | "Reclamar POD" | 24h |

### 3.8 Historial de Acciones

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (hist_TIMESTAMP_RANDOM) |
| `clave` | string | codCar como string |
| `tipo` | enum | EMAIL, FASE, RECORDATORIO, NOTA |
| `descripcion` | string | Descripcion de la accion |
| `fechaCreacion` | string (ISO) | Fecha de la accion |

Limite: 200 entradas por carga. Se rotan por antiguedad.

### 3.9 Horario Laboral

```json
{
  "dias": [1, 2, 3, 4, 5],   // 0=domingo, 1=lunes..6=sabado
  "horaInicio": 7,             // Hora local inicio
  "horaFin": 21                // Hora local fin
}
```
Los envios programados solo se procesan dentro de este horario.

---

## 4. FEATURES REQUERIDAS (Por Fases de Desarrollo)

### FASE 1 - Fundacion (MVP Core)

> **Objetivo:** El operador puede ver cargas, entrar al detalle, cambiar fase y responder.

#### F1: Vista unificada de cargas (Tab "Todo")
- Lista de registros agrupados por codCar
- **Busqueda SIEMPRE visible** en header (campo con placeholder "Buscar codCar...")
- Cada carga es una **card con jerarquia visual** (ver §6.1 Card Design)
- Pull-to-refresh para recargar datos (POST procesarCorreos + GET getRegistros)
- **Checkbox visible** en cada card para seleccion multiple (NO long press)
- Ordenacion por fecha descendente (ultimo email primero)

#### F2: Detalle de carga
- Al tocar una card, ver pantalla completa con info + emails del hilo
- **Header sticky**: codCar + transportista + chip fase (siempre visible)
- **Secciones colapsables**: Emails (abierta), Notas, Historial
- **Bottom bar sticky** con acciones principales: [Responder] [Cambiar fase] [+ Nota]
- Menu [⋮] en header para acciones secundarias
- Edicion inline de campos editables via bottom sheet

#### F3: Cambio de fase
- Bottom sheet con opciones coloreadas (incidencia=rojo, ok=verde)
- Acciones rapidas contextuales segun grupo de fase (ver §3.4)
- **Feedback obligatorio**: vibracion corta (50ms) + toast "Fase actualizada" + animacion color

#### F4: Responder email
- Componer respuesta a un hilo existente (full-screen modal)
- Selector de plantilla predefinida
- Pie comun configurable (firma global)
- Boton [Enviar ahora] prominente + opcion secundaria [Programar]
- **Feedback**: boton cambia a spinner "Enviando..." + toast resultado

### FASE 2 - Valor Diferencial (Alertas + Notas)

> **Objetivo:** La app PROACTIVAMENTE dice al operador que necesita atencion. Sin esto, es solo una lista.

#### F5: Alertas proactivas (INLINE en lista)
Evaluar 5 reglas sobre los registros y mostrar alertas **dentro de la lista principal** (NO en tab separado):

| Regla | Nombre | Condicion | Nivel |
|-------|--------|-----------|-------|
| **R2** | Sin respuesta | Email ENVIADO sin respuesta despues de N horas | ALTO |
| **R3** | Fase estancada | Registro lleva mas del limite en una fase | MEDIO/ALTO |
| **R4** | Docs pendientes | Carga en fase 29 (vacio) sin documentar despues de N dias | MEDIO/ALTO |
| **R5** | Incidencia activa | Registro en fase 05 o 25 | CRITICO |
| **R6** | Carga HOY sin orden | Carga con fCarga=hoy pero sin ENVIADO | ALTO/CRITICO |

**Integracion visual en cards:**
- Cards con alertas muestran banner superior coloreado: "ACCION REQUERIDA: [texto]"
- Cards con alerta CRITICA aparecen PRIMERO en la lista (antes de ordenacion por fecha)
- Badge numerico en tab "Todo" con total alertas

**Niveles de alerta:**
| Nivel | Color de banner | Vibracion |
|-------|----------------|-----------|
| CRITICO | #D32F2F (rojo oscuro) | Doble (100ms+100ms) |
| ALTO | #F57C00 (naranja oscuro) | Simple (50ms) |
| MEDIO | #1565C0 (azul oscuro) | Ninguna |
| BAJO | #2E7D32 (verde oscuro) | Ninguna |

**Nota sobre contraste:** Colores Material 700+ para visibilidad bajo sol directo.

**Configuracion de umbrales (defaults):**
- `silencioUmbralH`: 4 (horas sin respuesta antes de alertar)
- `estancamientoMaxH`: { "12": 3, "19": 24, "22": 3 } (horas max por fase)
- `docsUmbralDias`: 2 (dias sin documentar)
- `cooldownMs`: 3600000 (1 hora entre alertas repetidas)

**Deduplicacion:** Cada alerta tiene ID unico (ej: `R2_threadId`). No se repite si el cooldown no ha pasado.

#### F6: Notas rapidas
- Agregar nota de texto libre a una carga (desde detalle o accion rapida)
- Lista de notas por carga (ordenadas por fecha descendente)
- Eliminar nota con confirmacion
- Indicador visual en card si la carga tiene notas (icono + badge)
- Limite: 50 notas por carga

#### F7: Accion requerida inteligente
- Cada card calcula automaticamente que necesita el operador AHORA
- Logica en `action-resolver.js`:
  - Si hay alerta CRITICA/ALTA → mostrar alerta como accion
  - Si fase tiene acciones contextuales pendientes → mostrar primera accion
  - Si hay emails sin gestionar → "X emails sin leer"
  - Si hay deadline cercano (fCarga/fEntrega hoy) → "Deadline en Xh"
  - Si todo OK → no mostrar banner (card verde/gris)

### FASE 3 - Optimizacion (Filtros + Plantillas avanzadas)

> **Objetivo:** Operador experto encuentra cargas especificas rapidamente.

#### F8: Filtros en 2 niveles
**Nivel 1 - Filtros rapidos (sticky, siempre visibles, max 4 chips):**
- `[Urgentes]` → alertas CRITICO + ALTO
- `[Hoy]` → fCarga = hoy
- `[Sin leer]` → estado = RECIBIDO
- `[+]` → abre filtros avanzados

**Nivel 2 - Filtros avanzados (bottom sheet modal):**
- Transportista: dropdown
- Fase: checkboxes seleccion multiple
- Fecha: dropdown con opciones rapidas (Ultimas 24h, 7 dias, 30 dias, personalizado)
- Estado: dropdown
- Vinculacion: dropdown
- Resumen visible de filtros activos
- Botones [Resetear] [Aplicar]

#### F9: Plantillas de respuesta avanzadas
- CRUD completo de plantillas
- Cada plantilla tiene: alias, asunto, cuerpo (HTML), firma
- Variables interpolables con sintaxis `{{variable}}`:
  - `{{codCar}}`, `{{nombreTransportista}}`, `{{codTra}}`, `{{emailRemitente}}`
  - `{{interlocutor}}`, `{{referencia}}`, `{{asunto}}`, `{{fechaCorreo}}`
  - `{{estado}}`, `{{tipoTarea}}`
- Pie comun (firma global) que se agrega a todas las plantillas
- Export/import JSON de plantillas

#### F10: Seleccion multiple y acciones masivas
- Tap checkbox en cards → aparece bottom bar: "N seleccionadas [Cambiar fase] [Responder] [X]"
- Cambio de fase masivo con confirmacion
- Respuesta masiva con plantilla + preview
- Rate limit configurable (1-30 emails/minuto, default 10)

### FASE 4 - Productividad Avanzada

> **Objetivo:** Flujos automatizados y metricas para operadores experimentados.

#### F11: Resumen matutino
- Panel consolidado que se muestra a las 08:00 (configurable)
- 4 categorias con tarjetas:
  - **Urgente** (R5 incidencias + R6 cargas hoy): color rojo
  - **Sin respuesta** (R2): color naranja
  - **Documentacion pendiente** (R4): color azul
  - **Fases estancadas** (R3): color morado
- KPIs: cargas activas, cargas hoy, total alertas, sin respuesta, sin docs
- Boton "Ver" por categoria → filtra lista principal
- Solo se muestra una vez al dia (flag por fecha)

#### F12: Recordatorios con snooze
- Crear recordatorio manual (texto + preset de tiempo)
- Sugerencias automaticas al cambiar fase (19→verificar descarga 8h, 29→reclamar POD 24h)
- Notificacion push al vencerse (vibracion + banner)
- Botones en notificacion: [Snooze 15min] [Hecho]
- Lista de recordatorios activos en vista Programados
- Presets: 15min, 30min, 1h, 2h, 4h, manana

#### F13: Envios programados
- Programar email para fecha/hora futura
- Ver lista de programados con estado (PENDIENTE, ENVIADO, CANCELADO, ERROR)
- Cancelar envio pendiente
- Configurar horario laboral (dias + hora inicio/fin)

#### F14: Dashboard operativo
- KPIs del turno: cargas activas, distribucion por grupo de fase, alertas criticas
- Recordatorios pendientes hoy, cargas cerradas hoy/semana
- Grafico semanal (7 dias): cargas cerradas por dia

#### F15: Secuencias de follow-up
- Secuencias predefinidas con 3 pasos cada una:
  - **"Reclamar POD"**: 0h, 72h, 168h (plantillas: solicitud, recordatorio, escalado)
  - **"Confirmar carga"**: 0h, 24h, 48h
  - **"Seguimiento incidencia"**: 0h, 24h, 72h
- Crear secuencia custom con hasta 3 pasos
- Cada paso tiene: plantilla + horas de espera desde inicio
- Estados secuencia: ACTIVA, COMPLETADA, DETENIDA, CANCELADA
- Notificacion cuando un paso esta listo para enviar

#### F16: Historial y reporte
- Timeline de acciones por carga (tipos: EMAIL, FASE, RECORDATORIO, NOTA)
- Reporte de turno a las 18:00 (configurable): cargas gestionadas, incidencias, KPIs dia

---

## 5. FLUJOS DE USUARIO

### 5.1 Flujo principal: Abrir y triagear (3 segundos)

```
1. Abrir app → Vista "Todo" con lista de cargas
2. INMEDIATO: Cards con alertas CRITICAS aparecen ARRIBA con banner rojo
3. Operador ve de un vistazo: "3 cargas necesitan atencion"
4. Pull-to-refresh → POST procesarCorreos → actualiza lista
5. Tap filtro rapido [Urgentes] → solo cards con alertas
6. Tap en card → Detalle
```

**Principio:** En 3 segundos el operador sabe SI hay algo urgente y QUE es.

### 5.2 Flujo: Gestionar carga individual (2 taps)

```
1. Tap en card → Pantalla detalle con header sticky (codCar + fase)
2. Emails del hilo visibles inmediatamente (seccion abierta por defecto)
3. Bottom bar sticky con 3 botones principales:
   [Responder] [Cambiar fase] [+ Nota]
4. Tap "Cambiar fase" → bottom sheet con opciones coloreadas
   → Seleccionar → vibracion + toast "Fase actualizada a 19"
5. Tap "Responder" → flujo de respuesta (5.3)
6. Tap [⋮] header → menu completo: vincular, recordatorio, historial, etc.
7. Secciones colapsables: tap cabecera para expandir Notas, Historial
```

**Principio:** Las 3 acciones mas comunes estan a 1 tap en bottom bar.

### 5.3 Flujo: Responder email

```
1. Tap [Responder] en bottom bar → full-screen modal
2. Toolbar superior: [X Cerrar] [Plantilla ▼]
3. Si selecciona plantilla → variables se interpolan automaticamente
4. Cuerpo editable (texto rico simplificado)
5. Pie comun (firma) visible debajo
6. Boton principal [Enviar ahora] (grande, verde)
7. Opcion secundaria [Programar] (pequeno, bajo boton enviar)
8. Al enviar:
   8a. Boton cambia a [Enviando...] con spinner
   8b. Vibracion doble al completar
   8c. Toast "Email enviado a Garcia"
   8d. Vuelta a detalle automatica
```

### 5.4 Flujo: Seleccion multiple y acciones masivas

```
1. En lista principal, tap checkbox de una card → modo seleccion se activa
2. Bottom bar aparece: "3 seleccionadas [Cambiar fase] [Responder] [X]"
3. Tap mas checkboxes para agregar (tap en area NO-checkbox = abrir detalle)
4. Tap [Cambiar fase] → bottom sheet con selector → aplica a todas
5. Tap [Responder] → elegir plantilla → preview → confirmar envio
6. Progreso visible con barra, resultado por hilo
7. Tap [X] → salir de modo seleccion
```

**Principio:** Checkboxes siempre visibles, NO long press.

### 5.5 Flujo: Crear recordatorio

```
1. Desde detalle de carga, tap [⋮] → "Recordatorio"
2. Bottom sheet con:
   a. Texto del recordatorio (editable, pre-rellenado si hay sugerencia)
   b. Presets como chips: 15min, 30min, 1h, 2h, 4h, manana
   c. Sugerencia automatica si la fase aplica (ej: fase 19 → "Verificar descarga")
3. Tap preset → se calcula fechaDisparo → vibracion + toast
4. POST guardarRecordatorio
5. Al vencer → notificacion push con botones: [Snooze 15min] [Hecho]
```

### 5.6 Flujo: Resumen matutino

```
1. A las 08:00 se evaluan alertas
2. Si hay alertas → pantalla resumen como modal sobre la lista
3. 4 tarjetas por categoria con conteo y color
4. Tap "Ver" en categoria → cierra resumen + filtra lista principal
5. Tap "Posponer 1h" → oculta resumen, reevalua en 1 hora
6. Tap "Cerrar" → marca como visto hoy (flag por fecha)
```

---

## 6. DISENO MOBILE-FIRST

### 6.1 Patrones UI

#### Bottom Navigation Bar (3 tabs)
1. **Todo** (icono lista + badge alertas) - Lista unificada: cargas + alertas inline
2. **Programados** (icono reloj + badge pendientes) - Envios + recordatorios
3. **Config** (icono engranaje) - Configuracion + modo outdoor

**Justificacion 3 tabs:** Las alertas van DENTRO de la lista (cards rojas arriba), no en tab separado. Reduce cambios de contexto. El operador vive en "Todo".

#### Card de carga (diseño con jerarquia visual)

```
┌─────────────────────────────────────────┐
│ ☐  ACCION REQUERIDA: Responder POD   [⋮]│ ← Banner rojo/naranja (si hay alerta)
│                                         │
│ 168345 • Transportes Garcia S.L.        │ ← codCar (mono, grande) + transportista
│ 🟡 19 Cargado → En ruta    ⏱️ 3h        │ ← Chip fase (color) + tiempo
│                                         │
│ 📧 2 sin leer  📝 1 nota  ⏰ Desc. 18:00│ ← Indicadores: emails, notas, deadline
│                                         │
│ [Responder] [Fase ▼]                    │ ← Botones accion rapida EN la card
└─────────────────────────────────────────┘
```

**Jerarquia visual de la card:**
1. **Banner accion requerida** (solo si hay) - primera cosa que se ve
2. **codCar + transportista** - identificacion
3. **Chip fase + tiempo** - estado actual
4. **Indicadores** - emails sin leer, notas, deadline cercano
5. **Botones** - acciones directas sin entrar al detalle

**Colores de card segun prioridad:**
- **Banner rojo** `#D32F2F`: Alerta CRITICA (incidencia, carga HOY sin orden)
- **Banner naranja** `#F57C00`: Alerta ALTA (sin respuesta)
- **Sin banner**: Todo OK, card blanca con borde gris
- **Card gris** `#F5F5F5`: Gestionado/archivado

#### Detalle de carga

```
┌─────────────────────────────────────────┐
│ ← 168345 • Garcia              [⋮]      │ ← Header sticky: back + menu
│   🟡 19 Cargado → En ruta               │
├─────────────────────────────────────────┤
│                                         │
│ 📧 EMAILS (3)                     [▼]   │ ← Seccion colapsable (abierta)
│ ├─ Hoy 14:32 - Garcia                  │
│ │  "Llegamos en 1 hora aprox"          │
│ ├─ Hoy 12:15 - Tu                      │
│ │  "Confirma hora descarga"            │
│ └─ Ayer 18:00 - Garcia                 │
│    "Salimos de Barcelona"              │
│                                         │
│ 📝 NOTAS (1)                      [▶]   │ ← Seccion colapsable (cerrada)
│                                         │
│ 📊 HISTORIAL (5)                  [▶]   │ ← Seccion colapsable (cerrada)
│                                         │
├─────────────────────────────────────────┤
│ [Responder] [Cambiar fase] [+ Nota]     │ ← Bottom bar sticky
└─────────────────────────────────────────┘
```

**SIN FAB.** Bottom bar sticky con botones claros reemplaza FAB + bottom sheet confusos.

#### Filtros en 2 niveles

**Nivel 1 - Chips rapidos (sticky bajo busqueda, max 4):**
```
┌─────────────────────────────────────────┐
│ [🔍 Buscar codCar...]          [☑️] [⋮] │ ← Busqueda siempre visible
│ [Urgentes(3)] [Hoy(5)] [Sin leer(8)] [+]│ ← Filtros rapidos + [+]avanzados
└─────────────────────────────────────────┘
```

**Nivel 2 - Bottom sheet (tap [+]):**
```
┌─────────────────────────────────────────┐
│ FILTROS AVANZADOS                   [X] │
│                                         │
│ Transportista: [Todos ▼]                │
│ Fase: [☑️ Carga ☑️ En ruta ☐ Descarga]   │
│ Periodo: [Ultimas 24h ▼]               │
│ Estado: [Todos ▼]                       │
│ Vinculacion: [Todos ▼]                  │
│                                         │
│ Filtros activos (2): Carga, En ruta     │
│                                         │
│ [Resetear]              [Aplicar]       │
└─────────────────────────────────────────┘
```

#### Editor de respuesta
- **Full-screen modal** (ocupa toda la pantalla)
- Toolbar: [X Cerrar] [Plantilla ▼]
- Area de texto editable
- Pie comun visible debajo (no editable aqui)
- Boton [Enviar ahora] grande verde abajo
- Link secundario "Programar para despues" debajo del boton

### 6.2 Paleta de Colores (Alto Contraste)

```css
/* Primarios */
--color-primary: #1565C0;        /* Azul TRAYLESA (700, alto contraste) */
--color-primary-dark: #0D47A1;
--color-primary-light: #BBDEFB;

/* Estados - Material 700 para visibilidad bajo sol */
--color-ok: #2E7D32;             /* Verde 700 - OK/gestionado */
--color-warning: #F57C00;        /* Naranja 700 - atencion */
--color-danger: #D32F2F;         /* Rojo 700 - critico/incidencia */
--color-info: #1565C0;           /* Azul 700 - informativo */

/* Fases */
--color-fase-incidencia: #D32F2F;
--color-fase-ok: #2E7D32;
--color-fase-default: #616161;   /* Gris 700 (no 400) */

/* Niveles alerta (banner en card) */
--banner-critico: #D32F2F;
--banner-alto: #F57C00;
--banner-medio: #1565C0;
--banner-bajo: #2E7D32;

/* Categorias resumen matutino */
--cat-urgente: #D32F2F;
--cat-sin-respuesta: #F57C00;
--cat-documentacion: #1565C0;
--cat-estancadas: #7B1FA2;       /* Purple 700 */

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F5F5F5;
--bg-card-alert: #FFF3E0;        /* Orange 50 - card con alerta */

/* Textos - NEGRO puro, no grises claros */
--text-primary: #000000;
--text-secondary: #424242;       /* Gris 800, no 600 */
```

**Ratio contraste minimo:** 7:1 (WCAG AAA) para textos sobre fondo blanco.

### 6.3 Tipografia

- Titulos: 20-24px, bold, `--text-primary`
- Cuerpo: 16px (NO 14), `--text-primary`
- Subtexto/metadata: 14px (NO 12), `--text-secondary`
- codCar: monospace, 20px, bold, prominente
- Botones: 16px, medium weight, uppercase

**Nota:** Tamanos aumentados +2px respecto a estandar web para legibilidad en campo.

### 6.4 Responsive Breakpoints

- **Movil** (< 640px): layout single column, bottom nav, cards full width
- **Tablet** (640-1024px): split view (lista izq + detalle der)
- **Desktop** (> 1024px): redirect a extension Chrome

### 6.5 Accesibilidad en Campo

#### Tap targets
- **Minimo:** 48x48dp (12mm fisicos) para TODOS los elementos interactivos
- **Botones primarios:** 56x56dp (14mm)
- **Spacing entre targets:** 8dp minimo
- **Checkbox en card:** 48x48dp (zona tap generosa)

#### Zona de pulgar (mano derecha)
```
┌─────────────────────────┐
│ ZONA DIFICIL            │ ← Solo informacion (header)
│ (esquina sup-izq)       │    NO poner acciones aqui
│                         │
│ ZONA MEDIA              │ ← Contenido scroll
│                         │
│ ZONA FACIL              │ ← Acciones principales
│ (inferior derecha)      │    Bottom bar, bottom nav
└─────────────────────────┘
```

#### Modo outdoor (toggle en Config)
Activa automaticamente:
- Contraste extra (textos 100% negro, fondos 100% blanco)
- Tamano fuente +25% (cuerpo 20px, subtexto 16px)
- Bordes mas gruesos (2px en cards, 3px en chips)
- Desactiva animaciones complejas
- Aumenta padding en botones (+8dp)
- Clase CSS: `body.outdoor` carga `outdoor.css`

#### Notificaciones adaptadas al campo
- **NO audio** (ruido ambiental lo tapa)
- **SI vibracion** con patrones distinguibles:
  - Alerta CRITICA: doble pulso (100ms + pausa + 100ms)
  - Recordatorio vencido: pulso largo (200ms)
  - Accion completada: pulso corto (50ms)
- **SI badge numerico** (siempre visible en tab)
- **SI notificacion push** con botones de accion directa:
  ```
  "Carga 168345: POD pendiente 3 dias"
  [Abrir carga] [Marcar vista]
  ```

### 6.6 Feedback Obligatorio por Accion

Toda accion del usuario DEBE tener feedback triple: visual + haptico + textual.

| Accion | Visual | Haptico | Toast |
|--------|--------|---------|-------|
| Cambiar fase | Chip anima color viejo→nuevo | Corto (50ms) | "Fase actualizada a 19" (2s) |
| Enviar email | Boton→spinner→check | Doble (50ms+50ms) | "Email enviado a Garcia" (3s) |
| Marcar gestionado | Card fade out + slide | Medio (100ms) | "Carga archivada" + [Deshacer 5s] |
| Guardar nota | Nota aparece con highlight | Corto (50ms) | "Nota guardada" (2s) |
| Error de red | Borde rojo en card/boton | Triple rapido | "Sin conexion. Reintentando..." |
| Pull-to-refresh | Skeleton screens (shimmer) | Ninguno | "(N) cargas actualizadas" |

**Skeleton screens:** Usar shimmer effect para loading inicial, NUNCA spinners centrados.

**Toast con Undo:** Para acciones destructivas (archivar, eliminar nota), incluir boton [Deshacer] con 5s de timeout.

---

## 7. STACK RECOMENDADO

### Opcion A: PWA con Vanilla JS (Recomendado)
- **HTML5 + CSS3 + JavaScript ES6+**
- **Service Worker** para cache offline y notificaciones push
- **Web App Manifest** para "Add to Home Screen"
- **IndexedDB** para cache local de registros
- **Fetch API** para comunicacion con backend GAS
- Sin framework ni build step
- Archivo unico `index.html` + `app.js` + `styles.css` servido desde GitHub Pages o similar

**Ventajas:** Simplicidad, sin dependencias, compatible con el patron del proyecto existente (scripts via `<script>` tags).

### Opcion B: Framework ligero
- **Preact** o **Alpine.js** si se necesita reactividad
- **Vite** como bundler minimo
- Misma estrategia PWA

### Almacenamiento Local

```javascript
// Claves de localStorage/IndexedDB
'tarealog_config'               // Configuracion completa del usuario
'tarealog_plantillas'           // Array de plantillas
'tarealog_pie_comun'            // Firma global (HTML string)
'tarealog_alertas'              // Alertas activas evaluadas
'tarealog_recordatorios'        // Lista de recordatorios
'tarealog_recordatorios_vencidos' // Recordatorios vencidos (temporal para snooze)
'tarealog_notas'                // Mapa { codCar: NOTA[] }
'tarealog_secuencias'           // Array de secuencias activas
'tarealog_historial'            // Mapa { codCar: ENTRADA[] }
'tarealog_resumen_flag'         // Flag matutino { fecha, pospuestoHasta }
'tarealog_filtro_pendiente'     // Filtros para click-through desde resumen
'registros'                     // Cache de registros del backend
'ultimoBarrido'                 // ISO timestamp del ultimo barrido
```

---

## 8. CONFIGURACION DEL USUARIO

### 8.1 Configuracion General

```javascript
{
  gasUrl: '',                    // URL del backend GAS (obligatoria)
  intervaloMinutos: 15,          // Intervalo de barrido automatico (1-1440)
  emailsPorMinuto: 10,           // Rate limit para envios masivos (1-30)
  patrones: {
    codcarAdjunto: 'Carga_0*(\\d+)\\.pdf',  // Regex para detectar codCar en adjuntos
    keywordsAdmin: 'certificado|hacienda|347|aeat|factura'  // Keywords administrativos
  }
}
```

### 8.2 Configuracion de Alertas

```javascript
{
  alertas: {
    activado: true,              // Habilitar/deshabilitar motor alertas
    silencioUmbralH: 4,          // Horas sin respuesta (R2)
    estancamientoMaxH: {         // Horas max por fase (R3)
      '12': 3,                   // Fase 12 (cargando): 3h
      '19': 24,                  // Fase 19 (cargado/en ruta): 24h
      '22': 3                    // Fase 22 (descargando): 3h
    },
    docsUmbralDias: 2,           // Dias sin documentar (R4)
    cooldownMs: 3600000          // Cooldown entre alertas repetidas (1h)
  }
}
```

### 8.3 Configuracion de Resumen Matutino

```javascript
{
  resumenMatutino: {
    activado: true,              // Habilitar resumen automatico
    hora: '08:00'                // Hora de verificacion
  }
}
```

### 8.4 Configuracion de Recordatorios

```javascript
{
  recordatorios: {
    sugerenciasActivadas: true   // Sugerir recordatorio al cambiar fase
  }
}
```

### 8.5 Configuracion de Secuencias

```javascript
{
  secuencias: {
    activado: true,              // Habilitar secuencias
    evaluacionMinutos: 15        // Cada cuanto evaluar pasos
  }
}
```

### 8.6 Configuracion de Reporte de Turno

```javascript
{
  reporteTurno: {
    activado: true,              // Habilitar reporte automatico
    hora: '18:00'                // Hora de generacion
  }
}
```

### 8.7 Configuracion de Robustez

```javascript
{
  robustez: {
    timeoutBarridoMs: 300000,    // Timeout maximo para barrido (5 min)
    limiteLoteProcesamiento: 50, // Mensajes por lote
    tamanoTandaEnvio: 15         // Emails por tanda en envio masivo
  }
}
```

---

## 9. SECUENCIAS PREDEFINIDAS (Detalle)

### "Reclamar POD"
| Paso | Plantilla | Espera |
|------|-----------|--------|
| 1 | Solicitud docs descarga | 0h (inmediato) |
| 2 | Recordatorio docs pendientes | 72h (3 dias) |
| 3 | Escalado responsable | 168h (7 dias) |

### "Confirmar carga"
| Paso | Plantilla | Espera |
|------|-----------|--------|
| 1 | Consulta hora carga | 0h |
| 2 | Recordatorio carga | 24h |
| 3 | Urgente: confirmar carga | 48h |

### "Seguimiento incidencia"
| Paso | Plantilla | Espera |
|------|-----------|--------|
| 1 | Solicitar detalle incidencia | 0h |
| 2 | Recordatorio incidencia | 24h |
| 3 | Escalar incidencia | 72h |

---

## 10. BATERIAS DE FILTROS PREDEFINIDAS

| Nombre | Filtro |
|--------|--------|
| Alertas activas | estado = 'ALERTA' |
| Sin vincular | vinculacion = 'SIN_VINCULAR' |
| Operativos recientes | tipoTarea = 'OPERATIVO' |
| Administrativos | tipoTarea = 'ADMINISTRATIVA' |
| Gestionados | estado = 'GESTIONADO' |
| Recibidos pendientes | estado = 'RECIBIDO' |
| Sin fase | fase = '' |
| Sin fecha carga | fCarga = '' |
| Incidencias | fase IN ('05', '25') |
| En proceso | fase IN ('11', '12', '21', '22') |
| Completados | fase IN ('19', '29', '30') |

---

## 11. SANITIZACION HTML

Las plantillas soportan HTML basico para formato. El contenido debe sanitizarse:

**Tags permitidos:** `p`, `br`, `b`, `i`, `u`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `span`, `div`, `h1`-`h6`, `table`, `thead`, `tbody`, `tr`, `td`, `th`, `img`, `blockquote`, `pre`, `code`, `hr`, `sub`, `sup`

**Atributos permitidos:** `href`, `src`, `alt`, `title`, `class`, `style`, `colspan`, `rowspan`, `target`, `width`, `height`

**Bloqueados:** Tags `script`, `style`, `iframe`, `object`, `embed`, `form`. Atributos `on*` (onclick, etc). URLs `javascript:`, `data:`, `vbscript:` en href/src.

---

## 12. INDICACIONES DE IMPLEMENTACION

### 12.1 Arquitectura de archivos sugerida

```
src/movil/
├── index.html              # SPA entry point + manifest link
├── manifest.json           # Web App Manifest (PWA)
├── sw.js                   # Service Worker (cache, push, notificaciones)
├── css/
│   ├── app.css             # Estilos mobile-first + variables CSS
│   ├── cards.css           # Estilos card de carga (estados, alertas)
│   └── outdoor.css         # Modo outdoor (alto contraste, fuentes grandes)
├── js/
│   ├── app.js              # Entry point, router, inicializacion
│   ├── api.js              # Wrapper fetch() para todos los endpoints GAS
│   ├── store.js            # Estado local (registros, config, cache)
│   ├── feedback.js         # Vibracion, toasts, animaciones, sonidos
│   ├── views/
│   │   ├── todo.js         # Vista unificada (cargas + alertas inline)
│   │   ├── detalle.js      # Vista detalle de carga
│   │   ├── programados.js  # Vista envios programados + recordatorios
│   │   └── config.js       # Vista configuracion + modo outdoor
│   ├── components/
│   │   ├── card.js         # Card de carga (accion requerida + deadline)
│   │   ├── alert-card.js   # Card de alerta inline (roja/naranja)
│   │   ├── chip.js         # Chip de filtro/fase
│   │   ├── bottom-sheet.js # Bottom sheet generico
│   │   ├── bottom-bar.js   # Barra acciones sticky inferior
│   │   ├── search-bar.js   # Busqueda siempre visible
│   │   ├── toast.js        # Notificaciones toast con undo
│   │   └── editor.js       # Editor de respuesta (full-screen)
│   └── logic/
│       ├── alerts.js       # Motor alertas (reutilizar de extension)
│       ├── templates.js    # Interpolacion plantillas
│       ├── reminders.js    # Logica recordatorios
│       ├── sequences.js    # Logica secuencias
│       ├── filters.js      # Logica filtros
│       └── action-resolver.js # Determina "accion requerida" por carga
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### 12.2 Patron de comunicacion con backend

```javascript
// api.js - Ejemplo de wrapper
const API = {
  baseUrl: '',  // Se configura desde settings

  async get(action) {
    const res = await fetch(`${this.baseUrl}?action=${action}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  },

  async post(action, body) {
    const res = await fetch(`${this.baseUrl}?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  }
};
```

### 12.3 Logica reutilizable

Los siguientes modulos de la extension Chrome contienen **logica pura** (sin DOM ni Chrome API) y pueden reutilizarse directamente en la app movil:

- `alerts.js` - Motor de reglas R2-R6, deduplicacion, badge, notificaciones
- `templates.js` - CRUD plantillas, interpolacion `{{variable}}`, sanitizacion HTML
- `filters.js` - Construccion de filtros, baterias, filtro global, rango fechas
- `reminders.js` - CRUD recordatorios, presets, snooze, sugerencias
- `sequences.js` - Secuencias follow-up, evaluacion pasos, predefinidas
- `notes.js` - CRUD notas por carga (patron inmutable)
- `action-bar.js` - Acciones contextuales por fase
- `dashboard.js` - KPIs turno, grafico semanal, distribucion por grupo
- `action-log.js` - Historial de acciones, rotacion
- `shift-report.js` - Datos reporte de turno
- `alert-summary.js` - Categorizacion alertas, KPIs resumen, flag matutino
- `resilience.js` - Tandas, limites, retry

### 12.4 Consideraciones importantes

1. **CORS:** GAS Web App permite CORS por defecto. No deberia haber problemas.
2. **Rate limiting:** GAS tiene limite de ejecucion. Usar `limiteLoteProcesamiento` y `emailsPorMinuto`.
3. **Offline:** Cachear registros en IndexedDB. Mostrar datos cacheados si no hay red. Sincronizar al reconectar.
4. **Notificaciones push:** Usar Notification API del navegador (requiere permiso). Para PWA, usar Service Worker notifications.
5. **Timezone:** Las fechas se manejan en ISO 8601. Convertir a hora local para display.
6. **No hay login:** La app no requiere autenticacion propia. Solo necesita la URL del backend GAS.
7. **Throttle barridos:** Si hay `hayMas: true`, esperar 6 segundos antes de pedir siguiente lote (para no saturar GAS).

---

## 13. CRITERIOS DE ACEPTACION

### Fase 1 - Fundacion
- [ ] Vista "Todo" con lista de cards agrupadas por codCar
- [ ] Busqueda siempre visible en header
- [ ] Card muestra: codCar, transportista, chip fase, tiempo
- [ ] Tap card → detalle con emails + bottom bar sticky
- [ ] Cambiar fase con bottom sheet coloreado + feedback
- [ ] Responder email con plantilla + enviar/programar
- [ ] Pull-to-refresh funcional (procesarCorreos + getRegistros)
- [ ] Feedback (vibracion + toast) en CADA accion

### Fase 2 - Valor Diferencial
- [ ] Alertas evaluadas sobre registros (5 reglas)
- [ ] Cards con alertas muestran banner "ACCION REQUERIDA" + color
- [ ] Cards con alerta CRITICA aparecen PRIMERO en lista
- [ ] Badge numerico en tab "Todo" con total alertas
- [ ] Crear/ver/eliminar notas por carga
- [ ] "Accion requerida" calculada automaticamente por card

### Fase 3 - Optimizacion
- [ ] Filtros rapidos (3-4 chips sticky): Urgentes, Hoy, Sin leer
- [ ] Filtros avanzados en bottom sheet modal
- [ ] Plantillas con interpolacion de variables {{...}}
- [ ] Seleccion multiple con checkboxes + acciones masivas
- [ ] Export/import JSON de plantillas

### Fase 4 - Productividad
- [ ] Resumen matutino a las 08:00
- [ ] Recordatorios con presets y snooze
- [ ] Envios programados (ver, cancelar)
- [ ] Dashboard KPIs del turno
- [ ] Secuencias follow-up predefinidas
- [ ] Historial de acciones por carga

### No Funcionales
- [ ] PWA instalable (manifest + service worker)
- [ ] Funciona offline (datos cacheados en IndexedDB)
- [ ] Responsive (movil + tablet split view)
- [ ] Tiempo de carga inicial < 2 segundos
- [ ] Pull-to-refresh en menos de 5 segundos
- [ ] Sin dependencias externas (o minimas)
- [ ] Codigo auto-documentado, funciones < 20 lineas
- [ ] Tests unitarios para logica pura

### UX y Accesibilidad
- [ ] Contraste minimo 7:1 (WCAG AAA) en todos los textos
- [ ] Tap targets >= 48x48dp en TODOS los elementos interactivos
- [ ] Feedback triple (visual + haptico + toast) en CADA accion
- [ ] Busqueda siempre visible (NO detras de icono lupa)
- [ ] Modo outdoor funcional (toggle en Config)
- [ ] Skeleton screens para loading (NO spinners centrados)
- [ ] Toast con [Deshacer] en acciones destructivas
- [ ] Bottom bar para acciones (NO FAB)
- [ ] Checkboxes visibles para seleccion multiple (NO long press)
- [ ] Acciones principales en zona pulgar (bottom)

---

*Documento generado a partir del codigo fuente de TareaLog v0.3.0*
*Optimizado para UX movil en campo (operadores de trafico)*
*Ruta de codigo: `src/movil/`*
*Fecha: 2026-02-16*
