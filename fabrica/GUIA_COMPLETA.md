# Guía Completa - Fábrica Agéntica v2.0

**Proyecto:** PruebaInicializa4
**Versión:** 2.0
**Última actualización:** 2026-02-13

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Comandos Disponibles](#comandos-disponibles)
4. [Sistema de Buzones](#sistema-de-buzones)
5. [Desarrollo Paralelo (Worktrees)](#desarrollo-paralelo)
6. [Gestión de Habilidades](#gestión-de-habilidades)
7. [Scripts de Automatización](#scripts-de-automatización)
8. [Workflows Completos](#workflows-completos)
9. [Configuración Avanzada](#configuración-avanzada)
10. [Troubleshooting](#troubleshooting)

---

## Introducción

### ¿Qué es la Fábrica Agéntica?

La **Fábrica Agéntica** es un sistema completo de automatización y gestión de desarrollo que incluye:

- ✅ **Sistema de buzones** - Gestión automatizada de especificaciones mediante expedientes
- ✅ **Desarrollo paralelo** - Git worktrees para trabajar en múltiples features simultáneamente
- ✅ **Gestión de habilidades** - Catálogo indexado de skills especializadas
- ✅ **Scripts de automatización** - Mantenimiento nocturno, backups, limpieza
- ✅ **Comandos unificados** - Interfaz `just` para todas las operaciones

### Filosofía

> "Automatizar lo repetitivo, documentar lo importante, simplificar lo complejo"

**Principios:**
1. **Convention over configuration** - Estructura estándar, cero configuración inicial
2. **Fail fast, recover gracefully** - Detectar errores rápido, recuperar automáticamente
3. **Living documentation** - Documentación que se actualiza con el código
4. **Parallel by default** - Desarrollo paralelo sin conflictos

---

## Arquitectura del Sistema

### Estructura de Carpetas

```
fabrica/
├── justfile                          # Lógica completa de comandos (400-500 líneas)
├── GUIA_COMPLETA.md                  # Esta guía
│
├── buzon_agente/                     # SISTEMA DE BUZONES
│   ├── entrada/                     #   Depositar archivos aquí
│   │   └── LEEME.md                #   Instrucciones
│   ├── taller_activo/              #   Expedientes en proceso
│   ├── archivo_concluido/          #   Expedientes terminados
│   ├── vigilante.py                #   Monitor automático (600 líneas)
│   ├── buzones.json                #   Configuración del sistema
│   ├── vigilante.log               #   Logs del vigilante
│   └── GUIA_INICIO_RAPIDO.md       #   Quick start
│
├── ramas_paralelas/                  # DESARROLLO PARALELO
│   └── [worktrees dinámicos]       #   Se crean con: just paralelo "nombre"
│
├── deploy/                           # GESTORES
│   ├── gestor_habilidades.py       #   Indexar/buscar skills (250 líneas)
│   └── gestor_worktrees.py         #   Gestión worktrees (300 líneas)
│
└── scripts/                          # SCRIPTS DE AUTOMATIZACIÓN
    ├── inicializar_fabrica.py      #   Bootstrap idempotente (200 líneas)
    ├── concluir_expediente.py      #   Archivar expedientes (60 líneas)
    └── turno_noche.py              #   Mantenimiento nocturno (150 líneas)
```

### Flujo de Datos

```
Especificación (entrada/)
    ↓
Vigilante detecta
    ↓
Crea expediente (taller_activo/)
    ↓
Agente trabaja
    ↓
Concluye expediente (archivo_concluido/)
```

---

## Comandos Disponibles

### Ver Ayuda

```bash
just ayuda        # Ayuda completa con ejemplos
just --list       # Listar todos los comandos
```

### Comandos Principales

#### Gestión del Proyecto

```bash
just iniciar
```
Verifica sistema completo:
- Estructura de carpetas
- Dependencias instaladas (git, python, node)
- Configuración de git

```bash
just probar [args]
```
Ejecuta tests del proyecto. Detecta automáticamente el stack:
- **Node.js:** `npm test`
- **Python:** `pytest tests/`
- **Otro:** Mostrar instrucciones

```bash
just diagnostico
```
Diagnóstico completo del sistema:
- Rutas configuradas
- Estadísticas del proyecto
- Herramientas instaladas
- Configuración git

```bash
just limpiar [todo]
```
Limpieza de archivos temporales:
- **Básico:** `*.pyc`, `__pycache__`, `.DS_Store`, `*.tmp`
- **Todo:** + logs, cache, node_modules/.cache

#### Sistema de Buzones

```bash
just automatizar
```
Procesar todos los archivos en `entrada/` (modo batch).

```bash
just automatizar-vigilar
```
Iniciar vigilante en modo watch (monitoreo continuo).
Presionar Ctrl+C para detener.

```bash
just estado-buzones
```
Ver estado de todos los buzones:
- Archivos en entrada/ (pendientes)
- Expedientes en taller_activo/ (en proceso)
- Expedientes en archivo_concluido/ (finalizados)

```bash
just ejecutar-buzon [ID]
```
Ver detalles de un expediente específico:
- Archivos del expediente
- Instrucciones generadas

```bash
just concluir [ID]
```
Mover expediente de `taller_activo/` → `archivo_concluido/`.

#### Desarrollo Paralelo (Worktrees)

```bash
just paralelo [nombre]
```
Crear worktree en `ramas_paralelas/`:
- Detecta prefijo automáticamente (feature/, bugfix/, experiment/)
- Crea rama nueva o usa existente
- Instrucciones de uso al finalizar

```bash
just paralelos-activos
```
Listar todos los worktrees activos:
- Nombre
- Rama
- Commit actual
- Ruta

```bash
just paralelo-limpiar [nombre]
```
Eliminar worktree completado.
Solicita confirmación antes de eliminar.

#### Gestión de Habilidades

```bash
just habilidades
```
Listar todas las skills disponibles en `.claude/skills/`:
- Título
- Descripción
- Keywords
- Nombre del archivo

```bash
just habilidades-reindexar
```
Reindexar catálogo de habilidades.
Genera `INDICE_HABILIDADES.json`.

---

## Sistema de Buzones

### Concepto

El sistema de buzones gestiona trabajo mediante **expedientes**:

1. **Depositas** archivo en `entrada/`
2. **Vigilante** detecta y crea expediente
3. **Trabajas** siguiendo `INSTRUCCIONES_AGENTE.md`
4. **Archivas** expediente al terminar

### Tipos de Archivos Soportados

| Extensión | Tipo | Acción Recomendada |
|-----------|------|-------------------|
| `.md` | Especificación | `/implanta` |
| `.txt` | Especificación | `/implanta` |
| `.log` | Error | `/corrige` |
| `.email` | Feedback | Transformar a especificación |

**Configuración en:** `fabrica/buzon_agente/buzones.json`

### Modos del Vigilante

#### Modo Batch (Una vez)

```bash
just automatizar
# O directamente:
python fabrica/buzon_agente/vigilante.py --modo batch
```

**Comportamiento:**
- Procesa todos los archivos en `entrada/`
- Crea expedientes en `taller_activo/`
- Termina después de procesar

**Usar cuando:**
- Tienes varios archivos acumulados
- Quieres control manual del proceso

#### Modo Watch (Continuo)

```bash
just automatizar-vigilar
# O directamente:
python fabrica/buzon_agente/vigilante.py --modo watch
```

**Comportamiento:**
- Monitorea `entrada/` continuamente
- Procesa archivos nuevos automáticamente
- Corre hasta presionar Ctrl+C

**Usar cuando:**
- Flujo continuo de especificaciones
- Integración con otros sistemas
- Desarrollo activo

**Requiere:** `pip install watchdog`

### Anatomía de un Expediente

Cuando el vigilante detecta un archivo, crea:

```
taller_activo/EXP_20260213_120000_nombre/
├── nombre.md                     # Archivo original
└── INSTRUCCIONES_AGENTE.md       # Instrucciones generadas
```

**INSTRUCCIONES_AGENTE.md contiene:**
- Metadata del expediente (ID, fecha, tipo)
- Clasificación automática
- Preview del contenido
- Acción recomendada
- Próximos pasos
- Espacio para notas del agente

### Workflow Completo

```bash
# 1. Crear especificación
cat > fabrica/buzon_agente/entrada/feature_login.md << EOF
# Feature: Login con OAuth

Como usuario, quiero login con Google OAuth.

## Criterios de Aceptación
- [ ] Botón "Continuar con Google"
- [ ] Redirección OAuth
- [ ] Token guardado
EOF

# 2. Procesar
just automatizar

# Output:
# 📥 Archivos a procesar: 1
# 📄 Procesando: feature_login.md
# ✅ Expediente creado: EXP_20260213_120000_feature_login

# 3. Ver estado
just estado-buzones

# 4. Trabajar en expediente
just ejecutar-buzon EXP_20260213_120000_feature_login

# 5. Implementar (seguir instrucciones del expediente)
# - Leer INSTRUCCIONES_AGENTE.md
# - Ejecutar acción recomendada: /implanta
# - Desarrollar con TDD
# - Documentar decisiones

# 6. Concluir
just concluir EXP_20260213_120000_feature_login

# Output:
# ✅ Expediente concluido: EXP_20260213_120000_feature_login
#    Movido a: fabrica/buzon_agente/archivo_concluido/
```

### Personalizar Clasificación

Editar `fabrica/buzon_agente/buzones.json`:

```json
{
  "deteccion_tipo": {
    ".pdf": {
      "tipo": "documento",
      "accion": "Extraer texto y analizar",
      "descripcion": "Documento PDF"
    },
    ".csv": {
      "tipo": "datos",
      "accion": "Importar a base de datos",
      "descripcion": "Datos CSV"
    }
  }
}
```

---

## Desarrollo Paralelo

### Concepto: Git Worktrees

**Problema:** Cambiar de rama interrumpe el trabajo actual.

**Solución:** Git worktrees = múltiples checkouts del mismo repo.

**Ventajas:**
- Trabajar en múltiples features simultáneamente
- Sin stash/commit temporal
- Sin conflictos entre ramas
- Cada worktree es independiente

### Crear Worktree

```bash
just paralelo "mi-feature"
```

**Proceso:**
1. Detecta prefijo automáticamente:
   - `feature/` - feature normal
   - `bugfix/` - si contiene "bug" o "fix"
   - `experiment/` - si contiene "exp" o "test"
2. Crea rama `prefijo/mi-feature`
3. Crea worktree en `ramas_paralelas/mi-feature/`
4. Muestra instrucciones de uso

**Output:**
```
🌳 Creando worktree: mi-feature

✓ Creando nueva rama: feature/mi-feature
✅ Worktree creado exitosamente

📂 Ruta: fabrica/ramas_paralelas/mi-feature
🌿 Rama: feature/mi-feature

💡 Próximos pasos:
   1. cd fabrica/ramas_paralelas/mi-feature
   2. Desarrollar feature
   3. git add . && git commit
   4. git push origin feature/mi-feature
   5. just paralelo-limpiar mi-feature
```

### Trabajar en Worktree

```bash
# Ir al worktree
cd fabrica/ramas_paralelas/mi-feature

# Trabajar normalmente
# - Editar código
# - Crear tests
# - Commit cambios

# Volver a main sin perder trabajo
cd ../../../
# (mi-feature sigue existiendo)

# Continuar en mi-feature cuando quieras
cd fabrica/ramas_paralelas/mi-feature
```

### Listar Worktrees Activos

```bash
just paralelos-activos
```

**Output:**
```
🌳 Worktrees Activos
════════════════════════════════════════

1. mi-feature
   Rama: feature/mi-feature
   Commit: abc1234
   Ruta: Z:\...\ramas_paralelas\mi-feature

2. bugfix-login
   Rama: bugfix/bugfix-login
   Commit: def5678
   Ruta: Z:\...\ramas_paralelas\bugfix-login

📊 Total: 2 worktrees
```

### Eliminar Worktree

```bash
just paralelo-limpiar "mi-feature"
```

**Proceso:**
1. Verifica que el worktree existe
2. Solicita confirmación
3. Ejecuta `git worktree remove`
4. Limpia carpeta

**⚠️ Advertencia:** Si hay cambios sin commit, falla. Usa `--force` manualmente si es intencional.

---

## Gestión de Habilidades

### Concepto

**Skills** = Módulos de conocimiento especializado en `.claude/skills/`.

Cada skill documenta:
- Patrones de código experto
- Mejores prácticas
- Ejemplos prácticos
- Referencias a expertos

### Listar Skills

```bash
just habilidades
```

**Output:**
```
🎓 Habilidades Disponibles
════════════════════════════════════════

1. Python Best Practices
   Archivo: python-best-practices.md
   Patrones de Raymond Hettinger, guías PEP...
   Keywords: python, patterns, hettinger

2. TDD con Pytest
   Archivo: pytest-tdd.md
   Test-Driven Development con pytest...
   Keywords: testing, tdd, pytest

📊 Total: 2 habilidades
```

### Buscar Skill

```bash
python fabrica/deploy/gestor_habilidades.py buscar "testing"
```

**Output:**
```
🔍 Buscando: 'testing'
════════════════════════════════════════
✓ 1 resultados:

1. TDD con Pytest
   Archivo: pytest-tdd.md
   Test-Driven Development con pytest...
```

### Reindexar Catálogo

```bash
just habilidades-reindexar
```

**Proceso:**
1. Escanea `.claude/skills/*.md`
2. Extrae metadata (título, descripción, keywords)
3. Genera `INDICE_HABILIDADES.json`

**Ejecutar cuando:**
- Añades nueva skill
- Modificas skill existente
- Índice desactualizado

### Crear Nueva Skill

```bash
# 1. Crear archivo
nano .claude/skills/mi-skill.md

# 2. Escribir contenido (ver formato abajo)

# 3. Reindexar
just habilidades-reindexar
```

**Formato recomendado:**
```markdown
# Mi Skill

Descripción breve de la skill.

## Keywords

- keyword1
- keyword2
- keyword3

## Contenido

[Contenido de la skill]
```

---

## Scripts de Automatización

### inicializar_fabrica.py

**Propósito:** Bootstrap idempotente del sistema.

```bash
python fabrica/scripts/inicializar_fabrica.py
```

**Acciones:**
- Crear directorios faltantes
- Generar `buzones.json` si no existe
- Crear `.gitkeep` en carpetas vacías
- Verificar estructura completa

**Idempotente:** Seguro ejecutar múltiples veces.

### concluir_expediente.py

**Propósito:** Archivar expedientes manualmente.

```bash
python fabrica/scripts/concluir_expediente.py [ID]
```

**Sin argumentos:** Lista expedientes activos.

### turno_noche.py

**Propósito:** Mantenimiento nocturno automatizado.

```bash
python fabrica/scripts/turno_noche.py
```

**Tareas realizadas:**
- Limpiar logs > 30 días
- Backup de expedientes concluidos
- Limpiar backups > 90 días
- Eliminar archivos temporales
- Generar reporte de estadísticas

**Programar (Windows Task Scheduler):**
```
Acción: python
Argumentos: fabrica\scripts\turno_noche.py
Iniciar en: Z:\Aplicaciones\Extensiones Chrome\PruebaInicializa4
Disparador: Diario, 3:00 AM
```

---

## Workflows Completos

### Workflow 1: Implementar Feature

```bash
# 1. Especificación
cat > fabrica/buzon_agente/entrada/feature_notificaciones.md << EOF
# Feature: Sistema de Notificaciones

Implementar notificaciones push en la aplicación.

## Criterios de Aceptación
- [ ] Notificaciones en tiempo real
- [ ] Configuración de preferencias
- [ ] Historial de notificaciones

## Notas Técnicas
- Usar WebSocket para tiempo real
- Persistir en localStorage
EOF

# 2. Procesar
just automatizar

# 3. Crear rama paralela
just paralelo "notificaciones"
cd fabrica/ramas_paralelas/notificaciones

# 4. Implementar con TDD
# Test 1: Red → escribir test que falla
# Test 2: Green → código mínimo
# Test 3: Refactor → mejorar código

# 5. Commit
git add .
git commit -m "feat(notificaciones): sistema completo con WebSocket"

# 6. Push
git push origin feature/notificaciones

# 7. Volver a main
cd ../../../
git checkout main

# 8. Mergear
git merge feature/notificaciones

# 9. Limpiar
just paralelo-limpiar "notificaciones"

# 10. Concluir expediente
just concluir EXP_xxx_feature_notificaciones
```

### Workflow 2: Corregir Bug

```bash
# 1. Reproducir bug y capturar log
npm start > logs/error_500.log 2>&1

# 2. Depositar log
cp logs/error_500.log fabrica/buzon_agente/entrada/

# 3. Procesar
just automatizar
# Vigilante detecta tipo "error" → acción "/corrige"

# 4. Crear rama bugfix
just paralelo "bugfix-error-500"
cd fabrica/ramas_paralelas/bugfix-error-500

# 5. Escribir test que reproduce bug (debe fallar)
# Ejemplo Python:
# def test_endpoint_no_lanza_500():
#     response = client.get("/api/data")
#     assert response.status_code != 500

# 6. Corregir bug (test debe pasar ahora)

# 7. Commit
git add .
git commit -m "fix(api): corregir error 500 en endpoint /api/data"

# 8. Mergear a main
cd ../../../
git checkout main
git merge bugfix/bugfix-error-500

# 9. Limpiar
just paralelo-limpiar "bugfix-error-500"
just concluir EXP_xxx_error_500
```

---

## Configuración Avanzada

### Personalizar Justfile

Editar `fabrica/justfile` para:
- Añadir comandos custom
- Cambiar comportamiento de comandos
- Integrar con herramientas del proyecto

**Ejemplo: Añadir comando de deploy**
```justfile
# Deploy a producción
deploy-prod:
    @echo "🚀 Desplegando a producción..."
    @git push production main
    @echo "✅ Desplegado"
```

### Personalizar Detección de Tipos

Editar `fabrica/buzon_agente/buzones.json`:

```json
{
  "deteccion_tipo": {
    ".spec.md": {
      "tipo": "especificacion_detallada",
      "accion": "/planea y luego /implanta",
      "descripcion": "Especificación que requiere planning"
    }
  }
}
```

### Integrar con CI/CD

**Ejemplo GitHub Actions:**
```yaml
name: Turno Nocturno

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM diario

jobs:
  mantenimiento:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: python fabrica/scripts/turno_noche.py
```

---

## Troubleshooting

### Vigilante No Detecta Archivos

**Síntomas:**
- Archivos permanecen en `entrada/`
- No se crean expedientes

**Soluciones:**
```bash
# 1. Verificar logs
cat fabrica/buzon_agente/vigilante.log

# 2. Ejecutar manualmente
python fabrica/buzon_agente/vigilante.py --modo batch

# 3. Verificar que no esté ignorado
cat fabrica/buzon_agente/buzones.json
# Buscar en "patrones_ignorar"
```

### Worktree No Se Crea

**Síntomas:**
- `just paralelo` falla
- Error "not a git repository"

**Soluciones:**
```bash
# 1. Verificar que es repo git
git status

# 2. Si no es repo, inicializar
git init
git add .
git commit -m "Initial commit"

# 3. Intentar de nuevo
just paralelo "nombre"
```

### Just Comando No Encontrado

**Síntomas:**
- `just: command not found`

**Soluciones:**
```powershell
# Windows
choco install just

# Linux/Mac
brew install just

# Verificar
just --version
```

### Python Módulo No Encontrado

**Síntomas:**
- `ModuleNotFoundError: watchdog`

**Soluciones:**
```bash
# Instalar dependencias
pip install watchdog

# O si hay requirements.txt
pip install -r requirements.txt
```

---

## 📊 Estadísticas y Métricas

### Ver Estadísticas

```bash
just diagnostico
```

**Output:**
```
🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA
════════════════════════════════════════

📁 RUTAS:
  Proyecto: Z:\...\PruebaInicializa4
  Fábrica: Z:\...\fabrica
  Buzones: Z:\...\buzon_agente

📊 ESTADÍSTICAS:
  Archivos código: 12
  Skills: 2
  Plans: 0
  Expedientes activos: 1

🔧 HERRAMIENTAS:
  git version 2.40.0
  Python 3.11.0
  Node v18.16.0
  just 1.13.0

✅ Diagnóstico completado
```

---

## 🔗 Referencias

### Documentación Relacionada
- `CLAUDE.md` - Hub central del proyecto
- `docs/AGENT_GUIDE.md` - Protocolo para agentes
- `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` - Quick start buzones

### Herramientas Externas
- [Just Manual](https://just.systems/) - Documentación oficial de Just
- [Git Worktree](https://git-scm.com/docs/git-worktree) - Documentación de worktrees

---

**Fin de la Guía Completa**

*Generado automáticamente por `/inicializa` | Última actualización: 2026-02-13*
