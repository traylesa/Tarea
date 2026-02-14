#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestor de Habilidades v2.0
Indexa y gestiona el catálogo de skills disponibles en .claude/skills/

Funcionalidades:
- Listar skills disponibles con descripción
- Buscar skills por keyword
- Reindexar catálogo automáticamente
- Generar INDICE_HABILIDADES.json

Uso:
    python fabrica/deploy/gestor_habilidades.py listar
    python fabrica/deploy/gestor_habilidades.py reindexar
    python fabrica/deploy/gestor_habilidades.py buscar "testing"
"""

import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Optional

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_SKILLS = RAIZ / ".claude" / "skills"
ARCHIVO_INDICE = DIR_SKILLS / "INDICE_HABILIDADES.json"

# ==============================================================================
# FUNCIONES DE INDEXACIÓN
# ==============================================================================

def extraer_metadata(archivo_skill: Path) -> Dict:
    """Extrae metadata de un archivo de skill"""

    try:
        with open(archivo_skill, "r", encoding="utf-8") as f:
            contenido = f.read()

        # Extraer título (primera línea con #)
        match_titulo = re.search(r"^#\s+(.+)$", contenido, re.MULTILINE)
        titulo = match_titulo.group(1) if match_titulo else archivo_skill.stem

        # Extraer descripción (primer párrafo después del título)
        match_descripcion = re.search(r"^#.+?\n\n(.+?)(?:\n\n|\n#|\Z)", contenido, re.DOTALL)
        descripcion = match_descripcion.group(1).strip() if match_descripcion else "Sin descripción"

        # Limitar descripción a 200 caracteres
        if len(descripcion) > 200:
            descripcion = descripcion[:197] + "..."

        # Extraer keywords (sección ## Keywords si existe)
        keywords = []
        match_keywords = re.search(r"##\s+Keywords?\n\n(.+?)(?:\n\n|\n#|\Z)", contenido, re.DOTALL)
        if match_keywords:
            keywords_text = match_keywords.group(1)
            keywords = [kw.strip() for kw in re.findall(r"[-*]\s+(.+)", keywords_text)]

        return {
            "nombre": archivo_skill.stem,
            "archivo": archivo_skill.name,
            "titulo": titulo,
            "descripcion": descripcion,
            "keywords": keywords,
            "tamano_kb": archivo_skill.stat().st_size / 1024
        }

    except Exception as e:
        return {
            "nombre": archivo_skill.stem,
            "archivo": archivo_skill.name,
            "titulo": archivo_skill.stem,
            "descripcion": f"Error al leer: {e}",
            "keywords": [],
            "tamano_kb": 0
        }


def reindexar_skills() -> List[Dict]:
    """Reindexar todas las skills disponibles"""

    if not DIR_SKILLS.exists():
        print(f"⚠️  Carpeta de skills no existe: {DIR_SKILLS}")
        return []

    archivos_skill = list(DIR_SKILLS.glob("*.md"))
    archivos_skill = [f for f in archivos_skill if f.name != "INDICE_HABILIDADES.json"]

    skills = []
    for archivo in sorted(archivos_skill):
        metadata = extraer_metadata(archivo)
        skills.append(metadata)

    return skills


def guardar_indice(skills: List[Dict]):
    """Guarda índice de skills en JSON"""

    indice = {
        "version": "2.0",
        "fecha_generacion": Path(__file__).stat().st_mtime,
        "total_skills": len(skills),
        "skills": skills
    }

    try:
        with open(ARCHIVO_INDICE, "w", encoding="utf-8") as f:
            json.dump(indice, f, indent=2, ensure_ascii=False)
        print(f"✅ Índice guardado: {ARCHIVO_INDICE.name}")
    except Exception as e:
        print(f"❌ Error al guardar índice: {e}")


def cargar_indice() -> Optional[List[Dict]]:
    """Carga índice desde archivo JSON"""

    if not ARCHIVO_INDICE.exists():
        return None

    try:
        with open(ARCHIVO_INDICE, "r", encoding="utf-8") as f:
            indice = json.load(f)
        return indice.get("skills", [])
    except Exception as e:
        print(f"⚠️  Error al cargar índice: {e}")
        return None


# ==============================================================================
# COMANDOS
# ==============================================================================

def comando_listar():
    """Lista todas las skills disponibles"""

    print("🎓 Habilidades Disponibles")
    print("═" * 60)

    skills = cargar_indice()
    if skills is None:
        print("⚠️  Índice no existe. Ejecuta: reindexar")
        skills = reindexar_skills()

    if not skills:
        print("📭 No hay skills disponibles")
        print()
        print("💡 Crea skills en: .claude/skills/")
        return

    for i, skill in enumerate(skills, 1):
        print(f"\n{i}. {skill['titulo']}")
        print(f"   Archivo: {skill['archivo']}")
        print(f"   {skill['descripcion']}")

        if skill.get('keywords'):
            keywords_str = ", ".join(skill['keywords'][:5])
            print(f"   Keywords: {keywords_str}")

    print()
    print(f"📊 Total: {len(skills)} habilidades")


def comando_reindexar():
    """Reindexar catálogo de skills"""

    print("🔄 Reindexando catálogo de habilidades...")
    print()

    skills = reindexar_skills()

    if not skills:
        print("📭 No se encontraron skills en .claude/skills/")
        return

    print(f"✓ {len(skills)} skills indexadas")
    guardar_indice(skills)
    print()
    print("💡 Usa 'listar' para ver el catálogo completo")


def comando_buscar(query: str):
    """Busca skills por keyword"""

    print(f"🔍 Buscando: '{query}'")
    print("═" * 60)

    skills = cargar_indice()
    if skills is None:
        skills = reindexar_skills()

    query_lower = query.lower()
    resultados = []

    for skill in skills:
        # Buscar en título, descripción y keywords
        if (
            query_lower in skill['titulo'].lower() or
            query_lower in skill['descripcion'].lower() or
            any(query_lower in kw.lower() for kw in skill.get('keywords', []))
        ):
            resultados.append(skill)

    if not resultados:
        print(f"❌ No se encontraron skills para: '{query}'")
        return

    print(f"✓ {len(resultados)} resultados:\n")

    for i, skill in enumerate(resultados, 1):
        print(f"{i}. {skill['titulo']}")
        print(f"   Archivo: {skill['archivo']}")
        print(f"   {skill['descripcion']}")
        print()


# ==============================================================================
# CLI
# ==============================================================================

def mostrar_ayuda():
    """Muestra ayuda de uso"""
    print("""
Gestor de Habilidades v2.0

Uso:
    python gestor_habilidades.py listar              # Listar todas las skills
    python gestor_habilidades.py reindexar           # Reindexar catálogo
    python gestor_habilidades.py buscar [keyword]    # Buscar por palabra clave

Ejemplos:
    python gestor_habilidades.py listar
    python gestor_habilidades.py buscar testing
    python gestor_habilidades.py reindexar
    """)


def main():
    """Función principal"""

    if len(sys.argv) < 2:
        mostrar_ayuda()
        return 1

    comando = sys.argv[1].lower()

    if comando == "listar":
        comando_listar()
    elif comando == "reindexar":
        comando_reindexar()
    elif comando == "buscar":
        if len(sys.argv) < 3:
            print("❌ Falta keyword para buscar")
            print("Uso: python gestor_habilidades.py buscar [keyword]")
            return 1
        comando_buscar(sys.argv[2])
    else:
        print(f"❌ Comando desconocido: {comando}")
        mostrar_ayuda()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
