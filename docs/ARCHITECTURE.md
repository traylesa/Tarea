# Arquitectura Técnica - PruebaInicializa4

**Decisiones arquitectónicas, stack técnico y precauciones**

---

## 📋 Índice

- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Sistemas Implementados](#sistemas-implementados)
- [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
- [Precauciones Críticas](#precauciones-críticas)
- [Limitaciones Conocidas](#limitaciones-conocidas)

---

## Stack Tecnológico

### Detectado: Generic (Extensión Chrome)

**Lenguajes principales:**
- JavaScript/TypeScript (extensión Chrome)
- Python 3.8+ (scripts de automatización)
- Bash/Shell (automatización Windows)

**Herramientas:**
- **Just** - Command runner
- **Git** - Control de versiones + worktrees
- **Python** - Scripts de fábrica
- **Watchdog** - Monitoreo de archivos (vigilante)

**Entorno:**
- Windows Server 2022 (desarrollo)
- Git Bash (shell commands)
- PowerShell (justfile delegador)

---

## Estructura del Proyecto

### Árbol Completo

```
PruebaInicializa4/
│
├── justfile                              # Delegador (66 líneas)
│                                        # Delega a fabrica/justfile
│                                        # Shell: PowerShell
│
├── CLAUDE.md                             # Hub ultra-ligero (188 líneas)
├── README.md                             # Descripción ejecutiva
│
├── fabrica/                              # FÁBRICA AGÉNTICA
│   ├── justfile                         # Lógica completa (400+ líneas)
│   │                                    # Shell: Git Bash
│   ├── GUIA_COMPLETA.md                 # Documentación detallada
│   │
│   ├── buzon_agente/                    # SISTEMA DE BUZONES
│   │   ├── entrada/                     # Depositar specs
│   │   │   └── LEEME.md
│   │   ├── taller_activo/              # Expedientes en proceso
│   │   ├── archivo_concluido/          # Expedientes terminados
│   │   ├── vigilante.py                # Monitor (603 líneas)
│   │   ├── buzones.json                # Configuración
│   │   ├── vigilante.log               # Logs
│   │   └── GUIA_INICIO_RAPIDO.md
│   │
│   ├── ramas_paralelas/                 # WORKTREES (vacío inicial)
│   │                                    # Se llenan con: just paralelo
│   │
│   ├── deploy/                          # GESTORES
│   │   ├── gestor_habilidades.py       # Skills (250 líneas)
│   │   └── gestor_worktrees.py         # Worktrees (300 líneas)
│   │
│   └── scripts/                         # AUTOMATIZACIÓN
│       ├── inicializar_fabrica.py      # Bootstrap (200 líneas)
│       ├── concluir_expediente.py      # Archivar (60 líneas)
│       └── turno_noche.py              # Mantenimiento (150 líneas)
│
├── docs/                                 # DOCUMENTACIÓN
│   ├── README.md                        # Índice
│   ├── AGENT_GUIDE.md                   # Protocolo agentes (300+ líneas)
│   ├── QUICK_REFERENCE.md               # Comandos rápidos
│   ├── ARCHITECTURE.md                  # Este archivo
│   ├── plans/                           # Plans implementación
│   └── adr/                             # Architecture Decision Records
│
├── .claude/                              # CLAUDE CODE
│   ├── commands/                        # Comandos slash custom
│   └── skills/                          # Skills especializadas
│
└── src/                                  # CÓDIGO FUENTE
    └── (pendiente implementar)
```

### Responsabilidades por Carpeta

| Carpeta | Propósito | Archivos Clave |
|---------|-----------|----------------|
| `fabrica/` | Sistema de automatización completo | justfile, vigilante.py |
| `docs/` | Documentación estructurada | AGENT_GUIDE.md, ARCHITECTURE.md |
| `.claude/` | Integración Claude Code | commands/, skills/ |
| `src/` | Código fuente del proyecto | (a definir) |

---

## Sistemas Implementados

### 1. Sistema de Justfiles (Delegación)

**Arquitectura:**
```
Usuario ejecuta: just [comando]
    ↓
justfile (raíz) - PowerShell
    ↓ delega
fabrica/justfile - Git Bash
    ↓ ejecuta
Scripts Python / Git / Comandos
```

**Razón:**
- Justfile raíz usa PowerShell (compatible CMD Windows)
- Justfile fabrica usa Git Bash (comandos Unix)
- Delegación permite interfaz limpia + lógica compleja

### 2. Sistema de Buzones (Expedientes)

**Flujo:**
```
Archivo depositado en entrada/
    ↓
Vigilante detecta (watchdog o batch)
    ↓
Clasifica por extensión (buzones.json)
    ↓
Crea expediente en taller_activo/
    ↓
Genera INSTRUCCIONES_AGENTE.md
    ↓
Agente trabaja
    ↓
Concluye → archivo_concluido/
```

**Componentes:**
- `vigilante.py` - Monitor (batch/watch)
- `buzones.json` - Configuración tipos
- `concluir_expediente.py` - Archivado

**Extensible:**
- Añadir nuevos tipos en `buzones.json`
- Personalizar acciones por extensión
- Integrar con sistemas externos

### 3. Desarrollo Paralelo (Git Worktrees)

**Concepto:**
```
Repositorio main
    ├── worktree 1 (feature/login)
    ├── worktree 2 (bugfix/navbar)
    └── worktree 3 (experiment/redesign)

Cada worktree = checkout independiente
Sin conflictos entre ramas
```

**Ventajas:**
- ✅ Múltiples features simultáneas
- ✅ Sin stash/commit temporal
- ✅ Sin cambio de contexto
- ✅ Aislamiento completo

**Gestión:**
- `gestor_worktrees.py` - Crear/listar/eliminar
- Detección automática de prefijos (feature/, bugfix/, experiment/)
- Integración con justfile

### 4. Gestión de Habilidades

**Catálogo:**
```
.claude/skills/
├── skill1.md
├── skill2.md
└── INDICE_HABILIDADES.json (generado)
```

**Indexación:**
- Extrae metadata (título, descripción, keywords)
- Genera JSON para búsqueda rápida
- Reindexación bajo demanda

### 5. Automatización (Scripts)

**Scripts disponibles:**
- `inicializar_fabrica.py` - Bootstrap idempotente
- `concluir_expediente.py` - Archivar expedientes
- `turno_noche.py` - Mantenimiento programado

**Programables:**
- Windows Task Scheduler
- GitHub Actions
- Cron (Linux/Mac)

---

## Decisiones Arquitectónicas

### DA-001: Justfile Delegador

**Decisión:** Dos justfiles (raíz + fabrica/) con shells diferentes.

**Contexto:**
- Windows no tiene shell Unix nativo
- Git Bash disponible pero no es default
- Comandos complejos requieren Unix tools

**Alternativas consideradas:**
1. ❌ Solo PowerShell → Incompatible con comandos Unix
2. ❌ Solo Git Bash → No funciona desde CMD
3. ✅ Delegación PowerShell → Git Bash → Funciona en ambos

**Consecuencias:**
- ✅ Compatible CMD y Git Bash
- ✅ Interfaz limpia en raíz
- ⚠️ Requiere Git Bash instalado

### DA-002: Sistema de Buzones (Expedientes)

**Decisión:** Modelo de expedientes por tema (no por tipo).

**Contexto:**
- Necesidad de gestionar specs/errores/feedback
- Rastrear estado de cada tema
- Documentar decisiones por expediente

**Alternativas consideradas:**
1. ❌ Carpetas por tipo (specs/, errors/) → Pierde contexto temporal
2. ❌ Base de datos → Over-engineering para inicio
3. ✅ Expedientes con metadata → Simple, rastreable, archivable

**Consecuencias:**
- ✅ Historial completo por tema
- ✅ Fácil archivar/buscar
- ⚠️ Requiere limpiar archivo_concluido periódicamente

### DA-003: Git Worktrees para Desarrollo Paralelo

**Decisión:** Usar git worktrees en lugar de ramas tradicionales.

**Contexto:**
- Desarrollo de múltiples features simultáneas
- Evitar stash/commit temporal
- Mantener contexto independiente

**Alternativas consideradas:**
1. ❌ Ramas con git stash → Pierde contexto, propenso a errores
2. ❌ Múltiples clones → Desperdicia espacio, sincronización compleja
3. ✅ Git worktrees → Checkouts independientes, mismo repo

**Consecuencias:**
- ✅ Desarrollo paralelo sin conflictos
- ✅ Cambio de contexto instantáneo
- ⚠️ Carpeta ramas_paralelas/ crece (limpiar completadas)

---

## Precauciones Críticas

### ⚠️ CRÍTICO 1: Git Bash Requerido

**Síntoma:**
```
just: command not found
/usr/bin/bash: command not found
```

**Causa:** Git Bash no instalado o ruta incorrecta en justfile.

**Solución:**
```bash
# Instalar Git (incluye Git Bash)
choco install git

# Verificar ruta en fabrica/justfile línea 9:
set shell := ["C:\\Program Files\\Git\\usr\\bin\\sh.exe", "-c"]

# Si Git está en otra ubicación, actualizar ruta
```

**Prevención:** Verificar con `just iniciar` después de clonar.

### ⚠️ CRÍTICO 2: Watchdog Requerido para Modo Watch

**Síntoma:**
```
ModuleNotFoundError: No module named 'watchdog'
```

**Causa:** Paquete watchdog no instalado.

**Solución:**
```bash
pip install watchdog
```

**Alternativa:** Usar modo batch (`just automatizar`) que no requiere watchdog.

### ⚠️ CRÍTICO 3: Git Init Antes de Worktrees

**Síntoma:**
```
fatal: not a git repository
just paralelo falla
```

**Causa:** Proyecto no inicializado como repositorio git.

**Solución:**
```bash
git init
git add .
git commit -m "Initial commit"
just paralelo "nombre"
```

### ⚠️ IMPORTANTE: Limpiar Worktrees Completados

**Síntoma:** Carpeta `ramas_paralelas/` crece indefinidamente.

**Prevención:**
```bash
# Después de mergear feature
just paralelo-limpiar "nombre-feature"
```

**Limpieza masiva:**
```bash
# Listar activos
just paralelos-activos

# Limpiar uno por uno
just paralelo-limpiar "nombre1"
just paralelo-limpiar "nombre2"
```

### ⚠️ IMPORTANTE: Archivar Expedientes Regularmente

**Síntoma:** `taller_activo/` con expedientes terminados.

**Prevención:**
```bash
# Al terminar expediente
just concluir [ID_EXPEDIENTE]
```

**Limpieza manual:**
```bash
# Mover manualmente si just falla
mv fabrica/buzon_agente/taller_activo/EXP_xxx \
   fabrica/buzon_agente/archivo_concluido/
```

---

## Limitaciones Conocidas

### 1. Windows Only (Parcial)

**Limitación:** Justfiles configurados para Windows.

**Impacto:** En Linux/Mac, ajustar rutas de shell en justfiles.

**Workaround Linux/Mac:**
```justfile
# Cambiar en justfiles:
set shell := ["bash", "-c"]  # En lugar de Git Bash
```

### 2. Stack Detection Básico

**Limitación:** Solo detecta stacks comunes (Python, Node, Java).

**Impacto:** Proyectos con stacks menos comunes muestran "generic".

**Workaround:** Personalizar `fabrica/justfile` con comandos específicos.

### 3. Vigilante Requiere Watchdog para Modo Watch

**Limitación:** Modo watch no funciona sin watchdog.

**Impacto:** En entornos sin pip, solo modo batch disponible.

**Workaround:** Usar `just automatizar` (modo batch) que no requiere watchdog.

### 4. Justfile Requiere Git Bash

**Limitación:** Comandos Unix en `fabrica/justfile` requieren Git Bash.

**Impacto:** En sistemas sin Git Bash, comandos fallan.

**Workaround:** Instalar Git for Windows (incluye Git Bash).

---

## 📊 Métricas Técnicas

### Tamaños de Archivos Clave

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `justfile` | 66 | Delegador |
| `fabrica/justfile` | 400+ | Lógica completa |
| `CLAUDE.md` | 188 | Hub ligero |
| `vigilante.py` | 603 | Monitor buzones |
| `AGENT_GUIDE.md` | 300+ | Protocolo |
| `GUIA_COMPLETA.md` | 600+ | Documentación fábrica |

### Estadísticas del Proyecto

- **Archivos generados:** 16
- **Scripts Python:** 5 (vigilante + 3 scripts + 2 gestores)
- **Documentación:** 8 archivos Markdown
- **Líneas totales código:** ~3,000+
- **Tamaño en disco:** 108 KB

---

## 🔗 Referencias

### Documentación Relacionada
- `CLAUDE.md` - Hub central
- `docs/AGENT_GUIDE.md` - Protocolo de trabajo
- `docs/QUICK_REFERENCE.md` - Comandos prácticos
- `fabrica/GUIA_COMPLETA.md` - Guía detallada

### Decisiones Arquitectónicas (ADR)
- `docs/adr/` - Futuras decisiones importantes

### Herramientas Externas
- [Just Manual](https://just.systems/) - Command runner
- [Git Worktree](https://git-scm.com/docs/git-worktree) - Desarrollo paralelo
- [Watchdog](https://pythonhosted.org/watchdog/) - Monitoreo archivos

---

**Última actualización:** 2026-02-13
**Responsable arquitectura:** [Definir]
