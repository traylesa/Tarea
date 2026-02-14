# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## Pre-Deployment

### Archivos para desplegar

La extension Chrome se despliega cargando la carpeta `src/extension/` en `chrome://extensions` (modo desarrollador).

**Archivos nuevos/modificados:**
- `manifest.json` - Actualizado v0.2.0, sin default_popup
- `background.js` - Reescrito: ventana independiente + config dinamica
- `panel.html` - Nuevo: reemplaza popup.html con tabs
- `panel.js` - Nuevo: reemplaza popup.js con config dinamica
- `panel.css` - Nuevo: reemplaza popup.css responsive
- `config.js` - Nuevo: modulo configuracion
- `config-ui.js` - Nuevo: UI configuracion

### Procedimiento de Despliegue

```
1. Abrir Chrome → chrome://extensions
2. Activar "Modo desarrollador" (esquina superior derecha)
3. Clic "Cargar extension sin empaquetar"
4. Seleccionar carpeta: src/extension/
5. Verificar que la extension aparece sin errores
6. Clic en el icono de la extension → debe abrir ventana independiente
```

### Smoke Tests

| Test | Resultado esperado |
|------|-------------------|
| Clic en icono | Abre ventana 800x600 |
| Segundo clic | Enfoca ventana existente |
| Mover ventana y reabrir | Recuerda posicion |
| Tab Datos | Muestra tabla Tabulator |
| Tab Configuracion | Muestra formulario |
| Guardar URL invalida | Muestra error rojo |
| Guardar config valida | Muestra "Configuracion guardada" |
| Restaurar defaults | Vuelve a valores por defecto |

### Rollback Plan

```
1. Restaurar manifest.json original (con default_popup)
2. Restaurar background.js original
3. Los archivos popup.html/popup.js/popup.css originales siguen en su lugar
4. Recargar extension en chrome://extensions
```

---

## PUERTA DE VALIDACION 7: SUPERADA

- [x] Deploy exitoso (extension local, carga directa)
- [x] Smoke tests documentados
- [x] Rollback plan documentado
