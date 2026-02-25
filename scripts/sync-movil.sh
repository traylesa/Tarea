#!/bin/bash
# sync-movil.sh - Sincroniza src/movil/ al repo tarealog-movil para Cloudflare Pages
# Uso: bash scripts/sync-movil.sh [mensaje-commit]
set -e

PROYECTO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOVIL_SRC="$PROYECTO_DIR/src/movil"
SHARED_SRC="$PROYECTO_DIR/src/shared"
DEPLOY_DIR="$PROYECTO_DIR/../tarealog-movil-sync"
REPO_URL="git@github.com:traylesa/tarealog-movil.git"

echo "=== Sync TareaLog Movil ==="

# 1. Verificar o clonar repo deploy
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "Clonando repo deploy..."
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"
git pull origin main --rebase 2>/dev/null || true

# 2. Copiar archivos movil (preservando _headers, build.sh, update.html)
echo "Copiando archivos..."

# JS propios
cp "$MOVIL_SRC/js/app.js" js/app.js
cp "$MOVIL_SRC/js/api.js" js/api.js
cp "$MOVIL_SRC/js/store.js" js/store.js
cp "$MOVIL_SRC/js/feedback.js" js/feedback.js
cp "$MOVIL_SRC/js/logic/action-resolver.js" js/logic/action-resolver.js
cp "$MOVIL_SRC/js/components/"*.js js/components/
cp "$MOVIL_SRC/js/views/"*.js js/views/

# Libs de extension
cp "$MOVIL_SRC/lib/"*.js lib/
cp "$MOVIL_SRC/lib/sortable/Sortable.min.js" lib/sortable/Sortable.min.js

# CSS
cp "$MOVIL_SRC/css/"*.css css/

# Shared
mkdir -p shared
cp "$SHARED_SRC/visual-status.css" shared/

# Raiz (index, sw, manifest, icons)
cp "$MOVIL_SRC/sw.js" sw.js
cp "$MOVIL_SRC/manifest.json" manifest.json
cp "$MOVIL_SRC/index.html" index.html

# Fix: ruta shared para deploy (raiz, no ../shared/)
sed -i 's|"\.\./shared/|"shared/|g' index.html

# 3. Verificar diferencias
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "Sin cambios. Ya sincronizado."
  exit 0
fi

# 4. Commit y push
MSG="${1:-sync: actualizar desde PruebaInicializa4}"
git add -A
git commit -m "$MSG"
git push origin main

echo ""
echo "=== Sync completado ==="
echo "Cloudflare Pages desplegara automaticamente."
echo "URL: https://tarealog-movil.pages.dev"
