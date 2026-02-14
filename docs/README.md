# Documentación - PruebaInicializa4

**Índice completo de documentación del proyecto**
**Principio:** Hub and Spoke - Cada documento tiene responsabilidad única

---

## 📋 Documentos Principales

### 1. [AGENT_GUIDE.md](AGENT_GUIDE.md) ⭐
**Protocolo de trabajo para agentes (humanos y automatizados)**

**Contiene:**
- ✅ Flujo de trabajo en 3 pasos (antes/durante/después)
- ✅ Mapa de información ("¿Dónde encuentro X?")
- ✅ Convenciones del proyecto (código, git, docs)
- ✅ Workflows comunes (feature, bugfix, ADR)
- ✅ Troubleshooting completo

**Lee esto si:** Vas a trabajar en una tarea y necesitas saber el protocolo.

**Tamaño:** ~300 líneas

---

### 2. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) ⚡
**Referencia rápida de comandos con ejemplos prácticos**

**Contiene:**
- ✅ Todos los comandos Just con ejemplos
- ✅ Sistema de buzones (flujos completos)
- ✅ Desarrollo paralelo (worktrees)
- ✅ Scripts Python (gestores, automatización)
- ✅ Git workflows (feature, bugfix)
- ✅ Soluciones rápidas

**Lee esto si:** Necesitas recordar sintaxis de un comando específico.

**Tamaño:** ~400 líneas

---

### 3. [ARCHITECTURE.md](ARCHITECTURE.md) 🏗️
**Arquitectura técnica, decisiones y precauciones**

**Contiene:**
- ✅ Stack tecnológico detectado
- ✅ Estructura completa del proyecto
- ✅ Sistemas implementados (buzones, worktrees, skills)
- ✅ Decisiones arquitectónicas (ADR inline)
- ✅ Precauciones críticas (Git Bash, watchdog, etc.)
- ✅ Limitaciones conocidas
- ✅ Métricas técnicas

**Lee esto si:** Necesitas entender decisiones técnicas o resolver problemas de configuración.

**Tamaño:** ~400 líneas

---

## 📂 Otras Secciones de Documentación

### plans/
**Planes de implementación para features**

Cada plan documenta:
- Objetivo de la feature
- Archivos afectados
- Tareas a realizar (checklist)
- Estado actual (pendiente/en progreso/completado)

**Formato:** `PLAN_nombre_feature.md`

**Listar plans:**
```bash
ls docs/plans/
cat docs/plans/PLAN_nombre_feature.md
```

**Estado actual:** Sin plans (proyecto recién inicializado)

---

### adr/
**Architecture Decision Records (ADR)**

Documenta decisiones arquitectónicas importantes:
- Por qué se tomó la decisión
- Alternativas consideradas
- Consecuencias (pros/cons)
- Estado (Aceptada/Rechazada/Obsoleta)

**Formato estándar:** `ADR-XXX-titulo-decision.md`

**Listar ADRs:**
```bash
ls docs/adr/
cat docs/adr/ADR-001-decision.md
```

**Nota:** Decisiones iniciales están inline en `ARCHITECTURE.md`. Crear ADRs independientes para decisiones futuras importantes.

---

## 🗂️ Documentación Fuera de /docs

### ../CLAUDE.md (raíz)
**Hub ultra-ligero del proyecto (188 líneas)**

**Principio:** Índice central, no repositorio de información.

**Contiene:**
- Mapa de documentación (tabla "Necesitas X → Lee Y")
- Top 5 comandos más usados
- Estado actual resumido
- Arquitectura resumida (4 líneas)
- Protocolo de 3 pasos (resumen)
- Top 3 precauciones
- Métricas clave (tabla)
- Reglas universales (bullet points)

**Lee esto PRIMERO** al empezar en el proyecto.

---

### ../fabrica/GUIA_COMPLETA.md
**Guía exhaustiva del sistema de fábrica agéntica (600+ líneas)**

**Contiene:**
- Introducción y filosofía
- Arquitectura del sistema
- **Todos** los comandos disponibles (detallados)
- Sistema de buzones (completo)
- Desarrollo paralelo (worktrees)
- Gestión de habilidades
- Scripts de automatización
- Workflows completos (paso a paso)
- Configuración avanzada
- Troubleshooting detallado

**Lee esto si:** Necesitas documentación exhaustiva de la fábrica.

---

### ../fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md
**Quick start del sistema de buzones (200+ líneas)**

**Contiene:**
- Inicio rápido en 3 pasos
- Estructura de carpetas
- Tipos de archivos soportados
- Ejemplos prácticos (feature, bugfix, feedback)
- Comandos útiles
- Configuración avanzada
- Troubleshooting específico de buzones

**Lee esto si:** Vas a usar el sistema de buzones por primera vez.

---

### ../README.md (raíz)
**Descripción ejecutiva del proyecto**

**Contiene:**
- Descripción general
- Instalación (prerrequisitos, pasos)
- Quick start (flujo básico)
- Arquitectura resumida
- Comandos principales
- Troubleshooting básico
- Información de contacto/contribución

**Lee esto si:** Es tu primer contacto con el proyecto.

---

## 🔍 Búsqueda Rápida

### "Necesito saber cómo..."

| Tarea | Documento | Sección |
|---|---|---|
| Trabajar en una feature | `AGENT_GUIDE.md` | §Workflows |
| Ver comandos con ejemplos | `QUICK_REFERENCE.md` | Todo el doc |
| Usar sistema de buzones | `../fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` | §Quick start |
| Entender arquitectura | `ARCHITECTURE.md` | §Estructura, §Sistemas |
| Ver decisiones técnicas | `ARCHITECTURE.md` | §Decisiones |
| Resolver problema técnico | `ARCHITECTURE.md` | §Precauciones |
| Protocolo de trabajo | `AGENT_GUIDE.md` | §Protocolo 3 pasos |
| Ver todos los comandos | `../fabrica/GUIA_COMPLETA.md` | §Comandos |
| Entender expedientes | `../fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` | §Anatomía |
| Crear worktree | `QUICK_REFERENCE.md` | §Desarrollo Paralelo |

---

## ✍️ Contribuir a la Documentación

### Cuándo Actualizar Qué Documento

| Cambio | Documento a Actualizar |
|--------|----------------------|
| Cambio de fase/versión | `CLAUDE.md` §Estado Actual |
| Nueva feature implementada | `CLAUDE.md` §Métricas |
| Comando nuevo | `QUICK_REFERENCE.md` + `fabrica/GUIA_COMPLETA.md` |
| Decisión arquitectónica | `ARCHITECTURE.md` §Decisiones (o crear ADR) |
| Nuevo precaución | `ARCHITECTURE.md` §Precauciones |
| Cambio en protocolo | `AGENT_GUIDE.md` |
| Nueva skill | Reindexar con `just habilidades-reindexar` |
| Plan completado | Mover a `plans/archive/` |

### Principio de Actualización

> **"Documentación es código"** - Actualizar docs es parte del DoD (Definition of Done)

**Checklist al completar tarea:**
- [ ] Código implementado y testeado
- [ ] Documentación relevante actualizada
- [ ] CLAUDE.md actualizado si cambió estado/versión
- [ ] Plan marcado como completado (si aplica)
- [ ] ADR creado si decisión arquitectónica importante

---

## 📚 Convenciones de Documentación

### Formato Markdown

```markdown
# Título Principal

**Metadatos relevantes**

---

## Sección 1

Contenido...

### Subsección 1.1

Contenido...

---

## Sección 2

Contenido...

---

**Referencias:** [Links a otros docs]
```

### Estructura de Links

**✅ Correcto (relativo):**
```markdown
Ver [AGENT_GUIDE.md](AGENT_GUIDE.md)
Ver [CLAUDE.md](../CLAUDE.md)
```

**❌ Incorrecto (absoluto):**
```markdown
Ver [AGENT_GUIDE.md](Z:\...\docs\AGENT_GUIDE.md)
```

### Code Blocks con Lenguaje

**✅ Correcto:**
````markdown
```bash
just ayuda
```

```python
def funcion():
    pass
```
````

**❌ Incorrecto:**
````markdown
```
just ayuda
```
````

---

## 📊 Estado de la Documentación

### Documentos Existentes

- ✅ `AGENT_GUIDE.md` - Protocolo de agentes (300+ líneas)
- ✅ `QUICK_REFERENCE.md` - Comandos rápidos (400+ líneas)
- ✅ `ARCHITECTURE.md` - Arquitectura técnica (400+ líneas)
- ✅ `README.md` - Este índice
- ✅ `../CLAUDE.md` - Hub ligero (188 líneas)
- ✅ `../fabrica/GUIA_COMPLETA.md` - Guía exhaustiva (600+ líneas)
- ✅ `../fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md` - Quick start buzones
- ✅ `../README.md` - Descripción ejecutiva
- ⏳ `plans/` - Sin plans aún (proyecto inicial)
- ⏳ `adr/` - Sin ADRs independientes (inline en ARCHITECTURE.md)

**Total líneas documentación:** ~2,500+ líneas

### Coverage de Documentación

| Aspecto | Documentado | Ubicación |
|---------|-------------|-----------|
| Protocolo de trabajo | ✅ 100% | AGENT_GUIDE.md |
| Comandos disponibles | ✅ 100% | QUICK_REFERENCE.md, GUIA_COMPLETA.md |
| Arquitectura técnica | ✅ 100% | ARCHITECTURE.md |
| Sistema de buzones | ✅ 100% | GUIA_INICIO_RAPIDO.md |
| Desarrollo paralelo | ✅ 100% | QUICK_REFERENCE.md, GUIA_COMPLETA.md |
| Gestión de skills | ✅ 100% | GUIA_COMPLETA.md |
| Scripts de automatización | ✅ 100% | GUIA_COMPLETA.md |
| Troubleshooting | ✅ 100% | AGENT_GUIDE.md, ARCHITECTURE.md |
| Workflows completos | ✅ 100% | AGENT_GUIDE.md, QUICK_REFERENCE.md |

---

## 🔗 Enlaces Útiles

### Documentación Interna
- [CLAUDE.md](../CLAUDE.md) - Hub central (LEER PRIMERO)
- [AGENT_GUIDE.md](AGENT_GUIDE.md) - Protocolo de trabajo
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Comandos rápidos
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura técnica
- [Guía Completa Fábrica](../fabrica/GUIA_COMPLETA.md) - Sistema completo
- [README Principal](../README.md) - Descripción ejecutiva

### Comandos Útiles
```bash
# Ver ayuda
just ayuda

# Listar comandos
just --list

# Ver índice de documentación
cat docs/README.md

# Buscar en documentación
grep -r "keyword" docs/
```

---

**Última actualización:** 2026-02-13
**Principio:** Hub and Spoke - Responsabilidad única por documento
**Generado por:** `/inicializa` con optimización Hub Ultra-Ligero

---

*Este índice es un documento vivo. Si añades documentación nueva, actualiza este índice.*
