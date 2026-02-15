# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## Pre-Deployment

### Archivos listos para produccion

| Archivo | Tipo |
|---------|------|
| `src/extension/alert-summary.js` | Nuevo |
| `src/extension/alert-summary.html` | Nuevo |
| `src/extension/alert-summary.css` | Nuevo |
| `src/extension/background.js` | Modificado |
| `src/extension/config.js` | Modificado |
| `src/extension/panel.html` | Modificado |
| `src/extension/panel.js` | Modificado |
| `src/extension/config-ui.js` | Modificado |

### Tests

```
70/70 tests pasando (28 nuevos + 42 existentes)
0 regresiones
```

---

## Deployment (Extension Chrome)

### Pasos para desplegar

1. Cargar extension en `chrome://extensions`
2. Activar "Modo desarrollador"
3. Click "Cargar sin empaquetar" → seleccionar `src/extension/`
4. Verificar que el service worker se activa sin errores
5. Verificar que aparece el boton "Resumen" en el panel

### Backend GAS

No requiere cambios en GAS para este Sprint. El backend existente ya proporciona alertas via procesarCorreos. No se despliega nuevo endpoint.

---

## Post-Deployment: Smoke Tests

| Test | Pasos | Resultado esperado |
|------|-------|-------------------|
| Boton Resumen | Click "Resumen" en panel | Ventana popup se abre con categorias |
| Sin alertas | Sin alertas en storage | Muestra "Sin alertas activas" |
| Click-through | Click en categoria | Panel se abre con filtro aplicado |
| Config matutino | Tab Config → Resumen matutino | Checkbox y hora visibles, se guardan |
| Posponer | Click "Posponer 1h" | Ventana se cierra, flag actualizado |

---

## Rollback Plan

1. En `chrome://extensions`, click "Recargar" con la version anterior de los archivos
2. Si es necesario limpiar storage: `chrome.storage.local.remove(['tarealog_resumen_flag', 'tarealog_filtro_pendiente'])`
3. Los archivos nuevos (alert-summary.*) se pueden eliminar sin afectar funcionalidad existente

---

## Puerta de Validacion 7

- [x] Archivos listos para despliegue
- [x] Smoke tests documentados
- [x] Rollback plan documentado

**Estado:** COMPLETADO (pendiente carga manual en chrome://extensions por el usuario)
