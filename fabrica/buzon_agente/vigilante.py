#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vigilante de Buzones v2.3.1 - Modelo Expedientes con Playbook Operacional
Automatiza la creación de expedientes desde archivos depositados en entrada/

Características v2.3.1:
- Clasificación inteligente por contenido (categoria, severidad, impacto, urgencia, complejidad)
- Decisión de camino estratégico: TICKET_RAPIDO | MINI_PROYECTO | PROYECTO_COMPLETO
- Generación de 10 plantillas de fases (00-09) según camino
- DICCIONARIO DE DOMINIO centralizado en docs/ (coordinado con CLAUDE.md)
- PROPUESTA_DICCIONARIO.md por expediente (para cambios al diccionario central)
- ESTADO.json para tracking
- INSTRUCCIONES_AGENTE.md como playbook operacional completo
- Lanzamiento automático de Claude con prompt detallado
- Logging detallado

Uso:
    python vigilante_v2.3.1.py --modo batch     # Procesar una vez
    python vigilante_v2.3.1.py --modo watch     # Monitoreo continuo
"""

import os
import sys
import time
import shutil
import json
import argparse
import re
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Intentar importar watchdog (solo necesario en modo watch)
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_BUZONES = RAIZ / "fabrica" / "buzon_agente"
DIR_ENTRADA = DIR_BUZONES / "entrada"
DIR_TALLER = DIR_BUZONES / "taller_activo"
DIR_ARCHIVO = DIR_BUZONES / "archivo_concluido"
DIR_DOCS = RAIZ / "docs"  # ⭐ Directorio para diccionario central
CONFIG_FILE = DIR_BUZONES / "buzones.json"
LOG_FILE = DIR_BUZONES / "vigilante.log"

# ==============================================================================
# SISTEMA DE LOGGING
# ==============================================================================

class Logger:
    """Logger simple con output a archivo y consola con colores"""

    def __init__(self, log_file: Path):
        self.log_file = log_file
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def _log(self, nivel: str, mensaje: str, color: str = ""):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        linea = f"[{timestamp}] {nivel}: {mensaje}"

        # Escribir a archivo
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(linea + "\n")

        # Mostrar en consola con color
        if color:
            print(f"{color}{linea}\033[0m")
        else:
            print(linea)

    def info(self, mensaje: str):
        self._log("INFO", mensaje)

    def warning(self, mensaje: str):
        self._log("WARNING", mensaje, "\033[93m")  # Amarillo

    def error(self, mensaje: str):
        self._log("ERROR", mensaje, "\033[91m")  # Rojo

    def success(self, mensaje: str):
        self._log("OK", mensaje, "\033[92m")  # Verde

# Instancia global del logger
logger = Logger(LOG_FILE)

# ==============================================================================
# GESTOR DE CONFIGURACIÓN
# ==============================================================================

class ConfiguracionBuzones:
    """Gestor de configuración de buzones"""

    DEFAULT_CONFIG = {
        "version": "2.3.1",
        "creado_en": datetime.now().isoformat(),
        "modelo": "expedientes_playbook_operacional",
        "rutas": {
            "entrada": "fabrica/buzon_agente/entrada/",
            "taller_activo": "fabrica/buzon_agente/taller_activo/",
            "archivo_concluido": "fabrica/buzon_agente/archivo_concluido/"
        },
        "deteccion_tipo": {
            ".md": {"tipo": "especificacion", "accion": "/implanta"},
            ".txt": {"tipo": "especificacion", "accion": "/implanta"},
            ".log": {"tipo": "error", "accion": "/corrige"},
            ".email": {"tipo": "feedback", "accion": "Transformar a especificacion"}
        },
        "clasificacion_inteligente": {
            "habilitado": True,
            "max_lineas_preview": 120,
            "keywords": {
                "urgente": ["urgente", "inmediato", "critical", "blocker"],
                "bug": ["bug", "error", "falla", "defecto", "issue"],
                "feature": ["feature", "funcionalidad", "implementar", "añadir"],
                "refactor": ["refactor", "mejorar", "optimizar", "reorganizar"]
            }
        },
        "generacion_fases": {
            "habilitado": True,
            "fases_disponibles": [
                "00_ESTRATEGIA", "01_ANALISIS", "02_INVESTIGACION", "03_PLAN",
                "04_DISENO", "05_RESULTADO", "06_VALIDACION", "07_DESPLIEGUE",
                "08_OPERACION", "09_EVOLUCION"
            ]
        },
        "diccionario_dominio": {
            "habilitado": True,
            "ubicacion": "docs/DICCIONARIO_DOMINIO.md",  # ⭐ Central en docs/
            "propuesta_por_expediente": True
        },
        "lanzamiento_automatico": {
            "habilitado": True,
            "comando": "claude",
            "opciones": "--dangerously-skip-permissions"
        },
        "vigilante": {
            "habilitado": True,
            "patrones_ignorar": [
                "*.tmp",
                "*.processing",
                ".DS_Store",
                "INSTRUCCIONES_AGENTE.md",
                "LEEME.md",
                "PROPUESTA_DICCIONARIO.md"
            ],
            "archivo_log": "fabrica/buzon_agente/vigilante.log"
        }
    }

    def __init__(self, config_file: Path):
        self.config_file = config_file
        self.config = self._cargar_config()

    def _cargar_config(self) -> dict:
        """Carga configuración desde archivo, o crea default"""
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error al cargar config, usando default: {e}")
                return self.DEFAULT_CONFIG
        else:
            # Crear config default
            self._guardar_config(self.DEFAULT_CONFIG)
            return self.DEFAULT_CONFIG

    def _guardar_config(self, config: dict):
        """Guarda configuración a archivo"""
        try:
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error al guardar config: {e}")

    def get(self, clave: str, default=None):
        """Obtiene valor de configuración con soporte para claves anidadas"""
        partes = clave.split(".")
        valor = self.config
        for parte in partes:
            if isinstance(valor, dict):
                valor = valor.get(parte, {})
            else:
                return default
        return valor if valor != {} else default

    def debe_ignorar(self, nombre_archivo: str) -> bool:
        """Verifica si un archivo debe ser ignorado"""
        patrones = self.config.get("vigilante", {}).get("patrones_ignorar", [])

        for patron in patrones:
            if patron.startswith("*"):
                extension = patron[1:]
                if nombre_archivo.endswith(extension):
                    return True
            elif nombre_archivo == patron:
                return True

        return False

    def obtener_tipo_archivo(self, extension: str) -> Dict[str, str]:
        """Obtiene tipo y acción para una extensión"""
        deteccion = self.config.get("deteccion_tipo", {})
        return deteccion.get(extension, {
            "tipo": "desconocido",
            "accion": "Revisar manualmente"
        })

# ==============================================================================
# CLASIFICADOR INTELIGENTE
# ==============================================================================

class ClasificadorInteligente:
    """Clasifica contenido por categoría, severidad, impacto, urgencia y complejidad"""

    def __init__(self, config: ConfiguracionBuzones):
        self.config = config
        self.habilitado = config.get("clasificacion_inteligente.habilitado", True)
        self.max_lineas = config.get("clasificacion_inteligente.max_lineas_preview", 120)

    def clasificar(self, contenido: str, extension: str) -> Dict:
        """Clasifica contenido y retorna metadatos"""

        if not self.habilitado:
            return self._clasificacion_default()

        # Analizar primeras líneas
        lineas = contenido.split("\n")[:self.max_lineas]
        texto = "\n".join(lineas).lower()

        # Detectar categoria
        categoria = self._detectar_categoria(texto)

        # Detectar severidad
        severidad = self._detectar_severidad(texto)

        # Detectar impacto
        impacto = self._detectar_impacto(texto, extension)

        # Detectar urgencia
        urgencia = self._detectar_urgencia(texto)

        # Detectar complejidad
        complejidad = self._detectar_complejidad(texto, lineas)

        return {
            "categoria": categoria,
            "severidad": severidad,
            "impacto": impacto,
            "urgencia": urgencia,
            "complejidad": complejidad
        }

    def _clasificacion_default(self) -> Dict:
        """Clasificación por defecto cuando está deshabilitado"""
        return {
            "categoria": "PROYECTO",
            "severidad": "MEDIA",
            "impacto": "MEDIO",
            "urgencia": "NORMAL",
            "complejidad": "STANDARD"
        }

    def _detectar_categoria(self, texto: str) -> str:
        """Detecta categoría: BUG | FEATURE | REFACTOR | PROYECTO"""
        if any(kw in texto for kw in ["bug", "error", "falla", "defecto", "issue", "crítico"]):
            return "BUG"
        elif any(kw in texto for kw in ["feature", "funcionalidad", "añadir", "agregar", "nueva"]):
            return "FEATURE"
        elif any(kw in texto for kw in ["refactor", "mejorar", "optimizar", "reorganizar", "limpiar"]):
            return "REFACTOR"
        else:
            return "PROYECTO"

    def _detectar_severidad(self, texto: str) -> str:
        """Detecta severidad: CRITICA | ALTA | MEDIA | BAJA"""
        if any(kw in texto for kw in ["crítico", "blocker", "severo", "grave", "production"]):
            return "CRITICA"
        elif any(kw in texto for kw in ["urgente", "importante", "prioridad alta", "high"]):
            return "ALTA"
        elif any(kw in texto for kw in ["menor", "trivial", "low", "baja prioridad"]):
            return "BAJA"
        else:
            return "MEDIA"

    def _detectar_impacto(self, texto: str, extension: str) -> str:
        """Detecta impacto: ALTO | MEDIO | BAJO"""
        # Archivos .log suelen ser impacto alto (errores en producción)
        if extension == ".log":
            return "ALTO"

        if any(kw in texto for kw in ["sistema completo", "toda la aplicación", "todos los usuarios"]):
            return "ALTO"
        elif any(kw in texto for kw in ["módulo específico", "algunos usuarios", "componente"]):
            return "MEDIO"
        else:
            return "BAJO"

    def _detectar_urgencia(self, texto: str) -> str:
        """Detecta urgencia: INMEDIATA | ALTA | NORMAL | BAJA"""
        if any(kw in texto for kw in ["inmediato", "ahora", "urgente", "hoy mismo"]):
            return "INMEDIATA"
        elif any(kw in texto for kw in ["esta semana", "pronto", "próximamente"]):
            return "ALTA"
        elif any(kw in texto for kw in ["futuro", "cuando sea posible", "backlog"]):
            return "BAJA"
        else:
            return "NORMAL"

    def _detectar_complejidad(self, texto: str, lineas: List[str]) -> str:
        """Detecta complejidad: MINI | STANDARD | EPIC"""
        # Heurística: longitud del texto + keywords
        num_lineas = len([l for l in lineas if l.strip()])

        if num_lineas < 10:
            return "MINI"
        elif num_lineas > 50 or any(kw in texto for kw in ["arquitectura", "múltiples módulos", "integración completa"]):
            return "EPIC"
        else:
            return "STANDARD"

# ==============================================================================
# DECISOR DE CAMINO ESTRATÉGICO
# ==============================================================================

class DecisorCamino:
    """Decide camino estratégico según clasificación"""

    CAMINOS = {
        "TICKET_RAPIDO": {
            "descripcion": "Tickets rápidos (bugs menores, fixes simples)",
            "fases": ["00_ESTRATEGIA", "03_PLAN", "05_RESULTADO", "06_VALIDACION"]
        },
        "MINI_PROYECTO": {
            "descripcion": "Proyectos pequeños (features simples, refactors)",
            "fases": ["00_ESTRATEGIA", "01_ANALISIS", "03_PLAN", "04_DISENO",
                     "05_RESULTADO", "06_VALIDACION", "07_DESPLIEGUE", "08_OPERACION"]
        },
        "PROYECTO_COMPLETO": {
            "descripcion": "Proyectos complejos (arquitectura, integraciones)",
            "fases": ["00_ESTRATEGIA", "01_ANALISIS", "02_INVESTIGACION", "03_PLAN",
                     "04_DISENO", "05_RESULTADO", "06_VALIDACION", "07_DESPLIEGUE",
                     "08_OPERACION", "09_EVOLUCION"]
        }
    }

    def decidir(self, clasificacion: Dict) -> Tuple[str, str]:
        """Decide camino y retorna (camino, justificacion)"""

        complejidad = clasificacion.get("complejidad", "STANDARD")
        categoria = clasificacion.get("categoria", "PROYECTO")
        severidad = clasificacion.get("severidad", "MEDIA")

        # TICKET_RAPIDO: bugs críticos simples o fixes urgentes
        if categoria == "BUG" and complejidad == "MINI":
            return ("TICKET_RAPIDO",
                    "Bug simple que requiere fix rápido sin análisis extenso")

        # PROYECTO_COMPLETO: complejidad EPIC o proyectos de arquitectura
        if complejidad == "EPIC" or categoria == "PROYECTO":
            return ("PROYECTO_COMPLETO",
                    "Proyecto complejo que requiere análisis profundo y todas las fases")

        # MINI_PROYECTO: resto de casos (features, refactors medianos)
        return ("MINI_PROYECTO",
                "Feature o refactor de complejidad media con fases estándar")

    def obtener_fases(self, camino: str) -> List[str]:
        """Obtiene lista de fases para un camino"""
        return self.CAMINOS.get(camino, {}).get("fases", [])

# ==============================================================================
# GENERADOR DE PLANTILLAS DE FASES
# ==============================================================================

class GeneradorFases:
    """Genera archivos de plantillas para cada fase"""

    PLANTILLAS = {
        "00_ESTRATEGIA": """# 00 - ESTRATEGIA

**Fase:** Definición Estratégica
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Definir la estrategia general del expediente: qué se quiere lograr, por qué es importante, y cuál es el enfoque de alto nivel.

---

## 📥 ENTRADAS

- Archivo principal del expediente: `{archivo_principal}`
- Clasificación automática:
  - Categoría: {categoria}
  - Severidad: {severidad}
  - Urgencia: {urgencia}

---

## 📤 SALIDAS

- [ ] Objetivo claro del expediente
- [ ] Criterios de éxito definidos
- [ ] Restricciones identificadas
- [ ] Riesgos principales listados

---

## ✅ CHECKLIST

- [ ] Objetivo documentado (qué y por qué)
- [ ] Alcance definido (qué SÍ y qué NO)
- [ ] Stakeholders identificados
- [ ] Restricciones técnicas/negocio claras
- [ ] Riesgos principales evaluados

---

## 📝 CONTENIDO

### Objetivo
[Qué se quiere lograr]

### Criterios de Éxito
1. [Criterio 1]
2. [Criterio 2]

### Restricciones
- [Restricción 1]
- [Restricción 2]

### Riesgos
- [Riesgo 1 + mitigación]
- [Riesgo 2 + mitigación]

---

**Estado:** {estado_fase}
""",

        "01_ANALISIS": """# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** {expediente}
**Camino:** {camino}

---

## OBJETIVO

Leer `{archivo_principal}` y documentar: situación actual, situación deseada, historias de usuario con criterios de aceptación, y análisis de riesgos.

---

## ENTRADAS

- 00_ESTRATEGIA.md (objetivo y alcance)
- Archivo principal: `{archivo_principal}`
- Código existente relacionado (si aplica)

---

## 1.1 Resumen Ejecutivo

[Descripción en 3-5 líneas]

## 1.2 Situación Actual (AS-IS)

[Cómo funciona ahora / qué existe / qué falta]

## 1.3 Situación Deseada (TO-BE)

[Cómo debería funcionar al completar este expediente]

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| [Aspecto 1] | [Estado actual] | [Estado deseado] | [Qué falta] |

## 1.5 Historias de Usuario

### HU-1: [Título]
```
COMO [rol/persona]
QUIERO [acción/funcionalidad]
PARA [beneficio/valor de negocio]
```

**Criterios de Aceptación:**
- CA-1.1 (caso feliz):
  DADO [contexto] CUANDO [acción] ENTONCES [resultado]
- CA-1.2 (caso error):
  DADO [contexto] CUANDO [acción inválida] ENTONCES [manejo error]
- CA-1.3 (caso borde):
  DADO [contexto límite] CUANDO [acción] ENTONCES [resultado]

### HU-2: [Título]
(mismo formato, una HU principal + secundarias si el alcance lo requiere)

## 1.6 Requisitos No Funcionales

- Rendimiento: [tiempos respuesta, límites]
- Seguridad: [permisos, validaciones]
- Compatibilidad: [navegadores, dispositivos]
- Escalabilidad: [volumen esperado]

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| [R1] | Alta/Media/Baja | Alto/Medio/Bajo | [Cómo mitigar] |

## 1.8 Dependencias

- Módulos/HUs de los que depende: [listar]
- Módulos/HUs que dependen de esto: [listar]

## 1.9 Preguntas Abiertas

- [Listar ambigüedades o decisiones pendientes]

---

## >>> PUERTA DE VALIDACION 1 <<<

NO avanzar a Fase 2 hasta verificar:
- [ ] AS-IS y TO-BE documentados
- [ ] Todas las HU tienen formato COMO/QUIERO/PARA
- [ ] Cada HU tiene mínimo 3 criterios de aceptación (caso feliz + error + borde)
- [ ] Riesgos identificados con mitigación
- [ ] Si hay preguntas abiertas: PARAR y consultar

---

**Estado:** {estado_fase}
""",

        "02_INVESTIGACION": """# 02 - INVESTIGACIÓN

**Fase:** Investigación del Codebase + Opciones Técnicas
**Expediente:** {expediente}
**Camino:** {camino}

---

## OBJETIVO

Investigar el codebase existente (mapa impacto, patrones, tests) Y evaluar opciones técnicas para decidir el enfoque.

---

## ENTRADAS

- 01_ANALISIS.md (HUs, requisitos, GAP analysis)
- Código existente del proyecto
- Arquitectura actual del sistema

---

## 2.1 Mapa de Impacto

Archivos/módulos afectados (con RUTAS EXACTAS):

| Archivo | Líneas afectadas | Tipo cambio | Descripción |
|---------|-----------------|-------------|-------------|
| src/[ruta exacta] | [N-M] | crear/modificar/eliminar | [Qué cambia] |

Líneas de código estimadas a modificar/crear: [N]

## 2.2 Patrones Existentes

Patrones del codebase a reutilizar (con ejemplo de código real):
```
[Pegar ejemplo real del codebase que se reutilizará]
```

Antipatrones a evitar:
- [Antipatrón 1 + por qué evitarlo]

## 2.3 Análisis de Tests Existentes

- Tests relacionados que ya existen: [listar con rutas]
- Cobertura actual de la zona afectada: [%]
- Tests que podrían romperse: [listar]

## 2.4 Spike Técnico (si hay incertidumbre)

- Prototipo mínimo para validar viabilidad
- Resultado: viable / no viable / viable con restricciones

## 2.5 Opciones Evaluadas

### Opción 1: [Nombre]
- **Descripción:** [Qué es y cómo funciona]
- **Pros:** [Ventajas]
- **Cons:** [Desventajas]
- **Complejidad:** S/M/L

### Opción 2: [Nombre]
- **Descripción:** [Qué es]
- **Pros:** [Ventajas]
- **Cons:** [Desventajas]
- **Complejidad:** S/M/L

### Opción 3: [Nombre]
[Mismo formato]

## 2.6 Criterios de Decisión

| Criterio | Peso | Opción 1 | Opción 2 | Opción 3 |
|----------|------|----------|----------|----------|
| [Criterio 1] | [Alto/Medio/Bajo] | [Puntuación] | [Puntuación] | [Puntuación] |

## 2.7 Decisión (ADR)

**Opción seleccionada:** [X]
**Justificación:** [Por qué esta opción y no las demás]

---

## >>> PUERTA DE VALIDACION 2 <<<

NO avanzar a Fase 3 hasta verificar:
- [ ] Mapa de impacto completo (archivos + rutas exactas)
- [ ] Patrones existentes identificados con código real
- [ ] Tests existentes analizados (qué podría romperse)
- [ ] Spike resuelto (si aplicó)
- [ ] Al menos 2 opciones evaluadas con pros/cons
- [ ] Decisión justificada

---

**Estado:** {estado_fase}
""",

        "03_PLAN": """# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación Detallada
**Expediente:** {expediente}
**Camino:** {camino}

---

## OBJETIVO

Crear plan detallado con desglose de tareas, estrategia TDD y Definition of Done verificable.

---

## ENTRADAS

- 00_ESTRATEGIA.md (objetivo y alcance)
- 01_ANALISIS.md (HUs y criterios de aceptación)
- 02_INVESTIGACION.md (decisión técnica + mapa impacto)

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos afectados | Entregable |
|---|-------|-------------|-------------|-------------------|------------|
| 1 | [Tarea] | S/M/L | - | [rutas] | [Resultado] |
| 2 | [Tarea] | S/M/L | 1 | [rutas] | [Resultado] |

Complejidad: S (< 30 min) / M (30 min - 2h) / L (> 2h)

## 3.2 Orden de Ejecución

1. Tarea [X] → Tarea [Y] → Tarea [Z]
2. [Paralelismos posibles]

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**
1. test_[nombre]: [qué valida] → archivo: tests/[ruta]
2. test_[nombre]: [qué valida] → archivo: tests/[ruta]

**Orden de implementación para hacerlos pasar (Green):**
1. [Módulo/archivo] - [qué implementar]
2. [Módulo/archivo] - [qué implementar]

**Refactorizaciones previstas (Refactor):**
- [Mejora 1]

## 3.4 Plan de Testing

- **Unit tests:** [qué testear, dónde]
- **Integration tests:** [qué testear, dónde]
- **E2E tests:** [qué testear, dónde] (si aplica)

## 3.5 Estrategia de Migración de Datos (si aplica)

- Migraciones necesarias: [listar]
- Rollback plan: [cómo revertir]

## 3.6 Definition of Done (DoD)

Checklist específica para ESTE expediente (derivada de criterios de aceptación):
- [ ] CA-1.1: [criterio verificable derivado de HU-1]
- [ ] CA-1.2: [criterio verificable derivado de HU-1]
- [ ] CA-1.3: [criterio verificable derivado de HU-1]
- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Sin regresiones en tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Documentación actualizada

---

## >>> PUERTA DE VALIDACION 3 <<<

NO avanzar a Fase 4/5 hasta verificar:
- [ ] Todas las tareas tienen complejidad, dependencia y archivos
- [ ] Estrategia TDD definida (qué tests primero)
- [ ] Plan de testing completo
- [ ] DoD completo y verificable (cada item medible)

---

**Estado:** {estado_fase}
""",

        "04_DISENO": """# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Diseñar la solución técnica completa: arquitectura, estructura de datos, interfaces, flujos.

---

## 📥 ENTRADAS

- 03_PLAN.md (plan de implementación)
- Código existente del sistema

---

## 📤 SALIDAS

- [ ] Diagrama de arquitectura
- [ ] Modelo de datos (si aplica)
- [ ] Interfaces definidas (APIs, funciones)
- [ ] Flujos de ejecución documentados

---

## ✅ CHECKLIST

- [ ] Arquitectura clara y documentada
- [ ] Todos los nombres en DICCIONARIO_DOMINIO.md ⚠️
- [ ] Interfaces públicas definidas
- [ ] Flujos críticos diagramados
- [ ] Validaciones especificadas

---

## 📝 CONTENIDO

### Arquitectura
[Diagrama o descripción de componentes]

### Modelo de Datos
**IMPORTANTE:** Consultar `docs/DICCIONARIO_DOMINIO.md` antes de crear nombres nuevos.

#### Tablas/Entidades
- `nombre_tabla_1` (según diccionario)
  - Campos: [lista]

### Interfaces

#### API/Funciones Públicas
```python
def funcion_principal(param1: tipo) -> tipo:
    \"\"\"Descripción\"\"\"
    pass
```

### Flujos de Ejecución
1. Usuario hace X
2. Sistema valida Y
3. Sistema ejecuta Z
4. Sistema retorna resultado

---

**Estado:** {estado_fase}
""",

        "05_RESULTADO": """# 05 - RESULTADO (IMPLEMENTACIÓN TDD)

**Fase:** Implementación con TDD
**Expediente:** {expediente}
**Camino:** {camino}

---

## OBJETIVO

Ejecutar el plan de 03_PLAN.md siguiendo TDD estricto.
ESCRIBIR CODIGO REAL en src/ (NO solo documentar).

---

## ENTRADAS

- 03_PLAN.md (tareas, estrategia TDD y DoD)
- 04_DISENO.md (diseño técnico, modelos, interfaces)
- docs/DICCIONARIO_DOMINIO.md (nombres canónicos)

---

## PASO 1: TESTS (Red)

Escribir tests que FALLEN (aún no hay implementación):

| # | Test | Archivo | Estado |
|---|------|---------|--------|
| 1 | [Descripción test] | tests/test_xxx.py | RED |
| 2 | [Descripción test] | tests/test_xxx.py | RED |

```bash
# Ejecutar tests (deben fallar)
pytest tests/ -v --tb=short
# Resultado esperado: X failed
```

---

## PASO 2: CÓDIGO (Green)

Escribir código MÍNIMO para que los tests pasen:

| # | Archivo | Acción | Líneas | Descripción |
|---|---------|--------|--------|-------------|
| 1 | src/xxx.py | creado | [N] | [Qué hace] |
| 2 | src/xxx.py | modificado | [N] | [Qué cambió] |

```bash
# Ejecutar tests (deben pasar)
pytest tests/ -v --tb=short
# Resultado esperado: X passed, 0 failed
```

---

## PASO 3: REFACTOR

Mejoras aplicadas post-green (manteniendo tests en verde):
- [Mejora 1: qué se mejoró y por qué]
- [Mejora 2: qué se mejoró y por qué]

```bash
# Verificar que siguen pasando después de refactor
pytest tests/ -v --tb=short
# Resultado: X passed, 0 failed
```

---

## RESULTADO FINAL

### Archivos Creados/Modificados
| Archivo | Acción | Líneas | Descripción |
|---------|--------|--------|-------------|
| src/xxx.py | creado | [N] | [Qué hace] |
| tests/test_xxx.py | creado | [N] | [Qué testea] |

### Resultados de Tests
- **Unitarios:** [X] passed, [Y] failed
- **Integración:** [X] passed, [Y] failed
- **Cobertura:** [%]

### Ejecución Real
```
[PEGAR SALIDA REAL DE PYTEST AQUÍ - NO INVENTAR]
```

### Notas de Implementación
[Decisiones tomadas durante implementación, desviaciones del plan, problemas encontrados y cómo se resolvieron]

---

## >>> PUERTA DE VALIDACION 5 <<<

NO avanzar a Fase 6 hasta verificar:
- [ ] TODOS los tests nuevos pasan (salida real pegada arriba)
- [ ] CERO tests existentes rotos
- [ ] Código escrito en src/ (NO solo documentación)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] PROPUESTA_DICCIONARIO.md actualizada (si hay nombres nuevos)
- [ ] Si hay fallos: corregir ANTES de avanzar

---

**Estado:** {estado_fase}
""",

        "06_VALIDACION": """# 06 - VALIDACIÓN

**Fase:** Validación y QA
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Validar que la implementación cumple todos los requisitos y está lista para despliegue.

---

## 📥 ENTRADAS

- 05_RESULTADO.md (implementación completada)
- 01_ANALISIS.md (requisitos originales)
- 00_ESTRATEGIA.md (criterios de éxito)

---

## 📤 SALIDAS

- [ ] Todos los requisitos verificados
- [ ] Tests E2E ejecutados
- [ ] Performance validada
- [ ] Security scan ejecutado

---

## ✅ CHECKLIST

- [ ] Requisitos funcionales: 100% cumplidos
- [ ] Requisitos no funcionales: validados
- [ ] Tests: 100% pasando
- [ ] Performance: dentro de SLAs
- [ ] Security: sin vulnerabilidades críticas
- [ ] Code review: aprobado

---

## 📝 CONTENIDO

### Validación de Requisitos

#### Requisitos Funcionales
- [RF-1]: ✅ Cumplido
- [RF-2]: ✅ Cumplido

#### Requisitos No Funcionales
- Performance: ✅ P95 < Xms
- Security: ✅ Sin vulnerabilidades
- Escalabilidad: ✅ Soporta Y usuarios

### Tests E2E
```bash
# Ejecutar:
npm run test:e2e

# Resultado:
✅ X/X tests passing
```

### Issues Encontrados
[Lista de issues menores encontrados + resolución]

---

**Estado:** {estado_fase}
""",

        "07_DESPLIEGUE": """# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Desplegar la solución a producción de forma segura y controlada.

---

## 📥 ENTRADAS

- 06_VALIDACION.md (validación completada)
- Código listo en rama

---

## 📤 SALIDAS

- [ ] Código mergeado a main
- [ ] Desplegado en producción
- [ ] Monitoreo activado
- [ ] Rollback plan listo

---

## ✅ CHECKLIST

- [ ] PR creado y aprobado
- [ ] CI/CD pipeline: green
- [ ] Backup realizado (si aplica)
- [ ] Deployment ejecutado
- [ ] Smoke tests: passing
- [ ] Rollback plan documentado

---

## 📝 CONTENIDO

### Pre-Deployment

#### PR
- **Número:** #XXX
- **Estado:** ✅ Aprobado
- **Reviewers:** [Nombres]

#### CI/CD
```bash
✅ Build: SUCCESS
✅ Tests: PASS
✅ Linter: PASS
```

### Deployment

#### Comando
```bash
# Ejecutado:
just deploy production
```

#### Resultado
- **Fecha:** YYYY-MM-DD HH:MM
- **Versión:** vX.Y.Z
- **Estado:** ✅ SUCCESS

### Post-Deployment

#### Smoke Tests
- [Test 1]: ✅ PASS
- [Test 2]: ✅ PASS

#### Rollback Plan
```bash
# Si algo falla:
just rollback vX.Y.Z-1
```

---

**Estado:** {estado_fase}
""",

        "08_OPERACION": """# 08 - OPERACIÓN

**Fase:** Monitoreo y Soporte
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Monitorear el sistema en producción y dar soporte durante el período de estabilización.

---

## 📥 ENTRADAS

- 07_DESPLIEGUE.md (deployment completado)
- Monitoreo configurado

---

## 📤 SALIDAS

- [ ] Sistema estable (X días sin incidentes)
- [ ] Métricas dentro de rangos
- [ ] Documentación usuario actualizada
- [ ] Incidentes resueltos

---

## ✅ CHECKLIST

- [ ] Monitoreo activo y funcionando
- [ ] Métricas clave en verde
- [ ] 0 incidentes críticos
- [ ] Documentación usuario completa
- [ ] Equipo entrenado (si aplica)

---

## 📝 CONTENIDO

### Monitoreo

#### Métricas Clave
- **Uptime:** 99.X%
- **Response time P95:** Xms
- **Error rate:** 0.X%

#### Alertas Configuradas
- [Alerta 1]: threshold + acción
- [Alerta 2]: threshold + acción

### Incidentes

#### Incidente 1
- **Fecha:** YYYY-MM-DD
- **Severidad:** [Baja/Media/Alta]
- **Descripción:** [Qué pasó]
- **Resolución:** [Cómo se resolvió]

### Documentación Usuario
- [Link a docs actualizadas]

---

**Estado:** {estado_fase}
""",

        "09_EVOLUCION": """# 09 - EVOLUCIÓN

**Fase:** Mejora Continua
**Expediente:** {expediente}
**Camino:** {camino}

---

## 🎯 OBJETIVO

Identificar oportunidades de mejora y planear evolución futura del sistema.

---

## 📥 ENTRADAS

- 08_OPERACION.md (métricas de operación)
- Feedback de usuarios
- Bugs reportados

---

## 📤 SALIDAS

- [ ] Retrospectiva completada
- [ ] Lecciones aprendidas documentadas
- [ ] Mejoras futuras priorizadas
- [ ] Roadmap actualizado

---

## ✅ CHECKLIST

- [ ] Retrospectiva realizada
- [ ] Lecciones aprendidas capturadas
- [ ] Mejoras técnicas identificadas
- [ ] Mejoras funcionales identificadas
- [ ] Próximos pasos definidos

---

## 📝 CONTENIDO

### Retrospectiva

#### ✅ Qué funcionó bien
- [Item 1]
- [Item 2]

#### ❌ Qué mejorar
- [Item 1]
- [Item 2]

#### 💡 Lecciones Aprendidas
1. [Lección 1]
2. [Lección 2]

### Mejoras Futuras

#### Técnicas
- [Mejora técnica 1] - Prioridad: Alta/Media/Baja
- [Mejora técnica 2]

#### Funcionales
- [Mejora funcional 1] - Prioridad: Alta/Media/Baja
- [Mejora funcional 2]

### Próximos Pasos
1. [Acción 1]
2. [Acción 2]

---

**Estado:** {estado_fase}
"""
    }

    def __init__(self, config: ConfiguracionBuzones):
        self.config = config
        self.habilitado = config.get("generacion_fases.habilitado", True)

    def generar(self, carpeta_expediente: Path, fases: List[str], metadatos: Dict):
        """Genera archivos de fases en el expediente"""

        if not self.habilitado:
            return

        for fase in fases:
            self._generar_fase(carpeta_expediente, fase, metadatos)

    def _generar_fase(self, carpeta_expediente: Path, fase: str, metadatos: Dict):
        """Genera un archivo de fase específico"""

        archivo_fase = carpeta_expediente / f"{fase}.md"

        # No sobrescribir si ya existe
        if archivo_fase.exists():
            return

        # Obtener plantilla
        plantilla = self.PLANTILLAS.get(fase, "# {fase}\n\nPlantilla no disponible.")

        # Reemplazar variables
        contenido = plantilla.format(
            expediente=metadatos.get("expediente", ""),
            camino=metadatos.get("camino", ""),
            categoria=metadatos.get("categoria", ""),
            severidad=metadatos.get("severidad", ""),
            urgencia=metadatos.get("urgencia", ""),
            archivo_principal=metadatos.get("archivo_principal", ""),
            estado_fase="NO INICIADO"
        )

        # Escribir archivo
        try:
            with open(archivo_fase, "w", encoding="utf-8") as f:
                f.write(contenido)
            logger.info(f"    Fase generada: {fase}.md")
        except Exception as e:
            logger.error(f"Error al generar fase {fase}: {e}")

# ==============================================================================
# GESTOR DE DICCIONARIO DE DOMINIO (CENTRAL EN docs/)
# ==============================================================================

class GestorDiccionario:
    """Gestiona diccionario central y propuestas de cambios"""

    def __init__(self, config: ConfiguracionBuzones):
        self.config = config
        self.habilitado = config.get("diccionario_dominio.habilitado", True)
        self.ubicacion_central = config.get("diccionario_dominio.ubicacion", "docs/DICCIONARIO_DOMINIO.md")

    def inicializar_diccionario_central(self, raiz_proyecto: Path):
        """Crea diccionario central en docs/ si no existe (solo primera vez)"""

        if not self.habilitado:
            return

        archivo_dict = raiz_proyecto / self.ubicacion_central

        if archivo_dict.exists():
            logger.info("Diccionario central ya existe en docs/")
            return

        # Crear directorio docs/ si no existe
        archivo_dict.parent.mkdir(parents=True, exist_ok=True)

        contenido = f"""# DICCIONARIO DE DOMINIO

**Propósito:** Fuente única de verdad para nombres de tablas, campos, variables, estados y enums del proyecto.

**Ubicación:** Este archivo es ÚNICO y está en `docs/` como parte del sistema Hub and Spoke de documentación.

**Coordinación:** Todos los expedientes deben:
1. **Consultar este archivo** antes de crear nombres nuevos
2. **Proponer cambios** en `PROPUESTA_DICCIONARIO.md` de su expediente
3. **Actualizar este archivo central** una vez aprobado el cambio

---

## 1. Convenciones de Nombres

### Tablas/Entidades
- **snake_case** minúsculas
- Plural para colecciones: `usuarios`, `pedidos`
- Singular para entidades: `configuracion`, `sistema`

### Campos/Atributos
- **snake_case** minúsculas
- Descriptivos y autoexplicativos
- `id` siempre como clave primaria
- Timestamps: `created_at`, `updated_at`, `deleted_at`

### Estados/Enums
- **UPPER_CASE** con guiones bajos
- Descriptivos del estado: `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`
- Agrupados por dominio: `ESTADO_PEDIDO_*`, `ESTADO_USUARIO_*`

### Variables/Funciones (código)
- **camelCase** para JavaScript/TypeScript
- **snake_case** para Python
- Nombres verbos para funciones: `obtenerUsuario()`, `validarEmail()`
- Nombres sustantivos para variables: `usuario`, `totalPedidos`

---

## 2. Tablas/Entidades

*(Agregar aquí las tablas según se vayan definiendo en expedientes)*

### Ejemplo: `usuarios`
- **Descripción:** Almacena información de usuarios del sistema
- **Campos:**
  - `id` (uuid, PK)
  - `email` (varchar(255), unique, not null)
  - `nombre` (varchar(100))
  - `created_at` (timestamp, not null)
  - `updated_at` (timestamp, not null)
- **Índices:**
  - PK en `id`
  - UNIQUE en `email`
- **Relaciones:**
  - `usuarios.id` ← `pedidos.usuario_id` (1:N)

---

## 3. Estados/Enums

*(Agregar aquí los enums según se vayan definiendo)*

### Ejemplo: Estados de Pedido
```python
ESTADO_PEDIDO_PENDIENTE = "PENDIENTE"
ESTADO_PEDIDO_EN_PROCESO = "EN_PROCESO"
ESTADO_PEDIDO_COMPLETADO = "COMPLETADO"
ESTADO_PEDIDO_CANCELADO = "CANCELADO"
```

---

## 4. Validaciones

*(Agregar aquí reglas de validación comunes)*

### Ejemplo: Email
- Formato: RFC 5322 compliant
- Longitud: 5-255 caracteres
- Único en sistema

---

## 5. Glosario de Negocio

*(Términos del dominio de negocio con su significado canónico)*

- **Usuario:** Persona registrada en el sistema con credenciales
- **Pedido:** Solicitud de compra realizada por un usuario
- **[Agregar más términos según proyecto]**

---

## 6. Historial de Cambios

*(Registrar aquí cada cambio al diccionario con fecha y expediente origen)*

- **{datetime.now().strftime("%Y-%m-%d")}:** Diccionario inicial creado por vigilante_v2.3.1.py

---

**Última actualización:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Mantenido por:** Coordinación entre expedientes
**Consultas:** Antes de crear CUALQUIER nombre nuevo en código/diseño
"""

        try:
            with open(archivo_dict, "w", encoding="utf-8") as f:
                f.write(contenido)
            logger.success(f"✅ Diccionario central creado en {self.ubicacion_central}")
        except Exception as e:
            logger.error(f"Error al crear diccionario central: {e}")

    def generar_propuesta_expediente(self, carpeta_expediente: Path, metadatos: Dict):
        """Genera plantilla PROPUESTA_DICCIONARIO.md en expediente"""

        if not self.habilitado:
            return

        archivo_propuesta = carpeta_expediente / "PROPUESTA_DICCIONARIO.md"

        # No sobrescribir
        if archivo_propuesta.exists():
            return

        expediente = metadatos.get("expediente", "")

        contenido = f"""# PROPUESTA DE CAMBIO AL DICCIONARIO DE DOMINIO

**Expediente:** {expediente}
**Fecha:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Autor:** Claude / Usuario
**Estado:** PENDIENTE

---

## 📖 INSTRUCCIONES

**REGLA FUNDAMENTAL:** Ningún nombre nuevo de tabla/campo/variable/estado puede aparecer en el código sin estar registrado en el diccionario central primero.

**PROCESO OBLIGATORIO:**

1. **Antes de crear nombres nuevos:**
   - Abrir `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
   - Verificar que el nombre NO existe
   - Documentar aquí el cambio propuesto

2. **Documentar cambio:**
   - Nombre completo (tabla, campo, enum, etc.)
   - Tipo de dato / tipo de cambio
   - Validaciones / restricciones
   - Descripción clara del propósito

3. **Aprobar cambio:**
   - Usuario/arquitecto revisa esta propuesta
   - Usuario actualiza `docs/DICCIONARIO_DOMINIO.md` manualmente
   - Usuario registra en historial de cambios del diccionario
   - Usuario marca este cambio como APROBADO

4. **Solo entonces implementar en código**

---

## 💡 EJEMPLOS

### Ejemplo: Nueva Tabla

**Nombre:** `nombre_tabla`

**Descripción:** [Para qué se usa]

**Campos:**
- `id` (uuid, PK)
- `campo_1` (tipo, restricciones)
- `campo_2` (tipo, restricciones)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

**Índices:**
- PK en `id`
- INDEX en `campo_1`

**Relaciones:**
- FK a `tabla_existente.id`

---

### Ejemplo: Nuevo Enum/Estado

**Nombre:** `ENUM_NAME_VALOR`

**Valores:**
- `VALOR_1` - Descripción significado
- `VALOR_2` - Descripción significado
- `VALOR_3` - Descripción significado

**Usado en:** [Tabla X, campo Y]

---

## ✏️ CAMBIOS PROPUESTOS

*(Documentar aquí tus propuestas siguiendo el formato de ejemplos)*

### 1. [Título del cambio]

[Descripción completa]

---

## ✅ APROBACIÓN

- [ ] Validado contra convenciones del proyecto
- [ ] No conflicto con nombres existentes en diccionario
- [ ] Documentado completamente
- [ ] Listo para integrar en `docs/DICCIONARIO_DOMINIO.md`

**Aprobado por:** ____________
**Fecha aprobación:** ____________

---

**Referencia:** `docs/DICCIONARIO_DOMINIO.md` (diccionario central)
"""

        try:
            with open(archivo_propuesta, "w", encoding="utf-8") as f:
                f.write(contenido)
            logger.info(f"    PROPUESTA_DICCIONARIO.md generada")
        except Exception as e:
            logger.error(f"Error al generar propuesta de diccionario: {e}")

# ==============================================================================
# GESTOR DE ESTADO (ESTADO.json)
# ==============================================================================

class GestorEstado:
    """Gestor de archivo ESTADO.json para tracking del expediente"""

    def crear_actualizar(self, carpeta_expediente: Path, metadatos: Dict):
        """Crea o actualiza ESTADO.json"""

        archivo_estado = carpeta_expediente / "ESTADO.json"

        estado = {
            "expediente": metadatos.get("expediente", ""),
            "creado_en": datetime.now().isoformat(),
            "archivo_principal": metadatos.get("archivo_principal", ""),
            "clasificacion": {
                "categoria": metadatos.get("categoria", ""),
                "severidad": metadatos.get("severidad", ""),
                "impacto": metadatos.get("impacto", ""),
                "urgencia": metadatos.get("urgencia", ""),
                "complejidad": metadatos.get("complejidad", "")
            },
            "camino_estrategico": {
                "camino": metadatos.get("camino", ""),
                "justificacion": metadatos.get("justificacion", "")
            },
            "fases_generadas": metadatos.get("fases", []),
            "fase_actual": metadatos.get("fases", [""])[0] if metadatos.get("fases") else "",
            "estado": "ACTIVO",
            "timestamps": {
                "creado": datetime.now().isoformat(),
                "ultima_actualizacion": datetime.now().isoformat()
            }
        }

        try:
            with open(archivo_estado, "w", encoding="utf-8") as f:
                json.dump(estado, f, indent=2, ensure_ascii=False)
            logger.info(f"    ESTADO.json generado/actualizado")
        except Exception as e:
            logger.error(f"Error al crear/actualizar ESTADO.json: {e}")

# ==============================================================================
# GESTOR DE EXPEDIENTES
# ==============================================================================

class GestorExpedientes:
    """Gestiona la creación y manipulación de expedientes"""

    def __init__(self, config: ConfiguracionBuzones):
        self.config = config
        self.dir_entrada = DIR_ENTRADA
        self.dir_taller = DIR_TALLER
        self.clasificador = ClasificadorInteligente(config)
        self.decisor = DecisorCamino()
        self.generador_fases = GeneradorFases(config)
        self.gestor_dict = GestorDiccionario(config)
        self.gestor_estado = GestorEstado()

        # Crear directorios si no existen
        self.dir_entrada.mkdir(parents=True, exist_ok=True)
        self.dir_taller.mkdir(parents=True, exist_ok=True)

        # Inicializar diccionario central (solo primera vez)
        self.gestor_dict.inicializar_diccionario_central(RAIZ)

    def generar_id_expediente(self, nombre_archivo: str) -> str:
        """Genera ID único para expediente"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_base = Path(nombre_archivo).stem
        # Sanitizar nombre (solo alfanuméricos y guiones)
        nombre_sanitizado = "".join(c if c.isalnum() or c in "-_" else "_" for c in nombre_base)
        return f"{nombre_sanitizado}_{timestamp}"

    def crear_expediente(self, archivo_origen: Path) -> Optional[str]:
        """Crea expediente a partir de archivo en entrada/"""

        try:
            # Verificar que el archivo existe
            if not archivo_origen.exists():
                logger.error(f"Archivo no encontrado: {archivo_origen}")
                return None

            logger.info(f"📄 Procesando: {archivo_origen.name}")

            # Generar ID de expediente
            id_expediente = self.generar_id_expediente(archivo_origen.name)
            carpeta_expediente = self.dir_taller / id_expediente

            # Crear carpeta del expediente
            carpeta_expediente.mkdir(parents=True, exist_ok=True)
            logger.info(f"[NUEVO] Expediente creado: {id_expediente}/")

            # Mover archivo original a carpeta de expediente
            archivo_destino = carpeta_expediente / archivo_origen.name
            shutil.move(str(archivo_origen), str(archivo_destino))
            logger.info(f"    Archivo movido: {archivo_origen.name}")

            # Leer contenido para clasificación
            contenido = self._leer_contenido(archivo_destino)
            extension = archivo_destino.suffix.lower()

            # Clasificación inteligente
            clasificacion = self.clasificador.clasificar(contenido, extension)
            logger.info(f"[INFO] Clasificación: {clasificacion['categoria']} / Complejidad: {clasificacion['complejidad']}")

            # Decisión de camino
            camino, justificacion = self.decisor.decidir(clasificacion)
            logger.info(f"[INFO] Camino asignado: {camino}")
            logger.info(f"    Justificación: {justificacion}")

            # Fases a generar
            fases = self.decisor.obtener_fases(camino)
            logger.info(f"[INFO] Generando {len(fases)} fases: {', '.join(fases)}")

            # Metadatos completos
            metadatos = {
                "expediente": id_expediente,
                "archivo_principal": archivo_destino.name,
                "camino": camino,
                "justificacion": justificacion,
                "fases": fases,
                **clasificacion
            }

            # Generar archivos de fases
            self.generador_fases.generar(carpeta_expediente, fases, metadatos)

            # Generar propuesta de diccionario
            self.gestor_dict.generar_propuesta_expediente(carpeta_expediente, metadatos)

            # Generar ESTADO.json
            self.gestor_estado.crear_actualizar(carpeta_expediente, metadatos)

            # Generar instrucciones para agente (playbook operacional)
            self._generar_instrucciones_playbook(carpeta_expediente, metadatos)

            # Lanzamiento automático de Claude (si habilitado)
            self._lanzar_agente(carpeta_expediente, id_expediente)

            logger.success(f"✅ Expediente completado: {id_expediente}")
            return id_expediente

        except Exception as e:
            logger.error(f"Error al crear expediente: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def _leer_contenido(self, archivo: Path, max_lineas: int = 120) -> str:
        """Lee contenido del archivo (primeras N líneas)"""
        try:
            with open(archivo, "r", encoding="utf-8", errors="ignore") as f:
                lineas = []
                for i, linea in enumerate(f):
                    if i >= max_lineas:
                        break
                    lineas.append(linea)
                return "".join(lineas)
        except Exception as e:
            logger.warning(f"No se pudo leer contenido: {e}")
            return ""

    def _generar_instrucciones_playbook(self, carpeta_expediente: Path, metadatos: Dict):
        """Genera INSTRUCCIONES_AGENTE.md como playbook operacional completo"""

        fases = metadatos.get("fases", [])
        camino = metadatos.get("camino", "")
        expediente = metadatos.get("expediente", "")
        archivo_principal = metadatos.get('archivo_principal', '')

        # Generar lista de fases con estado
        fases_lista = "\n".join([f"- ✅ **{fase}.md** - APLICA (ejecutar en orden)" for fase in fases])

        # Generar playbook detallado con PUERTAS DE VALIDACIÓN BLOQUEANTES
        playbook_fases = []
        for i, fase in enumerate(fases):
            puerta = self._obtener_puerta_validacion(fase)
            playbook_fases.append(f"""
## FASE {i}: {fase}

**Acción:** {self._obtener_accion_fase(fase, archivo_principal)}

**Entradas:**
{self._obtener_entradas_fase(fase)}

**Salidas esperadas:**
{self._obtener_salidas_fase(fase)}

**Checklist (completar EN el archivo {fase}.md):**
{self._obtener_checklist_fase(fase)}

{puerta}

---
""")

        playbook_completo = "\n".join(playbook_fases)

        contenido = f"""# INSTRUCCIONES PARA AGENTE (PLAYBOOK OPERACIONAL)

**Expediente:** {expediente}
**Creado:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Archivo principal:** {archivo_principal}

---

## CLASIFICACION DEL EXPEDIENTE

- **Categoria:** {metadatos.get('categoria', '')}
- **Severidad:** {metadatos.get('severidad', '')}
- **Impacto:** {metadatos.get('impacto', '')}
- **Urgencia:** {metadatos.get('urgencia', '')}
- **Complejidad:** {metadatos.get('complejidad', '')}

---

## CAMINO ESTRATEGICO ASIGNADO

**Camino:** {camino}
**Justificacion:** {metadatos.get('justificacion', '')}
**Fases a ejecutar:** {len(fases)}

---

## LISTA DE FASES (ORDEN DE EJECUCION)

{fases_lista}

---

## PLAYBOOK DETALLADO (EJECUTAR SECUENCIALMENTE)

**REGLA CRITICA:** Las puertas de validacion son BLOQUEANTES.
NO avanzar a la siguiente fase sin cumplir TODOS los items del checklist.

{playbook_completo}

---

## DICCIONARIO DE DOMINIO (OBLIGATORIO)

**Ubicacion:** `docs/DICCIONARIO_DOMINIO.md` (raiz del proyecto, UNICO)

**REGLA FUNDAMENTAL:**
Ningun nombre nuevo de tabla/campo/variable/estado puede aparecer en el codigo
sin estar registrado en el diccionario central primero.

**PROCESO:**
1. Consultar `docs/DICCIONARIO_DOMINIO.md`
2. Si NO existe el nombre: documentar en `PROPUESTA_DICCIONARIO.md` de este expediente
3. Actualizar diccionario central
4. Solo entonces implementar en codigo

---

## REGLAS IMPORTANTES

1. Ejecutar fases en ORDEN NUMERICO (no saltarse ninguna)
2. Las puertas de validacion son BLOQUEANTES (no avanzar sin cumplir)
3. Consultar docs/DICCIONARIO_DOMINIO.md ANTES de crear nombres nuevos
4. Fase 05_RESULTADO = ESCRIBIR CODIGO REAL en src/ (no solo documentar)
5. Seguir TDD: test primero (Red), codigo minimo (Green), refactorizar (Refactor)
6. Al terminar TODAS las fases: `just concluir {expediente}`

---

## ESTADO DEL EXPEDIENTE

- [ ] Archivo recibido
{chr(10).join([f"- [ ] {fase}" for fase in fases])}
- [ ] Expediente concluido

---

## TRACKING

**Archivo:** `ESTADO.json` - Actualizar segun progreso.
**Hub:** `CLAUDE.md` (raiz del proyecto)

---

**Sistema:** Fabrica Agentica v2.3.1
**Generado automaticamente por:** vigilante_v2.3.1.py
"""

        # Escribir archivo de instrucciones
        archivo_instrucciones = carpeta_expediente / "INSTRUCCIONES_AGENTE.md"
        try:
            with open(archivo_instrucciones, "w", encoding="utf-8") as f:
                f.write(contenido)
            logger.info(f"    INSTRUCCIONES_AGENTE.md generado (playbook completo)")
        except Exception as e:
            logger.error(f"Error al generar instrucciones: {e}")

    def _obtener_accion_fase(self, fase: str, archivo_principal: str = "") -> str:
        """Retorna la ACCIÓN concreta que debe ejecutar el agente en cada fase"""
        acciones = {
            "00_ESTRATEGIA": f"Leer `{archivo_principal}` y generar `00_ESTRATEGIA.md` con: objetivo claro, alcance (que SI y que NO), criterios de exito medibles, riesgos con mitigacion",
            "01_ANALISIS": f"Analizar `{archivo_principal}` y generar `01_ANALISIS.md` con: Historias de Usuario (COMO/QUIERO/PARA), criterios de aceptacion (DADO/CUANDO/ENTONCES, minimo 3 por HU), requisitos no funcionales, dependencias",
            "02_INVESTIGACION": "Investigar el codebase existente y generar `02_INVESTIGACION.md` con: mapa de impacto (archivos afectados con rutas exactas), patrones existentes a reutilizar, tests que podrian romperse, spike tecnico si hay incertidumbre",
            "03_PLAN": "Generar `03_PLAN.md` con: desglose de tareas (WBS con complejidad S/M/L), estrategia TDD (que tests escribir primero), Definition of Done especifica para este expediente",
            "04_DISENO": "Generar `04_DISENO.md` con: modelos/entidades (campos, tipos, relaciones), API/endpoints (si aplica), migraciones de BD, diagramas de flujo (si complejidad >= L)",
            "05_RESULTADO": "ESCRIBIR CODIGO REAL en src/ siguiendo TDD estricto: (1) Escribir tests que fallen (Red), (2) Escribir codigo minimo para que pasen (Green), (3) Refactorizar (Refactor). Documentar en `05_RESULTADO.md` los archivos creados/modificados y resultados de tests",
            "06_VALIDACION": "Ejecutar TODOS los tests, verificar criterios de aceptacion de Fase 01, completar checklist DoD de Fase 03. Generar `06_VALIDACION.md` con resultados",
            "07_DESPLIEGUE": "Preparar deployment: PR, merge, deploy commands, smoke tests. Documentar en `07_DESPLIEGUE.md`",
            "08_OPERACION": "Documentar plan de monitoreo y soporte en `08_OPERACION.md`",
            "09_EVOLUCION": "Retrospectiva y lecciones aprendidas en `09_EVOLUCION.md`. Actualizar CLAUDE.md y docs si hubo cambios arquitectonicos"
        }
        return acciones.get(fase, f"Completar `{fase}.md` con contenido real")

    def _obtener_puerta_validacion(self, fase: str) -> str:
        """Retorna la puerta de validación BLOQUEANTE para cada fase"""
        puertas = {
            "00_ESTRATEGIA": "### >>> PUERTA DE VALIDACION 0 <<<\nNO avanzar a Fase 1 hasta verificar:\n- [ ] Objetivo documentado (que y por que)\n- [ ] Alcance definido (que SI y que NO)\n- [ ] Riesgos evaluados con mitigacion",
            "01_ANALISIS": "### >>> PUERTA DE VALIDACION 1 <<<\nNO avanzar a Fase 2 hasta verificar:\n- [ ] Todas las HU tienen formato COMO/QUIERO/PARA\n- [ ] Cada HU tiene minimo 3 criterios de aceptacion\n- [ ] Riesgos identificados con mitigacion\n- [ ] Si hay preguntas abiertas: PARAR y consultar",
            "02_INVESTIGACION": "### >>> PUERTA DE VALIDACION 2 <<<\nNO avanzar a Fase 3 hasta verificar:\n- [ ] Mapa de impacto completo (archivos + rutas exactas)\n- [ ] Precauciones criticas identificadas\n- [ ] Spike resuelto (si aplico)",
            "03_PLAN": "### >>> PUERTA DE VALIDACION 3 <<<\nNO avanzar a Fase 4/5 hasta verificar:\n- [ ] Todas las tareas tienen complejidad y dependencia\n- [ ] Estrategia TDD definida (que tests primero)\n- [ ] DoD completo y verificable",
            "04_DISENO": "### >>> PUERTA DE VALIDACION 4 <<<\nNO avanzar a Fase 5 hasta verificar:\n- [ ] Nombres en docs/DICCIONARIO_DOMINIO.md\n- [ ] Modelos coherentes con arquitectura existente\n- [ ] Interfaces definidas",
            "05_RESULTADO": "### >>> PUERTA DE VALIDACION 5 <<<\nNO avanzar a Fase 6 hasta verificar:\n- [ ] TODOS los tests nuevos pasan\n- [ ] CERO tests existentes rotos\n- [ ] Codigo escrito en src/ (NO solo documentacion)\n- [ ] Cobertura >= 80% del codigo nuevo",
            "06_VALIDACION": "### >>> PUERTA DE VALIDACION 6 <<<\nNO avanzar a Fase 7 hasta verificar:\n- [ ] TODOS los criterios de aceptacion verificados\n- [ ] DoD 100% completado\n- [ ] Suite completa de tests ejecutada",
            "07_DESPLIEGUE": "### >>> PUERTA DE VALIDACION 7 <<<\n- [ ] Deploy exitoso\n- [ ] Smoke tests OK\n- [ ] Rollback plan documentado",
            "08_OPERACION": "### >>> PUERTA DE VALIDACION 8 <<<\n- [ ] Monitoreo configurado\n- [ ] Plan de soporte documentado",
            "09_EVOLUCION": "### >>> PUERTA FINAL <<<\n- [ ] Retrospectiva completada\n- [ ] Documentacion proyecto actualizada\n- [ ] Listo para: `just concluir [expediente]`"
        }
        return puertas.get(fase, "")

    def _obtener_objetivo_fase(self, fase: str) -> str:
        """Retorna objetivo resumido de una fase"""
        objetivos = {
            "00_ESTRATEGIA": "Definir objetivo, alcance y estrategia general",
            "01_ANALISIS": "Analizar requisitos funcionales y no funcionales",
            "02_INVESTIGACION": "Investigar opciones técnicas y decidir enfoque",
            "03_PLAN": "Crear plan detallado de implementación",
            "04_DISENO": "Diseñar arquitectura y modelo de datos",
            "05_RESULTADO": "Implementar código con tests",
            "06_VALIDACION": "Validar requisitos y ejecutar QA",
            "07_DESPLIEGUE": "Desplegar a producción",
            "08_OPERACION": "Monitorear y dar soporte",
            "09_EVOLUCION": "Retrospectiva y mejora continua"
        }
        return objetivos.get(fase, "Ver archivo de fase para detalles")

    def _obtener_entradas_fase(self, fase: str) -> str:
        """Retorna entradas resumidas de una fase"""
        entradas = {
            "00_ESTRATEGIA": "- Archivo principal del expediente\n- Clasificación automática",
            "01_ANALISIS": "- 00_ESTRATEGIA.md\n- Archivo principal",
            "02_INVESTIGACION": "- 01_ANALISIS.md (requisitos)",
            "03_PLAN": "- 00_ESTRATEGIA.md, 01_ANALISIS.md, 02_INVESTIGACION.md",
            "04_DISENO": "- 03_PLAN.md\n- Código existente",
            "05_RESULTADO": "- 03_PLAN.md, 04_DISENO.md\n- docs/DICCIONARIO_DOMINIO.md",
            "06_VALIDACION": "- 05_RESULTADO.md\n- Requisitos originales",
            "07_DESPLIEGUE": "- 06_VALIDACION.md\n- Código en rama",
            "08_OPERACION": "- 07_DESPLIEGUE.md\n- Monitoreo configurado",
            "09_EVOLUCION": "- 08_OPERACION.md\n- Feedback usuarios"
        }
        return entradas.get(fase, "- Ver archivo de fase")

    def _obtener_salidas_fase(self, fase: str) -> str:
        """Retorna salidas resumidas de una fase"""
        salidas = {
            "00_ESTRATEGIA": "- Objetivo claro\n- Criterios de éxito\n- Riesgos identificados",
            "01_ANALISIS": "- AS-IS documentado\n- TO-BE documentado\n- Requisitos completos",
            "02_INVESTIGACION": "- Opciones evaluadas\n- Decisión técnica\n- ADR (si aplica)",
            "03_PLAN": "- Tareas detalladas\n- Estimaciones\n- Orden de ejecución",
            "04_DISENO": "- Arquitectura\n- Modelo de datos\n- Interfaces definidas",
            "05_RESULTADO": "- Código implementado\n- Tests (>= 80% cobertura)\n- Code review",
            "06_VALIDACION": "- Requisitos verificados\n- Tests E2E\n- QA aprobado",
            "07_DESPLIEGUE": "- Código en producción\n- Smoke tests OK\n- Rollback plan",
            "08_OPERACION": "- Sistema estable\n- Métricas en verde\n- 0 incidentes críticos",
            "09_EVOLUCION": "- Retrospectiva\n- Lecciones aprendidas\n- Roadmap actualizado"
        }
        return salidas.get(fase, "- Ver archivo de fase")

    def _obtener_checklist_fase(self, fase: str) -> str:
        """Retorna checklist resumido de una fase"""
        checklists = {
            "00_ESTRATEGIA": "- [ ] Objetivo documentado\n- [ ] Alcance definido\n- [ ] Riesgos evaluados",
            "01_ANALISIS": "- [ ] AS-IS documentado\n- [ ] TO-BE documentado\n- [ ] Requisitos completos",
            "02_INVESTIGACION": "- [ ] 3+ opciones investigadas\n- [ ] Decisión justificada\n- [ ] ADR creado",
            "03_PLAN": "- [ ] Todas las tareas listadas\n- [ ] Estimaciones completas\n- [ ] Plan de testing",
            "04_DISENO": "- [ ] Arquitectura clara\n- [ ] Nombres en diccionario ⚠️\n- [ ] Interfaces definidas",
            "05_RESULTADO": "- [ ] Código completo\n- [ ] Tests >= 80%\n- [ ] Diccionario actualizado",
            "06_VALIDACION": "- [ ] Requisitos 100%\n- [ ] Tests pasando\n- [ ] Performance OK",
            "07_DESPLIEGUE": "- [ ] PR aprobado\n- [ ] Deploy exitoso\n- [ ] Smoke tests OK",
            "08_OPERACION": "- [ ] Monitoreo activo\n- [ ] Métricas OK\n- [ ] 0 incidentes",
            "09_EVOLUCION": "- [ ] Retrospectiva\n- [ ] Lecciones aprendidas\n- [ ] Mejoras priorizadas"
        }
        return checklists.get(fase, "- [ ] Ver archivo de fase")

    def _lanzar_agente(self, carpeta_expediente: Path, id_expediente: str):
        """Lanza Claude automáticamente con el expediente en nueva ventana"""

        if not self.config.get("lanzamiento_automatico.habilitado", False):
            logger.info("    Lanzamiento automático deshabilitado (config)")
            return

        try:
            # Obtener ruta raíz del proyecto
            proyecto_raiz = DIR_BUZONES.parent.parent
            ruta_expediente = f"fabrica/buzon_agente/taller_activo/{id_expediente}"

            # Leer metadatos para construir prompt específico
            estado_json = carpeta_expediente / "ESTADO.json"
            fases_texto = ""
            if estado_json.exists():
                try:
                    with open(estado_json, "r", encoding="utf-8") as f:
                        estado = json.load(f)
                    fases = estado.get("fases_generadas", [])
                    for i, fase in enumerate(fases, 1):
                        objetivo = self._obtener_objetivo_fase(fase)
                        fases_texto += f"{i}. {fase}: {objetivo}. "
                except Exception:
                    fases_texto = "Ejecutar todas las fases en orden. "

            # Prompt explícito orientado a ACCIÓN (no solo documentación)
            prompt_detallado = (
                f"Lee INSTRUCCIONES_AGENTE.md en {ruta_expediente}/ "
                f"y ejecuta TODAS las fases del expediente de forma automatica y secuencial: "
                f"{fases_texto}"
                f"IMPORTANTE: "
                f"(a) Respetar puertas de validacion entre fases (NO avanzar sin cumplir checklist). "
                f"(b) En fase 05_RESULTADO debes ESCRIBIR CODIGO REAL en src/ siguiendo TDD (test primero, codigo despues). "
                f"(c) Consulta docs/DICCIONARIO_DOMINIO.md ANTES de crear nombres nuevos. "
                f"(d) Cada archivo de fase debe tener contenido REAL y completo, no placeholders. "
                f"(e) Al finalizar todas las fases ejecuta: just concluir {id_expediente}"
            )

            # --- Generar PROMPT_TASK.md (auditoría y recovery) ---
            prompt_task = carpeta_expediente / "PROMPT_TASK.md"
            contenido_prompt_task = (
                f"# EXPEDIENTE PROCESANDOSE AUTOMATICAMENTE\n\n"
                f"**Expediente**: {id_expediente}\n"
                f"**Creado**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"**Estado**: El prompt se envio automaticamente al abrir Claude\n\n"
                f"---\n\n"
                f"## PROMPT ENVIADO AUTOMATICAMENTE\n\n"
                f"```\n{prompt_detallado}\n```\n\n"
                f"---\n\n"
                f"## SI NECESITAS RELANZAR MANUALMENTE\n\n"
                f"Ejecutar desde la raiz del proyecto:\n"
                f"```bash\n"
                f"cd /d \"{proyecto_raiz}\"\n"
                f"claude --dangerously-skip-permissions \"Lee INSTRUCCIONES_AGENTE.md en {ruta_expediente}/ y ejecuta todas las fases...\"\n"
                f"```\n\n"
                f"O usar EJECUTAR_AGENTE.bat (doble clic)\n\n"
                f"---\n\n"
                f"*Generado automaticamente por Vigilante v2.3.1 (Lanzamiento automatico con prompt CLI)*\n"
            )

            with open(prompt_task, "w", encoding="utf-8") as f:
                f.write(contenido_prompt_task)
            logger.info(f"    PROMPT_TASK.md generado")

            # --- Generar EJECUTAR_AGENTE.ps1 ---
            script_ps1 = carpeta_expediente / "EJECUTAR_AGENTE.ps1"
            # Escapar comillas simples en prompt para PowerShell
            prompt_ps1 = prompt_detallado.replace("'", "''")
            contenido_ps1 = (
                f"# PowerShell script para lanzar Claude con prompt automatico\n"
                f"Set-Location '{proyecto_raiz}'\n\n"
                f"Write-Host \"\"\n"
                f"Write-Host \"=============================================\" -ForegroundColor Cyan\n"
                f"Write-Host \"   EXPEDIENTE: {id_expediente}\" -ForegroundColor Yellow\n"
                f"Write-Host \"=============================================\" -ForegroundColor Cyan\n"
                f"Write-Host \"\"\n"
                f"Write-Host \"Lanzando Claude con prompt automatico...\" -ForegroundColor Green\n"
                f"Write-Host \"\"\n\n"
                f"claude --dangerously-skip-permissions '{prompt_ps1}'\n"
            )

            with open(script_ps1, "w", encoding="utf-8") as f:
                f.write(contenido_ps1)
            logger.info(f"    EJECUTAR_AGENTE.ps1 generado")

            # --- Generar EJECUTAR_AGENTE.bat (wrapper) ---
            script_bat = carpeta_expediente / "EJECUTAR_AGENTE.bat"
            contenido_bat = (
                f"@echo off\r\n"
                f"powershell.exe -ExecutionPolicy Bypass -File \"{script_ps1}\"\r\n"
            )

            with open(script_bat, "w", encoding="utf-8") as f:
                f.write(contenido_bat)
            logger.info(f"    EJECUTAR_AGENTE.bat generado")

            # --- Lanzar en nueva ventana de terminal ---
            try:
                subprocess.Popen(
                    f'start "Claude-{id_expediente}" cmd /k "{script_bat}"',
                    shell=True,
                    cwd=str(proyecto_raiz)
                )
                logger.success(f"    🤖 Claude lanzado en nueva ventana de terminal")
            except Exception as e:
                logger.warning(f"No se pudo auto-lanzar Claude: {e}")
                logger.info(f"    Ejecutar manualmente: {script_bat}")

        except Exception as e:
            logger.error(f"Error al preparar lanzamiento: {e}")

# ==============================================================================
# PROCESADOR DE ENTRADA (MODO BATCH)
# ==============================================================================

class ProcesadorBatch:
    """Procesa todos los archivos en entrada/ una vez"""

    def __init__(self, config: ConfiguracionBuzones):
        self.config = config
        self.gestor = GestorExpedientes(config)

    def procesar(self):
        """Procesar todos los archivos en entrada/"""
        logger.info("=" * 80)
        logger.info("Iniciando procesamiento BATCH - Fábrica Agéntica v2.3.1")
        logger.info("=" * 80)

        # Listar archivos en entrada/
        archivos = list(DIR_ENTRADA.glob("*"))
        archivos = [f for f in archivos if f.is_file()]

        # Filtrar archivos a ignorar
        archivos_validos = []
        for archivo in archivos:
            if self.config.debe_ignorar(archivo.name):
                logger.info(f"⏭️  Ignorando: {archivo.name}")
            else:
                archivos_validos.append(archivo)

        if not archivos_validos:
            logger.info("📭 No hay archivos para procesar en entrada/")
            return

        logger.info(f"📥 Archivos a procesar: {len(archivos_validos)}")
        logger.info("")

        # Procesar cada archivo
        expedientes_creados = []
        for archivo in archivos_validos:
            id_expediente = self.gestor.crear_expediente(archivo)
            if id_expediente:
                expedientes_creados.append(id_expediente)
            logger.info("")  # Línea en blanco entre expedientes

        # Resumen
        logger.info("=" * 80)
        logger.success(f"✅ Procesamiento completado: {len(expedientes_creados)} expedientes creados")
        logger.info("=" * 80)

        for exp_id in expedientes_creados:
            logger.info(f"  - {exp_id}/")

        logger.info("")
        logger.info("💡 Próximos pasos:")
        logger.info("   1. Claude debería haberse abierto automáticamente con cada expediente")
        logger.info("   2. Si no, revisar expedientes en: fabrica/buzon_agente/taller_activo/")
        logger.info("   3. Ejecutar manualmente: EJECUTAR_AGENTE.bat en cada expediente")
        logger.info("   4. Al terminar expediente: just concluir [id_expediente]")

# ==============================================================================
# MONITOR DE ENTRADA (MODO WATCH)
# ==============================================================================

class EventHandlerEntrada(FileSystemEventHandler):
    """Handler de eventos de watchdog"""

    def __init__(self, config: ConfiguracionBuzones, gestor: GestorExpedientes):
        super().__init__()
        self.config = config
        self.gestor = gestor

    def on_created(self, event):
        """Archivo creado en entrada/"""
        if event.is_directory:
            return

        archivo = Path(event.src_path)

        # Ignorar archivos temporales
        if self.config.debe_ignorar(archivo.name):
            logger.info(f"⏭️  Ignorando: {archivo.name}")
            return

        # Esperar a que el archivo esté completamente escrito
        time.sleep(0.5)

        logger.info(f"🔔 Nuevo archivo detectado: {archivo.name}")
        logger.info("")
        self.gestor.crear_expediente(archivo)
        logger.info("")

class MonitorWatch:
    """Monitor continuo de entrada/ con watchdog"""

    def __init__(self, config: ConfiguracionBuzones):
        if not WATCHDOG_AVAILABLE:
            logger.error("❌ Modo watch requiere watchdog: pip install watchdog")
            sys.exit(1)

        self.config = config
        self.gestor = GestorExpedientes(config)

    def iniciar(self):
        """Iniciar monitoreo continuo"""
        logger.info("=" * 80)
        logger.info("Iniciando VIGILANTE en modo WATCH - Fábrica Agéntica v2.3.1")
        logger.info("=" * 80)
        logger.info(f"📂 Monitoreando: {DIR_ENTRADA}")
        logger.info("👁️  El vigilante está atento...")
        logger.info("⏹️  Presiona Ctrl+C para detener")
        logger.info("")

        event_handler = EventHandlerEntrada(self.config, self.gestor)
        observer = Observer()
        observer.schedule(event_handler, str(DIR_ENTRADA), recursive=False)
        observer.start()

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("")
            logger.info("⏹️  Deteniendo vigilante...")
            observer.stop()

        observer.join()
        logger.info("✅ Vigilante detenido")

# ==============================================================================
# CLI PRINCIPAL
# ==============================================================================

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description="Vigilante de Buzones v2.3.1 - Playbook Operacional Automático"
    )
    parser.add_argument(
        "--modo",
        choices=["batch", "watch"],
        default="batch",
        help="Modo de ejecución: batch (una vez) o watch (continuo)"
    )

    args = parser.parse_args()

    # Cargar configuración
    config = ConfiguracionBuzones(CONFIG_FILE)

    # Verificar que vigilante esté habilitado
    if not config.config.get("vigilante", {}).get("habilitado", True):
        logger.warning("⚠️  Vigilante deshabilitado en configuración")
        return

    # Ejecutar según modo
    if args.modo == "batch":
        procesador = ProcesadorBatch(config)
        procesador.procesar()
    else:  # watch
        monitor = MonitorWatch(config)
        monitor.iniciar()

if __name__ == "__main__":
    main()
