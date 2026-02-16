# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## 3.1 Desglose de Tareas (WBS)

### Bloque A: Infraestructura PWA

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| A1 | Crear estructura directorios src/movil/ | S | - | directorios |
| A2 | Manifest PWA + iconos | S | A1 | manifest.json |
| A3 | Service Worker (cache + offline) | M | A1 | sw.js |
| A4 | Index HTML con script tags | M | A1 | index.html |
| A5 | Variables CSS + estilos base | M | A1 | css/app.css |
| A6 | Estilos cards | M | A5 | css/cards.css |
| A7 | Estilos outdoor | S | A5 | css/outdoor.css |

### Bloque B: Capa de Datos

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| B1 | API wrapper (fetch GAS) | M | A1 | js/api.js |
| B2 | Store (estado + IndexedDB + localStorage) | M | B1 | js/store.js |
| B3 | Feedback (vibracion, toast) | S | A1 | js/feedback.js |

### Bloque C: Logica Nuevos Modulos

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| C1 | Action resolver (accion requerida por carga) | M | - | js/logic/action-resolver.js |

### Bloque D: Vistas y Componentes

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| D1 | App (router, inicializacion, bottom nav) | M | B2 | js/app.js |
| D2 | Componente Card de carga | M | C1 | js/components/card.js |
| D3 | Componente Bottom Sheet | S | A5 | js/components/bottom-sheet.js |
| D4 | Componente Toast | S | B3 | js/components/toast.js |
| D5 | Vista Todo (lista cargas + pull-refresh) | L | D1,D2 | js/views/todo.js |
| D6 | Vista Detalle (carga completa) | L | D1,D3 | js/views/detalle.js |
| D7 | Vista Programados (envios + recordatorios) | M | D1 | js/views/programados.js |
| D8 | Vista Config (ajustes + outdoor) | S | D1 | js/views/config.js |

### Bloque E: Tests

| # | Tarea | Complejidad | Dep | Archivos |
|---|-------|-------------|-----|----------|
| E1 | Tests api.js | M | B1 | tests/TDD/unit/test_api.js |
| E2 | Tests store.js | M | B2 | tests/TDD/unit/test_store.js |
| E3 | Tests action-resolver.js | M | C1 | tests/TDD/unit/test_action_resolver.js |
| E4 | Tests feedback.js | S | B3 | tests/TDD/unit/test_feedback.js |

---

## 3.2 Orden de Ejecucion

```
1. A1 (directorios)
2. [Paralelo] A2, A5, B3
3. [Paralelo] A3, A6, A7
4. E1 → B1 (TDD: test primero, api despues)
5. E2 → B2 (TDD: test primero, store despues)
6. E3 → C1 (TDD: test primero, action-resolver despues)
7. E4 → B3/feedback actualizar
8. A4 (index.html con todos los scripts)
9. D1, D3, D4 (app + componentes base)
10. D2, D5 (card + vista todo)
11. D6 (detalle)
12. D7, D8 (programados, config)
```

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_api.js`: get/post con mock fetch, manejo errores, URL construida correctamente
2. `test_store.js`: guardar/cargar registros, guardar/cargar config, cache con timestamps
3. `test_action_resolver.js`: resolver accion por alerta, por fase, por deadline, sin accion
4. `test_feedback.js`: vibracion por tipo, toast creacion/auto-eliminacion

**Orden de implementacion para hacerlos pasar (Green):**

1. `js/api.js` — wrapper fetch con get/post/error handling
2. `js/store.js` — estado con localStorage (IndexedDB en iteracion posterior)
3. `js/logic/action-resolver.js` — resolver accion requerida por carga
4. `js/feedback.js` — vibracion + toast

**Refactorizaciones previstas:**
- Extraer constantes de colores/tamanos a variables CSS
- Unificar patron de carga modulos (script tags con orden)

---

## 3.4 Plan de Testing

- **Unit tests:** api.js, store.js, action-resolver.js, feedback.js (Jest, ~40 tests nuevos)
- **Modulos reutilizados:** Ya tienen 368 tests pasando, no se tocan
- **Integration tests:** No aplica (logica pura sin integracion entre nuevos modulos)
- **E2E tests:** Manual (abrir PWA en movil, verificar flujos principales)

---

## 3.5 Definition of Done (DoD)

- [ ] Todos los archivos de src/movil/ creados con codigo funcional
- [ ] PWA instalable (manifest + service worker registrado)
- [ ] Vista Todo renderiza cards con datos del backend GAS
- [ ] Detalle de carga muestra emails, notas, historial
- [ ] Cambio de fase funcional con feedback triple
- [ ] Respuesta email con plantillas funcional
- [ ] Alertas proactivas inline en cards (R2-R6)
- [ ] Filtros rapidos + avanzados funcionando
- [ ] Seleccion multiple con acciones masivas
- [ ] Modo outdoor funcional
- [ ] Tests nuevos >= 80% cobertura logica nueva
- [ ] 0 tests existentes rotos
- [ ] Todos los nombres en docs/DICCIONARIO_DOMINIO.md

---

## PUERTA DE VALIDACION 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (que tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable

**Estado:** COMPLETADO
