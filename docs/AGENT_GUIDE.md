# Guía para Agentes - PruebaInicializa4

**Versión:** 2.0
**Proyecto:** PruebaInicializa4
**Última actualización:** 2026-02-13

---

## 🎯 Propósito de Este Documento

Esta guía establece el **protocolo de trabajo** para agentes (humanos y automatizados) que trabajan en este proyecto.

Define:
- Flujo de trabajo recomendado
- Dónde encontrar información
- Cómo documentar decisiones
- Convenciones del proyecto

---

## 📋 Protocolo de 3 Pasos

### ANTES de Empezar una Tarea

#### 1. Leer Contexto Rápido
```bash
# Leer hub central
cat CLAUDE.md
```

**Obtienes:**
- Estado actual del proyecto
- Mapa de documentación
- Comandos disponibles

#### 2. Buscar Skill Relevante
```bash
# Listar skills disponibles
just habilidades

# Buscar skill específica
python fabrica/deploy/gestor_habilidades.py buscar "[keyword]"
```

**Si existe skill relevante:**
- Leer antes de implementar
- Seguir patrones recomendados
- Aplicar mejores prácticas

#### 3. Consultar Diccionario de Dominio (OBLIGATORIO)
```bash
# Leer diccionario central
cat docs/DICCIONARIO_DOMINIO.md
```

**REGLA FUNDAMENTAL:**
Ningún nombre nuevo de tabla/campo/variable/estado puede aparecer en el código sin estar registrado en el diccionario primero.

**Si necesitas crear nombres nuevos:**
1. Verificar que NO existen en `docs/DICCIONARIO_DOMINIO.md`
2. Documentar propuesta en `PROPUESTA_DICCIONARIO.md` de tu expediente
3. Actualizar diccionario central una vez aprobado
4. Solo entonces implementar en código

#### 4. Revisar Plan (si existe)
```bash
# Listar plans disponibles
ls docs/plans/

# Leer plan específico
cat docs/plans/PLAN_nombre_feature.md
```

**Si existe plan:**
- Seguir estructura propuesta
- Actualizar si necesitas desviarte
- Marcar tareas completadas

---

### DURANTE la Ejecución

#### 1. Seguir Metodología TDD

**Ciclo obligatorio:**
```
🔴 RED   → Escribir test que falla
🟢 GREEN → Código mínimo para pasar
🔵 REFACTOR → Mejorar manteniendo tests verdes
```

**Estructura de tests:**
```
tests/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
└── functional/     # Tests funcionales (end-to-end)
```

#### 2. Actualizar Plan si Cambios

**Cuándo actualizar:**
- Descubres nueva dependencia
- Cambias arquitectura propuesta
- Encuentras blocker no previsto
- Completas una tarea del plan

**Cómo actualizar:**
```bash
# Editar plan
nano docs/plans/PLAN_nombre_feature.md

# Documentar cambio
echo "## Cambio: [fecha]" >> docs/plans/PLAN_nombre_feature.md
echo "Razón: [justificación]" >> docs/plans/PLAN_nombre_feature.md
```

#### 3. Documentar Decisiones Arquitectónicas

**Cuándo crear ADR (Architecture Decision Record):**
- Eliges entre múltiples alternativas
- Decisión impacta arquitectura futura
- Necesitas justificar elección

**Formato ADR:**
```markdown
# ADR-001: Título de la Decisión

**Estado:** Aceptada | Propuesta | Rechazada | Obsoleta
**Fecha:** YYYY-MM-DD
**Decidido por:** [Nombre/Agente]

## Contexto

[Descripción del problema]

## Decisión

[Qué se decidió]

## Consecuencias

### Positivas
- [Beneficio 1]

### Negativas
- [Desventaja 1]

## Alternativas Consideradas

1. [Alternativa 1]: [Por qué se descartó]
2. [Alternativa 2]: [Por qué se descartó]
```

**Guardar en:**
```bash
docs/adr/ADR-XXX-nombre-decision.md
```

#### 4. Usar Buzones para Specs

**Flujo recomendado:**
```bash
# 1. Crear especificación
cat > fabrica/buzon_agente/entrada/feature_nombre.md << EOF
# Feature: Nombre

## Descripción
[Qué hace]

## Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
EOF

# 2. Procesar
just automatizar

# 3. Trabajar en expediente
just ejecutar-buzon EXP_xxx

# 4. Al terminar
just concluir EXP_xxx
```

---

### DESPUÉS de Terminar

#### 1. Ejecutar Validación

**Si comando /valida disponible:**
```bash
/valida
```

**Si no disponible, verificar manualmente:**
```bash
# Tests pasan
just probar

# Linter sin errores
# (configurar según stack)

# Documentación actualizada
git status docs/
```

#### 2. Actualizar Documentación Afectada

**Archivos que pueden necesitar actualización:**
- `CLAUDE.md` - Si cambió estado/fase del proyecto
- `docs/DICCIONARIO_DOMINIO.md` - Si creaste nombres nuevos (OBLIGATORIO)
- `README.md` - Si cambió funcionalidad principal
- `docs/AGENT_GUIDE.md` - Si cambió protocolo
- Plan en `docs/plans/` - Marcar tareas completadas
- ADR en `docs/adr/` - Si tomaste decisión arquitectónica

**Criterio simple:**
> "Si alguien nuevo lee la doc, ¿entenderá el estado actual?"

#### 3. Concluir Expediente

**Si usaste sistema de buzones:**
```bash
just concluir [ID_EXPEDIENTE]
```

Esto mueve el expediente a `archivo_concluido/` preservando toda la información.

#### 4. Limpiar Rama Paralela (si aplica)

**Si usaste worktree:**
```bash
# Mergear a main/master
git checkout main
git merge feature/nombre

# Limpiar worktree
just paralelo-limpiar nombre
```

---

## 🗂️ Mapa de Información

### "¿Dónde encuentro...?"

| Necesitas... | Ubicación | Comando |
|---|---|---|
| **Comandos disponibles** | `fabrica/justfile` | `just ayuda` |
| **Estado del proyecto** | `CLAUDE.md` | `cat CLAUDE.md` |
| **Protocolo de trabajo** | `docs/AGENT_GUIDE.md` | Este documento |
| **Nombres canónicos (OBLIGATORIO)** | `docs/DICCIONARIO_DOMINIO.md` | `cat docs/DICCIONARIO_DOMINIO.md` |
| **Guía de fábrica** | `fabrica/GUIA_COMPLETA.md` | `cat fabrica/GUIA_COMPLETA.md` |
| **Sistema de buzones** | `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` | `cat fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` |
| **Skills disponibles** | `.claude/skills/` | `just habilidades` |
| **Plans activos** | `docs/plans/` | `ls docs/plans/` |
| **Decisiones arquitectónicas** | `docs/adr/` | `ls docs/adr/` |
| **Código fuente** | `src/` | `ls src/` |
| **Tests** | `tests/` | `just probar` |

---

## 🎨 Convenciones del Proyecto

### Código

**Estilo:**
- Seguir guías estándar del lenguaje
- Nombres descriptivos (intención sobre implementación)
- Funciones < 20 líneas
- Archivos < 200 líneas

**Tests:**
- TDD obligatorio (test primero)
- Patrón AAA (Arrange-Act-Assert)
- Un concepto por test
- Nombres descriptivos: `test_descripcion_comportamiento`

**Documentación:**
- Código autodocumentado (nombres claros)
- Comentarios solo para "por qué", no "qué"
- README en carpetas principales

### Git

**Commits:**
```
tipo(alcance): descripción corta

Descripción detallada opcional.

Refs: #123
```

**Tipos:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Cambios en documentación
- `refactor` - Refactorización sin cambio funcional
- `test` - Añadir/modificar tests
- `chore` - Mantenimiento (deps, config)

**Branches:**
- `feature/nombre` - Nueva funcionalidad
- `bugfix/nombre` - Corrección de bug
- `experiment/nombre` - Experimento temporal

### Documentación

**Formato:**
- Markdown para todo
- Headers jerárquicos (#, ##, ###)
- Code blocks con syntax highlighting
- Links relativos entre docs

**Estructura:**
```markdown
# Título

**Metadatos clave**

---

## Sección 1

Contenido...

## Sección 2

Contenido...

---

**Referencias:** [Links a otros docs]
```

---

## 🚀 Workflows Comunes

### Workflow 1: Implementar Nueva Feature

```bash
# 1. Crear especificación
cat > fabrica/buzon_agente/entrada/feature_nombre.md
# (escribir spec)

# 2. Procesar con vigilante
just automatizar

# 3. Crear rama paralela
just paralelo "feature-nombre"
cd fabrica/ramas_paralelas/feature-nombre

# 4. Implementar con TDD
# - Escribir test (RED)
# - Código mínimo (GREEN)
# - Refactorizar (REFACTOR)

# 5. Validar
just probar

# 6. Commit y merge
git add .
git commit -m "feat: implementar feature nombre"
git checkout main
git merge feature/feature-nombre

# 7. Limpiar
just paralelo-limpiar "feature-nombre"
just concluir [ID_EXPEDIENTE]
```

### Workflow 2: Corregir Bug

```bash
# 1. Copiar log de error a entrada/
cp logs/error.log fabrica/buzon_agente/entrada/

# 2. Procesar
just automatizar

# 3. El vigilante crea expediente con acción /corrige

# 4. Crear rama bugfix
just paralelo "bugfix-nombre"
cd fabrica/ramas_paralelas/bugfix-nombre

# 5. Escribir test que reproduce bug (debe fallar)

# 6. Corregir bug (test debe pasar)

# 7. Commit y merge
git add .
git commit -m "fix: corregir bug nombre"
git checkout main
git merge bugfix/bugfix-nombre

# 8. Limpiar
just paralelo-limpiar "bugfix-nombre"
just concluir [ID_EXPEDIENTE]
```

### Workflow 3: Documentar Decisión Arquitectónica

```bash
# 1. Crear ADR
nano docs/adr/ADR-001-decision.md
# (escribir siguiendo template)

# 2. Referenciar en código si aplica
# Añadir comentario: "// Ver ADR-001"

# 3. Actualizar CLAUDE.md si es decisión mayor
nano CLAUDE.md

# 4. Commit
git add docs/adr/ADR-001-decision.md CLAUDE.md
git commit -m "docs(adr): documentar decisión sobre [tema]"
```

---

## DICCIONARIO DE DOMINIO

### Proceso Obligatorio (4 Pasos)

#### Paso 1: CONSULTAR Diccionario Central
```bash
cat docs/DICCIONARIO_DOMINIO.md
```
Verificar si el nombre que quieres usar ya existe.

#### Paso 2: PROPONER Cambio (si nombre NO existe)
Documentar en `PROPUESTA_DICCIONARIO.md` de tu expediente:
- Nombre completo (tabla, campo, enum, etc.)
- Tipo de dato / tipo de cambio
- Validaciones / restricciones
- Descripción del propósito

#### Paso 3: ACTUALIZAR Diccionario Central
Una vez aprobada la propuesta:
```bash
# Editar diccionario central
nano docs/DICCIONARIO_DOMINIO.md
# Añadir nuevo nombre en sección correspondiente
# Registrar en historial de cambios
```

#### Paso 4: IMPLEMENTAR en Código
Solo después de registrar en el diccionario.

### Ejemplo: Dos Expedientes Coordinados

**Expediente A** necesita tabla `pedidos`:
1. Consulta `docs/DICCIONARIO_DOMINIO.md` → NO existe
2. Propone en su `PROPUESTA_DICCIONARIO.md`
3. Se aprueba → Actualiza diccionario central
4. Implementa con nombre canónico

**Expediente B** necesita campo en `pedidos`:
1. Consulta `docs/DICCIONARIO_DOMINIO.md` → tabla existe (Expediente A la registró)
2. Propone nuevo campo `pedidos.fecha_envio`
3. Se aprueba → Actualiza diccionario central
4. Implementa con nombre coherente

### Troubleshooting Diccionario

| Problema | Solución |
|----------|----------|
| No encuentro el diccionario | `cat docs/DICCIONARIO_DOMINIO.md` (siempre en docs/) |
| Nombre ya existe con otro significado | Proponer renombramiento en PROPUESTA_DICCIONARIO.md |
| Conflicto entre expedientes | Diccionario central es fuente de verdad |

---

## Troubleshooting

### Comando Just Falla

**Síntoma:** `just [comando]` no funciona

**Solución:**
```bash
# Verificar que just está instalado
just --version

# Verificar que estás en raíz del proyecto
pwd  # Debe ser /ruta/a/PruebaInicializa4

# Ver lista de comandos disponibles
just --list
```

### Git Worktree No Se Crea

**Síntoma:** `just paralelo` falla

**Solución:**
```bash
# Verificar que es repositorio git
git status

# Si no es repo, inicializar
git init
git add .
git commit -m "Initial commit"

# Intentar de nuevo
just paralelo "nombre"
```

### Vigilante No Detecta Archivos

**Síntoma:** Archivos en entrada/ no se procesan

**Solución:**
```bash
# Ver logs
cat fabrica/buzon_agente/vigilante.log

# Ejecutar manualmente
python fabrica/buzon_agente/vigilante.py --modo batch

# Verificar que no esté ignorado
cat fabrica/buzon_agente/buzones.json
# Buscar tu archivo en "patrones_ignorar"
```

---

## 📚 Referencias

### Documentación Completa
- `CLAUDE.md` - Hub central del proyecto
- `fabrica/GUIA_COMPLETA.md` - Guía detallada de fábrica
- `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` - Sistema de buzones

### Comandos Clave
- `just ayuda` - Ver todos los comandos
- `just iniciar` - Verificar sistema
- `just diagnostico` - Diagnóstico completo

### Herramientas Externas
- [Just Manual](https://just.systems/man/en/) - Referencia completa de Just
- [Git Worktree Docs](https://git-scm.com/docs/git-worktree) - Desarrollo paralelo

---

**Nota:** Esta guía es un documento vivo. Si encuentras que falta información o algo no está claro, actualízala para futuros agentes.

---

*Generado automáticamente por `/inicializa` | Última actualización: 2026-02-13*
