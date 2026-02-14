# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────────┐
│                CHROME EXTENSION                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │popup.html│  │ popup.js │  │background.js  │ │
│  │(Panel UI)│←→│(Logica)  │  │(Service Worker│ │
│  └──────────┘  └────┬─────┘  │ Alarmas)      │ │
│                     │        └───────┬───────┘ │
└─────────────────────┼────────────────┼─────────┘
                      │ fetch          │ chrome.alarms
                      ▼                ▼
┌─────────────────────────────────────────────────┐
│           GOOGLE APPS SCRIPT (Web App)           │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Main.js │→ │EmailParser│  │ ThreadManager │ │
│  │(Orquest.)│  │(Extractor)│  │(Cache Hilos)  │ │
│  └────┬─────┘  └──────────┘  └───────────────┘ │
│       │        ┌──────────┐  ┌───────────────┐ │
│       ├───────→│ERPReader │  │  SLAChecker   │ │
│       │        │(CSV Parse)│  │(Alertas SLA)  │ │
│       │        └──────────┘  └───────────────┘ │
│       │        ┌──────────┐                     │
│       └───────→│ Auditor  │                     │
│                │(Validac.)│                     │
│                └──────────┘                     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              GOOGLE SHEETS (DB)                  │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ DB_HILOS      │  │ SEGUIMIENTO            │  │
│  │ (Cache oculta)│  │ (Registro principal)   │  │
│  └──────────────┘  └────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ dbo_PEDCLI   │  │ dbo_TRANSPOR           │  │
│  │ (CSV import) │  │ (CSV import)           │  │
│  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## MODELO DE DATOS

### Hoja: DB_HILOS (oculta)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| thread_id | string | ID del hilo Gmail |
| cod_car | number | Codigo de carga vinculado |
| created_at | datetime | Fecha de creacion del vinculo |
| updated_at | datetime | Ultima actualizacion |

### Hoja: SEGUIMIENTO (principal)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | number | ID autoincremental |
| message_id | string | ID del mensaje Gmail |
| thread_id | string | ID del hilo Gmail |
| cod_car | number/null | Codigo de carga (null si no vinculado) |
| cod_tra | string/null | Codigo transportista |
| nombre_transportista | string/null | Nombre del transportista (de ERP) |
| email_remitente | string | Email del remitente real |
| email_erp | string/null | Email registrado en ERP |
| asunto | string | Asunto del correo |
| fecha_correo | datetime | Fecha del correo |
| tipo_tarea | enum | OPERATIVO / ADMINISTRATIVA / SIN_CLASIFICAR |
| estado | enum | ENVIADO / RECIBIDO / GESTIONADO / ALERTA |
| alerta | string/null | Tipo de alerta si aplica |
| vinculacion | enum | AUTOMATICA / MANUAL / HILO / SIN_VINCULAR |
| procesado_at | datetime | Fecha de procesamiento |

### Hoja: dbo_PEDCLI (importada CSV)

| Campo | Tipo | Origen ERP |
|-------|------|-----------|
| CODCAR | number | Codigo de carga |
| CODTRA | string | Codigo transportista |
| CODVIA | string | Codigo viaje |
| FECHOR | datetime | Fecha hora limite |
| REFERENCIA | string | Referencia cliente |

### Hoja: dbo_TRANSPOR (importada CSV)

| Campo | Tipo | Origen ERP |
|-------|------|-----------|
| CODIGO | string | = CODTRA de PEDCLI |
| NOMBRE | string | Nombre transportista |
| NIF | string | NIF/CIF |
| DIRECCION | string | Direccion |

### Hoja: dbo_VIATELEF + dbo_TELEF (contactos)

| Campo | Tipo | Origen ERP |
|-------|------|-----------|
| CODVIA | string | Codigo viaje (enlace) |
| NUMERO | string | Email de contacto |

---

## INTERFACES PUBLICAS

### EmailParser

```javascript
/**
 * Extrae metadatos de un mensaje de correo.
 * @param {Object} message - {attachments: string[], subject: string, body: string, from: string}
 * @returns {Object} {codCar: number|null, nif: string|null, tipo: 'OPERATIVO'|'ADMINISTRATIVA'|'SIN_CLASIFICAR'}
 */
function extractMetadata(message) {}

/**
 * Extrae CODCAR de nombre de adjunto.
 * @param {string} filename - Nombre del archivo adjunto
 * @returns {number|null} Codigo de carga o null
 */
function extractCodCarFromFilename(filename) {}

/**
 * Detecta si el correo es administrativo por keywords.
 * @param {string} subject - Asunto del correo
 * @param {string} body - Cuerpo del correo
 * @returns {boolean}
 */
function isAdministrative(subject, body) {}

/**
 * Extrae NIF/CIF del texto.
 * @param {string} text - Texto a analizar
 * @returns {string|null} NIF encontrado o null
 */
function extractNif(text) {}
```

### ThreadManager

```javascript
/**
 * Vincula un hilo a un codigo de carga.
 * @param {string} threadId - ID del hilo Gmail
 * @param {number} codCar - Codigo de carga
 */
function mapThreadToLoad(threadId, codCar) {}

/**
 * Recupera el CODCAR vinculado a un hilo.
 * @param {string} threadId - ID del hilo Gmail
 * @returns {number|null} CODCAR o null si no existe
 */
function getLoadFromThread(threadId) {}
```

### ERPReader

```javascript
/**
 * Busca una carga por CODCAR en dbo_PEDCLI.
 * @param {number} codCar - Codigo de carga
 * @returns {Object|null} {codCar, codTra, codVia, fechor, referencia} o null
 */
function findCarga(codCar) {}

/**
 * Busca un transportista por CODTRA en dbo_TRANSPOR.
 * @param {string} codTra - Codigo transportista
 * @returns {Object|null} {codigo, nombre, nif, direccion} o null
 */
function findTransportista(codTra) {}

/**
 * Obtiene email de contacto para un CODVIA.
 * @param {string} codVia - Codigo viaje
 * @returns {string|null} Email o null
 */
function findEmailContacto(codVia) {}
```

### Auditor

```javascript
/**
 * Verifica si el email real coincide con el registrado en ERP.
 * @param {string} emailReal - Email del remitente/destinatario
 * @param {string} codTra - Codigo transportista
 * @returns {Object} {valido: boolean, alerta: string|null, emailErp: string|null}
 */
function auditEmail(emailReal, codTra) {}
```

### SLAChecker

```javascript
/**
 * Detecta cargas proximas a vencer sin correo enviado.
 * @param {Object[]} cargas - Lista de cargas con fechor
 * @param {Object[]} registros - Registros de seguimiento existentes
 * @param {number} umbralHoras - Horas antes del vencimiento (default: 2)
 * @returns {Object[]} Cargas con alerta: [{codCar, fechor, horasRestantes}]
 */
function checkSLA(cargas, registros, umbralHoras) {}
```

---

## FLUJOS DE EJECUCION

### Flujo 1: Procesamiento de correo (Main)

1. Obtener correos nuevos desde ultimo barrido (GmailApp)
2. Para cada mensaje:
   a. `extractMetadata(message)` → obtener codCar, tipo
   b. Si codCar encontrado → `mapThreadToLoad(threadId, codCar)`
   c. Si no → `getLoadFromThread(threadId)` (herencia hilo)
   d. Si codCar → `findCarga(codCar)` → datos ERP
   e. `auditEmail(from, codTra)` → verificar contacto
   f. Registrar en hoja SEGUIMIENTO
3. `checkSLA(cargas, registros)` → generar alertas

### Flujo 2: Panel Extension

1. Usuario abre popup → fetch a GAS Web App
2. GAS retorna registros de SEGUIMIENTO (JSON)
3. Popup renderiza tabla con colores segun estado/alerta
4. Usuario puede: filtrar, forzar vinculacion, ejecutar barrido

---

## NOMBRES EN DICCIONARIO

Todos los nombres propuestos estan documentados en `PROPUESTA_DICCIONARIO.md` de este expediente.

---

## CHECKLIST

- [x] Arquitectura clara y documentada
- [x] Todos los nombres en DICCIONARIO_DOMINIO.md (propuesta creada)
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados
- [x] Validaciones especificadas (en interfaces)

---

## PUERTA DE VALIDACION 4

- [x] Nombres documentados en propuesta de diccionario
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

---

**Estado:** COMPLETADO
**Puerta de validacion 4:** SUPERADA
