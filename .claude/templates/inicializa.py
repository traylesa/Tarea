#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inicializa.py - Desplegador de Fábrica Agéntica v2.0
Descomprime ZIP de templates y despliega estructura completa con reemplazo de variables

Uso:
    python inicializa.py --target /ruta/proyecto [opciones]

Opciones:
    --target PATH          Ruta del proyecto destino (requerido)
    --stack STACK         Stack tecnológico (auto|python|node|java|generic)
    --complejidad NIVEL   Complejidad (auto|MINI|STANDARD|EPIC)
    --templates-zip PATH  Ruta al ZIP de templates (default: fabrica-templates.zip)
"""

import os
import sys
import shutil
import zipfile
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

VERSION = "2.3.1"
DEFAULT_TEMPLATES_ZIP = "fabrica-templates.zip"

# Variables soportadas
VARIABLES_SOPORTADAS = {
    'PROJECT_NAME': 'Nombre del proyecto',
    'PROJECT_PATH': 'Ruta absoluta del proyecto',
    'STACK': 'Stack tecnológico detectado',
    'COMPLEJIDAD': 'Nivel de complejidad',
    'DATE': 'Fecha actual (YYYY-MM-DD)',
    'VERSION': 'Versión inicial del proyecto'
}

# ==============================================================================
# CLASE PRINCIPAL
# ==============================================================================

class FabricaDeployer:
    """Desplegador de Fábrica Agéntica desde ZIP de templates"""

    def __init__(self, target_path: Path, templates_zip: Path,
                 stack: str = 'auto', complejidad: str = 'auto'):
        self.target = Path(target_path).resolve()
        self.templates_zip = Path(templates_zip).resolve()
        self.stack = stack
        self.complejidad = complejidad
        self.temp_dir = None
        self.variables = {}

    def deploy(self) -> bool:
        """Ejecuta despliegue completo"""
        try:
            print("╔════════════════════════════════════════════════════════════╗")
            print(f"║  Inicializador de Fábrica Agéntica v{VERSION}            ║")
            print("╚════════════════════════════════════════════════════════════╝")
            print()

            # 1. Validar precondiciones
            if not self._validar_precondiciones():
                return False

            # 2. Detectar variables del proyecto
            print("📊 Analizando proyecto...")
            self.variables = self._detectar_variables()
            self._mostrar_variables()

            # 3. Descomprimir templates
            print("\n📦 Descomprimiendo templates...")
            if not self._descomprimir_templates():
                return False

            # 4. Desplegar estructura
            print("\n🏗️  Desplegando estructura...")
            archivos_copiados = self._desplegar_estructura()

            # 5. Procesar templates (reemplazar variables)
            print("\n🔄 Procesando templates...")
            archivos_procesados = self._procesar_templates()

            # 6. Crear carpetas vacías
            print("\n📁 Creando estructura de carpetas...")
            carpetas_creadas = self._crear_carpetas_vacias()

            # 7. Limpiar temporales
            self._limpiar_temporales()

            # 8. Reporte final
            print("\n" + "═" * 60)
            print("✅ DESPLIEGUE COMPLETADO")
            print("═" * 60)
            print(f"  • Archivos copiados: {archivos_copiados}")
            print(f"  • Templates procesados: {archivos_procesados}")
            print(f"  • Carpetas creadas: {carpetas_creadas}")
            print(f"  • Variables reemplazadas: {len(self.variables)}")
            print()
            print("💡 Próximos pasos:")
            print("   1. cd " + str(self.target))
            print("   2. just iniciar")
            print("   3. just ayuda")
            print()

            return True

        except Exception as e:
            print(f"\n❌ Error durante el despliegue: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _validar_precondiciones(self) -> bool:
        """Valida que se puede ejecutar el despliegue"""

        # Verificar que el ZIP existe
        if not self.templates_zip.exists():
            print(f"❌ ZIP de templates no encontrado: {self.templates_zip}")
            print(f"   Buscar en: .claude/templates/fabrica-templates.zip")
            return False

        # Verificar que target es un directorio
        if not self.target.exists():
            print(f"❌ Directorio destino no existe: {self.target}")
            return False

        if not self.target.is_dir():
            print(f"❌ Target no es un directorio: {self.target}")
            return False

        # Verificar que no esté ya inicializado
        archivos_criticos = [
            self.target / "fabrica" / "justfile",
            self.target / "fabrica" / "buzon_agente" / "vigilante.py"
        ]

        for archivo in archivos_criticos:
            if archivo.exists():
                print(f"⚠️  Proyecto ya inicializado (existe {archivo.name})")
                respuesta = input("¿Sobrescribir? (s/N): ")
                if respuesta.lower() != 's':
                    print("❌ Cancelado por el usuario")
                    return False
                break

        return True

    def _detectar_variables(self) -> Dict[str, str]:
        """Detecta variables del proyecto"""

        # Nombre del proyecto (nombre del directorio)
        project_name = self.target.name

        # Stack tecnológico
        if self.stack == 'auto':
            stack = self._detectar_stack()
        else:
            stack = self.stack

        # Complejidad
        if self.complejidad == 'auto':
            complejidad = self._detectar_complejidad()
        else:
            complejidad = self.complejidad

        return {
            'PROJECT_NAME': project_name,
            'PROJECT_PATH': str(self.target),
            'STACK': stack,
            'COMPLEJIDAD': complejidad,
            'DATE': datetime.now().strftime('%Y-%m-%d'),
            'VERSION': '0.1.0'
        }

    def _detectar_stack(self) -> str:
        """Detecta stack tecnológico del proyecto"""

        indicadores = [
            ('package.json', 'node'),
            ('requirements.txt', 'python'),
            ('Pipfile', 'python'),
            ('pom.xml', 'java'),
            ('build.gradle', 'java'),
            ('Cargo.toml', 'rust'),
            ('go.mod', 'go'),
            ('manifest.json', 'generic')  # Chrome extension
        ]

        for archivo, stack in indicadores:
            if (self.target / archivo).exists():
                return stack

        return 'generic'

    def _detectar_complejidad(self) -> str:
        """Detecta complejidad del proyecto por número de archivos"""

        try:
            # Contar archivos (excluyendo .git, node_modules, etc.)
            archivos = list(self.target.rglob('*'))
            archivos = [
                f for f in archivos
                if f.is_file() and
                '.git' not in f.parts and
                'node_modules' not in f.parts and
                '__pycache__' not in f.parts
            ]

            total = len(archivos)

            if total < 10:
                return 'MINI'
            elif total < 100:
                return 'STANDARD'
            else:
                return 'EPIC'
        except:
            return 'MINI'

    def _mostrar_variables(self):
        """Muestra las variables detectadas"""
        print("\n  Variables detectadas:")
        for var, valor in self.variables.items():
            print(f"    {var}: {valor}")

    def _descomprimir_templates(self) -> bool:
        """Descomprime ZIP de templates a directorio temporal"""

        try:
            # Crear directorio temporal
            import tempfile
            self.temp_dir = Path(tempfile.mkdtemp(prefix='fabrica_'))

            # Descomprimir
            with zipfile.ZipFile(self.templates_zip, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)

            print(f"  ✓ Templates descomprimidos en: {self.temp_dir}")
            return True

        except Exception as e:
            print(f"  ✗ Error al descomprimir: {e}")
            return False

    def _desplegar_estructura(self) -> int:
        """Copia archivos sin cambios (Python scripts)"""

        # Archivos a copiar directamente (sin reemplazo de variables)
        archivos_directos = [
            'fabrica/buzon_agente/vigilante.py',
            'fabrica/scripts/inicializar_fabrica.py',
            'fabrica/scripts/concluir_expediente.py',
            'fabrica/scripts/turno_noche.py',
            'fabrica/deploy/gestor_habilidades.py',
            'fabrica/deploy/gestor_worktrees.py'
        ]

        contador = 0
        for archivo_rel in archivos_directos:
            origen = self.temp_dir / archivo_rel
            destino = self.target / archivo_rel

            if origen.exists():
                destino.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(origen, destino)
                print(f"  ✓ {archivo_rel}")
                contador += 1
            else:
                print(f"  ⚠ No encontrado: {archivo_rel}")

        return contador

    def _procesar_templates(self) -> int:
        """Procesa templates con reemplazo de variables"""

        # Archivos template (con extensión .template)
        templates = list(self.temp_dir.rglob('*.template'))

        contador = 0
        for template_path in templates:
            # Calcular ruta relativa y destino
            rel_path = template_path.relative_to(self.temp_dir)
            destino_path = self.target / str(rel_path).replace('.template', '')

            # Leer contenido
            contenido = template_path.read_text(encoding='utf-8')

            # Reemplazar variables
            for var, valor in self.variables.items():
                contenido = contenido.replace(f'{{{{{var}}}}}', valor)

            # Escribir destino
            destino_path.parent.mkdir(parents=True, exist_ok=True)
            destino_path.write_text(contenido, encoding='utf-8')

            print(f"  ✓ {rel_path} → {destino_path.name}")
            contador += 1

        return contador

    def _crear_carpetas_vacias(self) -> int:
        """Crea carpetas vacías necesarias"""

        carpetas = [
            'fabrica/ramas_paralelas',
            'fabrica/buzon_agente/entrada',
            'fabrica/buzon_agente/taller_activo',
            'fabrica/buzon_agente/archivo_concluido',
            'docs/plans',
            'docs/adr',
            '.claude/commands',
            '.claude/skills',
            'src'
        ]

        contador = 0
        for carpeta_rel in carpetas:
            carpeta = self.target / carpeta_rel
            if not carpeta.exists():
                carpeta.mkdir(parents=True, exist_ok=True)
                # Crear .gitkeep
                (carpeta / '.gitkeep').touch()
                contador += 1

        print(f"  ✓ {contador} carpetas creadas")
        return contador

    def _limpiar_temporales(self):
        """Limpia directorio temporal"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

# ==============================================================================
# CLI
# ==============================================================================

def main():
    """Función principal CLI"""

    parser = argparse.ArgumentParser(
        description='Desplegador de Fábrica Agéntica v2.0',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
    # Despliegue automático
    python inicializa.py --target /ruta/proyecto

    # Con stack específico
    python inicializa.py --target /ruta/proyecto --stack python

    # Con complejidad específica
    python inicializa.py --target /ruta/proyecto --complejidad STANDARD

    # Con ZIP custom
    python inicializa.py --target /ruta/proyecto --templates-zip mi-templates.zip
        """
    )

    parser.add_argument(
        '--target',
        required=True,
        help='Directorio destino del proyecto'
    )

    parser.add_argument(
        '--stack',
        default='auto',
        choices=['auto', 'python', 'node', 'java', 'rust', 'go', 'generic'],
        help='Stack tecnológico (default: auto)'
    )

    parser.add_argument(
        '--complejidad',
        default='auto',
        choices=['auto', 'MINI', 'STANDARD', 'EPIC'],
        help='Nivel de complejidad (default: auto)'
    )

    parser.add_argument(
        '--templates-zip',
        default=None,
        help=f'Ruta al ZIP de templates (default: {DEFAULT_TEMPLATES_ZIP})'
    )

    parser.add_argument(
        '--version',
        action='version',
        version=f'inicializa.py v{VERSION}'
    )

    args = parser.parse_args()

    # Determinar ruta del ZIP
    if args.templates_zip:
        templates_zip = Path(args.templates_zip)
    else:
        # Buscar en orden de prioridad
        rutas_busqueda = [
            # 1. Junto al script (ubicación centralizada)
            Path(__file__).parent / DEFAULT_TEMPLATES_ZIP,
            # 2. En .claude/templates/ del proyecto destino
            Path(args.target).resolve() / '.claude' / 'templates' / DEFAULT_TEMPLATES_ZIP,
            # 3. En .claude/templates/ del directorio actual
            Path.cwd() / '.claude' / 'templates' / DEFAULT_TEMPLATES_ZIP,
            # 4. Ubicación centralizada de red (TRAYLESA)
            Path(r'Z:\Aplicaciones\.claude\templates') / DEFAULT_TEMPLATES_ZIP,
            Path(r'\\192.168.100.169\automatiza\Aplicaciones\.claude\templates') / DEFAULT_TEMPLATES_ZIP,
        ]

        templates_zip = rutas_busqueda[0]  # Default
        for ruta in rutas_busqueda:
            if ruta.exists():
                templates_zip = ruta
                break

    # Crear desplegador y ejecutar
    deployer = FabricaDeployer(
        target_path=args.target,
        templates_zip=templates_zip,
        stack=args.stack,
        complejidad=args.complejidad
    )

    success = deployer.deploy()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
