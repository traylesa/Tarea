# PruebaInicializa4

**Estado:** Activo | **Fase:** Desarrollo | **Versión:** 0.4.2
**Última actualización:** 2026-02-28

---

## REGLAS PRINCIPALES

- **Idioma**: Responder y mostrar pensamiento SIEMPRE en español

---

## 🗺️ MAPA DE DOCUMENTACIÓN

**Principio:** Este archivo es el hub central. Cada documento tiene responsabilidad única.

| Necesitas... | Lee... | Sección |
|---|---|---|
| **Protocolo de trabajo** | `docs/AGENT_GUIDE.md` | Flujo 3 pasos, convenciones |
| **Nombres canónicos (OBLIGATORIO)** | `docs/DICCIONARIO_DOMINIO.md` | Tablas, campos, estados, enums |
| **Comandos rápidos** | `docs/QUICK_REFERENCE.md` | Just, bash, ejemplos |
| **Sistema de buzones** | `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` | Vigilante, expedientes |
| **Fábrica completa** | `fabrica/GUIA_COMPLETA.md` | Todos los sistemas |
| **Arquitectura técnica** | `docs/ARCHITECTURE.md` | Stack, estructura, decisiones |
| **Instalación** | `README.md` | Setup, quick start |
| **Plans activos** | `docs/plans/` | Implementación features |
| **Decisiones (ADR)** | `docs/adr/` | Arquitectura, trade-offs |
| **Skills especializadas** | `.claude/skills/` | Guias tecnicas por area |

---

## ⚡ TOP 5 COMANDOS

```bash
just ayuda              # Ver todos los comandos
just iniciar            # Verificar sistema
just automatizar        # Procesar entrada/
just paralelo "nombre"  # Crear rama paralela
just diagnostico        # Diagnóstico completo
```

**Lista completa:** `docs/QUICK_REFERENCE.md`

---

## 🎯 ESTADO ACTUAL

### Versión: 0.4.2 (Selección columna Kanban + Ayuda completa)

**Extension Chrome (Manifest V3):**
- ✅ Panel con 5 tabs: Datos, Tablero, Plantillas, Config, Ayuda
- ✅ Tabla Tabulator con 20+ columnas, edicion inline, agrupacion por hilo
- ✅ Preferencias rejilla por defecto (orden, anchos, visibilidad predefinidos)
- ✅ Filtros avanzados compartidos Datos/Tablero (fechas, fases, estados, baterias, personalizados)
- ✅ Plantillas de respuesta con pie comun global + export/import JSON
- ✅ Edicion masiva en tabla y tablero Kanban (fase + estado a seleccionados)
- ✅ Respuesta masiva (reply-all excluyendo email propio)
- ✅ Selector de spreadsheet dinamico
- ✅ Estado inicial de emails configurable desde Config (guardado en GAS)
- ✅ Motor de reglas con 9 campos y 9 tipos de accion
- ✅ Tablero Kanban tipo Trello: 8 columnas, drag&drop, SortableJS, deduplicacion
- ✅ Seleccion por columna en Kanban (checkbox por cabecera, indeterminate)
- ✅ Swimlanes por estado, colapso horizontal, conteos duales (filtrado/total)
- ✅ Indicadores enriquecidos en tarjetas (notas, recordatorios, programados)
- ✅ Alertas proactivas (R2-R6), resumen matutino con click-through
- ✅ Recordatorios con snooze, sugerencias por fase, detalle modal
- ✅ Secuencias de seguimiento (3 predefinidas), evaluacion periodica
- ✅ Envios programados con ERROR editable, reactivacion, enviar ahora
- ✅ Dashboard Mi Turno + Reporte de turno + Historial acciones
- ✅ Acciones contextuales por fase + Notas por carga
- ✅ Herencia de campos en hilos (fase/estado/codCar del ultimo registro)
- ✅ Modo oscuro persistente
- ✅ Pagina de ayuda completa (15 secciones, inc. App movil)

**Backend GAS (Web App):**
- ✅ 11 archivos desplegados via clasp (6 adaptadores + 5 logica pura)
- ✅ Endpoints: getRegistros, procesarCorreos, actualizarCampo, vincularManual, enviarRespuesta, configurarSpreadsheet, obtenerEstadoInicial, configurarEstadoInicial
- ✅ SPREADSHEET_ID dinamico via PropertiesService
- ✅ Auto-sync headers en hojas SEGUIMIENTO y DB_HILOS
- ✅ Interlocutor calculado (from+to minus email propio via Session.getEffectiveUser)
- ✅ Campo bandeja extraido de etiquetas Gmail (labels/INBOX/OTRO)
- ✅ Herencia en processMessage (ultimo registro por threadId)
- ✅ Timezone local: ahoraLocalISO() y fechaLocalISO() en Configuracion.js

**PWA Movil (Cloudflare Pages):**
- ✅ URL: https://tarealog-movil.pages.dev
- ✅ 5 vistas: Mi Turno, Todo, Tablero, Programados, Config
- ✅ Kanban tactil: scroll-snap, drag&drop, seleccion por columna, pull-to-refresh
- ✅ BottomSheet detalle: chips editables, fechas, indicadores, acciones
- ✅ SW versionado (v50), offline-first, toast de actualizacion
- ✅ Sync automatico via hook post-commit

**Tests:** 910 Jest pasando, 39 suites (logica pura dual-compatible GAS/Node)

**Ver detalle:** `just diagnostico`

---

## 🏗️ ARQUITECTURA RESUMIDA

```
PruebaInicializa4/
├── src/
│   ├── extension/     # Chrome Extension (30+ archivos JS, panel.html, CSS)
│   ├── gas/           # Google Apps Script (11 archivos via clasp)
│   └── movil/         # PWA movil (views, css, sw.js, app.js)
├── tests/TDD/unit/    # Tests Jest (39 suites, 910 tests)
├── docs/              # Documentación (diccionario, arquitectura, guias)
├── fabrica/           # Fábrica agéntica
└── .claude/           # Skills y comandos
```

**Arquitectura completa:** `docs/ARCHITECTURE.md`
**Stack:** JavaScript (Chrome Extension MV3 + Google Apps Script)

### Skills Especializadas (`.claude/skills/`)

**Indice maestro**: `.claude/skills/INDICE_SKILLS.md` (navegacion rapida, grafo dependencias, protocolo agentes)

| Skill | Area | Contenido |
|-------|------|-----------|
| `gas-deploy.md` | Backend | Despliegue clasp, endpoints, PropertiesService |
| `chrome-extension-mv3.md` | Extension | MV3 patterns, service worker, storage, ventanas |
| `dual-compat-modules.md` | Arquitectura | Patron GAS/Node dual-compat para tests Jest (910 tests, 39 suites) |
| `sheets-database.md` | Backend | CRUD Sheets, auto-sync headers, 6 hojas |
| `alertas-proactivas.md` | Dominio | Motor de reglas R2-R6, niveles, notificaciones, resumen |
| `productividad-avanzada.md` | Dominio | Recordatorios, secuencias, dashboard, historial, notas |
| `trazabilidad-hilos.md` | Backend | ThreadManager, DB_HILOS, vinculacion auto/manual/hilo |
| `pwa-mobile-development.md` | Mobile | PWA, integracion GAS, UI mobile-first, cambio estado |
| `motor-reglas-acciones.md` | Dominio | Reglas parametrizables, 9 campos, 9 tipos accion |
| `sistema-configuracion.md` | Arquitectura | Defaults, auto-migracion, export/import, sync GAS |
| `envios-programados.md` | Dominio | Cola envios, ERROR editable, reactivacion, horario laboral |
| `kanban-tablero.md` | UI | Kanban Trello, colapso horizontal, chips filtros, SortableJS |

---

## DICCIONARIO DE DOMINIO (OBLIGATORIO)

**Ubicación:** `docs/DICCIONARIO_DOMINIO.md` (ÚNICO para todo el proyecto)

**REGLA FUNDAMENTAL:**
Ningún nombre nuevo de tabla/campo/variable/estado puede aparecer en el código sin estar registrado en el diccionario primero.

**PROCESO OBLIGATORIO:**
1. **Consultar** `docs/DICCIONARIO_DOMINIO.md` antes de crear nombres
2. **Proponer** cambios en `PROPUESTA_DICCIONARIO.md` de tu expediente
3. **Actualizar** diccionario central una vez aprobado
4. **Solo entonces** implementar en código

**Checklist mínimo:**
- [ ] Consultado diccionario antes de crear nombres
- [ ] Propuesta documentada (si hay nombres nuevos)
- [ ] Diccionario actualizado (si aprobado)

**Protocolo completo:** `docs/AGENT_GUIDE.md` §Diccionario de Dominio

---

## GUÍA RÁPIDA PARA AGENTES

### Protocolo de 3 Pasos

**ANTES:** Lee `CLAUDE.md` + `docs/AGENT_GUIDE.md` + `docs/DICCIONARIO_DOMINIO.md`
**DURANTE:** Sigue TDD, usa buzones, consulta diccionario, actualiza plans
**DESPUÉS:** Valida, documenta propuestas, concluye expedientes

**Protocolo completo:** `docs/AGENT_GUIDE.md`

### Flujo Básico

```bash
# 1. Especificación → entrada/
echo "Feature X" > fabrica/buzon_agente/entrada/feature.md

# 2. Procesar
just automatizar

# 3. Trabajar
just ejecutar-buzon [ID]

# 4. Concluir
just concluir [ID]
```

**Workflows completos:** `docs/AGENT_GUIDE.md` §Workflows

---

## ⚠️ PRECAUCIONES CRÍTICAS

### Top 3 Precauciones

1. **Git:** Siempre hacer commit antes de operaciones destructivas
2. **Justfile:** Requiere Git Bash en ruta estándar de Windows
3. **Vigilante:** Requiere `pip install watchdog` para modo watch

**Precauciones completas:** `docs/ARCHITECTURE.md` §Precauciones

---

## 📊 MÉTRICAS CLAVE

| Métrica | Valor |
|---------|-------|
| Versión | 0.4.2 |
| Stack | JavaScript (Chrome MV3 + GAS + PWA) |
| Tests | 910 pasando, 39 suites |
| Archivos src | 30+ extension, 11 GAS, 10+ movil |
| Docs | 8+ |
| Deploy PWA | v50 (Cloudflare Pages) |
| Deploy GAS | @30 (clasp) |

**Métricas detalladas:** `just diagnostico`

---

## 🔗 REFERENCIAS RÁPIDAS

### Documentación
- **Hub central:** Este archivo
- **Protocolo agentes:** `docs/AGENT_GUIDE.md`
- **Diccionario dominio:** `docs/DICCIONARIO_DOMINIO.md` (OBLIGATORIO)
- **Comandos:** `docs/QUICK_REFERENCE.md`
- **Arquitectura:** `docs/ARCHITECTURE.md`
- **Fábrica:** `fabrica/GUIA_COMPLETA.md`

### Comandos
- `just ayuda` - Ayuda completa
- `just --list` - Listar comandos
- `cat docs/README.md` - Índice docs

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Problema | Solución Inmediata | Documento |
|----------|-------------------|-----------|
| Just no funciona | `choco install just` | `docs/QUICK_REFERENCE.md` |
| Vigilante no detecta | `python vigilante.py --modo batch` | `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` |
| Worktree falla | Verificar `git status` | `docs/ARCHITECTURE.md` |

**Troubleshooting completo:** `docs/AGENT_GUIDE.md` §Troubleshooting

---

## 📝 REGLAS UNIVERSALES

### Código
- TDD obligatorio (Red-Green-Refactor)
- Funciones < 20 líneas
- Nombres descriptivos (intención sobre implementación)
- Tests: Patrón AAA (Arrange-Act-Assert)

### Documentación
- Actualizar SIEMPRE con cambios
- Markdown para todo
- Links relativos entre docs
- Código autodocumentado

### Git
- Commits descriptivos: `tipo(alcance): mensaje`
- Branches: `feature/`, `bugfix/`, `experiment/`
- NO force push a main/master
- NO commits sin tests

**Convenciones completas:** `docs/AGENT_GUIDE.md` §Convenciones

---

**Mantenedor:** [Definir]
**Última sincronización:** 2026-02-28

---

*Archivo generado por `/inicializa` | Principio: Hub Ultra-Ligero*
