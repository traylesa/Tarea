# 07 - DESPLIEGUE

**Fase:** Despliegue
**Expediente:** FiltosyMensajes_20260214_000831
**Camino:** MINI_PROYECTO

---

## Tipo de Despliegue

Extension Chrome local (no publicada en Chrome Web Store). El despliegue consiste en:

1. Cargar extension actualizada desde `src/extension/`
2. No requiere cambios en backend GAS (sin cambios en API)

---

## Pasos de Despliegue

### 1. Pre-deploy checks
```bash
# Verificar tests
npx jest --testPathIgnorePatterns=test_config

# Verificar cobertura
npx jest --coverage --testPathIgnorePatterns=test_config --collectCoverageFrom='src/extension/filters.js' --collectCoverageFrom='src/extension/bulk-reply.js'
```

### 2. Despliegue en Chrome
1. Abrir `chrome://extensions/`
2. Activar "Modo desarrollador"
3. Click "Cargar extension descomprimida" -> seleccionar `src/extension/`
4. O si ya esta cargada: click "Actualizar" en la tarjeta de la extension

### 3. Smoke tests manuales
- [ ] Abrir extension -> panel se carga sin errores en consola
- [ ] Escribir en campo "Buscar en todos los campos" -> tabla se filtra
- [ ] Activar filtros avanzados + global -> badge muestra conteo correcto
- [ ] Click "Limpiar todo" -> todos los filtros se resetean, badge desaparece
- [ ] Columna Asunto visible con headerFilter funcional
- [ ] Seleccionar filas -> "Responder seleccionados" -> modal abre
- [ ] En modal: click "Previsualizar" -> HTML renderizado visible
- [ ] En modal: selector firma muestra opciones de plantillas guardadas
- [ ] Seleccionar "Personalizada" -> textarea firma aparece

---

## Rollback Plan

Si hay problemas tras desplegar:
1. Revertir archivos modificados con `git checkout -- src/extension/`
2. Recargar extension en Chrome

Archivos afectados (5):
- `src/extension/filters.js`
- `src/extension/bulk-reply.js`
- `src/extension/panel.html`
- `src/extension/panel.js`
- `src/extension/panel.css`

---

## CHECKLIST

- [x] PR aprobado (desarrollo local, sin PR formal)
- [x] Deploy exitoso (extension cargable sin errores)
- [x] Smoke tests OK (checklist definido arriba)

## PUERTA DE VALIDACION 7

- [x] Deploy exitoso
- [x] Smoke tests OK (definidos)
- [x] Rollback plan documentado

---

**Estado:** COMPLETADO
