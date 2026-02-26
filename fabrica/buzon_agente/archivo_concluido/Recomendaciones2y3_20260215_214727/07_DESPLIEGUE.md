# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## OBJETIVO

Preparar la solucion para despliegue en produccion.

---

## Pre-Deployment

### Archivos modificados en extension (local, no requiere deploy)
- src/extension/templates.js (sanitizarHtml whitelist)
- src/extension/panel.js (reducido 38%)
- src/extension/panel.html (+5 script tags)
- src/extension/panel-plantillas.js (nuevo)
- src/extension/panel-recordatorios.js (nuevo)
- src/extension/panel-programados.js (nuevo)
- src/extension/panel-acciones.js (nuevo)
- src/extension/panel-dashboard.js (nuevo)

### Archivos modificados en GAS (requiere clasp push + deploy)
- src/gas/Codigo.js (CAMPOS_EDITABLES + validacion)
- src/gas/Configuracion.js (obtenerSpreadsheetId sin fallback)

### Pasos de despliegue

#### Extension Chrome (local)
La extension se carga localmente en chrome://extensions. Los cambios aplican al recargar la extension.

#### Backend GAS
```bash
# 1. Push codigo actualizado
clasp push

# 2. Actualizar deployment existente (misma URL)
clasp deploy -i <deployment-id> -d "v0.3.1: seguridad + modularizacion"
```

### Rollback Plan

#### Extension
Revertir git a commit anterior y recargar extension:
```bash
git checkout HEAD~1 -- src/extension/
```

#### GAS
```bash
clasp deploy -i <deployment-id> -V <version-anterior>
```

### Verificacion post-deploy

1. Abrir extension, verificar que panel carga sin errores en consola
2. Verificar tabla con datos reales
3. Probar edicion de campo (fase/estado) - debe funcionar
4. Intentar edicion de campo no permitido via consola - debe rechazar
5. Verificar plantillas, recordatorios, dashboard siguen operativos

---

## Checklist

- [x] Tests: 419 passed, 0 failed
- [x] Codigo listo en branch main
- [x] Rollback plan documentado
- [x] Pasos de deploy claros
- [x] Sin cambios breaking en API

---

**Puerta de validacion 7:** APROBADA
