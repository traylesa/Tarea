# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** OPTIMIZA_TareaLog_Copiloto_20260215_152248
**Estado:** COMPLETADO

---

## Pre-Deployment Checklist

- [x] Tests: 73 passed, 0 failed
- [x] Cobertura >= 80%
- [x] DoD 100% completado
- [x] Sin archivos sensibles (.env, credentials)

## Componentes a Desplegar

### 1. Extension Chrome (local, sin store)

Archivos modificados/creados:
- `src/extension/alerts.js` (NUEVO)
- `src/extension/background.js` (MODIFICADO)
- `src/extension/config.js` (MODIFICADO)

**Procedimiento:**
```bash
# La extension se carga localmente en chrome://extensions
# 1. Ir a chrome://extensions
# 2. Activar "Modo desarrollador"
# 3. "Cargar descomprimida" → seleccionar src/extension/
# 4. Verificar que no hay errores en service worker
```

### 2. Backend GAS

Archivo modificado:
- `src/gas/Codigo.js` (MODIFICADO — procesarCorreos ahora retorna registros)

**Procedimiento:**
```bash
# Desde la raiz del proyecto:
cd src/gas
clasp push
clasp deploy -i <DEPLOYMENT_ID_EXISTENTE>
```

**Nota:** El clasp scriptId es `18IsF8QMTGocJUy_W3u5vNV5UHUjB4LlhaeEE_EeJkj-PCpGNYEcV6fp8`

---

## Smoke Tests Post-Deploy

1. Recargar extension → verificar service worker sin errores
2. Abrir panel → verificar tabla carga datos
3. Esperar 1 barrido → verificar badge aparece (si hay alertas)
4. Verificar console del service worker: sin errores `evaluarAlertas`
5. Verificar `chrome.storage.local` contiene `tarealog_alertas`

---

## Rollback Plan

### Extension Chrome
```bash
# Revertir background.js a version anterior
git checkout HEAD~1 -- src/extension/background.js
# Eliminar alerts.js
rm src/extension/alerts.js
# Recargar extension en chrome://extensions
```

### Backend GAS
```bash
# Revertir Codigo.js
git checkout HEAD~1 -- src/gas/Codigo.js
clasp push
clasp deploy -i <DEPLOYMENT_ID_EXISTENTE>
```

---

## Puerta de Validación 7

- [x] Procedimiento de deploy documentado
- [x] Smoke tests definidos
- [x] Rollback plan documentado
