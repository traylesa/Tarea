# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos afectados | Entregable |
|---|-------|-------------|-------------|-------------------|------------|
| T1 | Crear modulo filtros avanzados (logica pura) | M | - | `src/extension/filters.js` | Modulo de filtros testeable |
| T2 | Crear modulo plantillas de respuesta (logica pura) | M | - | `src/extension/templates.js` | CRUD plantillas + interpolacion |
| T3 | Crear modulo gestion URLs GAS (logica pura) | S | - | `src/extension/gas-services.js` | CRUD servicios GAS con alias |
| T4 | Crear modulo agrupacion por hilos | S | - | `src/extension/thread-grouping.js` | Config agrupacion Tabulator |
| T5 | Crear modulo respuesta masiva | M | T2 | `src/extension/bulk-reply.js` | Envio masivo con plantillas |
| T6 | Crear contenido de ayuda | S | - | `src/extension/help-content.js` | Secciones de ayuda |
| T7 | Integrar filtros en panel.html/panel.js | M | T1 | `src/extension/panel.html`, `panel.js`, `panel.css` | UI filtros funcional |
| T8 | Integrar plantillas en panel.html | M | T2 | `src/extension/panel.html`, `panel.js`, `panel.css` | Tab plantillas funcional |
| T9 | Integrar URLs GAS en config | S | T3 | `src/extension/panel.html`, `config.js`, `config-ui.js` | Multi-URL funcional |
| T10 | Integrar agrupacion + seleccion + respuesta masiva | M | T4,T5 | `src/extension/panel.js`, `panel.html` | Agrupacion + respuesta |
| T11 | Integrar panel de ayuda | S | T6 | `src/extension/panel.html`, `panel.css` | Ayuda contextual |

Complejidad: S (< 30 min) / M (30 min - 2h) / L (> 2h)

## 3.2 Orden de Ejecucion

**Fase paralela 1 (logica pura, sin DOM):** T1, T2, T3, T4, T6
**Fase secuencial 2 (depende de logica):** T5 (requiere T2)
**Fase integracion 3 (DOM):** T7, T8, T9, T10, T11

```
T1 (filtros) ─────────────────────────> T7 (integrar filtros)
T2 (plantillas) ──> T5 (bulk reply) ─> T8 + T10 (integrar plantillas + respuesta)
T3 (URLs GAS) ────────────────────────> T9 (integrar config)
T4 (hilos) ────────────────────────────> T10 (integrar agrupacion)
T6 (ayuda) ────────────────────────────> T11 (integrar ayuda)
```

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `tests/TDD/unit/test_filters.js` - Modulo filtros:
   - test_construir_filtro_contiene
   - test_construir_filtro_no_contiene
   - test_combinar_filtros_and
   - test_filtro_rango_fechas
   - test_filtro_rango_solo_inicio
   - test_baterias_predefinidas
   - test_limpiar_filtros

2. `tests/TDD/unit/test_templates.js` - Modulo plantillas:
   - test_crear_plantilla
   - test_editar_plantilla
   - test_eliminar_plantilla
   - test_interpolar_variables
   - test_interpolar_variable_faltante
   - test_listar_variables_disponibles
   - test_sanitizar_html_output

3. `tests/TDD/unit/test_gas_services.js` - URLs GAS:
   - test_agregar_servicio
   - test_eliminar_servicio
   - test_obtener_servicio_activo
   - test_cambiar_servicio_activo
   - test_validar_url_servicio

4. `tests/TDD/unit/test_thread_grouping.js` - Agrupacion:
   - test_config_agrupacion_tabulator
   - test_toggle_agrupacion

5. `tests/TDD/unit/test_bulk_reply.js` - Respuesta masiva:
   - test_construir_payload_respuesta
   - test_validar_seleccion_vacia
   - test_construir_con_plantilla

**Orden de implementacion (Green):**
1. filters.js - funciones puras de filtrado
2. templates.js - CRUD + interpolacion
3. gas-services.js - CRUD servicios
4. thread-grouping.js - config Tabulator
5. bulk-reply.js - payload + envio
6. help-content.js - contenido estatico

**Refactorizaciones (Refactor):**
- Extraer logica compartida de storage a helper si se repite
- Unificar patrones de validacion

## 3.4 Plan de Testing

- **Unit tests:** `tests/TDD/unit/` - Todos los modulos de logica pura (filters, templates, gas-services, thread-grouping, bulk-reply)
- **Integration tests:** Verificacion manual en Chrome (carga extension, interaccion)
- **Framework:** Jest (compatible con modulos CommonJS, `module.exports` ya usado en config.js)

## 3.5 Estrategia de Migracion de Datos

- **Configuracion existente:** Retrocompatible. Si `gasUrl` es string (formato antiguo), migrar automaticamente a array `gasServices: [{alias: 'Principal', url: gasUrl}]`
- **Plantillas:** Nuevo campo en storage, no afecta datos existentes
- **Rollback:** Eliminar modulos nuevos, restaurar panel.html/panel.js originales

## 3.6 Definition of Done (DoD)

- [ ] CA-01.1 a CA-01.4: Filtros avanzados colapsables con contiene/no-contiene/AND/limpiar
- [ ] CA-02.1 a CA-02.3: Filtro rango fechas combinable
- [ ] CA-03.1 a CA-03.4: Al menos 5 baterias predefinidas
- [ ] CA-04.1 a CA-04.3: Multi-URL GAS con alias
- [ ] CA-05.1 a CA-05.3: Agrupacion por threadId
- [ ] CA-06.1 a CA-06.4: Respuesta masiva con manejo de errores
- [ ] CA-07.1 a CA-07.4: Plantillas editables con variables
- [ ] CA-08.1 a CA-08.3: Panel de ayuda contextual
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del codigo nuevo
- [ ] Sin regresiones en tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Documentacion actualizada

---

## PUERTA DE VALIDACION 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (que tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable (cada item medible)

---

**Estado:** COMPLETADO
