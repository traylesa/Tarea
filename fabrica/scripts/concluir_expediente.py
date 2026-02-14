#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Concluyente de Expedientes v2.0
Mueve expedientes de taller_activo/ a archivo_concluido/

Uso:
    python fabrica/scripts/concluir_expediente.py [ID_EXPEDIENTE]
"""

import sys
import shutil
from pathlib import Path
from datetime import datetime

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_TALLER = RAIZ / "fabrica" / "buzon_agente" / "taller_activo"
DIR_ARCHIVO = RAIZ / "fabrica" / "buzon_agente" / "archivo_concluido"

# ==============================================================================
# FUNCIONES
# ==============================================================================

def listar_expedientes_activos():
    """Lista todos los expedientes en taller_activo/"""
    if not DIR_TALLER.exists():
        return []

    expedientes = [d.name for d in DIR_TALLER.iterdir() if d.is_dir()]
    return sorted(expedientes)


def concluir_expediente(id_expediente: str) -> bool:
    """Mueve expediente a archivo_concluido/"""

    origen = DIR_TALLER / id_expediente
    destino = DIR_ARCHIVO / id_expediente

    # Verificar que el expediente existe
    if not origen.exists():
        print(f"❌ Expediente no encontrado: {id_expediente}")
        print(f"   Ruta buscada: {origen}")
        return False

    # Crear carpeta archivo_concluido si no existe
    DIR_ARCHIVO.mkdir(parents=True, exist_ok=True)

    # Si ya existe en archivo, añadir timestamp
    if destino.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        destino = DIR_ARCHIVO / f"{id_expediente}_{timestamp}"

    try:
        shutil.move(str(origen), str(destino))
        print(f"✅ Expediente concluido: {id_expediente}")
        print(f"   Movido a: {destino.relative_to(RAIZ)}")
        return True
    except Exception as e:
        print(f"❌ Error al mover expediente: {e}")
        return False


def main():
    """Función principal"""

    if len(sys.argv) < 2:
        print("📋 Expedientes activos en taller:")
        print()
        expedientes = listar_expedientes_activos()

        if not expedientes:
            print("   (No hay expedientes activos)")
        else:
            for exp in expedientes:
                print(f"   - {exp}")

        print()
        print("Uso: python concluir_expediente.py [ID_EXPEDIENTE]")
        return 1

    id_expediente = sys.argv[1]
    return 0 if concluir_expediente(id_expediente) else 1


if __name__ == "__main__":
    exit(main())
