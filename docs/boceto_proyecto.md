# 📁 PROYECTO: LogiTask Orchestrator (Sistema de Seguimiento Logístico Automatizado)

## 1. RESUMEN EJECUTIVO

**LogiTask Orchestrator** es una herramienta híbrida (Extensión de Chrome + Google Apps Script) diseñada para reconciliar la **realidad operativa** (datos del ERP) con la **realidad comunicativa** (correos electrónicos).

Su objetivo es automatizar el seguimiento de Órdenes de Carga, detectar desviaciones en los envíos (emails incorrectos), gestionar documentación administrativa (Certificados, AEAT 347) y proporcionar un panel de control para el equipo de tráfico.

---

## 2. ARQUITECTURA DE DATOS (El "Mapa del Tesoro")

El sistema se alimenta de dos fuentes de verdad que deben cruzarse:

### A. Fuente ERP (Estática / CSVs exportados)

Estos archivos definen "lo que debería pasar".

1. **`dbo_PEDCLI.csv` (Maestro de Cargas):**
* **Clave Principal:** `CODCAR` (Código de Carga).
* **Datos Críticos:** `CODTRA` (Transportista asignado), `CODVIA` (Viaje), `FECHOR` (Fecha límite), `REFERENCIA` (Ref. Cliente).


2. **`dbo_TRANSPOR.csv` (Maestro de Transportistas):**
* **Clave:** `CODIGO` (que equivale al `CODTRA` de PEDCLI).
* **Datos:** `NOMBRE`, `NIF`, `DIRECCION`.


3. **`dbo_VIATELEF.csv` + `dbo_TELEF.csv` (Maestro de Contactos):**
* **Ruta de Enlace:** `CODVIA` (en PEDCLI) → `CODIGO` (en VIATELEF) → `NUMERO` (Email en TELEF).
* **Propósito:** Define a *qué email exacto* se debió enviar la orden.



### B. Fuente Comunicación (Dinámica / Gmail)

1. **Bandeja de Entrada/Salida:** Correos reales.
2. **Hoja de Seguimiento (Output):** El registro procesado donde se unifican los datos.

---

## 3. LÓGICA CORE: "El Motor de Vinculación"

Esta es la parte más crítica para el equipo de desarrollo. El sistema no solo lee correos, **construye contextos**.

### 3.1. Estrategia de Identificación (Cruce de Datos)

El script debe clasificar cada correo entrante en una de estas tres categorías:

#### CASO A: La Orden de Carga (Iniciador)

* **Detector:** Archivo adjunto con patrón `Regex: /Carga_0*(\d+)\.pdf/i`.
* **Acción:**
1. Extraer el número (`168345`). Este es el `CODCAR`.
2. Buscar `CODCAR` en `dbo_PEDCLI`.
3. **PERSISTENCIA DE HILO (Clave):** Guardar en una base de datos temporal (Script Properties o Hoja auxiliar "Cache_Hilos") la relación:
* `Key`: `ThreadID` (ID del hilo de Gmail).
* `Value`: `CODCAR` (168345).


4. Registrar en Hoja de Seguimiento con todos los datos del ERP.



#### CASO B: La Conversación (Respuestas / Hilo)

* **Contexto:** El transportista responde "Ok, recibido" o "Pásame datos del chófer". No hay adjunto PDF.
* **Detector:** `ThreadID` del correo entrante.
* **Acción:**
1. Consultar "Cache_Hilos" con el `ThreadID`.
2. ¿Existe? **SÍ** → Recuperar el `CODCAR` vinculado anteriormente.
3. Heredar automáticamente los datos del ERP (Ruta, Transportista) al registro de este nuevo correo, aunque el correo en sí no tenga la información explícita.



#### CASO C: Documentación Administrativa (Sin Carga Específica)

* **Contexto:** Solicitud de certificados, AEAT 347, Facturas.
* **Detector:**
* Regex en Asunto/Cuerpo: `/(Certificado|Hacienda|347|AEAT|Factura)/i`.
* Búsqueda de Entidad: Buscar coincidencias de `NOMBRE` o `NIF` (de `dbo_TRANSPOR`) dentro del cuerpo del correo.


* **Acción:**
1. Vincular al `CODTRA` (Empresa), dejando el `CODCAR` (Carga) vacío o genérico.
2. Marcar `Tipo_Tarea` = "ADMINISTRATIVA".



---

## 4. ESPECIFICACIÓN TÉCNICA (Para Desarrolladores)

### A. Google Apps Script (Backend)

**Módulo 1: `ThreadManager.gs` (Gestor de Memoria)**
Debe implementar un mecanismo de caché para no perder el hilo de las conversaciones.

```javascript
// Pseudo-código
function mapThreadToLoad(threadId, codCar) {
  // Guarda en una hoja oculta 'DB_HILOS' o ScriptProperties
  // Col A: threadId, Col B: codCar, Col C: Timestamp
}

function getLoadFromThread(threadId) {
  // Busca en 'DB_HILOS'. Si encuentra, devuelve el CODCAR.
  // Si no, devuelve null.
}

```

**Módulo 2: `EmailParser.gs` (Extractor)**

```javascript
function extractMetadata(message) {
  // 1. Intenta sacar CODCAR de adjuntos
  // 2. Si falla, busca patrones de NIF/CIF en el cuerpo
  // 3. Si falla, busca Keywords (Certificados, etc.)
  // Retorna objeto: { codCar, nif, tipo: 'OPERATIVO'|'ADMIN' }
}

```

**Módulo 3: `Auditor.gs` (Validación)**
Compara el `Remitente/Destinatario` real del correo contra el `NUMERO` (email) obtenido de `dbo_TELEF` cruzando por el `CODTRA`.

* Si `Email_Real` != `Email_ERP` → Flag: `⚠️ ALERTA_CONTACTO_NO_REGISTRADO`.

### B. Extensión de Chrome (Frontend / Control)

**Componente: `TaskScheduler**`
No confía en los triggers de Google solamente. La extensión actúa como "Jefe de Orquesta".

* Permite al usuario definir: "Ejecutar barrido cada 15 min".
* Botón "Forzar Vinculación": Para correos que la IA no pudo casar, el usuario selecciona el correo y escribe el `CODCAR` manualmente. La extensión envía esto al Script y actualiza la `Cache_Hilos` para arreglar el resto de la conversación.

---

## 5. FLUJO DE TRABAJO DEL USUARIO (User Journey)

1. **Recepción:** Entra un correo.
2. **Procesamiento (Automático):** El script se ejecuta (por tiempo o botón en extensión).
* Lee adjunto → Saca `CODCAR` → Asocia `ID_HILO`.


3. **Visualización:** El usuario abre la Extensión. Ve una tabla:
* 🟢 Carga 12345 | Transp: TRAYLESA | Estado: Enviado Correctamente.
* 🔴 Carga 67890 | Transp: PEPE | Estado: **Email Desconocido** (Alerta).
* ⚪ Sin Carga | Asunto: "Certificado" | Transp: TRAYLESA | Estado: Admin.


4. **Interacción:**
* El usuario responde a un correo sin adjuntos.
* El sistema detecta que el `ID_HILO` ya pertenece a la Carga 12345 y marca la tarea como "Gestionada".



---

## 6. REGLAS DE NEGOCIO (SLA & Alertas)

1. **Regla de Retraso:**
* Si `Ahora` > `dbo_PEDCLI.FECHOR` - 2 horas
* Y no existe registro de correo "Enviado" para ese `CODCAR`.
* **Acción:** Notificación Push en Chrome: "URGENTE: Carga 168345 a punto de vencer y sin orden enviada".


2. **Regla de Integridad de Datos:**
* El CSV final exportado debe convertir todos los caracteres a `UTF-8` y usar `;` como separador para compatibilidad con sistemas Windows en España.



---

### ¿Cómo usar esta documentación?

* **Equipo Backend (GAS):** Enfocarse en `ThreadManager` y la lógica de Regex.
* **Equipo Frontend (Extensión):** Enfocarse en visualizar las Alertas y permitir la edición manual de la `Cache_Hilos`.
* **Equipo Datos:** Asegurar que los CSVs de `dbo_` se actualicen/suban a Drive regularmente para que el Script tenga datos frescos.
