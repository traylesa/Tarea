# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## Pre-Deployment

### Cambios solo frontend
Este expediente modifica solo archivos de la extensión Chrome y la PWA móvil. No hay cambios en el backend GAS, por lo que no se requiere `clasp push` ni `clasp deploy`.

### Archivos modificados
- `src/extension/kanban.js` — lógica pura
- `src/extension/panel-kanban.js` — controlador DOM
- `src/extension/panel.html` — checkbox
- `src/extension/kanban.css` — estilos
- `src/movil/js/views/kanban.js` — chip móvil
- `tests/TDD/unit/test_kanban.js` — tests

### Tests
```
Test Suites: 38 passed, 38 total
Tests:       882 passed, 882 total
```

## Deployment

### Extensión Chrome
1. Recargar extensión en `chrome://extensions/` (botón "Actualizar")
2. Verificar tablero Kanban muestra columna "Sin Fase" al inicio
3. Verificar registros sin fase aparecen en la columna

### PWA Móvil
1. `scripts/sync-movil.sh` sincroniza archivos a repo deploy
2. Push a `traylesa/tarealog-movil` despliega en Cloudflare Pages
3. Verificar en https://tarealog-movil.pages.dev

### Smoke Tests
- [ ] Columna "Sin Fase" visible en tablero (escritorio)
- [ ] Drag tarjeta de "Sin Fase" a "Espera" → fase = '00'
- [ ] Drag tarjeta de "En Ruta" a "Sin Fase" → fase = ''
- [ ] Checkbox "Sin Fase" oculta/muestra la columna
- [ ] Colapsar "Sin Fase" → persiste al recargar
- [ ] Chip "Sin Fase" funciona en móvil

### Rollback Plan
```bash
git revert HEAD  # Revierte el commit con los cambios
```
No hay migración de datos ni cambios en backend, rollback es trivial.

---

## Checklist

- [x] Tests pasando (882/882)
- [x] Smoke tests definidos
- [x] Rollback plan documentado

---

**Estado:** COMPLETADO (pendiente deploy manual por usuario)
