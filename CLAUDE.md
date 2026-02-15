# PruebaInicializa4

**Estado:** Activo | **Fase:** Desarrollo | **Versión:** 0.2.0
**Última actualización:** 2026-02-14

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

### Versión: 0.2.0 (Backend GAS + UI completa)

**Extension Chrome (Manifest V3):**
- ✅ Panel con tabs: Datos, Plantillas, Config, Ayuda
- ✅ Tabla Tabulator con 20+ columnas, edicion inline, agrupacion por hilo
- ✅ Filtros avanzados con tarjetas colapsables (fechas, fases, baterias, personalizados)
- ✅ Plantillas de respuesta con pie comun global + export/import JSON
- ✅ Edicion masiva (fase + estado a seleccionados)
- ✅ Respuesta masiva (reply-all excluyendo email propio)
- ✅ Selector de spreadsheet dinamico

**Backend GAS (Web App):**
- ✅ 11 archivos desplegados via clasp (6 adaptadores + 5 logica pura)
- ✅ Endpoints: getRegistros, procesarCorreos, actualizarCampo, vincularManual, enviarRespuesta, configurarSpreadsheet
- ✅ SPREADSHEET_ID dinamico via PropertiesService
- ✅ Auto-sync headers en hojas SEGUIMIENTO y DB_HILOS
- ✅ Interlocutor calculado (from+to minus email propio via Session.getEffectiveUser)

**Tests:** 67+ Jest pasando (logica pura dual-compatible GAS/Node)

**Ver detalle:** `just diagnostico`

---

## 🏗️ ARQUITECTURA RESUMIDA

```
PruebaInicializa4/
├── src/
│   ├── extension/     # Chrome Extension (panel.js, config-ui.js, filters.js, etc.)
│   └── gas/           # Google Apps Script (Codigo.js, Adaptadores, logica pura)
├── tests/TDD/unit/    # Tests Jest (67+)
├── docs/              # Documentación (diccionario, arquitectura, guias)
├── fabrica/           # Fábrica agéntica
└── .claude/           # Skills y comandos
```

**Arquitectura completa:** `docs/ARCHITECTURE.md`
**Stack:** JavaScript (Chrome Extension MV3 + Google Apps Script)

### Skills Especializadas (`.claude/skills/`)

| Skill | Area | Contenido |
|-------|------|-----------|
| `gas-deploy.md` | Backend | Despliegue clasp, endpoints, PropertiesService |
| `chrome-extension-mv3.md` | Extension | MV3 patterns, service worker, storage, ventanas |
| `dual-compat-modules.md` | Arquitectura | Patron GAS/Node dual-compat para tests Jest |
| `sheets-database.md` | Backend | CRUD Sheets, auto-sync headers, limitaciones |
| `alertas-proactivas.md` | Dominio | Motor de reglas, niveles, notificaciones, resumen |

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
| Complejidad | MINI |
| Stack | generic |
| Archivos | 16 |
| Docs | 8 |
| Estado | Inicial |

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
**Última sincronización:** 2026-02-13

---

*Archivo generado por `/inicializa` | Principio: Hub Ultra-Ligero*
