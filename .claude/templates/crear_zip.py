#!/usr/bin/env python3
"""Script para crear ZIP de templates"""

import zipfile
from pathlib import Path

def crear_zip():
    base_dir = Path(__file__).parent / "fabrica-base"
    zip_path = Path(__file__).parent / "fabrica-templates.zip"

    print(f"Creando ZIP: {zip_path}")
    print(f"Desde: {base_dir}")

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for archivo in base_dir.rglob('*'):
            if archivo.is_file():
                arcname = archivo.relative_to(base_dir)
                zipf.write(archivo, arcname)
                print(f"  + {arcname}")

    # Estadísticas
    tamano = zip_path.stat().st_size
    print(f"\n✅ ZIP creado: {zip_path.name}")
    print(f"   Tamaño: {tamano / 1024:.1f} KB")

    # Contar archivos
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        print(f"   Archivos: {len(zipf.namelist())}")

if __name__ == '__main__':
    crear_zip()
