# Referencia Rápida de Comandos - PruebaInicializa4

**Quick reference con ejemplos prácticos**

---

## 📋 Índice

- [Comandos Just](#comandos-just)
- [Sistema de Buzones](#sistema-de-buzones)
- [Desarrollo Paralelo](#desarrollo-paralelo)
- [Gestión de Habilidades](#gestión-de-habilidades)
- [Scripts Python](#scripts-python)
- [Git Workflows](#git-workflows)

---

## Comandos Just

### Gestión del Proyecto

```bash
# Ver ayuda completa con ejemplos
just ayuda

# Listar todos los comandos disponibles
just --list

# Verificar sistema (estructura, dependencias, git)
just iniciar

# Diagnóstico completo del proyecto
just diagnostico

# Ejecutar tests (detecta stack automáticamente)
just probar

# Limpiar archivos temporales
just limpiar          # Básico: *.pyc, __pycache__, .DS_Store
just limpiar todo     # Completo: + logs, cache
```

### Sistema de Buzones

```bash
# Procesar todos los archivos en entrada/ (una vez)
just automatizar

# Iniciar vigilante en modo continuo (Ctrl+C para detener)
just automatizar-vigilar

# Ver estado de todos los buzones
just estado-buzones

# Ver detalles de un expediente
just ejecutar-buzon EXP_20260213_120000_feature

# Concluir expediente (mover a archivo_concluido/)
just concluir EXP_20260213_120000_feature

# Inicializar sistema de buzones (idempotente)
just iniciar-fabrica
```

### Desarrollo Paralelo (Worktrees)

```bash
# Crear rama paralela (detecta prefijo automáticamente)
just paralelo "mi-feature"           # → feature/mi-feature
just paralelo "bugfix-login"         # → bugfix/bugfix-login
just paralelo "exp-nueva-idea"       # → experiment/exp-nueva-idea

# Listar ramas paralelas activas
just paralelos-activos

# Eliminar rama paralela completada
just paralelo-limpiar "mi-feature"
```

### Gestión de Habilidades

```bash
# Listar todas las skills disponibles
just habilidades

# Reindexar catálogo de skills
just habilidades-reindexar
```

---

## Sistema de Buzones

### Flujo Completo

```bash
# 1. Crear especificación
cat > fabrica/buzon_agente/entrada/feature_login.md << EOF
# Feature: Login con OAuth

Como usuario, quiero login con Google OAuth.

## Criterios de Aceptación
- [ ] Botón "Continuar con Google"
- [ ] Redirección OAuth
- [ ] Token guardado en localStorage
EOF

# 2. Procesar (modo batch)
just automatizar

# Output esperado:
# 📥 Archivos a procesar: 1
# 📄 Procesando: feature_login.md
# ✅ Expediente creado: EXP_20260213_120000_feature_login

# 3. Ver estado
just estado-buzones

# 4. Trabajar en expediente
just ejecutar-buzon EXP_20260213_120000_feature_login

# 5. Implementar (seguir INSTRUCCIONES_AGENTE.md del expediente)

# 6. Concluir
just concluir EXP_20260213_120000_feature_login
```

### Vigilante en Modo Watch

```bash
# Iniciar monitoreo continuo
just automatizar-vigilar

# Output:
# 👁️  El vigilante está atento...
# ⏹️  Presiona Ctrl+C para detener

# En otra terminal, depositar archivos
echo "Nueva feature" > fabrica/buzon_agente/entrada/feature.md
# El vigilante detecta automáticamente y procesa

# Detener vigilante
# Presionar Ctrl+C
```

### Tipos de Archivos Soportados

```bash
# Especificación (Markdown)
echo "Implementar X" > entrada/feature.md
# → Acción: /implanta

# Especificación (Texto plano)
echo "Implementar Y" > entrada/spec.txt
# → Acción: /implanta

# Log de error
cp logs/error.log entrada/
# → Acción: /corrige

# Email con feedback
cat > entrada/feedback.email << EOF
From: usuario@example.com
Subject: Sugerencia

Me gustaría modo oscuro.
EOF
# → Acción: Transformar a especificación
```

---

## Desarrollo Paralelo

### Crear y Usar Worktree

```bash
# Crear worktree
just paralelo "implementar-notificaciones"

# Output:
# ✅ Worktree creado exitosamente
# 📂 Ruta: fabrica/ramas_paralelas/implementar-notificaciones
# 🌿 Rama: feature/implementar-notificaciones

# Ir al worktree
cd fabrica/ramas_paralelas/implementar-notificaciones

# Trabajar normalmente
# (editar código, crear tests, commits)

# Commit
git add .
git commit -m "feat(notificaciones): sistema push"

# Push
git push origin feature/implementar-notificaciones

# Volver a raíz (worktree sigue existiendo)
cd ../../..

# Continuar en main sin conflictos
git checkout main
# (el worktree sigue en su rama)
```

### Trabajar en Múltiples Features Simultáneamente

```bash
# Feature 1: Login
just paralelo "login-oauth"
cd fabrica/ramas_paralelas/login-oauth
# ... trabajar ...
cd ../../..

# Feature 2: Dashboard (mientras login está en progreso)
just paralelo "dashboard-mejoras"
cd fabrica/ramas_paralelas/dashboard-mejoras
# ... trabajar ...
cd ../../..

# Ambas features coexisten sin conflictos

# Ver activas
just paralelos-activos
# Output:
# 1. login-oauth (feature/login-oauth)
# 2. dashboard-mejoras (feature/dashboard-mejoras)
```

### Limpiar Worktrees Completados

```bash
# Antes de limpiar, mergear a main
git checkout main
git merge feature/login-oauth
git push

# Limpiar worktree
just paralelo-limpiar "login-oauth"

# Confirmar eliminación cuando se solicite
```

---

## Gestión de Habilidades

### Listar Skills

```bash
just habilidades

# Output:
# 🎓 Habilidades Disponibles
# ════════════════════════════════════════
#
# 1. Python Best Practices
#    Archivo: python-best-practices.md
#    Patrones de Raymond Hettinger...
#    Keywords: python, patterns
#
# 📊 Total: 1 habilidades
```

### Buscar Skill por Keyword

```bash
python fabrica/deploy/gestor_habilidades.py buscar "testing"

# Output:
# 🔍 Buscando: 'testing'
# ✓ 2 resultados:
# 1. TDD con Pytest
# 2. Testing Patterns
```

### Crear Nueva Skill

```bash
# 1. Crear archivo
cat > .claude/skills/mi-skill.md << EOF
# Mi Skill Especializada

Descripción breve de la skill.

## Keywords

- keyword1
- keyword2

## Contenido

[Contenido detallado]
EOF

# 2. Reindexar
just habilidades-reindexar

# 3. Verificar
just habilidades
```

---

## Scripts Python

### Inicializar Fábrica

```bash
# Bootstrap idempotente (seguro ejecutar múltiples veces)
python fabrica/scripts/inicializar_fabrica.py

# Output:
# 📁 Verificando directorios...
# ⚙️  Configuración de buzones: ✓ existente
# ✅ Estructura ya estaba inicializada
```

### Concluir Expediente Manualmente

```bash
# Sin argumentos: listar expedientes activos
python fabrica/scripts/concluir_expediente.py

# Output:
# 📋 Expedientes activos en taller:
#    - EXP_20260213_120000_feature_login
#    - EXP_20260213_150000_bugfix_navbar

# Con argumento: concluir específico
python fabrica/scripts/concluir_expediente.py EXP_20260213_120000_feature_login

# Output:
# ✅ Expediente concluido: EXP_20260213_120000_feature_login
#    Movido a: fabrica/buzon_agente/archivo_concluido/
```

### Turno Nocturno (Mantenimiento)

```bash
python fabrica/scripts/turno_noche.py

# Tareas realizadas:
# - Limpiar logs > 30 días
# - Backup de expedientes concluidos
# - Limpiar backups > 90 días
# - Eliminar archivos temporales
# - Generar reporte de estadísticas
```

### Gestores

```bash
# Gestor de Habilidades
python fabrica/deploy/gestor_habilidades.py listar
python fabrica/deploy/gestor_habilidades.py reindexar
python fabrica/deploy/gestor_habilidades.py buscar "keyword"

# Gestor de Worktrees
python fabrica/deploy/gestor_worktrees.py crear "nombre"
python fabrica/deploy/gestor_worktrees.py listar
python fabrica/deploy/gestor_worktrees.py eliminar "nombre"
```

---

## Git Workflows

### Workflow Feature Completa

```bash
# 1. Especificación
echo "Feature X" > fabrica/buzon_agente/entrada/feature_x.md
just automatizar

# 2. Rama paralela
just paralelo "feature-x"
cd fabrica/ramas_paralelas/feature-x

# 3. TDD
# - Test RED → escribir test que falla
# - Código GREEN → mínimo para pasar
# - Refactor BLUE → mejorar código

# 4. Commit iterativo
git add .
git commit -m "test(x): añadir tests feature X"
# ... implementar ...
git add .
git commit -m "feat(x): implementar feature X"
# ... refactorizar ...
git add .
git commit -m "refactor(x): simplificar lógica"

# 5. Push
git push origin feature/feature-x

# 6. Merge a main
cd ../../..
git checkout main
git merge feature/feature-x
git push

# 7. Limpiar
just paralelo-limpiar "feature-x"
just concluir [ID_EXPEDIENTE]
```

### Workflow Bugfix

```bash
# 1. Reproducir y capturar log
npm start > logs/error_500.log 2>&1

# 2. Depositar log
cp logs/error_500.log fabrica/buzon_agente/entrada/
just automatizar

# 3. Rama bugfix
just paralelo "bugfix-error-500"
cd fabrica/ramas_paralelas/bugfix-error-500

# 4. Test que reproduce bug (debe fallar)
# Ejemplo Python:
cat > tests/test_bugfix.py << EOF
def test_endpoint_no_lanza_500():
    response = client.get("/api/data")
    assert response.status_code != 500
EOF

# 5. Corregir bug (test debe pasar)

# 6. Commit
git add .
git commit -m "fix(api): corregir error 500 en /api/data"

# 7. Merge
cd ../../..
git checkout main
git merge bugfix/bugfix-error-500

# 8. Limpiar
just paralelo-limpiar "bugfix-error-500"
just concluir [ID_EXPEDIENTE]
```

---

## 🔧 Configuración Avanzada

### Personalizar Detección de Tipos (buzones.json)

```json
{
  "deteccion_tipo": {
    ".spec.md": {
      "tipo": "especificacion_detallada",
      "accion": "/planea y luego /implanta",
      "descripcion": "Spec que requiere planning"
    },
    ".bug.md": {
      "tipo": "bug_report",
      "accion": "/corrige con TDD",
      "descripcion": "Bug report formal"
    }
  }
}
```

### Añadir Comando Custom al Justfile

```justfile
# Añadir a fabrica/justfile

# Deploy a staging
deploy-staging:
    @echo "🚀 Desplegando a staging..."
    @git push staging main
    @echo "✅ Desplegado en https://staging.ejemplo.com"
```

---

## 🆘 Soluciones Rápidas

```bash
# Just no funciona
choco install just

# Python módulo no encontrado
pip install watchdog

# Git no inicializado
git init && git add . && git commit -m "Initial"

# Vigilante no detecta
python fabrica/buzon_agente/vigilante.py --modo batch

# Ver logs del vigilante
cat fabrica/buzon_agente/vigilante.log
tail -f fabrica/buzon_agente/vigilante.log  # Seguir en tiempo real
```

---

**Última actualización:** 2026-02-13
**Ver más:** `fabrica/GUIA_COMPLETA.md` para documentación exhaustiva
