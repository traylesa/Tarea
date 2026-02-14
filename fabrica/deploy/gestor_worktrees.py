#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestor de Worktrees v2.0
Gestiona desarrollo paralelo mediante git worktrees

Funcionalidades:
- Crear worktree para feature/bugfix/experimento
- Listar worktrees activos
- Eliminar worktree completado
- Sincronización automática con rama principal

Uso:
    python fabrica/deploy/gestor_worktrees.py crear [nombre]
    python fabrica/deploy/gestor_worktrees.py listar
    python fabrica/deploy/gestor_worktrees.py eliminar [nombre]
"""

import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Optional

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_WORKTREES = RAIZ / "fabrica" / "ramas_paralelas"

# ==============================================================================
# FUNCIONES GIT
# ==============================================================================

def ejecutar_git(comando: List[str], cwd: Optional[Path] = None) -> tuple:
    """Ejecuta comando git y retorna (exitoso, output)"""

    try:
        resultado = subprocess.run(
            ["git"] + comando,
            cwd=cwd or RAIZ,
            capture_output=True,
            text=True,
            check=False
        )
        return resultado.returncode == 0, resultado.stdout.strip()
    except Exception as e:
        return False, str(e)


def es_repositorio_git() -> bool:
    """Verifica si el directorio actual es un repositorio git"""
    exitoso, _ = ejecutar_git(["rev-parse", "--git-dir"])
    return exitoso


def obtener_rama_actual() -> Optional[str]:
    """Obtiene el nombre de la rama actual"""
    exitoso, rama = ejecutar_git(["branch", "--show-current"])
    return rama if exitoso else None


def existe_rama(nombre_rama: str) -> bool:
    """Verifica si una rama existe"""
    exitoso, output = ejecutar_git(["branch", "--list", nombre_rama])
    return exitoso and nombre_rama in output


# ==============================================================================
# GESTIÓN DE WORKTREES
# ==============================================================================

def crear_worktree(nombre: str) -> bool:
    """Crea un nuevo worktree para desarrollo paralelo"""

    print(f"🌳 Creando worktree: {nombre}")
    print()

    # Verificar que es repositorio git
    if not es_repositorio_git():
        print("❌ Este directorio no es un repositorio git")
        print("   Inicializa git primero: git init")
        return False

    # Crear carpeta ramas_paralelas si no existe
    DIR_WORKTREES.mkdir(parents=True, exist_ok=True)

    # Generar nombre de rama (ej: feature/nombre, bugfix/nombre)
    prefijo = "feature"
    if "bug" in nombre.lower() or "fix" in nombre.lower():
        prefijo = "bugfix"
    elif "exp" in nombre.lower() or "test" in nombre.lower():
        prefijo = "experiment"

    nombre_rama = f"{prefijo}/{nombre}"
    ruta_worktree = DIR_WORKTREES / nombre

    # Verificar que el worktree no existe
    if ruta_worktree.exists():
        print(f"❌ Ya existe un worktree en: {ruta_worktree}")
        return False

    # Verificar que la rama no existe
    if existe_rama(nombre_rama):
        print(f"⚠️  La rama '{nombre_rama}' ya existe")
        respuesta = input("¿Crear worktree desde rama existente? (s/N): ")
        if respuesta.lower() != "s":
            return False
        comando = ["worktree", "add", str(ruta_worktree), nombre_rama]
    else:
        # Crear rama nueva
        print(f"✓ Creando nueva rama: {nombre_rama}")
        comando = ["worktree", "add", "-b", nombre_rama, str(ruta_worktree)]

    # Ejecutar git worktree add
    exitoso, output = ejecutar_git(comando)

    if not exitoso:
        print(f"❌ Error al crear worktree:")
        print(f"   {output}")
        return False

    print(f"✅ Worktree creado exitosamente")
    print()
    print(f"📂 Ruta: {ruta_worktree}")
    print(f"🌿 Rama: {nombre_rama}")
    print()
    print("💡 Próximos pasos:")
    print(f"   1. cd {ruta_worktree}")
    print("   2. Desarrollar feature/bugfix")
    print("   3. git add . && git commit")
    print("   4. git push origin " + nombre_rama)
    print(f"   5. just paralelo-limpiar {nombre}")

    return True


def listar_worktrees() -> List[Dict]:
    """Lista todos los worktrees activos"""

    exitoso, output = ejecutar_git(["worktree", "list", "--porcelain"])

    if not exitoso:
        return []

    worktrees = []
    lineas = output.split("\n")

    i = 0
    while i < len(lineas):
        if lineas[i].startswith("worktree"):
            ruta = lineas[i].split(" ", 1)[1]
            rama = ""
            commit = ""

            # Leer líneas siguientes para obtener branch y commit
            i += 1
            while i < len(lineas) and not lineas[i].startswith("worktree"):
                if lineas[i].startswith("branch"):
                    rama = lineas[i].split(" ", 1)[1].split("/")[-1]
                elif lineas[i].startswith("HEAD"):
                    commit = lineas[i].split(" ", 1)[1][:8]
                i += 1

            # Solo incluir worktrees en fabrica/ramas_paralelas/
            if "ramas_paralelas" in ruta:
                worktrees.append({
                    "ruta": ruta,
                    "rama": rama,
                    "commit": commit,
                    "nombre": Path(ruta).name
                })
        else:
            i += 1

    return worktrees


def eliminar_worktree(nombre: str) -> bool:
    """Elimina un worktree"""

    print(f"🗑️  Eliminando worktree: {nombre}")
    print()

    ruta_worktree = DIR_WORKTREES / nombre

    # Verificar que existe
    if not ruta_worktree.exists():
        print(f"❌ Worktree no encontrado: {nombre}")
        print(f"   Ruta buscada: {ruta_worktree}")
        return False

    # Confirmar eliminación
    print(f"⚠️  Se eliminará el worktree:")
    print(f"   Ruta: {ruta_worktree}")
    respuesta = input("¿Continuar? (s/N): ")

    if respuesta.lower() != "s":
        print("❌ Cancelado")
        return False

    # Ejecutar git worktree remove
    exitoso, output = ejecutar_git(["worktree", "remove", str(ruta_worktree)])

    if not exitoso:
        print(f"❌ Error al eliminar worktree:")
        print(f"   {output}")
        print()
        print("💡 Si hay cambios sin commit, usa:")
        print(f"   git worktree remove --force {ruta_worktree}")
        return False

    print(f"✅ Worktree eliminado: {nombre}")
    return True


# ==============================================================================
# CLI
# ==============================================================================

def mostrar_ayuda():
    """Muestra ayuda de uso"""
    print("""
Gestor de Worktrees v2.0

Uso:
    python gestor_worktrees.py crear [nombre]       # Crear worktree
    python gestor_worktrees.py listar               # Listar worktrees
    python gestor_worktrees.py eliminar [nombre]    # Eliminar worktree

Ejemplos:
    python gestor_worktrees.py crear mi-feature
    python gestor_worktrees.py crear bugfix-login
    python gestor_worktrees.py listar
    python gestor_worktrees.py eliminar mi-feature

Notas:
    - Los worktrees se crean en: fabrica/ramas_paralelas/
    - El prefijo de rama se detecta automáticamente:
        • feature/   → desarrollo de features
        • bugfix/    → corrección de bugs
        • experiment/ → experimentos temporales
    """)


def main():
    """Función principal"""

    if len(sys.argv) < 2:
        mostrar_ayuda()
        return 1

    comando = sys.argv[1].lower()

    if comando == "crear":
        if len(sys.argv) < 3:
            print("❌ Falta nombre del worktree")
            print("Uso: python gestor_worktrees.py crear [nombre]")
            return 1
        return 0 if crear_worktree(sys.argv[2]) else 1

    elif comando == "listar":
        print("🌳 Worktrees Activos")
        print("═" * 60)

        worktrees = listar_worktrees()

        if not worktrees:
            print("📭 No hay worktrees activos en fabrica/ramas_paralelas/")
            print()
            print("💡 Crea uno con: just paralelo [nombre]")
            return 0

        for i, wt in enumerate(worktrees, 1):
            print(f"\n{i}. {wt['nombre']}")
            print(f"   Rama: {wt['rama']}")
            print(f"   Commit: {wt['commit']}")
            print(f"   Ruta: {wt['ruta']}")

        print()
        print(f"📊 Total: {len(worktrees)} worktrees")
        return 0

    elif comando == "eliminar":
        if len(sys.argv) < 3:
            print("❌ Falta nombre del worktree")
            print("Uso: python gestor_worktrees.py eliminar [nombre]")
            return 1
        return 0 if eliminar_worktree(sys.argv[2]) else 1

    else:
        print(f"❌ Comando desconocido: {comando}")
        mostrar_ayuda()
        return 1


if __name__ == "__main__":
    exit(main())
