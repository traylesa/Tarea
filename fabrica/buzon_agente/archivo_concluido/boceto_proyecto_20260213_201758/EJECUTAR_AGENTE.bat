@echo off
echo ============================================
echo   Expediente: boceto_proyecto_20260213_201758
echo   Lanzando Claude con playbook operacional...
echo ============================================
echo.
cd /d "Z:\Aplicaciones\Extensiones Chrome\PruebaInicializa4"
claude --dangerously-skip-permissions "Lee el archivo INSTRUCCIONES_AGENTE.md en fabrica/buzon_agente/taller_activo/boceto_proyecto_20260213_201758/ (es tu playbook operacional completo). Este archivo contiene: (1) Clasificación del expediente, (2) Camino estratégico asignado, (3) Lista de fases a ejecutar en orden, (4) Playbook detallado de cada fase con objetivos, entradas, salidas y checklists. IMPORTANTE: (a) Ejecuta SOLO las fases marcadas como APLICA, (b) Respeta el orden numérico de fases, (c) Consulta docs/DICCIONARIO_DOMINIO.md ANTES de crear nombres nuevos, (d) Completa cada archivo de fase con contenido real (no dejes placeholders), (e) Al completar todas las fases ejecuta: just concluir boceto_proyecto_20260213_201758"
pause
