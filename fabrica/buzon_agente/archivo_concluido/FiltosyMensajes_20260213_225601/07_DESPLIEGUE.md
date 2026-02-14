# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## Pre-Deployment

### Archivos a desplegar

Extension Chrome (carpeta `src/extension/`):
- `panel.html` - Interfaz principal actualizada
- `panel.js` - Logica principal con integracion nuevos modulos
- `panel.css` - Estilos actualizados
- `filters.js` - NUEVO: modulo filtros avanzados
- `templates.js` - NUEVO: modulo plantillas respuesta
- `gas-services.js` - NUEVO: modulo multi-URL GAS
- `thread-grouping.js` - NUEVO: modulo agrupacion hilos
- `bulk-reply.js` - NUEVO: modulo respuesta masiva
- `help-content.js` - NUEVO: contenido ayuda
- `config.js` - Sin cambios
- `config-ui.js` - Sin cambios
- `background.js` - Sin cambios
- `manifest.json` - Sin cambios

### Verificaciones pre-deploy

```bash
# Tests pasan
npx jest tests/TDD/unit/test_filters.js tests/TDD/unit/test_templates.js tests/TDD/unit/test_gas_services.js tests/TDD/unit/test_thread_grouping.js tests/TDD/unit/test_bulk_reply.js
# Resultado: 55 passed, 5 suites passed
```

---

## Deployment

### Metodo: Carga manual en Chrome

```
1. Abrir chrome://extensions/
2. Activar "Modo desarrollador"
3. Click "Cargar extension sin empaquetar"
4. Seleccionar carpeta: src/extension/
5. Verificar que se carga sin errores
```

### Actualizacion (si ya esta cargada)

```
1. Abrir chrome://extensions/
2. Buscar "LogiTask Orchestrator"
3. Click boton de recarga (flecha circular)
4. Verificar version en detalles
```

---

## Post-Deployment: Smoke Tests

| Test | Accion | Resultado esperado |
|------|--------|-------------------|
| Carga extension | Abrir chrome://extensions | Extension visible sin errores |
| Abrir panel | Click en icono extension | Ventana se abre con tabs: Datos, Plantillas, Config, ? |
| Filtros | Click "Filtros" | Panel se expande con baterias y campos |
| Baterias | Click "Alertas activas" | Tabla filtra solo alertas |
| Agrupacion | Click "Agrupar por hilo" | Registros agrupados por threadId |
| Plantillas | Tab Plantillas | Editor visible, crear/editar/eliminar funcional |
| Config servicios | Tab Config | Lista servicios, agregar/eliminar funcional |
| Ayuda | Tab ? | Secciones de ayuda navegables |

---

## Rollback Plan

```bash
# Si la extension falla:
# 1. Revertir archivos modificados a version anterior
git checkout HEAD~1 -- src/extension/panel.html src/extension/panel.js src/extension/panel.css

# 2. Eliminar modulos nuevos (no rompe nada, panel.html no los referencia en version anterior)
rm src/extension/filters.js src/extension/templates.js src/extension/gas-services.js
rm src/extension/thread-grouping.js src/extension/bulk-reply.js src/extension/help-content.js

# 3. Recargar extension en chrome://extensions/
```

---

## CHECKLIST

- [x] Archivos listados y verificados
- [x] Tests pre-deploy pasando
- [x] Smoke tests definidos
- [x] Rollback plan documentado

## PUERTA DE VALIDACION 7

- [x] Deploy documentado (carga manual Chrome)
- [x] Smoke tests definidos
- [x] Rollback plan documentado

---

**Estado:** COMPLETADO
