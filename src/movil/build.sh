#!/bin/bash
# build.sh - Copia modulos de extension/ a movil/lib/ para deploy autonomo
# Uso: bash build.sh (desde src/movil/)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
EXT_DIR="$SCRIPT_DIR/../extension"

echo "=== Build TareaLog Movil ==="

# Limpiar y crear lib/
rm -rf "$LIB_DIR"
mkdir -p "$LIB_DIR"

# Lista de modulos necesarios (mismo orden que index.html)
MODULOS=(
  constants.js
  date-utils.js
  alerts.js
  templates.js
  filters.js
  reminders.js
  sequences.js
  notes.js
  fases-config.js
  estados-config.js
  action-bar.js
  action-rules.js
  bulk-reply.js
  dashboard.js
  action-log.js
  shift-report.js
  alert-summary.js
  resilience.js
)

# Copiar cada modulo
for mod in "${MODULOS[@]}"; do
  if [ -f "$EXT_DIR/$mod" ]; then
    cp "$EXT_DIR/$mod" "$LIB_DIR/$mod"
    echo "  OK: $mod"
  else
    echo "  FALTA: $mod"
  fi
done

# Reescribir rutas en index.html
sed -i 's|src="../extension/|src="./lib/|g' "$SCRIPT_DIR/index.html"

echo ""
echo "=== Build completado ==="
echo "Modulos copiados: ${#MODULOS[@]}"
echo "Destino: $LIB_DIR"
echo ""
echo "Para desplegar:"
echo "  1. Sube la carpeta src/movil/ completa a GitHub Pages"
echo "  2. O usa: cd src/movil && python -m http.server 8080"
