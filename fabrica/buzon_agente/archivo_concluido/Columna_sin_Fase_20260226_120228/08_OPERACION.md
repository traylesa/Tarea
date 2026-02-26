# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## Monitoreo

### Puntos de verificación post-deploy
1. **Columna visible:** Abrir tablero Kanban → "Sin Fase" aparece como primera columna
2. **Registros capturados:** Procesar correos nuevos → aparecen en "Sin Fase" si no tienen fase
3. **Drag funcional:** Arrastrar tarjeta entre columnas → fase se actualiza en GAS
4. **Conteos correctos:** Header de columna muestra número correcto de registros
5. **Colapso persistente:** Colapsar "Sin Fase" → recargar → sigue colapsada

### Métricas clave
- **Impacto visual:** 0 registros "perdidos" en tablero (antes podían estar invisibles)
- **Rendimiento:** Sin degradación (1 columna extra en array de 8)

## Plan de soporte

### Problemas potenciales y solución

| Problema | Diagnóstico | Solución |
|----------|-------------|----------|
| Columna no aparece | Verificar `_kanbanMostrarSinFase` | Comprobar checkbox marcado |
| Drag a sin_fase no limpia fase | Verificar `resolverFaseAlMover` | Debe retornar `''`, no `null` |
| Conteos incorrectos | Verificar `agruparPorColumna` | Registros sin fase → `grupos.sin_fase` |
| Móvil no muestra chip | Verificar `_ocultos.sin_fase` | Debe ser `false` (visible por defecto) |

## Checklist

- [x] Monitoreo definido (5 puntos de verificación)
- [x] Métricas identificadas
- [x] Plan de soporte con troubleshooting

---

**Estado:** COMPLETADO
