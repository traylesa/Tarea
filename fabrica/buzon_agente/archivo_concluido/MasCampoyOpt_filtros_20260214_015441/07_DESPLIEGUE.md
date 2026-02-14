# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## Pre-Deployment

### Archivos Modificados
- `src/extension/filters.js` - 4 funciones nuevas + operadores ampliados
- `src/extension/panel.js` - Columnas, cards, filtros temporales, edición masiva
- `src/extension/panel.html` - Nuevos controles UI
- `src/extension/panel.css` - Estilos nuevos componentes
- `tests/TDD/unit/test_filters.js` - 17 tests nuevos
- `docs/DICCIONARIO_DOMINIO.md` - 6 campos registrados

### Tests
```
Tests: 44 passed, 0 failed
Regresiones: 0
```

---

## Deployment

### Procedimiento (extensión Chrome)

1. Copiar archivos modificados al directorio de la extensión
2. En Chrome → chrome://extensions/ → Actualizar extensión
3. Abrir panel LogiTask y verificar nuevas columnas y filtros

### Rollback Plan

Si algo falla tras el despliegue:
1. Restaurar archivos anteriores desde backup/git
2. Actualizar extensión en chrome://extensions/
3. Los datos en chrome.storage son compatibles (campos nuevos simplemente no aparecen)

---

## Post-Deployment

### Smoke Tests

- [ ] Abrir panel: rejilla se carga con columnas nuevas (FCarga, HCarga, FEntrega, HEntrega, Zona, ZDest)
- [ ] Columnas nuevas muestran "--" si campo vacío
- [ ] Abrir panel filtros: cards de fases visibles
- [ ] Click en card de fase: filtra registros
- [ ] Marcar/Desmarcar todas: funciona
- [ ] Checkbox "Rango Carga": habilita fechas
- [ ] Panel edición masiva: seleccionar filas → botón se activa
- [ ] Filtro personalizado: operadores <, >, <=, >= disponibles
- [ ] Búsqueda global: buscar "MADRID" encuentra en zona/zDest

---

## PUERTA DE VALIDACIÓN 7: APROBADA

- [x] Deploy exitoso (archivos listos para cargar en extensión)
- [x] Smoke tests documentados
- [x] Rollback plan documentado
