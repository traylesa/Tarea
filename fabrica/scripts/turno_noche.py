#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Turno Nocturno v2.0
Automatización programada para tareas de mantenimiento

Tareas realizadas:
- Limpieza de logs antiguos (> 30 días)
- Backup de expedientes concluidos
- Generación de reporte semanal
- Limpieza de archivos temporales

Uso:
    python fabrica/scripts/turno_noche.py

    O programar con cron/Task Scheduler:
    # Linux/Mac (crontab -e)
    0 3 * * * cd /ruta/proyecto && python fabrica/scripts/turno_noche.py

    # Windows Task Scheduler:
    Acción: python
    Argumentos: fabrica\scripts\turno_noche.py
    Iniciar en: Z:\Aplicaciones\Extensiones Chrome\pruebainicializa
"""

import os
import shutil
from pathlib import Path
from datetime import datetime, timedelta

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

RAIZ = Path(__file__).parent.parent.parent
DIR_LOGS = RAIZ / "logs"
DIR_ARCHIVO = RAIZ / "fabrica" / "buzon_agente" / "archivo_concluido"
DIR_BACKUPS = RAIZ / "backups"
LOG_TURNO = RAIZ / "fabrica" / "buzon_agente" / "turno_noche.log"

DIAS_RETENER_LOGS = 30
DIAS_RETENER_BACKUPS = 90

# ==============================================================================
# LOGGING
# ==============================================================================

def log(mensaje: str):
    """Log simple con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    linea = f"[{timestamp}] {mensaje}\n"

    # Escribir a archivo
    LOG_TURNO.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_TURNO, "a", encoding="utf-8") as f:
        f.write(linea)

    # Mostrar en consola
    print(linea.strip())

# ==============================================================================
# TAREAS DE MANTENIMIENTO
# ==============================================================================

def limpiar_logs_antiguos():
    """Elimina logs con más de 30 días"""
    log("🧹 Limpiando logs antiguos...")

    if not DIR_LOGS.exists():
        log("   ⏭️  No hay carpeta logs/")
        return

    fecha_limite = datetime.now() - timedelta(days=DIAS_RETENER_LOGS)
    archivos_eliminados = 0

    for archivo in DIR_LOGS.rglob("*.log"):
        try:
            fecha_mod = datetime.fromtimestamp(archivo.stat().st_mtime)
            if fecha_mod < fecha_limite:
                archivo.unlink()
                archivos_eliminados += 1
        except Exception as e:
            log(f"   ⚠️  Error al procesar {archivo.name}: {e}")

    log(f"   ✓ {archivos_eliminados} logs eliminados")


def backup_expedientes_concluidos():
    """Crea backup de expedientes concluidos"""
    log("💾 Creando backup de expedientes...")

    if not DIR_ARCHIVO.exists():
        log("   ⏭️  No hay expedientes concluidos")
        return

    expedientes = list(DIR_ARCHIVO.iterdir())
    if not expedientes:
        log("   ⏭️  Carpeta archivo_concluido/ vacía")
        return

    DIR_BACKUPS.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo_backup = DIR_BACKUPS / f"expedientes_{timestamp}.tar.gz"

    try:
        shutil.make_archive(
            str(archivo_backup.with_suffix("")),
            "gztar",
            DIR_ARCHIVO
        )
        tamano_mb = archivo_backup.stat().st_size / (1024 * 1024)
        log(f"   ✓ Backup creado: {archivo_backup.name} ({tamano_mb:.2f} MB)")
    except Exception as e:
        log(f"   ❌ Error al crear backup: {e}")


def limpiar_backups_antiguos():
    """Elimina backups con más de 90 días"""
    log("🧹 Limpiando backups antiguos...")

    if not DIR_BACKUPS.exists():
        log("   ⏭️  No hay carpeta backups/")
        return

    fecha_limite = datetime.now() - timedelta(days=DIAS_RETENER_BACKUPS)
    archivos_eliminados = 0

    for archivo in DIR_BACKUPS.glob("*.tar.gz"):
        try:
            fecha_mod = datetime.fromtimestamp(archivo.stat().st_mtime)
            if fecha_mod < fecha_limite:
                archivo.unlink()
                archivos_eliminados += 1
        except Exception as e:
            log(f"   ⚠️  Error al procesar {archivo.name}: {e}")

    log(f"   ✓ {archivos_eliminados} backups eliminados")


def limpiar_temporales():
    """Elimina archivos temporales del proyecto"""
    log("🧹 Limpiando archivos temporales...")

    patrones = ["*.tmp", "*.pyc", "__pycache__", ".DS_Store"]
    archivos_eliminados = 0

    for patron in patrones:
        for archivo in RAIZ.rglob(patron):
            try:
                if archivo.is_dir():
                    shutil.rmtree(archivo)
                else:
                    archivo.unlink()
                archivos_eliminados += 1
            except Exception as e:
                log(f"   ⚠️  Error al eliminar {archivo.name}: {e}")

    log(f"   ✓ {archivos_eliminados} archivos temporales eliminados")


def generar_reporte():
    """Genera reporte de estadísticas del proyecto"""
    log("📊 Generando reporte de estadísticas...")

    estadisticas = {
        "expedientes_activos": len(list((RAIZ / "fabrica" / "buzon_agente" / "taller_activo").glob("*"))) if (RAIZ / "fabrica" / "buzon_agente" / "taller_activo").exists() else 0,
        "expedientes_concluidos": len(list(DIR_ARCHIVO.glob("*"))) if DIR_ARCHIVO.exists() else 0,
        "skills": len(list((RAIZ / ".claude" / "skills").glob("*.md"))) if (RAIZ / ".claude" / "skills").exists() else 0,
        "plans": len(list((RAIZ / "docs" / "plans").glob("*.md"))) if (RAIZ / "docs" / "plans").exists() else 0,
    }

    log(f"   • Expedientes activos: {estadisticas['expedientes_activos']}")
    log(f"   • Expedientes concluidos: {estadisticas['expedientes_concluidos']}")
    log(f"   • Skills disponibles: {estadisticas['skills']}")
    log(f"   • Plans documentados: {estadisticas['plans']}")

# ==============================================================================
# MAIN
# ==============================================================================

def main():
    """Función principal"""
    log("═" * 60)
    log("🌙 TURNO NOCTURNO - Mantenimiento Automático")
    log("═" * 60)

    limpiar_logs_antiguos()
    backup_expedientes_concluidos()
    limpiar_backups_antiguos()
    limpiar_temporales()
    generar_reporte()

    log("═" * 60)
    log("✅ Turno nocturno completado")
    log("═" * 60)


if __name__ == "__main__":
    main()
