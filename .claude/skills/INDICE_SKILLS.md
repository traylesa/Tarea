# Indice de Skills — Coordinacion Dinamica

**Proposito**: Mapa de navegacion rapida entre skills para agentes. Consultar ANTES de trabajar para saber que skills leer segun la tarea.

**Ultima actualizacion**: 2026-02-25 | **Version proyecto**: 0.4.0 | **Tests**: 878 (38 suites)

---

## Navegacion Rapida por Tarea

### Voy a modificar logica pura (filters, kanban, alerts, etc.)

1. Lee: `dual-compat-modules.md` (patron obligatorio)
2. Lee: el skill especifico del modulo (ver tabla abajo)
3. Despues: sincronizar copia a `src/movil/lib/` → `pwa-mobile-development.md`

### Voy a tocar la extension Chrome (panel, tabs, modales)

1. Lee: `chrome-extension-mv3.md` (scripts, orden, permisos)
2. Lee: el skill del area funcional (kanban, programados, alertas, etc.)
3. Si toca config: `sistema-configuracion.md`

### Voy a tocar la PWA movil

1. Lee: `pwa-mobile-development.md` (vistas, components, feedback, **despliegue**)
2. Lee: el skill del area funcional
3. Despues: incrementar `CACHE_NAME` en `sw.js` + actualizar `CACHE_URLS` si hay archivos nuevos
4. El hook post-commit sincroniza automaticamente a repo `tarealog-movil` → Cloudflare Pages

### Voy a tocar el backend GAS

1. Lee: `gas-deploy.md` (clasp push/deploy)
2. Lee: `sheets-database.md` (CRUD, headers, hojas)
3. Si es trazabilidad: `trazabilidad-hilos.md`
4. Si es programados: `envios-programados.md`
5. Despues: `clasp push && clasp deploy -i <id>`

### Voy a agregar un campo/estado/fase nuevo

1. Lee: `docs/DICCIONARIO_DOMINIO.md` (OBLIGATORIO, registrar nombre)
2. Lee: `sistema-configuracion.md` (getDefaults, auto-migracion)
3. Lee: `sheets-database.md` (si persiste en Sheets)

### Voy a crear tests

1. Lee: `dual-compat-modules.md` (patron test, require path)
2. Ejecutar: `npx jest --no-coverage` (878 tests, 38 suites)

---

## Mapa de Skills (12 skills)

| # | Skill | Area | Archivos principales | Depende de |
|---|-------|------|---------------------|------------|
| 1 | `chrome-extension-mv3.md` | Plataforma | manifest.json, background.js, panel.html | — |
| 2 | `dual-compat-modules.md` | Arquitectura | 22 modulos *.js + tests | — |
| 3 | `sistema-configuracion.md` | Config | config.js, config-ui.js, constants.js | 2 |
| 4 | `gas-deploy.md` | Backend | src/gas/ (11 archivos), clasp | — |
| 5 | `sheets-database.md` | Backend | AdaptadorHojas.js, Configuracion.js | 4 |
| 6 | `trazabilidad-hilos.md` | Backend | ThreadManager.js, DB_HILOS | 4, 5 |
| 7 | `alertas-proactivas.md` | Dominio | alerts.js, alert-summary.js, background.js | 1, 2, 3 |
| 8 | `productividad-avanzada.md` | Dominio | 7 modulos (reminders, sequences, etc.) | 2, 3, 7 |
| 9 | `motor-reglas-acciones.md` | Dominio | action-rules.js, config-rules-ui.js | 2, 3 |
| 10 | `envios-programados.md` | Dominio | scheduled.js, panel-programados.js | 2, 4, 5, 9 |
| 11 | `kanban-tablero.md` | UI | kanban.js, panel-kanban.js, views/kanban.js | 1, 2, 8, 12 |
| 12 | `pwa-mobile-development.md` | Mobile | src/movil/ (vistas, components, css) | 2, 4 |

---

## Grafo de Dependencias entre Skills

```
                    ┌──────────────┐
                    │ 1.chrome-mv3 │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐  ┌──────────┐  ┌──────────┐
     │ 7.alertas  │  │11.kanban │  │ 3.config │
     └─────┬──────┘  └────┬─────┘  └────┬─────┘
           │               │             │
           ▼               │        ┌────┴─────┐
     ┌──────────┐          │        ▼          ▼
     │ 8.produc │◄─────────┘  ┌──────────┐ ┌──────────┐
     └──────────┘             │ 9.reglas │ │10.progr. │
                              └──────────┘ └────┬─────┘
                                                │
     ┌──────────────┐   ┌──────────┐            │
     │2.dual-compat │   │4.gas-dep │◄───────────┘
     └──────┬───────┘   └────┬─────┘
            │                │
            │           ┌────┴─────┐
            │           ▼          ▼
            │     ┌──────────┐ ┌──────────┐
            │     │ 5.sheets │ │ 6.hilos  │
            │     └──────────┘ └──────────┘
            │
     ┌──────┴───────┐
     │  12.pwa-mov  │
     └──────────────┘
```

Todos los skills de dominio (7-11) dependen implicitamente de `2.dual-compat-modules.md`.

---

## Protocolo para Agentes

### Al iniciar cualquier tarea

1. Leer este indice (`INDICE_SKILLS.md`)
2. Identificar skills relevantes segun seccion "Navegacion Rapida"
3. Leer solo esos skills (no todos)
4. Consultar `docs/DICCIONARIO_DOMINIO.md` si hay nombres nuevos

### Al terminar cualquier tarea

1. Ejecutar `npx jest --no-coverage` → deben pasar 878+ tests
2. Si tocaste logica pura o movil → incrementar `CACHE_NAME` en `sw.js`
3. Si tocaste GAS → `clasp push && clasp deploy -i <id>`
4. Commit → hook post-commit sincroniza automaticamente `src/movil/` → repo `tarealog-movil`
5. Push → Cloudflare Pages redespliega automaticamente
6. Verificar en `https://tarealog-movil.pages.dev/sw.js` la version nueva
7. Si agregaste funcionalidad nueva → actualizar el skill correspondiente

### Reglas de coordinacion

- **Nunca crear nombres** sin consultar `docs/DICCIONARIO_DOMINIO.md`
- **Nunca modificar headers Sheets** sin leer `sheets-database.md`
- **Nunca agregar script** sin actualizar lista en `chrome-extension-mv3.md`
- **Nunca tocar config** sin verificar `leerFormulario()` en `config-ui.js`
- **Siempre TDD**: test ANTES del codigo, patron AAA

---

## Historial de Versiones Skills

| Fecha | Skills actualizados | Cambios principales |
|-------|-------------------|---------------------|
| 2026-02-25 | pwa-mobile, gas-deploy, indice | Despliegue Cloudflare Pages, sync automatico, fix SW versionado |
| 2026-02-25 | 6 skills (1,2,3,5,8,10) + indice | ERROR editable, 878 tests, coordinacion |
| 2026-02-24 | pwa-mobile-development | Filtros, kanban movil, dark mode |
| 2026-02-23 | kanban-tablero | Nuevo skill: Kanban Trello completo |
| 2026-02-21 | Todos (12) | Generacion inicial v1.1.0 |
