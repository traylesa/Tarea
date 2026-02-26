# Plan: Columna "Sin Fase" en Kanban
                                                                                                    Contexto
                                                                                                   
 Cuando un correo se procesa, entra con fase = '' y estado = NUEVO (o el estado inicial            
 configurado). En el Kanban estos registros van a grupos.sin_columna (kanban.js:55) pero nunca se 
 renderizan porque renderKanban() solo itera COLUMNAS_KANBAN (7 columnas con fases definidas). Los
  registros "desaparecen" del tablero hasta que alguien les asigna fase desde la tabla.

 Objetivo: Crear una columna "Sin Fase" al inicio del Kanban como punto de partida para
 clasificar/repartir registros nuevos. Colapsable como las demás.

 ---
 Análisis de repercusiones

 Filtros

 - filtroFases() en filters.js ya soporta __SIN_FASE__ marker → funciona sin cambios
 - _filtrarParaKanban() aplica filtroFases(fasesCardActivas) a todos los registros ANTES de        
 agrupar → los registros sin fase se filtrarán correctamente si __SIN_FASE__ está activo en los    
 filtros
 - Las tarjetas de fase del panel ya renderizan "(Sin fase)" → no requiere cambios

 Drag & Drop

 - Desde "Sin Fase" a otra columna: resolverFaseAlMover() ya asigna columna.fases[0] → funciona    
 - Desde otra columna a "Sin Fase": Necesita manejar sin_fase especialmente → limpiar la fase a '' 
 - Dentro de "Sin Fase": Reorganizar swimlanes por estado → funciona igual que las demás

 Conteos

 - calcularConteos() y calcularConteosDual() iteran Object.keys() del objeto agrupado → ya
 incluyen sin_columna → funcionará automáticamente si renombramos a sin_fase

 Colapso

 - Sistema de colapso usa _kanbanColumnasColapsadas[col.id] → automático para nueva columna        
 - Persistente en chrome.storage.local → funciona sin cambios

 Móvil

 - src/movil/js/views/kanban.js usa la misma lógica agruparPorColumna() y itera COLUMNAS_KANBAN →  
 mismo cambio necesario

 ---
 Implementación

 1. src/extension/kanban.js — Lógica pura (sin DOM)

 a) Añadir columna sin_fase al INICIO de COLUMNAS_KANBAN:
 var COLUMNAS_KANBAN = [
   { id: 'sin_fase',   nombre: 'Sin Fase',    fases: [],              orden: 0 },
   { id: 'espera',     nombre: 'Espera',      fases: ['00','01','02'], orden: 1 },
   // ... resto igual
 ];

 b) Modificar agruparPorColumna(): usar sin_fase en vez de sin_columna
 // Antes: grupos.sin_columna = [];
 // Después: sin_columna ya no se necesita, los registros sin fase van a grupos.sin_fase (por el   
 array vacío de fases, ninguna fase mapea ahí, pero el else los captura)
 Realmente el mapa _FASE_A_COLUMNA no mapea nada a sin_fase (porque fases: []), así que el else en 
  agruparPorColumna sigue enviando registros sin fase reconocida al grupo correcto. Pero
 necesitamos renombrar sin_columna → sin_fase:
 grupos.sin_fase = [];  // en vez de grupos.sin_columna
 // y en el else: grupos.sin_fase.push(r);

 c) Modificar resolverFaseAlMover(): manejar destino sin_fase
 function resolverFaseAlMover(columnaDestinoId, faseActual) {
   if (columnaDestinoId === 'sin_fase') return '';  // Limpiar fase
   var columna = COLUMNAS_KANBAN.find(...);
   // ...resto igual
 }

 2. src/extension/panel-kanban.js — Renderizado (con DOM)

 a) En renderKanban(), la columna sin_fase ya es parte de COLUMNAS_KANBAN → se renderizará
 automáticamente en la iteración COLUMNAS_KANBAN.forEach()

 b) Añadir toggle para mostrar/ocultar (como _kanbanMostrarEspera):
 - Variable _kanbanMostrarSinFase = true (visible por defecto)
 - Chip toggle en la barra de controles
 - En el forEach: if (col.id === 'sin_fase' && !_kanbanMostrarSinFase) return;

 c) El colapso ya funciona automáticamente (usa col.id como clave)

 3. src/extension/kanban.css — Estilos

 Añadir estilo visual diferenciado para la columna "Sin Fase":
 - Fondo ligeramente distinto (gris claro o punteado) para indicar "bandeja de entrada"
 - Borde izquierdo con color identificativo

 4. src/movil/js/views/kanban.js — Kanban móvil

 - La columna aparecerá automáticamente al estar en COLUMNAS_KANBAN
 - Añadir chip toggle para sin_fase
 - Ocultos por defecto: misma lógica que escritorio

 5. tests/TDD/unit/test_kanban.js — Tests

 Añadir tests para:
 - agruparPorColumna() con registros sin fase → van a sin_fase
 - resolverFaseAlMover('sin_fase', '19') → retorna ''
 - resolverFaseAlMover('espera', '') → retorna '00'
 - calcularConteos() incluye sin_fase en resultado
 - COLUMNAS_KANBAN[0].id === 'sin_fase'

 ---
 Archivos a modificar

 Archivo: src/extension/kanban.js
 Cambio: +columna sin_fase, renombrar sin_columna, resolverFaseAlMover
 ────────────────────────────────────────
 Archivo: src/extension/panel-kanban.js
 Cambio: +toggle _kanbanMostrarSinFase, chip control
 ────────────────────────────────────────
 Archivo: src/extension/kanban.css
 Cambio: Estilo diferenciado columna sin_fase
 ────────────────────────────────────────
 Archivo: src/movil/js/views/kanban.js
 Cambio: +chip toggle sin_fase
 ────────────────────────────────────────
 Archivo: tests/TDD/unit/test_kanban.js
 Cambio: Tests nuevos para sin_fase

 Verificación

 1. npx jest tests/TDD/unit/test_kanban.js → todos pasan
 2. npx jest --no-coverage → 878+ tests pasan
 3. Extensión: recargar, abrir Tablero → columna "Sin Fase" visible al inicio con registros sin    
 fase asignada
 4. Arrastrar tarjeta de "Sin Fase" a "Espera" → fase cambia a "00"
 5. Arrastrar tarjeta de "En Ruta" a "Sin Fase" → fase se limpia a ""
 6. Colapsar/expandir "Sin Fase" → persiste tras recargar
 7. Filtro "(Sin fase)" en barra → oculta/muestra registros sin fase en tabla Y kanban
 8. Móvil: chip "Sin Fase" visible, toggle funciona