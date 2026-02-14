# PruebaInicializa4

**Extensión Chrome con Fábrica Agéntica v2.0**

---

## 📋 Descripción

[Personalizar esta sección con la descripción específica de tu proyecto]

Este proyecto incluye el sistema de **Fábrica Agéntica**, que proporciona:

- 🤖 Sistema de buzones automatizado para gestión de especificaciones
- 🌳 Desarrollo paralelo mediante git worktrees
- 🎓 Gestión de habilidades (skills) especializadas
- 📚 Documentación estructurada y actualizada
- ⚡ Comandos rápidos mediante `just`

---

## 🚀 Instalación

### Prerrequisitos

- **Git** - Control de versiones
- **Python 3.8+** - Scripts de automatización
- **Just** - Command runner
- **Node.js** (opcional) - Si el proyecto usa JavaScript/TypeScript

### Instalar Herramientas (Windows)

```powershell
# Instalar Chocolatey si no lo tienes
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Instalar herramientas
choco install git python just nodejs -y

# Verificar instalación
git --version
python --version
just --version
node --version
```

### Clonar e Inicializar

```bash
# Clonar repositorio
git clone [URL_DEL_REPOSITORIO]
cd PruebaInicializa4

# La estructura ya está inicializada con /inicializa
# Verificar sistema
just iniciar
```

---

## ⚡ Quick Start

### Ver Comandos Disponibles

```bash
just ayuda
```

### Flujo Básico de Trabajo

```bash
# 1. Crear especificación
echo "Implementar feature X" > fabrica/buzon_agente/entrada/feature_x.md

# 2. Procesar con vigilante
just automatizar

# 3. Ver expedientes creados
just estado-buzones

# 4. Trabajar en expediente
just ejecutar-buzon [ID_EXPEDIENTE]

# 5. Al terminar
just concluir [ID_EXPEDIENTE]
```

---

## 📚 Documentación

### Documentos Principales

- **[CLAUDE.md](CLAUDE.md)** - Hub central del proyecto
- **[docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md)** - Protocolo de trabajo para agentes
- **[fabrica/GUIA_COMPLETA.md](fabrica/GUIA_COMPLETA.md)** - Guía detallada de la fábrica
- **[fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md](fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md)** - Quick start de buzones

### Ver Índice Completo

```bash
cat docs/README.md
```

---

## 🏗️ Arquitectura

```
PruebaInicializa4/
├── fabrica/                  # Sistema de fábrica agéntica
│   ├── buzon_agente/        # Sistema de expedientes
│   ├── ramas_paralelas/     # Desarrollo paralelo
│   ├── deploy/              # Gestores
│   └── scripts/             # Automatización
├── docs/                     # Documentación
├── .claude/                  # Comandos y skills
└── src/                      # Código fuente
```

**Ver arquitectura detallada:** `cat CLAUDE.md`

---

## 🤖 Sistema de Buzones

El sistema de buzones permite gestionar trabajo mediante **expedientes**:

1. **Depositas** archivo en `fabrica/buzon_agente/entrada/`
2. **Vigilante detecta** y crea expediente
3. **Trabajas** siguiendo instrucciones generadas
4. **Archivas** al terminar

**Tipos soportados:**
- `.md` / `.txt` → Especificaciones
- `.log` → Logs de error
- `.email` → Feedback de usuarios

**Más información:** `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md`

---

## 🌳 Desarrollo Paralelo

Usa **git worktrees** para trabajar en múltiples features simultáneamente:

```bash
# Crear rama paralela
just paralelo "mi-feature"

# Trabajar
cd fabrica/ramas_paralelas/mi-feature
# ... desarrollar ...

# Limpiar al terminar
just paralelo-limpiar "mi-feature"
```

---

## 🎓 Habilidades (Skills)

Módulos de conocimiento especializado en `.claude/skills/`:

```bash
# Listar skills
just habilidades

# Reindexar
just habilidades-reindexar
```

---

## 🧪 Testing

[Personalizar según tu stack de testing]

```bash
# Ejecutar tests
just probar

# Ejemplo Python
pytest tests/

# Ejemplo Node
npm test
```

---

## 🛠️ Comandos Principales

```bash
just ayuda                    # Ver ayuda completa
just iniciar                  # Verificar sistema
just automatizar              # Procesar buzón de entrada
just automatizar-vigilar      # Vigilante en modo continuo
just paralelo [nombre]        # Crear rama paralela
just habilidades              # Listar skills
just diagnostico              # Diagnóstico del sistema
```

**Ver todos los comandos:** `just --list`

---

## 🆘 Troubleshooting

### Just no Funciona

```powershell
# Instalar
choco install just

# Verificar
just --version
```

### Git Worktree Falla

```bash
# Verificar que es repositorio git
git status

# Si no, inicializar
git init
git add .
git commit -m "Initial commit"
```

### Vigilante No Detecta Archivos

```bash
# Ver logs
cat fabrica/buzon_agente/vigilante.log

# Ejecutar manualmente
python fabrica/buzon_agente/vigilante.py --modo batch
```

**Más soluciones:** `docs/AGENT_GUIDE.md` (sección Troubleshooting)

---

## 🤝 Contribuir

[Personalizar según tus necesidades de contribución]

1. Fork del proyecto
2. Crear rama feature: `just paralelo "mi-feature"`
3. Commit cambios: `git commit -m "feat: mi feature"`
4. Push: `git push origin feature/mi-feature`
5. Crear Pull Request

**Protocolo completo:** `docs/AGENT_GUIDE.md`

---

## 📊 Estado del Proyecto

**Versión:** 0.1.0
**Estado:** Inicial (recién inicializado)
**Última actualización:** 2026-02-13

**Ver estado detallado:** `cat CLAUDE.md`

---

## 📄 Licencia

[Personalizar con tu licencia]

---

## 🔗 Enlaces

- **Documentación:** `docs/README.md`
- **Fábrica Agéntica:** `fabrica/GUIA_COMPLETA.md`
- **Protocolo Agentes:** `docs/AGENT_GUIDE.md`

---

## 👥 Contacto

[Personalizar con información de contacto]

---

*Este proyecto fue inicializado con `/inicializa` de Claude Code | Fábrica Agéntica v2.0*
