#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inicializador de Fábrica v2.0
Bootstrap idempotente del sistema de buzones y estructura

Este script crea la estructura completa de la fábrica agéntica si no existe.
Es seguro ejecutarlo múltiples veces (no sobrescribe archivos existentes).

Uso:
    python fabrica/scripts/inicializar_fabrica.py
"""

import os
import json
from pathlib import Path
from datetime import datetime

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_FABRICA = RAIZ / "fabrica"
DIR_BUZONES = DIR_FABRICA / "buzon_agente"

DIRECTORIOS_REQUERIDOS = [
    DIR_FABRICA / "buzon_agente" / "entrada",
    DIR_FABRICA / "buzon_agente" / "taller_activo",
    DIR_FABRICA / "buzon_agente" / "archivo_concluido",
    DIR_FABRICA / "ramas_paralelas",
    DIR_FABRICA / "deploy",
    DIR_FABRICA / "scripts",
    RAIZ / "docs" / "plans",
    RAIZ / "docs" / "adr",
    RAIZ / ".claude" / "commands",
    RAIZ / ".claude" / "skills",
    RAIZ / "src",
]

# ==============================================================================
# FUNCIONES
# ==============================================================================

def crear_directorios():
    """Crea todos los directorios requeridos si no existen"""
    print("📁 Verificando directorios...")

    creados = 0
    existentes = 0

    for directorio in DIRECTORIOS_REQUERIDOS:
        if directorio.exists():
            existentes += 1
        else:
            directorio.mkdir(parents=True, exist_ok=True)
            print(f"   ✓ Creado: {directorio.relative_to(RAIZ)}")
            creados += 1

    print(f"   {existentes} existentes, {creados} creados")
    return creados > 0


def crear_config_buzones():
    """Crea buzones.json si no existe"""
    archivo_config = DIR_BUZONES / "buzones.json"

    if archivo_config.exists():
        print("⚙️  Configuración de buzones: ✓ existente")
        return False

    config = {
        "version": "2.0",
        "creado_en": datetime.now().isoformat(),
        "modelo": "expedientes_por_tema",
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
        "vigilante": {
            "habilitado": True,
            "patrones_ignorar": [
                "*.tmp",
                "*.processing",
                ".DS_Store",
                "INSTRUCCIONES_AGENTE.md",
                "LEEME.md"
            ],
            "archivo_log": "fabrica/buzon_agente/vigilante.log"
        }
    }

    try:
        with open(archivo_config, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print("⚙️  Configuración de buzones: ✓ creada")
        return True
    except Exception as e:
        print(f"❌ Error al crear configuración: {e}")
        return False


def crear_gitkeep():
    """Crea archivos .gitkeep en carpetas vacías"""
    carpetas_vacias = [
        DIR_FABRICA / "ramas_paralelas",
        RAIZ / "docs" / "plans",
        RAIZ / "docs" / "adr",
        RAIZ / ".claude" / "commands",
        RAIZ / ".claude" / "skills",
        RAIZ / "src",
    ]

    creados = 0
    for carpeta in carpetas_vacias:
        gitkeep = carpeta / ".gitkeep"
        if not gitkeep.exists() and carpeta.exists():
            gitkeep.touch()
            creados += 1

    if creados > 0:
        print(f"📝 .gitkeep: ✓ {creados} creados")
    else:
        print("📝 .gitkeep: ✓ existentes")

    return creados > 0


def verificar_estructura():
    """Verifica que toda la estructura esté completa"""
    print("\n🔍 Verificando estructura completa...")

    errores = []

    # Verificar directorios
    for directorio in DIRECTORIOS_REQUERIDOS:
        if not directorio.exists():
            errores.append(f"Falta directorio: {directorio.relative_to(RAIZ)}")

    # Verificar archivos críticos
    archivos_criticos = [
        RAIZ / "justfile",
        DIR_FABRICA / "justfile",
        DIR_BUZONES / "vigilante.py",
        DIR_BUZONES / "buzones.json",
    ]

    for archivo in archivos_criticos:
        if not archivo.exists():
            errores.append(f"Falta archivo: {archivo.relative_to(RAIZ)}")

    if errores:
        print("❌ Estructura incompleta:")
        for error in errores:
            print(f"   - {error}")
        return False
    else:
        print("✅ Estructura completa verificada")
        return True


def main():
    """Función principal"""
    print("═" * 60)
    print("  INICIALIZADOR DE FÁBRICA AGÉNTICA v2.0")
    print("═" * 60)
    print()

    cambios = False

    # 1. Crear directorios
    if crear_directorios():
        cambios = True

    # 2. Crear configuración de buzones
    if crear_config_buzones():
        cambios = True

    # 3. Crear .gitkeep
    if crear_gitkeep():
        cambios = True

    print()

    # 4. Verificar estructura
    estructura_ok = verificar_estructura()

    print()
    print("═" * 60)

    if cambios:
        print("✅ Inicialización completada con cambios")
    else:
        print("✅ Estructura ya estaba inicializada")

    if not estructura_ok:
        print("⚠️  Advertencia: Estructura incompleta")
        print("   Ejecuta /inicializa para completar setup")
        return 1

    print()
    print("💡 Próximos pasos:")
    print("   1. Ejecuta: just ayuda")
    print("   2. Deposita specs en: fabrica/buzon_agente/entrada/")
    print("   3. Procesa con: just automatizar")
    print()

    return 0


if __name__ == "__main__":
    exit(main())
