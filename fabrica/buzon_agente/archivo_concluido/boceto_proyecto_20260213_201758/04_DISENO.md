# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## ARQUITECTURA

### Diagrama de componentes

```
┌─────────────────────────────────────────────────┐
│              CHROME EXTENSION (MV3)              │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ popup.js │  │ service  │  │ notifications │  │
│  │ (Panel)  │  │ worker   │  │ .js           │  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │                           │
│       └──────┬───────┘                           │
│              │ fetch()                           │
└──────────────┼───────────────────────────────────┘
               │ HTTPS (JSON)
               ▼
┌──────────────────────────────────────────────────┐
│           GOOGLE APPS SCRIPT (Web App)           │
│                                                  │
│  ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ WebApp.gs │→ │Procesador.gs │→ │Auditor.gs │ │
│  └───────────┘  └──────┬───────┘  └───────────┘ │
│                         │                        │
│              ┌──────────┼──────────┐             │
│              ▼          ▼          ▼             │
│  ┌──────────────┐ ┌──────────┐ ┌────────────┐   │
│  │EmailParser.gs│ │ThreadMgr │ │ERPLoader.gs│   │
│  └──────────────┘ │.gs       │ └─────┬──────┘   │
│                    └──────────┘       │          │
└───────────────────────────────────────┼──────────┘
                                        │
               ┌────────────────────────┼──────┐
               │     GOOGLE SHEETS      │      │
               │                        ▼      │
               │  ┌─────────────────────────┐  │
               │  │    Hoja_Seguimiento     │  │
               │  ├─────────────────────────┤  │
               │  │       DB_Hilos          │  │
               │  ├─────────────────────────┤  │
               │  │      Log_Proceso        │  │
               │  ├─────────────────────────┤  │
               │  │    Configuracion        │  │
               │  └─────────────────────────┘  │
               └───────────────────────────────┘

               ┌───────────────────────────────┐
               │       GOOGLE DRIVE            │
               │  dbo_PEDCLI.csv               │
               │  dbo_TRANSPOR.csv             │
               │  dbo_VIATELEF.csv             │
               │  dbo_TELEF.csv                │
               └───────────────────────────────┘
```

---

## MODELO DE DATOS

**Nota:** Nombres verificados contra `docs/DICCIONARIO_DOMINIO.md`. Propuestas de nuevos nombres en `PROPUESTA_DICCIONARIO.md`.

### Hoja: Hoja_Seguimiento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_registro | string (auto) | ID único del registro (timestamp + secuencial) |
| thread_id | string | ID del hilo Gmail |
| message_id | string | ID del mensaje Gmail |
| fecha_correo | datetime | Fecha/hora del correo |
| remitente | string | Email del remitente |
| destinatario | string | Email del destinatario |
| asunto | string | Asunto del correo |
| cod_carga | string | CODCAR vinculado (puede ser vacío) |
| cod_transportista | string | CODTRA del ERP |
| nombre_transportista | string | Nombre del transportista |
| tipo_tarea | enum | OPERATIVO, ADMINISTRATIVA, SIN_CLASIFICAR |
| estado_vinculacion | enum | AUTOMATICA, MANUAL, HILO_HEREDADO, PENDIENTE |
| alerta_contacto | boolean | true si email real != email ERP |
| email_esperado | string | Email según ERP (para auditoría) |
| fecha_proceso | datetime | Cuándo se procesó este registro |
| notas | string | Notas manuales del operador |

### Hoja: DB_Hilos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| thread_id | string (PK) | ID del hilo Gmail |
| cod_carga | string | CODCAR vinculado |
| origen | enum | ADJUNTO, MANUAL |
| fecha_creacion | datetime | Cuándo se creó el mapeo |

### Hoja: Log_Proceso

| Campo | Tipo | Descripción |
|-------|------|-------------|
| timestamp | datetime | Fecha/hora del evento |
| nivel | enum | INFO, WARN, ERROR |
| modulo | string | Nombre del módulo (EmailParser, Auditor, etc.) |
| mensaje | string | Descripción del evento |
| datos | string (JSON) | Datos contextuales |

### Hoja: Configuracion

| Campo | Tipo | Descripción |
|-------|------|-------------|
| clave | string (PK) | Nombre de configuración |
| valor | string | Valor actual |
| descripcion | string | Para qué sirve |

Valores iniciales:
- `REGEX_ADJUNTO`: `Carga_0*(\d+)\.pdf`
- `REGEX_ADMIN`: `(Certificado|Hacienda|347|AEAT|Factura)`
- `INTERVALO_MINUTOS`: `15`
- `ULTIMO_TIMESTAMP`: (vacío, se actualiza automáticamente)
- `DIAS_RETENCION_HILOS`: `30`

---

## INTERFACES (API WebApp)

### POST /exec (doPost)

**Request body:**
```json
{
  "action": "string",
  "token": "string",
  "params": {}
}
```

**Acciones disponibles:**

#### `action: "barrido"`
Ejecuta barrido de Gmail desde último timestamp.
```json
// Response
{
  "ok": true,
  "procesados": 15,
  "vinculados": 12,
  "alertas": 2,
  "timestamp": "2026-02-13T10:30:00Z"
}
```

#### `action: "cargas_dia"`
Obtiene cargas del día con estado.
```json
// Params
{ "fecha": "2026-02-13" }

// Response
{
  "ok": true,
  "cargas": [
    {
      "cod_carga": "168345",
      "transportista": "TRAYLESA",
      "estado": "ENVIADO",
      "alerta_contacto": false,
      "alerta_sla": false,
      "ultimo_correo": "2026-02-13T08:15:00Z"
    }
  ]
}
```

#### `action: "vincular_manual"`
Vincula un correo a un CODCAR manualmente.
```json
// Params
{ "thread_id": "abc123", "cod_carga": "168345" }

// Response
{ "ok": true, "mensajes_actualizados": 3 }
```

#### `action: "alertas"`
Obtiene alertas activas (SLA + contacto).
```json
// Response
{
  "ok": true,
  "alertas": [
    {
      "tipo": "SLA",
      "cod_carga": "168345",
      "mensaje": "Carga 168345 vence en 1h sin orden enviada",
      "urgencia": "CRITICA"
    }
  ]
}
```

---

## FLUJOS DE EJECUCIÓN

### Flujo 1: Barrido automático

```
1. chrome.alarms dispara cada 15 min
2. service-worker.js → fetch(GAS_URL, {action: "barrido"})
3. GAS: Procesador obtiene correos desde ULTIMO_TIMESTAMP
4. GAS: Para cada correo:
   a. EmailParser extrae metadatos (Caso A/B/C)
   b. ThreadManager consulta/actualiza cache
   c. Auditor valida contactos
   d. Registra en Hoja_Seguimiento
5. GAS: Actualiza ULTIMO_TIMESTAMP
6. GAS: Retorna resumen a extensión
7. service-worker.js: Si hay alertas → chrome.notifications
8. service-worker.js: Actualiza badge con número de alertas
```

### Flujo 2: Vinculación manual

```
1. Usuario abre popup, ve correo "PENDIENTE"
2. Usuario escribe CODCAR y pulsa "Vincular"
3. popup.js → fetch(GAS_URL, {action: "vincular_manual", thread_id, cod_carga})
4. GAS: ThreadManager registra ThreadID → CODCAR
5. GAS: Actualiza todos los registros del hilo en Hoja_Seguimiento
6. GAS: Retorna confirmación
7. popup.js: Refresca tabla
```

### Flujo 3: Alerta SLA

```
1. Durante barrido, Procesador detecta:
   - FECHOR - 2h <= Ahora
   - No hay registro "ENVIADO" para ese CODCAR
2. Genera alerta tipo SLA en response
3. service-worker.js recibe alerta
4. chrome.notifications.create({title: "URGENTE", message: "Carga X vence en Yh"})
5. Badge actualizado
```

---

## ESTRUCTURA DE ARCHIVOS

```
logitask-orchestrator/
├── gas/                        # Google Apps Script
│   ├── appsscript.json         # Manifiesto GAS
│   ├── WebApp.gs               # doGet/doPost endpoints
│   ├── Procesador.gs           # Orquestador de barrido
│   ├── EmailParser.gs          # Extracción de metadatos
│   ├── ThreadManager.gs        # Cache de hilos
│   ├── Auditor.gs              # Validación de contactos
│   ├── ERPLoader.gs            # Carga de CSVs
│   └── Config.gs               # Constantes y configuración
│
├── extension/                  # Chrome Extension MV3
│   ├── manifest.json           # Manifiesto MV3
│   ├── service-worker.js       # Background: alarms, notifications
│   ├── popup.html              # Panel de control
│   ├── popup.js                # Lógica del panel
│   ├── popup.css               # Estilos del panel
│   ├── api.js                  # Cliente HTTP para GAS WebApp
│   ├── notifications.js        # Gestión de alertas Chrome
│   ├── options.html            # Página de configuración
│   ├── options.js              # Lógica de configuración
│   └── icons/                  # Iconos 16/48/128
│
├── tests/                      # Tests
│   └── TDD/
│       ├── unit/               # Tests unitarios por módulo
│       └── integration/        # Tests de integración
│
└── docs/                       # Documentación
    └── USUARIO.md              # Guía de usuario
```

---

## CHECKLIST

- [x] Arquitectura clara (diagrama de componentes)
- [x] Nombres propuestos en PROPUESTA_DICCIONARIO.md
- [x] Interfaces definidas (API WebApp con 4 endpoints)
- [x] Flujos críticos documentados (3 flujos)
- [x] Modelo de datos completo (4 hojas Google Sheets)
- [x] Estructura de archivos definida

---

**Estado:** COMPLETADO
