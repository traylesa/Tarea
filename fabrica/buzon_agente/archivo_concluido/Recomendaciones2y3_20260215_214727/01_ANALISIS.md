# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO

---

## 1.1 Resumen Ejecutivo

Reforzar seguridad (sanitización HTML, whitelist campos backend, eliminar spreadsheet hardcodeado) y modularizar panel.js (2,772 líneas) en archivos temáticos. Sin cambios visibles para el usuario final.

---

## 1.2 Situación Actual (AS-IS)

- **sanitizarHtml()** (templates.js:62-67): Solo filtra `<script>` y atributos `on*` con comillas. No filtra `<iframe>`, `<object>`, `<embed>`, `<form>`, `javascript:` en URLs, ni atributos sin comillas.
- **actualizarCampo()** (Codigo.js:111, AdaptadorHojas.js:62): Acepta cualquier campo que exista en headers. Sin whitelist. Falla silenciosamente si campo no existe.
- **obtenerSpreadsheetId()** (Configuracion.js:6): Fallback hardcodeado `'1cLslY9zsd06zQthBnPQpSFTY6KLkopB0xSEIDx5KN-c'`.
- **panel.js**: 2,772 líneas, monolítico. Contiene: tabla Tabulator, filtros UI, plantillas UI, recordatorios UI, acciones/notas, dashboard, eventos globales.

## 1.3 Situación Deseada (TO-BE)

- **sanitizarHtml()**: Whitelist de tags y atributos seguros. Todo lo demás se elimina. URLs `javascript:` / `data:` / `vbscript:` limpiadas.
- **actualizarCampo()**: Lista explícita `CAMPOS_EDITABLES`. Retorna `{ok:false, error:"..."}` si campo no permitido.
- **obtenerSpreadsheetId()**: Lanza error si no hay ID en PropertiesService. Sin fallback.
- **panel.js**: <500 líneas (coordinador). Lógica extraída a panel-tabla.js, panel-plantillas.js, panel-recordatorios.js, panel-acciones.js, panel-notas.js, panel-dashboard.js.

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Sanitización HTML | Regex básico (script + on*) | Whitelist tags/atributos + limpieza URLs | Reescribir sanitizarHtml con enfoque whitelist |
| Validación campos | Sin validación | Whitelist CAMPOS_EDITABLES | Añadir lista + validación en accionActualizarCampo |
| Spreadsheet ID | Fallback hardcodeado | Error obligatorio | Eliminar fallback, lanzar error |
| panel.js | 2,772 líneas monolítico | <500 líneas coordinador + 6 módulos | Extraer bloques a archivos, añadir scripts en HTML |

---

## 1.5 Historias de Usuario

### HU-1: Sanitización HTML robusta
```
COMO operador que importa plantillas JSON de terceros
QUIERO que el HTML peligroso se elimine automáticamente
PARA evitar inyección de código malicioso en mis plantillas
```

**Criterios de Aceptación:**
- CA-1.1 (caso feliz): DADO HTML con `<b>texto</b>` CUANDO se sanitiza ENTONCES se preserva intacto
- CA-1.2 (caso error): DADO HTML con `<iframe src="evil">` CUANDO se sanitiza ENTONCES se elimina el iframe completo
- CA-1.3 (caso borde): DADO HTML con `<a href="javascript:alert(1)">click</a>` CUANDO se sanitiza ENTONCES se elimina el href pero se preserva el tag `<a>`
- CA-1.4 (caso borde): DADO HTML con `<img onerror=alert(1)>` (sin comillas) CUANDO se sanitiza ENTONCES se elimina el atributo onerror
- CA-1.5 (caso borde): DADO HTML vacío o null CUANDO se sanitiza ENTONCES retorna string vacío

### HU-2: Whitelist de campos en backend
```
COMO administrador del sistema
QUIERO que solo campos específicos sean editables via API
PARA proteger campos internos de modificación accidental o maliciosa
```

**Criterios de Aceptación:**
- CA-2.1 (caso feliz): DADO campo `fase` (permitido) CUANDO se llama actualizarCampo ENTONCES se guarda y retorna `{ok:true}`
- CA-2.2 (caso error): DADO campo `messageId` (prohibido) CUANDO se llama ENTONCES retorna `{ok:false, error:"Campo no editable: messageId"}`
- CA-2.3 (caso borde): DADO campo vacío o undefined CUANDO se llama ENTONCES retorna `{ok:false, error:"Campo no editable: ..."}`

### HU-3: SPREADSHEET_ID obligatorio
```
COMO nuevo usuario de la extensión
QUIERO un error claro si no he configurado la hoja de cálculo
PARA no apuntar accidentalmente al spreadsheet de otra persona
```

**Criterios de Aceptación:**
- CA-3.1 (caso feliz): DADO PropertiesService con SPREADSHEET_ID CUANDO se llama obtenerSpreadsheetId ENTONCES retorna el ID configurado
- CA-3.2 (caso error): DADO PropertiesService sin SPREADSHEET_ID CUANDO se llama ENTONCES lanza error con mensaje descriptivo
- CA-3.3 (caso borde): DADO SPREADSHEET_ID como string vacío CUANDO se llama ENTONCES lanza error (no acepta vacío)

### HU-4: Modularización de panel.js
```
COMO desarrollador
QUIERO panel.js dividido en módulos temáticos
PARA poder modificar una funcionalidad sin revisar 2,700+ líneas
```

**Criterios de Aceptación:**
- CA-4.1 (caso feliz): DADO el panel cargado CUANDO se abre ENTONCES funciona idéntico al actual
- CA-4.2 (caso feliz): DADO panel.js CUANDO se mide ENTONCES tiene <500 líneas
- CA-4.3 (caso borde): DADO un módulo extraído CUANDO se carga en orden incorrecto ENTONCES la extensión muestra error descriptivo (no falla silenciosamente)

---

## 1.6 Requisitos No Funcionales

- **Rendimiento**: Sanitización <1ms para HTML <10KB. Sin impacto en carga del panel.
- **Seguridad**: Enfoque whitelist (permitir solo lo seguro, eliminar todo lo demás).
- **Compatibilidad**: Chrome MV3. Patrón `<script>` tags (no modules).
- **Mantenibilidad**: Módulos con patrón dual-compat para testabilidad Jest.
- **Regresión**: 0 tests rotos de los 368+ existentes.

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Sanitización elimina HTML legítimo de plantillas | Media | Alto | Whitelist generosa de tags de formato |
| Whitelist campos muy restrictiva | Baja | Medio | Incluir todos los campos que panel.js edita |
| Modularización rompe orden de carga | Alta | Alto | Respetar dependencias, test tras cada extracción |
| Error spreadsheet confunde al usuario | Baja | Bajo | Mensaje claro con instrucciones |

## 1.8 Dependencias

- HU-1, HU-2, HU-3: Independientes entre sí, pueden implementarse en paralelo
- HU-4: Depende de que HU-1/2/3 estén completas (no modularizar código en cambio)

## 1.9 Preguntas Abiertas

- Ninguna. El alcance está claro y los cambios son internos.

---

## PUERTA DE VALIDACIÓN 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene mínimo 3 criterios de aceptación
- [x] Riesgos identificados con mitigación
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
