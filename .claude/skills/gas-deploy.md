# Skill: Despliegue GAS con clasp

**Proposito**: Guia completa para desplegar codigo Google Apps Script via clasp, evitando errores comunes de la Web App.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-15

---

## Contexto del Proyecto

TareaLog usa GAS como backend (Web App). El codigo vive en `src/gas/` y se sube con clasp. El deployment tiene URL fija que consume la extension Chrome.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/gas/.clasp.json` | Configuracion clasp (scriptId) |
| `src/gas/appsscript.json` | Manifest GAS (timeZone, webapp) |
| `src/gas/Codigo.js` | Punto de entrada: doGet/doPost |
| `src/gas/Configuracion.js` | Constantes, PropertiesService |

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

## Referencias

- **clasp scriptId proyecto**: `18IsF8QMTGocJUy_W3u5vNV5UHUjB4LlhaeEE_EeJkj-PCpGNYEcV6fp8`
- **Docs**: `docs/ARCHITECTURE.md` §Backend GAS
- **Diccionario**: `docs/DICCIONARIO_DOMINIO.md` §Hojas Sheets

---

**Generada por /genera-skills**
