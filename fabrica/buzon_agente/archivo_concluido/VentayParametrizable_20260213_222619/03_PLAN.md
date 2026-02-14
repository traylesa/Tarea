# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dep. | Archivos afectados | Entregable |
|---|-------|-------------|------|-------------------|------------|
| T1 | Crear modulo config.js (defaults, carga, guardado, validacion) | M | - | `src/extension/config.js` | Modulo config funcional |
| T2 | Modificar manifest.json (quitar popup, anadir action click) | S | - | `src/extension/manifest.json` | Manifest actualizado |
| T3 | Reescribir background.js (abrir ventana, leer config) | M | T1,T2 | `src/extension/background.js` | Background con ventana |
| T4 | Crear panel.html con tabs (Datos + Configuracion) | S | T2 | `src/extension/panel.html` | HTML con tabs |
| T5 | Crear config-ui.js (formulario config, validacion UI) | M | T1,T4 | `src/extension/config-ui.js` | Panel config funcional |
| T6 | Modificar popup.js → panel.js (leer config, adaptar tabla) | M | T1,T4 | `src/extension/panel.js` | Panel datos funcional |
| T7 | Actualizar popup.css → panel.css (tabs, responsive, config) | S | T4 | `src/extension/panel.css` | Estilos completos |
| T8 | Tests unitarios | M | T1-T7 | `tests/TDD/unit/` | Tests pasando |

Complejidad: S (< 30 min) / M (30 min - 2h)

## 3.2 Orden de Ejecucion

```
T1 (config.js) ─┐
T2 (manifest)  ─┼─→ T3 (background.js)
                │
T4 (panel.html) ┼─→ T5 (config-ui.js)
                │─→ T6 (panel.js)
T7 (panel.css) ─┘
                     T8 (tests) - ultimo
```

1. **Paralelo 1:** T1 (config.js) + T2 (manifest) + T4 (panel.html) + T7 (panel.css)
2. **Secuencial:** T3 (background.js) depende de T1+T2
3. **Secuencial:** T5 (config-ui.js) y T6 (panel.js) dependen de T1+T4
4. **Final:** T8 (tests) valida todo

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_config_defaults`: Verifica que getDefaults() retorna config con todos los campos esperados
2. `test_config_validar_url_valida`: URL https:// valida pasa validacion
3. `test_config_validar_url_invalida`: URL sin protocolo falla validacion
4. `test_config_validar_intervalo_rango`: Intervalo fuera de 1-1440 falla
5. `test_config_validar_regex_valida`: Regex valida pasa
6. `test_config_validar_regex_invalida`: Regex invalida retorna error
7. `test_config_merge_con_defaults`: Config parcial se mergea con defaults

**Orden de implementacion para hacerlos pasar (Green):**

1. `config.js` - `getDefaults()`, `validar()`, `cargar()`, `guardar()`
2. Resto de archivos (no tienen logica testeable unitariamente - son UI)

**Refactorizaciones previstas (Refactor):**
- Extraer constantes de validacion (MIN_INTERVAL, MAX_INTERVAL)
- Unificar patron de acceso a storage

## 3.4 Plan de Testing

- **Unit tests:** `tests/TDD/unit/test_config.js` - Logica de config (defaults, validacion, merge)
- **Integration tests:** Manual - Cargar extension en Chrome, verificar ventana abre y config guarda
- **E2E tests:** No aplica (extension Chrome, no hay framework E2E viable sin Puppeteer)

Nota: La logica testeable unitariamente esta concentrada en config.js. Los demas archivos son UI pura (DOM + Chrome APIs) que se testean manualmente.

## 3.5 Estrategia de Migracion

- **Datos existentes en storage:** `tabulatorPrefs` se mantiene intacto, nueva clave `logitask_config` es independiente
- **Rollback:** Restaurar archivos originales (popup.html, popup.js, popup.css, manifest.json, background.js)

## 3.6 Definition of Done (DoD)

- [ ] CA-01.1: Clic en icono abre ventana independiente 800x600
- [ ] CA-01.2: Segundo clic enfoca ventana existente
- [ ] CA-01.3: Posicion/tamano se recuerda entre sesiones
- [ ] CA-02.1: Tab Configuracion muestra campo URL servicio
- [ ] CA-02.2: URL valida se guarda y persiste
- [ ] CA-02.3: URL invalida muestra error
- [ ] CA-03.1: Campo intervalo muestra valor actual
- [ ] CA-03.2: Cambio de intervalo recrea alarma
- [ ] CA-03.3: Valor fuera de rango muestra error
- [ ] CA-04.1: Campo ruta CSV visible
- [ ] CA-04.2: Ruta se guarda
- [ ] CA-04.3: Ruta vacia se acepta
- [ ] CA-05.1: Campos patrones regex visibles
- [ ] CA-05.2: Regex valida se guarda
- [ ] CA-05.3: Regex invalida muestra error
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del codigo nuevo en config.js
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Archivos antiguos eliminados (popup.html, popup.js, popup.css)

---

## PUERTA DE VALIDACION 3: SUPERADA

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (tests de config.js primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable (cada item medible)
