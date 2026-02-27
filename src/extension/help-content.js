/**
 * help-content.js - Contenido del panel de ayuda
 * Guia de usuario organizada por secciones.
 */

var SECCIONES = [
  {
    id: 'inicio',
    titulo: 'Inicio rapido',
    contenido:
      '<h3>Bienvenido a TareaLog</h3>' +
      '<p>TareaLog te ayuda a gestionar las cargas de transporte desde tu correo Gmail. ' +
      'Extrae automaticamente los datos de los emails y los organiza en una tabla interactiva.</p>' +

      '<h4>Primeros pasos</h4>' +
      '<ol>' +
      '<li>Ve a la pestana <strong>Config</strong> y agrega tu servicio GAS (URL del Web App).</li>' +
      '<li>Configura la <strong>hoja de calculo</strong> destino (pega la URL de tu Google Sheet).</li>' +
      '<li>Ajusta la <strong>busqueda Gmail</strong> si necesitas filtrar correos especificos.</li>' +
      '<li>Pulsa <strong>Ejecutar Ahora</strong> para lanzar el primer barrido.</li>' +
      '</ol>' +

      '<h4>Pestanas de la aplicacion</h4>' +
      '<ul>' +
      '<li><strong>Datos</strong> — Tabla principal con todos los registros, filtros y acciones.</li>' +
      '<li><strong>Tablero</strong> — Vista Kanban tipo Trello con las cargas organizadas por fase.</li>' +
      '<li><strong>Plantillas</strong> — Crea y gestiona plantillas de respuesta con variables.</li>' +
      '<li><strong>Config</strong> — Servicios GAS, hoja destino, apariencia, fases, reglas y mas.</li>' +
      '<li><strong>? (Ayuda)</strong> — Esta guia.</li>' +
      '</ul>' +

      '<h4>App movil (PWA)</h4>' +
      '<p>TareaLog cuenta con una version movil accesible desde <strong>tarealog-movil.pages.dev</strong>. ' +
      'Incluye tablero Kanban con drag &amp; drop tactil, detalle de carga, cambio de fase/estado, ' +
      'respuesta rapida, recordatorios, notas y envios programados. ' +
      'Funciona offline y se actualiza automaticamente.</p>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> El barrido automatico sincroniza tus correos ' +
      'cada 15 minutos. Puedes cambiar el intervalo en Config.</div>'
  },
  {
    id: 'tabla',
    titulo: 'Tabla y edicion',
    contenido:
      '<h3>Tabla de registros</h3>' +
      '<p>La tabla muestra tus cargas con mas de 20 columnas. Puedes interactuar de varias formas:</p>' +

      '<h4>Edicion directa</h4>' +
      '<ul>' +
      '<li><strong>Doble click</strong> en una celda para editarla (fase, estado, transportista, fechas logisticas, etc.).</li>' +
      '<li>Los campos <strong>fCarga, hCarga, fEntrega, hEntrega</strong> son editables directamente en la tabla.</li>' +
      '<li>Los cambios se guardan automaticamente en la hoja de calculo y se propagan al hilo completo.</li>' +
      '</ul>' +

      '<h4>Ordenar y redimensionar</h4>' +
      '<ul>' +
      '<li>Click en la <strong>cabecera</strong> de cualquier columna para ordenar.</li>' +
      '<li>Arrastra el <strong>borde</strong> de una cabecera para redimensionar.</li>' +
      '<li>Click derecho en cabecera para <strong>ocultar/mostrar</strong> columnas.</li>' +
      '<li>La rejilla tiene <strong>preferencias por defecto</strong> (orden, anchos y visibilidad predefinidos) que se aplican en la primera carga.</li>' +
      '</ul>' +

      '<h4>Busqueda global</h4>' +
      '<p>Escribe en el campo <strong>"Buscar en todos los campos..."</strong> para filtrar al instante ' +
      'por cualquier dato: codigo de carga, transportista, email, asunto, etc.</p>' +

      '<h4>Agrupar por hilo</h4>' +
      '<p>Pulsa <strong>Agrupar por hilo</strong> para ver los correos agrupados por conversacion. ' +
      'Click en la cabecera del grupo para expandir o colapsar.</p>' +

      '<h4>Herencia en hilos</h4>' +
      '<p>Cuando llega un nuevo correo dentro de un hilo existente, TareaLog hereda automaticamente ' +
      'la <strong>fase, estado y codigo de carga</strong> del ultimo registro de ese hilo. ' +
      'Asi no necesitas reasignar datos manualmente en cada respuesta de la conversacion.</p>' +
      '<p>La prioridad de herencia es: adjunto (AUTOMATICA) &gt; ThreadManager (HILO) &gt; SEGUIMIENTO (HILO). ' +
      'Si el registro tiene alerta, esta prevalece siempre sobre el estado heredado.</p>' +

      '<h4>Seleccion multiple y edicion masiva</h4>' +
      '<p>Marca las casillas de la primera columna para seleccionar varios registros. ' +
      'Aparecera el panel de <strong>edicion masiva</strong> donde puedes cambiar <strong>fase y/o estado</strong> a todos a la vez. ' +
      'Los cambios se propagan al hilo completo de cada registro seleccionado.</p>'
  },
  {
    id: 'filtros',
    titulo: 'Filtros',
    contenido:
      '<h3>Filtros avanzados</h3>' +
      '<p>Pulsa el boton <strong>Filtros</strong> para abrir el panel con tarjetas colapsables. ' +
      'Los filtros se comparten entre la tabla <strong>Datos</strong> y el <strong>Tablero</strong> Kanban.</p>' +

      '<h4>1. Fechas</h4>' +
      '<p>Filtra por rango en tres tipos de fecha:</p>' +
      '<ul>' +
      '<li><strong>Correo</strong> — Fecha de recepcion del email.</li>' +
      '<li><strong>Carga</strong> — Fecha programada de carga.</li>' +
      '<li><strong>Entrega</strong> — Fecha de entrega/descarga.</li>' +
      '</ul>' +
      '<p>Marca la casilla del tipo de fecha para activar el rango. ' +
      'Marca <strong>"Sin fecha"</strong> para incluir tambien registros sin fecha en ese campo.</p>' +

      '<h4>2. Tarjetas de fases</h4>' +
      '<p>Cada fase logistica tiene una <strong>tarjeta</strong> (card). Funcionan como filtros interactivos:</p>' +
      '<ul>' +
      '<li><strong>Click en una tarjeta</strong> — La activa (resaltada en azul). Solo se muestran las cargas en esas fases.</li>' +
      '<li><strong>Click de nuevo</strong> — La desactiva. Si no hay ninguna activa, se muestran todas.</li>' +
      '<li>Las fases <strong>criticas</strong> (incidencias 05, 25) se destacan en rojo.</li>' +
      '<li><strong>"Sin fase"</strong> (borde punteado) — Filtra registros que no tienen fase asignada.</li>' +
      '</ul>' +
      '<p>Botones de control rapido:</p>' +
      '<ul>' +
      '<li><strong>Marcar Todas</strong> — Activa todas las tarjetas de fase de una vez.</li>' +
      '<li><strong>Desmarcar Todas</strong> — Desactiva todas (equivale a mostrar todo).</li>' +
      '</ul>' +

      '<h4>3. Tarjetas de estados</h4>' +
      '<p>Funcionan igual que las tarjetas de fases pero filtran por <strong>estado</strong> del registro:</p>' +
      '<ul>' +
      '<li><strong>Click</strong> — Activa/desactiva el estado. Cada estado tiene su propio color.</li>' +
      '<li>Se pueden combinar: activa PENDIENTE + ALERTA para ver solo esos estados.</li>' +
      '<li>Sin ninguno activo, se muestran todos los estados.</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Las tarjetas de fases y estados muestran un <strong>contador</strong> ' +
      'con el numero de registros en cada fase/estado. Util para ver la distribucion rapida.</div>' +

      '<h4>4. Filtros rapidos (baterias)</h4>' +
      '<p>Botones predefinidos de un solo click:</p>' +
      '<ul>' +
      '<li><strong>Alertas activas</strong> — Registros con alerta.</li>' +
      '<li><strong>Sin vincular</strong> — Correos sin codigo de carga.</li>' +
      '<li><strong>Incidencias</strong> — Fases 05 y 25.</li>' +
      '<li><strong>En proceso</strong> — Fases 01 a 28 (todo lo que esta activo).</li>' +
      '<li><strong>Completados</strong> — Fases 19, 29, 30.</li>' +
      '</ul>' +

      '<h4>5. Filtros personalizados</h4>' +
      '<p>Pulsa <strong>"+ Agregar filtro"</strong> para crear condiciones a medida:</p>' +
      '<ol>' +
      '<li>Selecciona el <strong>campo</strong> (transportista, zona, referencia, bandeja, interlocutor...).</li>' +
      '<li>Elige el <strong>operador</strong> (contiene, no contiene, igual, mayor, menor).</li>' +
      '<li>Escribe el <strong>valor</strong>.</li>' +
      '</ol>' +

      '<h4>Combinacion de filtros</h4>' +
      '<p>Todos los filtros se combinan con <strong>AND</strong>: un registro debe cumplir TODAS las condiciones ' +
      'para mostrarse. Por ejemplo, si activas fase "19 En ruta" + estado "PENDIENTE", solo veras cargas en ruta con estado pendiente.</p>' +
      '<ul>' +
      '<li>El <strong>badge</strong> en la barra muestra cuantos filtros tienes activos.</li>' +
      '<li><strong>"Limpiar todo"</strong> — Desactiva todos los filtros de una vez.</li>' +
      '<li>La <strong>busqueda global</strong> (campo de texto) funciona ademas de los filtros del panel.</li>' +
      '</ul>'
  },
  {
    id: 'tablero',
    titulo: 'Tablero Kanban',
    contenido:
      '<h3>Vista Kanban</h3>' +
      '<p>La pestana <strong>Tablero</strong> muestra las cargas en un tablero tipo Trello, organizadas en columnas por grupo de fase:</p>' +
      '<ul>' +
      '<li><strong>Sin fase</strong> — Registros sin fase asignada (primera columna, fondo rayado).</li>' +
      '<li><strong>Espera</strong> — Fases 00, 01, 02.</li>' +
      '<li><strong>Carga</strong> — Fases 11, 12.</li>' +
      '<li><strong>En ruta</strong> — Fase 19.</li>' +
      '<li><strong>Descarga</strong> — Fases 21, 22.</li>' +
      '<li><strong>Vacio</strong> — Fase 29.</li>' +
      '<li><strong>Incidencia</strong> — Fases 05, 25 (columna roja).</li>' +
      '<li><strong>Documentado</strong> — Fase 30 (oculto por defecto, atenuado).</li>' +
      '</ul>' +

      '<h4>Deduplicacion</h4>' +
      '<p>Si una misma carga (mismo <strong>codCar</strong>) aparece en varios correos, el tablero muestra ' +
      'solo el registro mas reciente. Esto evita tarjetas duplicadas.</p>' +

      '<h4>Tarjetas</h4>' +
      '<p>Cada tarjeta muestra:</p>' +
      '<ul>' +
      '<li><strong>Codigo de carga</strong> — En tipografia monoespaciada.</li>' +
      '<li><strong>Transportista</strong> — Nombre o email del interlocutor.</li>' +
      '<li><strong>Asunto</strong> — Dos lineas maximas del asunto del correo.</li>' +
      '<li><strong>Estado</strong> — Chip coloreado (NUEVO, PENDIENTE, GESTIONADO, etc.).</li>' +
      '<li><strong>Tiempo</strong> — Relativo (&lt;1h, 3h, 2d) + hora logistica (\u23F014:30).</li>' +
      '<li><strong>Borde izquierdo</strong> — Color segun estado del registro.</li>' +
      '<li><strong>Banner rojo</strong> — Si la carga tiene alerta activa.</li>' +
      '</ul>' +

      '<h4>Indicadores en tarjeta</h4>' +
      '<p>Iconos pequenos en la esquina inferior derecha:</p>' +
      '<ul>' +
      '<li>\uD83D\uDCDD — <strong>Notas</strong> con contador. Click para abrir.</li>' +
      '<li>\u23F0 — <strong>Recordatorio</strong> activo. Click para ver detalle.</li>' +
      '<li>\uD83D\uDCC5 — <strong>Envio programado</strong>. Click para ver detalle.</li>' +
      '</ul>' +

      '<h4>Interacciones</h4>' +
      '<ul>' +
      '<li><strong>Click en tarjeta</strong> — Abre modal con detalle completo y campos editables.</li>' +
      '<li><strong>Arrastrar (drag &amp; drop)</strong> — Mueve una carga a otra columna, cambiando su fase automaticamente.</li>' +
      '<li>Puedes soltar sobre una columna <strong>colapsada</strong>: la zona de drop sigue activa.</li>' +
      '</ul>' +

      '<h4>Detalle de tarjeta (modal)</h4>' +
      '<p>Al hacer click en una tarjeta se abre un panel con:</p>' +
      '<ul>' +
      '<li><strong>Selects</strong> — Estado y fase editables directamente.</li>' +
      '<li><strong>Fechas logisticas</strong> — F.Carga y F.Entrega con campos date + time editables.</li>' +
      '<li><strong>Indicadores clickables</strong> — Notas, recordatorio y programado.</li>' +
      '<li><strong>Botones</strong> — +Nota, +Recordatorio, Responder, Ver en tabla.</li>' +
      '</ul>' +

      '<h4>Seleccion por columna</h4>' +
      '<p>Cada cabecera de columna tiene un <strong>checkbox</strong> para seleccionar/deseleccionar ' +
      'todas las tarjetas de esa columna de una vez:</p>' +
      '<ul>' +
      '<li><strong>Marcar</strong> — Selecciona todas las tarjetas visibles de la columna.</li>' +
      '<li><strong>Desmarcar</strong> — Deselecciona todas las de la columna.</li>' +
      '<li><strong>Indeterminate</strong> — Si hay seleccion parcial, el checkbox muestra estado mixto.</li>' +
      '<li><strong>Columna vacia</strong> — Checkbox deshabilitado.</li>' +
      '<li><strong>Columna colapsada</strong> — Checkbox oculto.</li>' +
      '</ul>' +
      '<p>Tambien puedes marcar tarjetas individuales con el checkbox de cada tarjeta.</p>' +

      '<h4>Edicion masiva desde tablero</h4>' +
      '<p>Al seleccionar tarjetas aparece un panel de edicion masiva:</p>' +
      '<ul>' +
      '<li>Marca <strong>"Fase"</strong> y selecciona la nueva fase.</li>' +
      '<li>Marca <strong>"Estado"</strong> y selecciona el nuevo estado.</li>' +
      '<li>Pulsa <strong>"Aplicar (N)"</strong> para cambiar todos a la vez.</li>' +
      '<li>Pulsa <strong>"Responder"</strong> para enviar respuesta a los seleccionados.</li>' +
      '</ul>' +

      '<h4>Conteos duales</h4>' +
      '<p>Cuando hay filtros activos, el contador de cada columna muestra <strong>filtrado/total</strong> ' +
      '(ej: "3/8"). Sin filtros, muestra solo el total. Columnas con 6+ cargas resaltan el badge en naranja.</p>' +

      '<h4>Controles superiores</h4>' +
      '<ul>' +
      '<li><strong>Actualizar</strong> — Refresca el tablero con los datos actuales.</li>' +
      '<li><strong>Checkboxes de columnas</strong> — Sin Fase, Espera, Vacio, Documentado, Nada, Cerrado.</li>' +
      '<li><strong>Todas/Ninguna</strong> — Mostrar/ocultar columnas opcionales de una vez.</li>' +
      '<li><strong>Estados</strong> — Toggle swimlanes (subagrupar por estado dentro de cada columna).</li>' +
      '<li><strong>Colapso horizontal</strong> — Click en el nombre de columna para colapsarla a una barra vertical fina (44px).</li>' +
      '</ul>' +

      '<h4>Atajos de teclado (tablero)</h4>' +
      '<ul>' +
      '<li><span class="ayuda-kbd">f</span> — Enfocar busqueda global.</li>' +
      '<li><span class="ayuda-kbd">r</span> — Refrescar tablero.</li>' +
      '<li><span class="ayuda-kbd">Esc</span> — Cerrar modal de detalle.</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Los filtros de la barra (fases, estados, busqueda global) ' +
      'se aplican tambien al tablero. Es la misma barra de filtros compartida. En el tablero se ocultan ' +
      'los botones exclusivos de la tabla (Ejecutar, Agrupar, Programados, etc.).</div>'
  },
  {
    id: 'acciones',
    titulo: 'Acciones y notas',
    contenido:
      '<h3>Barra de acciones contextuales</h3>' +
      '<p>Al seleccionar <strong>una fila</strong> en la tabla, aparece una barra con acciones rapidas adaptadas a la fase actual:</p>' +

      '<h4>Acciones por fase</h4>' +
      '<ul>' +
      '<li><strong>Espera (00-02):</strong> Confirmar hora de carga, Retrasar carga.</li>' +
      '<li><strong>Carga (11-12):</strong> Solicitar posicion, Avisar destino.</li>' +
      '<li><strong>En ruta (19):</strong> Verificar ETA, Avisar destino.</li>' +
      '<li><strong>Descarga (21-22):</strong> Confirmar descarga (pasa a fase 29).</li>' +
      '<li><strong>Vacio (29):</strong> Reclamar POD, Marcar documentado (pasa a fase 30).</li>' +
      '<li><strong>Incidencia (05, 25):</strong> Solicitar detalle, Escalar responsable.</li>' +
      '</ul>' +

      '<h4>Acciones siempre disponibles</h4>' +
      '<ul>' +
      '<li><strong>Recordar</strong> — Crea un recordatorio para esta carga.</li>' +
      '<li><strong>Notas</strong> — Abre las notas asociadas a la carga.</li>' +
      '<li><strong>Vincular</strong> — Asocia manualmente un codigo de carga al registro.</li>' +
      '</ul>' +

      '<h3>Notas por carga</h3>' +
      '<p>Cada carga puede tener notas privadas. Utiles para anotar incidencias, acuerdos telefonicos o cualquier observacion.</p>' +
      '<ul>' +
      '<li>Escribe en el campo y pulsa <strong>Enter</strong> o el boton <strong>Agregar</strong>.</li>' +
      '<li>Las notas se guardan con fecha y hora automatica.</li>' +
      '<li>Las notas son <strong>inmutables</strong>: se crean nuevas, no se editan las existentes.</li>' +
      '<li>En la tabla y tablero, un indicador \uD83D\uDCDD con contador aparece si la carga tiene notas.</li>' +
      '</ul>' +

      '<h3>Vinculacion manual</h3>' +
      '<p>Si un correo no se vinculo automaticamente a una carga, puedes asociarlo manualmente:</p>' +
      '<ol>' +
      '<li>Selecciona la fila en la tabla.</li>' +
      '<li>Pulsa <strong>"Vincular"</strong> en la barra de acciones.</li>' +
      '<li>Introduce el <strong>codigo de carga</strong> numerico.</li>' +
      '<li>Pulsa <strong>"Vincular"</strong> para confirmar. Se marca como vinculacion MANUAL.</li>' +
      '</ol>'
  },
  {
    id: 'respuestas',
    titulo: 'Respuestas y plantillas',
    contenido:
      '<h3>Respuesta masiva</h3>' +
      '<p>Envia respuestas a multiples transportistas de una vez:</p>' +
      '<ol>' +
      '<li>Marca los correos con las <strong>casillas</strong> de seleccion (tabla o tablero Kanban).</li>' +
      '<li>Pulsa <strong>"Responder seleccionados"</strong> (tabla) o <strong>"Responder"</strong> (tablero).</li>' +
      '<li>Elige una <strong>plantilla</strong> o escribe un mensaje libre.</li>' +
      '<li>Revisa la <strong>previsualizacion</strong> (muestra el primer destinatario).</li>' +
      '<li>Pulsa <strong>Enviar</strong> o marca "Programar envio" para enviarlo mas tarde.</li>' +
      '</ol>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Las respuestas se envian como reply al hilo original, ' +
      'excluyendo automaticamente tu propio email (calculado via Session.getEffectiveUser). No se crea un email nuevo.</div>' +

      '<h3>Plantillas de respuesta</h3>' +
      '<p>Crea plantillas en la pestana <strong>Plantillas</strong>:</p>' +
      '<ul>' +
      '<li>Cada plantilla tiene: alias, asunto y cuerpo HTML.</li>' +
      '<li>Usa <strong>variables</strong> para personalizar: <code>{{codCar}}</code>, <code>{{nombreTransportista}}</code>, ' +
      '<code>{{referencia}}</code>, <code>{{fechaCorreo}}</code>, etc.</li>' +
      '<li>Pulsa <strong>"Variables disponibles"</strong> en el editor para ver la lista completa.</li>' +
      '<li>El boton <strong>Previsualizar</strong> muestra el resultado con datos reales.</li>' +
      '</ul>' +

      '<h4>Pie comun (firma)</h4>' +
      '<p>En la parte superior de la pestana Plantillas encontraras el <strong>pie comun</strong>. ' +
      'Es una firma global que se anade automaticamente al final de todas las respuestas.</p>' +

      '<h4>Exportar e importar</h4>' +
      '<p>Puedes exportar tus plantillas a un archivo JSON para compartirlas o hacer backup. ' +
      'Al importar, marca la casilla para incluir tambien el pie comun.</p>'
  },
  {
    id: 'alertas',
    titulo: 'Alertas',
    contenido:
      '<h3>Sistema de alertas proactivas</h3>' +
      '<p>TareaLog evalua automaticamente tus cargas despues de cada barrido y genera alertas cuando detecta situaciones que requieren atencion:</p>' +

      '<h4>Tipos de alerta (reglas R2-R6)</h4>' +
      '<ul>' +
      '<li><strong>R2 — Sin respuesta</strong> — Un transportista no ha respondido a tu email en mas de 4 horas.</li>' +
      '<li><strong>R3 — Fase estancada</strong> — Una carga lleva demasiado tiempo en la misma fase (ej: &gt;3h en posicion carga).</li>' +
      '<li><strong>R4 — Documentacion pendiente</strong> — Carga en fase 29 (vacio) sin documentar durante mas de 2 dias.</li>' +
      '<li><strong>R5 — Incidencia activa</strong> — Cualquier carga en fases 05 o 25 (siempre critica).</li>' +
      '<li><strong>R6 — Carga HOY sin orden</strong> — Carga programada para hoy sin email de confirmacion enviado.</li>' +
      '</ul>' +

      '<h4>Niveles</h4>' +
      '<ul>' +
      '<li><strong style="color:#FF0000">Critico</strong> — Incidencias y cargas urgentes.</li>' +
      '<li><strong style="color:#FF8C00">Alto</strong> — Sin respuesta, cargas HOY.</li>' +
      '<li><strong style="color:#2196F3">Medio</strong> — Documentacion, fases estancadas.</li>' +
      '</ul>' +

      '<h4>Indicadores</h4>' +
      '<ul>' +
      '<li>El <strong>icono de la extension</strong> muestra un badge con el numero de alertas y color segun gravedad.</li>' +
      '<li>Las alertas criticas y altas generan <strong>notificaciones</strong> de Chrome.</li>' +
      '<li>Las alertas se <strong>deduplican</strong> por ID + cooldown configurable para evitar spam.</li>' +
      '</ul>' +

      '<h4>Resumen matutino</h4>' +
      '<p>Una vez al dia (a la hora configurada, por defecto 08:00), se abre automaticamente una ventana con el <strong>resumen de alertas</strong> ' +
      'organizado por categorias: Urgente, Sin respuesta, Documentacion, Fases estancadas.</p>' +
      '<p>Tambien puedes abrirlo manualmente con el boton <strong>"Resumen"</strong>.</p>' +
      '<p>Desde el resumen, pulsa <strong>"Ver"</strong> en cualquier categoria para abrir el panel con los filtros ya aplicados (click-through).</p>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Puedes ajustar los umbrales de cada alerta ' +
      'y la hora del resumen matutino en la pestana Config.</div>'
  },
  {
    id: 'recordatorios',
    titulo: 'Recordatorios',
    contenido:
      '<h3>Recordatorios con snooze</h3>' +
      '<p>Crea recordatorios personales asociados a una carga para no olvidar seguimientos:</p>' +

      '<h4>Crear un recordatorio</h4>' +
      '<ol>' +
      '<li>Selecciona una fila en la tabla o abre una tarjeta en el tablero.</li>' +
      '<li>Pulsa <strong>"Recordar"</strong> o <strong>"+Record."</strong>.</li>' +
      '<li>Escribe el texto del recordatorio.</li>' +
      '<li>Elige cuando quieres que salte: 15min, 30min, 1h, 2h, 4h o manana a las 9.</li>' +
      '<li>Opcionalmente, selecciona una <strong>fecha y hora personalizada</strong>.</li>' +
      '</ol>' +

      '<h4>Sugerencias automaticas</h4>' +
      '<p>Cuando cambias la fase de una carga, TareaLog puede sugerirte un recordatorio:</p>' +
      '<ul>' +
      '<li><strong>Fase 19 (En ruta)</strong> — "Verificar descarga" en 8 horas.</li>' +
      '<li><strong>Fase 29 (Vacio)</strong> — "Reclamar POD" en 24 horas.</li>' +
      '</ul>' +
      '<p>Puedes aceptar la sugerencia o descartarla. Se activan/desactivan en Config.</p>' +

      '<h4>Gestionar recordatorios</h4>' +
      '<p>Pulsa el boton <strong>"Recordatorios"</strong> para ver el panel con todos los activos:</p>' +
      '<ul>' +
      '<li><strong>Click en un recordatorio</strong> — Abre modal de detalle con contexto de carga.</li>' +
      '<li><strong>Snooze</strong> — Posponer con los mismos presets de tiempo.</li>' +
      '<li><strong>Completar</strong> — Marcar como hecho y eliminarlo.</li>' +
      '<li><strong>Editar</strong> — Modificar texto o reprogramar.</li>' +
      '</ul>' +
      '<p>Cuando un recordatorio vence, recibes una <strong>notificacion de Chrome</strong> con opciones de snooze directas en los botones.</p>' +

      '<div class="ayuda-warn"><strong>Limite:</strong> Maximo 50 recordatorios activos simultaneamente. ' +
      'Los recordatorios se verifican cada 1 minuto.</div>'
  },
  {
    id: 'turno',
    titulo: 'Mi turno y reporte',
    contenido:
      '<h3>Panel "Mi Turno"</h3>' +
      '<p>Pulsa <strong>"Mi Turno"</strong> para ver un resumen rapido de tu situacion actual:</p>' +
      '<ul>' +
      '<li><strong>Cargas activas</strong> por grupo de fase (espera, carga, ruta, descarga, vacio, incidencia).</li>' +
      '<li><strong>Alertas urgentes</strong> — Numero de alertas criticas.</li>' +
      '<li><strong>Recordatorios hoy</strong> — Pendientes para hoy.</li>' +
      '<li><strong>Cerradas hoy / semana</strong> — Cargas completadas (fase 30).</li>' +
      '</ul>' +

      '<h3>Reporte de turno</h3>' +
      '<p>Pulsa <strong>"Reporte"</strong> para generar un resumen de fin de turno con las estadisticas del dia. ' +
      'Incluye cargas gestionadas, incidencias y recordatorios pendientes.</p>' +
      '<p>Usa el boton <strong>"Copiar"</strong> para pegar el reporte donde necesites (email, chat, etc.).</p>' +

      '<h3>Historial de acciones</h3>' +
      '<p>TareaLog registra automaticamente un historial de las acciones realizadas sobre cada carga ' +
      '(cambios de fase, estado, etc.). El historial se rota automaticamente para no acumular datos excesivos.</p>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Puedes configurar la hora de generacion automatica del reporte en Config.</div>'
  },
  {
    id: 'secuencias',
    titulo: 'Secuencias',
    contenido:
      '<h3>Secuencias de seguimiento</h3>' +
      '<p>Las secuencias automatizan cadenas de emails escalonados para una carga. ' +
      'Si no recibes respuesta, TareaLog envia recordatorios automaticos en los intervalos configurados.</p>' +

      '<h4>Secuencias predefinidas</h4>' +
      '<ul>' +
      '<li><strong>Reclamar POD</strong> — 3 pasos: solicitud inicial, recordatorio a las 72h, escalado a las 168h (7 dias).</li>' +
      '<li><strong>Confirmar carga</strong> — 3 pasos: consulta inicial, recordatorio a las 24h, urgente a las 48h.</li>' +
      '<li><strong>Seguimiento incidencia</strong> — 3 pasos: solicitar detalle, recordatorio a las 24h, escalar a las 72h.</li>' +
      '</ul>' +

      '<h4>Como funcionan</h4>' +
      '<ul>' +
      '<li>Se inician desde la <strong>barra de acciones</strong> de una carga o via reglas automaticas.</li>' +
      '<li>TareaLog evalua las secuencias cada 15 minutos (configurable).</li>' +
      '<li>Si el transportista responde, puedes <strong>detener</strong> la secuencia manualmente.</li>' +
      '<li>Al completar todos los pasos, la secuencia se marca como completada.</li>' +
      '<li>Las secuencias pueden iniciarse automaticamente via el motor de reglas (accion <strong>INICIAR_SECUENCIA</strong>).</li>' +
      '</ul>' +

      '<div class="ayuda-warn"><strong>Importante:</strong> Los envios respetan el horario laboral configurado en Config. ' +
      'Fuera de horario, los emails se posponen al siguiente periodo laboral.</div>'
  },
  {
    id: 'programados',
    titulo: 'Envios programados',
    contenido:
      '<h3>Correos programados</h3>' +
      '<p>Puedes programar el envio de respuestas para una fecha y hora futura:</p>' +
      '<ol>' +
      '<li>Al responder, marca la casilla <strong>"Programar envio"</strong>.</li>' +
      '<li>Selecciona la <strong>fecha y hora</strong> deseada.</li>' +
      '<li>El correo quedara en estado <strong>PENDIENTE</strong> hasta el momento del envio.</li>' +
      '</ol>' +

      '<h4>Panel de programados</h4>' +
      '<p>Pulsa <strong>"Programados"</strong> para ver todos los envios:</p>' +
      '<ul>' +
      '<li>Filtra por estado: Todos, Pendiente, Enviado, Error, Cancelado.</li>' +
      '<li><strong>Click en un envio</strong> — Abre modal de detalle con todos los campos editables.</li>' +
      '<li><strong>Cancelar envio</strong> — Detiene un envio pendiente.</li>' +
      '<li><strong>Enviar ahora</strong> — Envia inmediatamente sin esperar la hora programada.</li>' +
      '</ul>' +

      '<h4>Envios con error</h4>' +
      '<p>Si un envio programado falla, queda en estado <strong>ERROR</strong>:</p>' +
      '<ul>' +
      '<li>El modal muestra el <strong>mensaje de error</strong> detallado.</li>' +
      '<li>Puedes <strong>editar</strong> el asunto, cuerpo, CC y BCC del correo para corregir el problema.</li>' +
      '<li>Al guardar cambios en un envio ERROR, se <strong>reactiva automaticamente</strong> a estado PENDIENTE.</li>' +
      '<li>Pulsa <strong>"Enviar ahora"</strong> para reintentarlo inmediatamente.</li>' +
      '<li><strong>"Reprogramar"</strong> para asignar una nueva fecha de envio.</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Los envios programados respetan el horario laboral ' +
      'y el limite de emails por minuto configurados en Config. En la PWA movil, ' +
      'puedes ver y gestionar programados con boton Reintentar y editor BottomSheet.</div>'
  },
  {
    id: 'reglas',
    titulo: 'Motor de reglas',
    contenido:
      '<h3>Reglas de acciones automaticas</h3>' +
      '<p>TareaLog incluye un motor de reglas configurable que ejecuta acciones automaticas cuando un registro cumple condiciones. ' +
      'Accede desde la pestana <strong>Config</strong>, seccion <strong>Reglas de Acciones</strong>.</p>' +

      '<h4>Campos de condicion (9)</h4>' +
      '<p>Puedes crear condiciones sobre cualquiera de estos campos:</p>' +
      '<ul>' +
      '<li><strong>fase</strong> — Codigo de fase logistica (00-30).</li>' +
      '<li><strong>estado</strong> — Estado del registro (NUEVO, PENDIENTE, GESTIONADO, etc.).</li>' +
      '<li><strong>codCar</strong> — Codigo de carga.</li>' +
      '<li><strong>tipoTarea</strong> — OPERATIVO, ADMINISTRATIVA o SIN_CLASIFICAR.</li>' +
      '<li><strong>vinculacion</strong> — AUTOMATICA, MANUAL, HILO, SIN_VINCULAR.</li>' +
      '<li><strong>alerta</strong> — Nivel de alerta activo.</li>' +
      '<li><strong>bandeja</strong> — Bandeja de origen del email (INBOX, OTRO, texto libre).</li>' +
      '<li><strong>interlocutor</strong> — Email del interlocutor (texto libre).</li>' +
      '<li><strong>zona</strong> — Zona geografica (texto libre).</li>' +
      '</ul>' +
      '<p>Cada condicion tiene: campo que cambia, valor destino (o "*" para cualquiera) y opcionalmente valor de origen.</p>' +

      '<h4>Tipos de accion (9)</h4>' +
      '<p>Cada regla puede ejecutar una o mas acciones:</p>' +
      '<ul>' +
      '<li><strong>Propagar al hilo</strong> — Copia el cambio a todos los registros del mismo hilo.</li>' +
      '<li><strong>Sugerir recordatorio</strong> — Muestra sugerencia de recordatorio al usuario.</li>' +
      '<li><strong>Crear recordatorio</strong> — Crea un recordatorio automaticamente.</li>' +
      '<li><strong>Iniciar secuencia</strong> — Lanza una secuencia de seguimiento automatica.</li>' +
      '<li><strong>Preseleccionar plantilla</strong> — Abre el modal de respuesta con una plantilla predefinida.</li>' +
      '<li><strong>Cambiar fase</strong> — Mueve la carga a otra fase.</li>' +
      '<li><strong>Cambiar estado</strong> — Asigna un estado.</li>' +
      '<li><strong>Mostrar aviso</strong> — Muestra una notificacion informativa.</li>' +
      '<li><strong>Heredar campo del hilo</strong> — Copia un campo (fase, estado o codCar) del registro anterior del mismo hilo.</li>' +
      '</ul>' +

      '<h4>Reglas de sistema vs. usuario</h4>' +
      '<ul>' +
      '<li>Las reglas de <strong>sistema</strong> vienen predefinidas y se pueden desactivar pero no eliminar.</li>' +
      '<li>Las reglas de <strong>usuario</strong> se crean, editan y eliminan libremente.</li>' +
      '<li>Usa <strong>"Restaurar por defecto"</strong> para volver a las reglas de sistema originales.</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Las reglas se evaluan en orden de prioridad (campo Orden). ' +
      'Puedes activar o desactivar cada regla individualmente. Una regla puede tener multiples acciones.</div>'
  },
  {
    id: 'config',
    titulo: 'Configuracion',
    contenido:
      '<h3>Pestana de configuracion</h3>' +
      '<p>Desde la pestana <strong>Config</strong> puedes ajustar todos los parametros de TareaLog:</p>' +

      '<h4>Servicios GAS</h4>' +
      '<p>Agrega una o varias URLs de tu Web App de Google Apps Script. ' +
      'Cada servicio tiene un alias descriptivo y puedes cambiar entre ellos con el selector de la barra principal.</p>' +

      '<h4>Hoja de calculo</h4>' +
      '<p>Pega la URL completa de tu Google Sheet o introduce el ID directamente. Pulsa <strong>"Detectar"</strong> para validarla. ' +
      'El ID se guarda en el backend GAS via PropertiesService, asi todos los dispositivos usan la misma hoja.</p>' +

      '<h4>Busqueda Gmail</h4>' +
      '<p>Define que correos procesa el barrido. Usa la sintaxis de Gmail:</p>' +
      '<ul>' +
      '<li><code>(in:inbox OR in:sent) newer_than:7d</code> — Inbox y enviados de ultima semana.</li>' +
      '<li><code>in:inbox is:unread</code> — Solo no leidos.</li>' +
      '<li><code>(in:inbox OR in:sent) newer_than:30d</code> — Ultimo mes.</li>' +
      '</ul>' +
      '<p>Pulsa los botones de ejemplo para aplicar queries comunes.</p>' +

      '<h4>Horario laboral</h4>' +
      '<p>Configura los <strong>dias</strong> (Lun-Dom) y las <strong>horas</strong> (de/a) en que se permiten envios automaticos. ' +
      'Los envios programados y secuencias fuera de horario se posponen al siguiente periodo laboral.</p>' +

      '<h4>Estado inicial de emails</h4>' +
      '<p>Selecciona el estado que se asigna automaticamente a los correos nuevos al procesarlos (p.ej. NUEVO, RECIBIDO). ' +
      'Se guarda en el backend GAS y se aplica a todos los dispositivos.</p>' +

      '<h4>Apariencia</h4>' +
      '<ul>' +
      '<li><strong>Modo oscuro</strong> — Alterna entre tema claro y oscuro. La preferencia se guarda y persiste entre sesiones.</li>' +
      '</ul>' +

      '<h4>Fases de transporte</h4>' +
      '<p>Personaliza las fases logisticas: codigo (2 caracteres), nombre, orden, si es critica y clase CSS. ' +
      'Puedes crear nuevas fases o desactivar las que no uses.</p>' +

      '<h4>Estados</h4>' +
      '<p>Personaliza los estados del seguimiento: codigo, nombre visible, icono (emoji), orden y clase CSS. ' +
      'Cada estado tiene un color asociado que se refleja en toda la aplicacion.</p>' +

      '<h4>Reglas de acciones</h4>' +
      '<p>Configura reglas automaticas con 9 campos de condicion y 9 tipos de accion. ' +
      'Ver seccion <strong>"Motor de reglas"</strong> para detalles completos.</p>' +

      '<h4>Otros ajustes</h4>' +
      '<ul>' +
      '<li><strong>Intervalo de barrido</strong> — Cada cuantos minutos sincronizar (1-1440, defecto: 15).</li>' +
      '<li><strong>Limite de envio</strong> — Maximo emails por minuto (1-30, defecto: 10).</li>' +
      '<li><strong>Resumen matutino</strong> — Activar/desactivar y hora de inicio (defecto: 08:00).</li>' +
      '<li><strong>Patrones regex</strong> — Expresiones para extraer codigo de carga de adjuntos y clasificar emails administrativos.</li>' +
      '<li><strong>Rutas</strong> — Ruta a archivos CSV del ERP.</li>' +
      '</ul>' +

      '<h4>Backup</h4>' +
      '<p>Usa <strong>"Exportar configuracion"</strong> para descargar un JSON con todos tus ajustes ' +
      '(servicios, fases, estados, reglas, filtros, etc.). ' +
      '<strong>"Importar configuracion"</strong> restaura desde un archivo previo. ' +
      '<strong>"Restaurar valores por defecto"</strong> reinicia todo a la configuracion original.</p>'
  },
  {
    id: 'movil',
    titulo: 'App movil',
    contenido:
      '<h3>PWA Movil</h3>' +
      '<p>TareaLog dispone de una aplicacion movil (PWA) accesible desde ' +
      '<strong>tarealog-movil.pages.dev</strong>. Se instala como app nativa y funciona offline.</p>' +

      '<h4>Vistas disponibles</h4>' +
      '<ul>' +
      '<li><strong>Mi Turno</strong> — Dashboard con KPIs del turno actual.</li>' +
      '<li><strong>Todo</strong> — Lista de todas las cargas con busqueda y filtros.</li>' +
      '<li><strong>Tablero</strong> — Kanban con scroll horizontal snap, drag &amp; drop tactil y seleccion por columna.</li>' +
      '<li><strong>Programados</strong> — Envios programados con filtro por estado, edicion y reintento.</li>' +
      '<li><strong>Config</strong> — Configuracion del servicio GAS, spreadsheet y sync.</li>' +
      '</ul>' +

      '<h4>Tablero movil</h4>' +
      '<p>El tablero movil tiene las mismas columnas que el escritorio pero con interfaz tactil:</p>' +
      '<ul>' +
      '<li><strong>Scroll horizontal con snap</strong> — Las columnas se alinean al deslizar.</li>' +
      '<li><strong>Chips toggle</strong> — Barra scrollable para mostrar/ocultar columnas.</li>' +
      '<li><strong>Drag &amp; drop tactil</strong> — Mantener pulsada una tarjeta para moverla.</li>' +
      '<li><strong>Seleccion por columna</strong> — Checkbox en cabecera de cada columna.</li>' +
      '<li><strong>Barra de seleccion flotante</strong> — Al seleccionar, aparece barra con Fase, Estado, Responder y Limpiar.</li>' +
      '<li><strong>Pull-to-refresh</strong> — Tira hacia abajo para actualizar datos.</li>' +
      '<li><strong>Dots de posicion</strong> — Indicadores de columna visible.</li>' +
      '</ul>' +

      '<h4>Detalle de carga (BottomSheet)</h4>' +
      '<p>Al pulsar una tarjeta se abre un panel inferior con:</p>' +
      '<ul>' +
      '<li><strong>Chips</strong> — Estado (clickable para cambiar), fase, bandeja, tipo de tarea.</li>' +
      '<li><strong>Fechas logisticas</strong> — Carga y Entrega editables pulsando sobre ellas.</li>' +
      '<li><strong>Indicadores</strong> — Notas, recordatorios y programados (clickables).</li>' +
      '<li><strong>Acciones</strong> — Responder, +Nota, +Recordatorio, Ver detalle completo.</li>' +
      '</ul>' +

      '<h4>Actualizaciones</h4>' +
      '<p>La PWA se actualiza automaticamente. Cuando hay una nueva version, aparece un toast con boton ' +
      '<strong>"Actualizar"</strong>. El Service Worker gestiona el cache versionado.</p>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Anade la PWA a la pantalla de inicio de tu movil ' +
      'para acceder como una app nativa. En Chrome: menu &gt; "Anadir a pantalla de inicio".</div>'
  },
  {
    id: 'atajos',
    titulo: 'Referencia rapida',
    contenido:
      '<h3>Referencia rapida</h3>' +

      '<h4>Barra de controles (tab Datos)</h4>' +
      '<ul>' +
      '<li><strong>Ejecutar Ahora</strong> — Lanza un barrido inmediato.</li>' +
      '<li><strong>Filtros</strong> — Abre/cierra el panel de filtros avanzados.</li>' +
      '<li><strong>Agrupar por hilo</strong> — Agrupa correos por conversacion.</li>' +
      '<li><strong>Responder seleccionados</strong> — Respuesta masiva a los marcados.</li>' +
      '<li><strong>Programados</strong> — Panel de envios programados.</li>' +
      '<li><strong>Resumen</strong> — Ventana de resumen de alertas.</li>' +
      '<li><strong>Recordatorios</strong> — Panel de recordatorios activos.</li>' +
      '<li><strong>Mi Turno</strong> — Dashboard con KPIs del turno.</li>' +
      '<li><strong>Reporte</strong> — Genera resumen de fin de turno.</li>' +
      '</ul>' +

      '<h4>Interacciones en tabla</h4>' +
      '<ul>' +
      '<li><strong>Doble click</strong> en celda — Editar valor (incluye fechas logisticas).</li>' +
      '<li><strong>Click</strong> en cabecera — Ordenar columna.</li>' +
      '<li><strong>Click derecho</strong> en cabecera — Opciones de columna.</li>' +
      '<li><strong>Checkbox</strong> — Seleccionar para edicion masiva (fase + estado).</li>' +
      '<li><strong>Click en fila</strong> — Muestra barra de acciones contextuales.</li>' +
      '</ul>' +

      '<h4>Interacciones en tablero Kanban</h4>' +
      '<ul>' +
      '<li><strong>Click en tarjeta</strong> — Abre detalle con campos editables.</li>' +
      '<li><strong>Arrastrar tarjeta</strong> — Cambia de fase (escritorio y movil).</li>' +
      '<li><strong>Checkbox columna</strong> — Selecciona/deselecciona todas las tarjetas de la columna.</li>' +
      '<li><strong>Checkbox tarjeta</strong> — Seleccion individual.</li>' +
      '<li><strong>Click en nombre columna</strong> — Colapsar/expandir.</li>' +
      '<li><strong>Indicadores</strong> — Click en notas/recordatorio/programado para abrir detalle.</li>' +
      '</ul>' +

      '<h4>Atajos de teclado</h4>' +
      '<ul>' +
      '<li><span class="ayuda-kbd">f</span> — Enfocar campo de busqueda global (en tab Tablero).</li>' +
      '<li><span class="ayuda-kbd">r</span> — Refrescar tablero Kanban.</li>' +
      '<li><span class="ayuda-kbd">Esc</span> — Cerrar modal de detalle Kanban.</li>' +
      '</ul>' +

      '<h4>Variables de plantilla</h4>' +
      '<ul>' +
      '<li><code>{{codCar}}</code> — Codigo de carga.</li>' +
      '<li><code>{{nombreTransportista}}</code> — Nombre del transportista.</li>' +
      '<li><code>{{referencia}}</code> — Referencia de la carga.</li>' +
      '<li><code>{{interlocutor}}</code> — Email del interlocutor.</li>' +
      '<li><code>{{fechaCorreo}}</code> — Fecha del correo.</li>' +
      '<li><code>{{estado}}</code> — Estado actual.</li>' +
      '<li><code>{{fase}}</code> — Fase actual.</li>' +
      '<li><code>{{fCarga}}</code> — Fecha de carga.</li>' +
      '<li><code>{{hCarga}}</code> — Hora de carga.</li>' +
      '<li><code>{{fEntrega}}</code> — Fecha de entrega.</li>' +
      '<li><code>{{hEntrega}}</code> — Hora de entrega.</li>' +
      '<li><code>{{asunto}}</code> — Asunto del correo.</li>' +
      '<li><code>{{bandeja}}</code> — Bandeja de origen.</li>' +
      '<li><code>{{zona}}</code> — Zona geografica.</li>' +
      '</ul>' +

      '<h4>Fases logisticas</h4>' +
      '<ul>' +
      '<li><strong>00</strong> — Espera / Sin asignar.</li>' +
      '<li><strong>01</strong> — Alerta transportista.</li>' +
      '<li><strong>02</strong> — Confirmada.</li>' +
      '<li><strong>05</strong> — Incidencia carga.</li>' +
      '<li><strong>11</strong> — Carga.</li>' +
      '<li><strong>12</strong> — Posicion carga.</li>' +
      '<li><strong>19</strong> — En ruta.</li>' +
      '<li><strong>21</strong> — Descarga.</li>' +
      '<li><strong>22</strong> — Posicion descarga.</li>' +
      '<li><strong>25</strong> — Incidencia descarga.</li>' +
      '<li><strong>29</strong> — Vacio (pendiente docs).</li>' +
      '<li><strong>30</strong> — Cierre / Documentado.</li>' +
      '</ul>' +

      '<h4>Estados</h4>' +
      '<ul>' +
      '<li><strong>NUEVO</strong> — Recien procesado.</li>' +
      '<li><strong>ENVIADO</strong> — Respuesta enviada.</li>' +
      '<li><strong>RECIBIDO</strong> — Confirmacion recibida.</li>' +
      '<li><strong>PENDIENTE</strong> — Esperando accion.</li>' +
      '<li><strong>GESTIONADO</strong> — Accion completada.</li>' +
      '<li><strong>ALERTA</strong> — Requiere atencion urgente.</li>' +
      '<li><strong>CERRADO</strong> — Finalizado.</li>' +
      '<li><strong>NADA</strong> — Sin seguimiento necesario.</li>' +
      '</ul>'
  }
];

function obtenerSecciones() {
  return SECCIONES.map(function(s) { return { id: s.id, titulo: s.titulo, contenido: s.contenido }; });
}

function obtenerSeccion(id) {
  return SECCIONES.find(function(s) { return s.id === id; }) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { obtenerSecciones: obtenerSecciones, obtenerSeccion: obtenerSeccion };
}
