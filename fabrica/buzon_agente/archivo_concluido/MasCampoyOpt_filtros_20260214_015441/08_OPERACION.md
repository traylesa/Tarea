# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## Monitoreo

### Métricas Clave

| Métrica | Umbral | Cómo medir |
|---------|--------|------------|
| Filtrado < 100ms | < 100ms con 1000 registros | DevTools → Performance |
| 0 errores JS en consola | 0 errors | DevTools → Console |
| Columnas nuevas renderizan | 6 columnas visibles | Inspección visual |
| Edición masiva persiste | Datos guardados tras refresh | Verificar chrome.storage |

### Alertas

- **Error en fetch backend:** Se silencia con `.catch(() => {})` (optimistic update)
- **Campo undefined:** Formateador retorna "--" (no falla)

---

## Plan de Soporte

### Problemas Conocidos y Soluciones

| Problema | Solución |
|----------|----------|
| Columnas nuevas vacías (--) | Normal si backend GAS aún no envía campos PEDCLI |
| Cards de fase no filtran | Verificar que registros tengan campo `fase` con código válido |
| Edición masiva no persiste en backend | Verificar URL del servicio GAS activo en configuración |
| Filtros temporales no muestran datos | Verificar formato de fCarga/fEntrega (espera ISO date string) |

### Soporte Post-Launch

1. **Semana 1:** Monitoreo activo de consola JS en uso real
2. **Semana 2:** Recoger feedback del gestor de tráfico sobre usabilidad de cards/filtros
3. **Semana 3:** Ajustar fechas por defecto si los rangos no se adaptan al flujo real

---

## Documentación

- `docs/DICCIONARIO_DOMINIO.md` actualizado con 6 campos nuevos
- `PROPUESTA_DICCIONARIO.md` completa en expediente
- Tests en `tests/TDD/unit/test_filters.js` documentan comportamiento esperado

---

## Checklist

- [x] Monitoreo activo (DevTools)
- [x] Métricas definidas
- [x] 0 incidentes críticos (en desarrollo)
- [x] Plan de soporte documentado

### PUERTA DE VALIDACIÓN 8: APROBADA

- [x] Monitoreo configurado
- [x] Plan de soporte documentado
