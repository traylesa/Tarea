# PowerShell script para lanzar Claude con prompt automatico
Set-Location 'Z:\Aplicaciones\Extensiones Chrome\PruebaInicializa4'

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   EXPEDIENTE: Recomendaciones2y3_20260215_214727" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lanzando Claude con prompt automatico..." -ForegroundColor Green
Write-Host ""

claude --dangerously-skip-permissions 'Lee INSTRUCCIONES_AGENTE.md en fabrica/buzon_agente/taller_activo/Recomendaciones2y3_20260215_214727/ y ejecuta TODAS las fases del expediente de forma automatica y secuencial: 1. 00_ESTRATEGIA: Definir objetivo, alcance y estrategia general. 2. 01_ANALISIS: Analizar requisitos funcionales y no funcionales. 3. 03_PLAN: Crear plan detallado de implementación. 4. 04_DISENO: Diseñar arquitectura y modelo de datos. 5. 05_RESULTADO: Implementar código con tests. 6. 06_VALIDACION: Validar requisitos y ejecutar QA. 7. 07_DESPLIEGUE: Desplegar a producción. 8. 08_OPERACION: Monitorear y dar soporte. IMPORTANTE: (a) Respetar puertas de validacion entre fases (NO avanzar sin cumplir checklist). (b) En fase 05_RESULTADO debes ESCRIBIR CODIGO REAL en src/ siguiendo TDD (test primero, codigo despues). (c) Consulta docs/DICCIONARIO_DOMINIO.md ANTES de crear nombres nuevos. (d) Cada archivo de fase debe tener contenido REAL y completo, no placeholders. (e) Al finalizar todas las fases ejecuta: just concluir Recomendaciones2y3_20260215_214727'
