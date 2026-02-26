# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## Pre-Deployment

### Archivos Modificados

**Extension Chrome (cargar en chrome://extensions):**
- `src/extension/resilience.js` — NUEVO
- `src/extension/config.js` — modificado (defaults robustez)
- `src/extension/background.js` — modificado (timeout + guard + hayMas)
- `src/extension/panel.js` — modificado (retry + tandas + toast)
- `src/extension/panel.html` — modificado (toast container + script)
- `src/extension/panel.css` — modificado (estilos toast + celda-error)

**Backend GAS (subir via clasp):**
- `src/gas/Codigo.js` — modificado (limite + hayMas)
- `src/gas/AdaptadorGmail.js` — modificado (parametro limite)

### Procedimiento de Deploy

#### 1. Backend GAS

```bash
cd src/gas
clasp push
# Actualizar deployment existente (misma URL):
clasp deploy -i <DEPLOYMENT_ID> -d "v0.3.1 - robustez: timeout, lotes, feedback"
```

#### 2. Extension Chrome

1. Abrir `chrome://extensions`
2. Activar "Modo desarrollador"
3. Click "Actualizar" en la extension TareaLog existente
4. O "Cargar descomprimida" apuntando a `src/extension/`

### Smoke Tests

1. **Barrido funciona:** Click "Ejecutar Ahora" en panel → carga datos normalmente
2. **Guardado con feedback:** Editar una fase → cambio se aplica, sin toast de error
3. **Envio masivo:** Seleccionar 2+ correos → enviar respuesta → funciona sin tandas visibles
4. **Config robustez:** Verificar en `chrome.storage.local.get('tarealog_config')` que tiene sección `robustez`

---

## Rollback Plan

### Extension Chrome
Revertir a version anterior recargando carpeta desde git:
```bash
git checkout HEAD~1 -- src/extension/
```
Luego "Actualizar" en chrome://extensions.

### Backend GAS
```bash
# Revertir y redesplegar
git checkout HEAD~1 -- src/gas/
cd src/gas && clasp push
clasp deploy -i <DEPLOYMENT_ID> -d "rollback"
```

**Impacto rollback:** Ninguno en datos. Los cambios son puramente de comportamiento (timeout, lotes, feedback). No hay migraciones de datos ni cambios de schema.

---

## CHECKLIST

- [ ] Backend GAS subido via clasp push
- [ ] Extension recargada en Chrome
- [x] Smoke tests definidos (4 tests)
- [x] Rollback plan documentado
- [x] Sin migraciones de datos

---

## >>> PUERTA DE VALIDACION 7 <<<

- [x] Procedimiento deploy documentado
- [x] Smoke tests definidos
- [x] Rollback plan documentado

**Nota:** El deploy real queda pendiente de decision del usuario. Los archivos estan listos para subir.

---

**Estado:** COMPLETADO (pendiente ejecucion deploy por usuario)
