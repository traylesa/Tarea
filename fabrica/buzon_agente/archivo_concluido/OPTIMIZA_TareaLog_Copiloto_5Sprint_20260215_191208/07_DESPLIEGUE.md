# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## OBJETIVO

Plan de despliegue para Sprint 5 de TareaLog (extensión Chrome local + backend GAS).

---

## Pre-Deployment

### Archivos a Desplegar

**Extension Chrome (carga local):**
- src/extension/dashboard.js (NUEVO)
- src/extension/action-log.js (NUEVO)
- src/extension/sequences.js (NUEVO)
- src/extension/shift-report.js (NUEVO)
- src/extension/action-bar.js (NUEVO - Sprint 4)
- src/extension/notes.js (NUEVO - Sprint 4)
- src/extension/panel.html (MODIFICADO - 6 script tags)
- src/extension/config.js (MODIFICADO - defaults)
- src/extension/background.js (MODIFICADO - alarmas)

**Backend GAS:** Sin cambios en Sprint 5.

---

## Procedimiento de Despliegue

### Paso 1: Extension Chrome
```
1. Abrir chrome://extensions/
2. Click "Actualizar" en extensión TareaLog (o "Cargar extensión sin empaquetar" si es primera vez)
3. Verificar que no hay errores en consola del service worker
4. Verificar que panel abre correctamente con todos los módulos
```

### Paso 2: Verificación Post-Deploy
```
1. Abrir panel TareaLog
2. Verificar que no hay errores en consola (F12)
3. Verificar que barrido funciona
4. Verificar que alarma SECUENCIAS se creó (chrome://extensions/ > Service Worker > Inspect)
```

### Rollback
```
1. Revertir a commit anterior: git checkout HEAD~1 -- src/extension/
2. Recargar extensión en chrome://extensions/
3. Verificar funcionalidad básica
```

---

## Checklist

- [x] Código en rama main
- [x] Tests 368/368 pasando
- [x] Sin cambios en backend GAS
- [ ] Extension recargada en Chrome (manual por usuario)
- [ ] Smoke test post-deploy (manual por usuario)

---

**Estado:** LISTO PARA DEPLOY (pendiente acción manual del usuario)
