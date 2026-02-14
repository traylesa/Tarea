# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## Objetivo

Ampliar el modelo de datos de seguimiento con campos logísticos (fechas carga/entrega, zonas) provenientes de PEDCLI, e implementar un sistema de filtrado inteligente con edición masiva que reduzca la carga operativa del gestor de tráfico.

**Por qué:** El gestor de tráfico necesita visualizar información logística crítica (fechas, zonas, fases) directamente en la rejilla, sin navegar al ERP. Los filtros actuales son básicos y requieren múltiples clics para operaciones frecuentes como filtrar por rango de carga/descarga o por fase.

---

## Alcance

### QUÉ SÍ

1. **Modelo de datos:** Agregar 7 campos nuevos al registro de seguimiento (fase, fCarga, hCarga, fEntrega, hEntrega, zona, zDest)
2. **Filtros temporales:** Rangos de carga y descarga habilitables por checkbox, con fechas por defecto reactivas
3. **Filtros geográficos:** Zona/ZDest con operador "contiene" y comodín `*`
4. **Búsqueda global:** Barrido en TODAS las columnas de la rejilla (ampliar CAMPOS_BUSCABLES)
5. **Opción "Todo":** Deshabilitar filtro individual en campos clave
6. **Selectores de fase:** Cards interactivas con "Marcar/Desmarcar Todas"
7. **Edición masiva:** Selección múltiple + panel superior con ComboBox para Fase y Estado + botón aplicar
8. **Gestor de columnas:** Mostrar/ocultar campos (ya existe parcialmente via headerMenu)
9. **Operadores lógicos:** Agregar `<`, `<=`, `>`, `>=` al sistema de filtros personalizados
10. **Case insensitivity:** Garantizar en toda búsqueda/filtrado

### QUÉ NO

- NO se modificará el backend GAS (Main.js, ERPReader.js) - solo se prepararán los campos para cuando el backend los envíe
- NO se implementará una interfaz de mantenimiento de Fases separada (se usará la constante FASES_TRANSPORTE existente)
- NO se crearán nuevas pestañas/tabs
- NO se modificará el sistema de plantillas ni la respuesta masiva
- NO se tocará el sistema de vinculación manual

---

## Stakeholders

- **Gestor de tráfico** (usuario principal): Necesita reducir clics y tiempo para filtrar/editar registros
- **Equipo desarrollo** (mantenedor): Necesita código modular y testeable

---

## Criterios de Éxito

| # | Criterio | Métrica |
|---|----------|---------|
| 1 | Nuevos campos visibles en rejilla | 7 columnas nuevas renderizadas |
| 2 | Filtros temporales funcionales | Checkbox activa/desactiva rango con fechas por defecto |
| 3 | Selectores de fase como cards | Click en card filtra por esa fase |
| 4 | Edición masiva funciona | Seleccionar N filas → cambiar fase/estado → persiste |
| 5 | Búsqueda global abarca todos los campos | Buscar "Madrid" encuentra en zona/zDest |
| 6 | Operadores lógicos completos | 7 operadores disponibles en filtros personalizados |
| 7 | Tests unitarios pasan | >= 80% cobertura del código nuevo |
| 8 | Tests existentes no se rompen | 0 regresiones |

---

## Restricciones

- El backend GAS no se modifica en este expediente
- Los campos nuevos pueden llegar vacíos (tolerancia a `undefined`/`null`)
- Se debe mantener compatibilidad con datos existentes en chrome.storage
- Tabulator es la librería de grid (no cambiar)

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Backend GAS no envía campos nuevos aún | ALTA | MEDIO | Campos se renderizan con `--` si no existen; diseño tolerante a datos parciales |
| Filtros complejos degradan rendimiento | BAJA | MEDIO | Usar filtros nativos de Tabulator; debounce en búsqueda global (ya existe) |
| Edición masiva pierde datos si falla red | MEDIA | ALTO | Actualizar registros locales primero (optimistic update), retry silencioso |
| Cambios CSS rompen layout existente | BAJA | BAJO | Nuevos estilos con prefijos específicos (`.fase-card-*`, `.bulk-*`) |

---

## Estrategia de Implementación

1. **Enfoque incremental:** Modificar archivos existentes, no crear nuevos módulos innecesarios
2. **Archivos a modificar:**
   - `src/extension/filters.js` - Nuevos operadores y filtros temporales
   - `src/extension/panel.js` - Columnas, edición masiva, cards de fase, UI filtros
   - `src/extension/panel.html` - Nuevos controles UI (cards, bulk panel, checkboxes)
   - `src/extension/panel.css` - Estilos nuevos componentes
3. **Tests primero (TDD):** Ampliar `tests/TDD/unit/test_filters.js` con nuevos operadores y crear tests para lógica de edición masiva
4. **Sin romper nada:** Los campos nuevos son opcionales (tolerancia a `undefined`)

---

## Checklist

- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Stakeholders identificados
- [x] Restricciones técnicas/negocio claras
- [x] Riesgos principales evaluados

### PUERTA DE VALIDACIÓN 0: APROBADA
- [x] Objetivo documentado (qué y por qué)
- [x] Alcance definido (qué SÍ y qué NO)
- [x] Riesgos evaluados con mitigación
