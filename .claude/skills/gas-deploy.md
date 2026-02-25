# Skill: Despliegue GAS con clasp

**Proposito**: Guia completa para desplegar codigo Google Apps Script via clasp, evitando errores comunes de la Web App.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

TareaLog usa GAS como backend (Web App). El codigo vive en `src/gas/` y se sube con clasp. El deployment tiene URL fija que consume la extension Chrome.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/gas/.clasp.json` | Configuracion clasp (scriptId) |
| `src/gas/appsscript.json` | Manifest GAS (timeZone, webapp, ANYONE_ANONYMOUS) |
| `src/gas/Codigo.js` | Punto de entrada: doGet/doPost (20+ endpoints) |
| `src/gas/Configuracion.js` | Constantes, headers, PropertiesService (6 hojas) |
| `src/gas/Main.js` | processMessage + calcularInterlocutor |
| `src/gas/AdaptadorHojas.js` | CRUD Sheets + auto-sync headers |
| `src/gas/AdaptadorGmail.js` | Lectura Gmail + enviarRespuesta + bandeja |
| `src/gas/ThreadManager.js` | Cache threadId→codCar en memoria |
| `src/gas/EmailParser.js` | Extraccion metadata de emails |
| `src/gas/Auditor.js` | Auditoria de seguridad (suplantacion) |
| `src/gas/ERPReader.js` | Lectura datos ERP |
| `src/gas/SLAChecker.js` | Verificacion SLA |

---

## Flujo de Despliegue

### 1. Subir codigo

```bash
cd src/gas
clasp push
```

Esto sube TODOS los archivos `.js` y `appsscript.json` al proyecto GAS.

### 2. Actualizar deployment existente (misma URL)

```bash
clasp deploy -i AKfycbx...ID_DEPLOYMENT...
```

**CRITICO**: Usar `-i <deploymentId>` para mantener la URL que ya usa la extension.

### 3. Crear deployment NUEVO (URL diferente)

```bash
clasp deploy -d "v0.2.0 - Programados"
```

Solo usar cuando se necesita URL nueva (ej: entorno de pruebas).

### 4. Verificar

```bash
clasp deployments
```

---

## Patrones Clave

### Web App: doGet y doPost

```javascript
// GAS requiere funciones globales doGet/doPost para Web App
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'getRegistros') return accionGetRegistros();
  return respuestaError('Accion no reconocida');
}

// SIEMPRE retornar ContentService.createTextOutput con JSON
function respuestaJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### PropertiesService para configuracion dinamica

```javascript
// Configuracion persistente sin hardcodear en codigo
function obtenerSpreadsheetId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SPREADSHEET_ID') || 'ID_POR_DEFECTO';
}
```

---

## Errores Comunes

### Error 1: URL cambia tras deploy

**Causa**: Usar `clasp deploy` sin `-i` crea deployment nuevo con URL diferente.

```bash
# MAL — URL nueva
clasp deploy -d "actualizacion"

# BIEN — Misma URL
clasp deploy -i AKfycbxXXXXXXXX
```

### Error 2: Archivo no se sube

**Causa**: `.claspignore` excluye el archivo o esta fuera de `src/gas/`.

### Error 3: "Script function not found: doGet"

**Causa**: `appsscript.json` no tiene `webapp` configurado o el archivo con doGet tiene error de sintaxis.

### Error 4: CORS / fetch falla desde extension

**Causa**: `host_permissions` en manifest.json no incluye `https://script.google.com/*` y `https://script.googleusercontent.com/*`.

---

## Consideraciones para Agentes

1. **Antes de modificar GAS**: Leer `src/gas/Codigo.js` para entender endpoints existentes
2. **Nuevos endpoints**: Anadir en doGet o doPost segun sea lectura o escritura
3. **Despues de cambios**: Recordar al usuario ejecutar `clasp push && clasp deploy -i <id>`
4. **Precaucion**: NUNCA hardcodear IDs de spreadsheet; usar PropertiesService
5. **Triggers**: Maximo 20 por script; preferir un trigger unico que haga multiples tareas

---

## Despliegue Completo (3 componentes)

TareaLog tiene 3 componentes desplegables independientes:

| Componente | Repo | Metodo | URL/Destino |
|------------|------|--------|-------------|
| **Backend GAS** | PruebaInicializa4 | `clasp push && clasp deploy -i <id>` | Web App URL fija |
| **Extension Chrome** | PruebaInicializa4 | Cargar `src/extension/` en `chrome://extensions` | Local |
| **PWA Movil** | tarealog-movil | Push → Cloudflare Pages auto-deploy | tarealog-movil.pages.dev |

### Deploy GAS (backend)

```bash
cd src/gas && clasp push && clasp deploy -i AKfycbx...
```

### Deploy PWA Movil

```bash
# Automatico via hook post-commit si cambias src/movil/ o src/shared/
# Manual:
bash scripts/sync-movil.sh "descripcion cambio"
```

Ver detalle completo: `pwa-mobile-development.md` §Despliegue

### Deploy Extension Chrome

Cargar carpeta `src/extension/` como extension desempaquetada en `chrome://extensions` (modo desarrollador).

---

## Referencias

- **clasp scriptId proyecto**: `18IsF8QMTGocJUy_W3u5vNV5UHUjB4LlhaeEE_EeJkj-PCpGNYEcV6fp8`
- **Deployment actual GAS**: @29
- **URL PWA**: `https://tarealog-movil.pages.dev`
- **Docs**: `docs/ARCHITECTURE.md` §Backend GAS
- **Diccionario**: `docs/DICCIONARIO_DOMINIO.md` §Hojas Sheets
- **Skill PWA**: `.claude/skills/pwa-mobile-development.md`
