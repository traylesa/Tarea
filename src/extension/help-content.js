/**
 * help-content.js - Contenido del panel de ayuda
 * Guia de usuario organizada por secciones.
 */

const SECCIONES = [
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
      '<li>Los cambios se guardan automaticamente en la hoja de calculo.</li>' +
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

      '<h4>Seleccion multiple y edicion masiva</h4>' +
      '<p>Marca las casillas de la primera columna para seleccionar varios registros. ' +
      'Aparecera el panel de <strong>edicion masiva</strong> donde puedes cambiar <strong>fase y/o estado</strong> a todos a la vez.</p>'
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
      '<li><strong>Todas</strong> — Activa todas las tarjetas de fase de una vez.</li>' +
      '<li><strong>Ninguna</strong> — Desactiva todas (equivale a mostrar todo).</li>' +
      '<li><strong>Invertir</strong> — Invierte la seleccion: las activas pasan a inactivas y viceversa.</li>' +
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
      '<li>Selecciona el <strong>campo</strong> (transportista, zona, referencia...).</li>' +
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
      '<li><strong>Sin fase</strong> — Registros sin fase asignada (primera columna).</li>' +
      '<li><strong>Espera</strong> — Fases 00, 01, 02.</li>' +
      '<li><strong>Carga</strong> — Fases 11, 12.</li>' +
      '<li><strong>En ruta</strong> — Fase 19.</li>' +
      '<li><strong>Descarga</strong> — Fases 21, 22.</li>' +
      '<li><strong>Vacio</strong> — Fase 29.</li>' +
      '<li><strong>Incidencia</strong> — Fases 05, 25 (columna roja).</li>' +
      '<li><strong>Documentado</strong> — Fase 30 (oculto por defecto).</li>' +
      '</ul>' +

      '<h4>Tarjetas</h4>' +
      '<p>Cada tarjeta muestra: codigo de carga, transportista, asunto (2 lineas), estado (chip con color), ' +
      'tiempo relativo y hora de carga si existe (ej: "2d \u23F014:30").</p>' +
      '<p>Los indicadores en la tarjeta muestran alertas (\u26A0), notas (\uD83D\uDCDD) y recordatorios (\u23F0).</p>' +
      '<ul>' +
      '<li><strong>Click en tarjeta</strong> — Abre el detalle con todos los campos y opciones de edicion.</li>' +
      '<li><strong>Arrastrar (drag &amp; drop)</strong> — Mueve una carga a otra columna, cambiando su fase automaticamente.</li>' +
      '<li><strong>Long-press</strong> — Abre acciones contextuales rapidas (cambiar fase, estado, ver detalle).</li>' +
      '</ul>' +

      '<h4>Detalle de tarjeta</h4>' +
      '<p>Al abrir una tarjeta aparece un panel con:</p>' +
      '<ul>' +
      '<li><strong>Chips</strong> — Estado y fase (clickables para cambiar), bandeja, tipo de tarea.</li>' +
      '<li><strong>Fechas logisticas</strong> — Carga y Entrega siempre visibles. Pulsa para <strong>editar</strong> ' +
      'fecha y hora, o para asignarlas si estan vacias. Boton "Borrar fecha" para limpiar.</li>' +
      '<li><strong>Acciones</strong> — Responder, +Nota, +Recordatorio, Ver detalle.</li>' +
      '</ul>' +

      '<h4>Controles</h4>' +
      '<ul>' +
      '<li><strong>Chips de columnas</strong> — Activa/desactiva columnas visibles en el tablero.</li>' +
      '<li><strong>Colapso horizontal</strong> — Click en la cabecera de una columna para colapsarla a una barra vertical.</li>' +
      '<li><strong>Swimlanes</strong> — Subagrupar por estado dentro de cada columna (toggle on/off).</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Los filtros de la barra (fases, estados, busqueda global) ' +
      'tambien se aplican al tablero. Es la misma barra de filtros compartida.</div>'
  },
  {
    id: 'acciones',
    titulo: 'Acciones y notas',
    contenido:
      '<h3>Barra de acciones contextuales</h3>' +
      '<p>Al seleccionar <strong>una fila</strong>, aparece una barra con acciones rapidas adaptadas a la fase actual:</p>' +

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
      '<li><strong>Vincular</strong> — Asocia manualmente un codigo de carga.</li>' +
      '</ul>' +

      '<h3>Notas por carga</h3>' +
      '<p>Cada carga puede tener notas privadas. Utiles para anotar incidencias, acuerdos telefonicos o cualquier observacion.</p>' +
      '<ul>' +
      '<li>Escribe en el campo y pulsa <strong>Enter</strong> para agregar.</li>' +
      '<li>Las notas se guardan con fecha y hora automatica.</li>' +
      '<li>El boton "Notas" muestra un <strong>badge</strong> si la carga tiene notas.</li>' +
      '</ul>'
  },
  {
    id: 'respuestas',
    titulo: 'Respuestas y plantillas',
    contenido:
      '<h3>Respuesta masiva</h3>' +
      '<p>Envia respuestas a multiples transportistas de una vez:</p>' +
      '<ol>' +
      '<li>Marca los correos con las <strong>casillas</strong> de seleccion.</li>' +
      '<li>Pulsa <strong>"Responder seleccionados"</strong>.</li>' +
      '<li>Elige una <strong>plantilla</strong> o escribe un mensaje libre.</li>' +
      '<li>Revisa la <strong>previsualizacion</strong> (muestra el primer destinatario).</li>' +
      '<li>Pulsa <strong>Enviar</strong> o marca "Programar envio" para enviarlo mas tarde.</li>' +
      '</ol>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Las respuestas se envian como reply al hilo original, ' +
      'excluyendo automaticamente tu propio email. No se crea un email nuevo.</div>' +

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

      '<h4>Tipos de alerta</h4>' +
      '<ul>' +
      '<li><strong>Sin respuesta</strong> — Un transportista no ha respondido a tu email en mas de 4 horas.</li>' +
      '<li><strong>Fase estancada</strong> — Una carga lleva demasiado tiempo en la misma fase (ej: >3h en posicion carga).</li>' +
      '<li><strong>Documentacion pendiente</strong> — Carga en fase 29 (vacio) sin documentar durante mas de 2 dias.</li>' +
      '<li><strong>Incidencia activa</strong> — Cualquier carga en fases 05 o 25 (siempre critica).</li>' +
      '<li><strong>Carga HOY sin orden</strong> — Carga programada para hoy sin email de confirmacion enviado.</li>' +
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
      '</ul>' +

      '<h4>Resumen matutino</h4>' +
      '<p>Una vez al dia (a la hora configurada), se abre automaticamente una ventana con el <strong>resumen de alertas</strong> ' +
      'organizado por categorias: Urgente, Sin respuesta, Documentacion, Fases estancadas.</p>' +
      '<p>Tambien puedes abrirlo manualmente con el boton <strong>"Resumen"</strong>.</p>' +
      '<p>Desde el resumen, pulsa <strong>"Ver"</strong> en cualquier categoria para abrir el panel con los filtros ya aplicados.</p>' +

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
      '<li>Selecciona una fila en la tabla.</li>' +
      '<li>Pulsa <strong>"Recordar"</strong> en la barra de acciones.</li>' +
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
      '<p>Puedes aceptar la sugerencia o descartarla. Se configuran en Config.</p>' +

      '<h4>Gestionar recordatorios</h4>' +
      '<p>Pulsa el boton <strong>"Recordatorios"</strong> para ver el panel con todos los activos:</p>' +
      '<ul>' +
      '<li><strong>Snooze</strong> — Posponer con los mismos presets de tiempo.</li>' +
      '<li><strong>Hecho</strong> — Marcar como completado y eliminarlo.</li>' +
      '</ul>' +
      '<p>Cuando un recordatorio vence, recibes una <strong>notificacion de Chrome</strong> con opciones de snooze directas.</p>' +

      '<div class="ayuda-warn"><strong>Limite:</strong> Maximo 50 recordatorios activos simultaneamente.</div>'
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

      '<div class="ayuda-tip"><strong>Consejo:</strong> Puedes configurar la hora de generacion automatica del reporte en Config.</div>'
  },
  {
    id: 'secuencias',
    titulo: 'Secuencias',
    contenido:
      '<h3>Secuencias de seguimiento</h3>' +
      '<p>Las secuencias automatizan cadenas de emails escalonados para una carga. ' +
      'Si no recibes respuesta, TareaLog envia recordatorios automaticos en los intervalos configurados.</p>' +

      '<h4>Secuencias disponibles</h4>' +
      '<ul>' +
      '<li><strong>Reclamar POD</strong> — 3 pasos: solicitud inicial, recordatorio a las 72h, escalado a las 168h (7 dias).</li>' +
      '<li><strong>Confirmar carga</strong> — 3 pasos: consulta inicial, recordatorio a las 24h, urgente a las 48h.</li>' +
      '<li><strong>Seguimiento incidencia</strong> — 3 pasos: solicitar detalle, recordatorio a las 24h, escalar a las 72h.</li>' +
      '</ul>' +

      '<h4>Como funcionan</h4>' +
      '<ul>' +
      '<li>Se inician desde la <strong>barra de acciones</strong> de una carga.</li>' +
      '<li>TareaLog evalua las secuencias cada 15 minutos.</li>' +
      '<li>Si el transportista responde, puedes <strong>detener</strong> la secuencia manualmente.</li>' +
      '<li>Al completar todos los pasos, la secuencia se marca como completada.</li>' +
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
      '<li>El correo quedara en estado <strong>Pendiente</strong> hasta el momento del envio.</li>' +
      '</ol>' +

      '<h4>Panel de programados</h4>' +
      '<p>Pulsa <strong>"Programados"</strong> para ver todos los envios:</p>' +
      '<ul>' +
      '<li>Filtra por estado: Pendiente, Enviado, Error, Cancelado.</li>' +
      '<li><strong>Cancelar</strong> — Detiene un envio pendiente.</li>' +
      '<li><strong>Reenviar</strong> — Reintenta un envio que fallo.</li>' +
      '</ul>' +

      '<h4>Envios con error</h4>' +
      '<p>Si un envio programado falla, queda en estado <strong>ERROR</strong>. ' +
      'Puedes <strong>editar</strong> el contenido del correo y corregir el problema, ' +
      'o pulsar <strong>"Reintentar"</strong> para volver a enviarlo. ' +
      'Al editar un envio en ERROR, se reactiva automaticamente a estado Pendiente.</p>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Los envios programados respetan el horario laboral ' +
      'y el limite de emails por minuto configurados en Config.</div>'
  },
  {
    id: 'reglas',
    titulo: 'Motor de reglas',
    contenido:
      '<h3>Reglas de acciones automaticas</h3>' +
      '<p>TareaLog incluye un motor de reglas configurable que ejecuta acciones automaticas cuando un registro cumple condiciones. ' +
      'Accede desde la pestana <strong>Config</strong>, seccion <strong>Reglas</strong>.</p>' +

      '<h4>Campos disponibles</h4>' +
      '<p>Puedes crear condiciones sobre <strong>9 campos</strong>:</p>' +
      '<ul>' +
      '<li><strong>fase</strong> — Codigo de fase logistica.</li>' +
      '<li><strong>estado</strong> — Estado del registro.</li>' +
      '<li><strong>codCar</strong> — Codigo de carga.</li>' +
      '<li><strong>tipoTarea</strong> — Tipo de tarea (CARGA, DESCARGA, etc.).</li>' +
      '<li><strong>vinculacion</strong> — Tipo de vinculacion (AUTOMATICA, MANUAL, HILO, etc.).</li>' +
      '<li><strong>alerta</strong> — Nivel de alerta activo.</li>' +
      '<li><strong>bandeja</strong> — Bandeja de origen del email (INBOX, OTRO).</li>' +
      '<li><strong>interlocutor</strong> — Email del interlocutor.</li>' +
      '<li><strong>zona</strong> — Zona geografica.</li>' +
      '</ul>' +

      '<h4>Tipos de accion</h4>' +
      '<p>Cada regla puede ejecutar una accion cuando se cumple la condicion:</p>' +
      '<ul>' +
      '<li><strong>Cambiar fase</strong> — Mover la carga a otra fase automaticamente.</li>' +
      '<li><strong>Cambiar estado</strong> — Asignar un estado.</li>' +
      '<li><strong>Notificar</strong> — Mostrar una notificacion.</li>' +
      '<li><strong>Heredar del hilo</strong> — Copiar un campo (fase/estado/codCar) del registro anterior del mismo hilo.</li>' +
      '</ul>' +

      '<div class="ayuda-tip"><strong>Consejo:</strong> Las reglas se evaluan en orden de prioridad. ' +
      'Puedes activar o desactivar cada regla individualmente.</div>'
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
      '<p>Pega la URL completa de tu Google Sheet. Pulsa <strong>"Detectar"</strong> para validarla. ' +
      'Puedes cambiar de hoja en cualquier momento con el selector dinamico.</p>' +

      '<h4>Busqueda Gmail</h4>' +
      '<p>Define que correos procesa el barrido. Usa la sintaxis de Gmail:</p>' +
      '<ul>' +
      '<li><code>(in:inbox OR in:sent) newer_than:7d</code> — Inbox y enviados de ultima semana.</li>' +
      '<li><code>in:inbox is:unread</code> — Solo no leidos.</li>' +
      '</ul>' +
      '<p>Pulsa los botones de ejemplo para aplicar queries comunes.</p>' +

      '<h4>Apariencia</h4>' +
      '<ul>' +
      '<li><strong>Modo oscuro</strong> — Alterna entre tema claro y oscuro. La preferencia se guarda y persiste entre sesiones.</li>' +
      '</ul>' +

      '<h4>Estado inicial de emails</h4>' +
      '<p>Selecciona el estado que se asigna automaticamente a los correos nuevos al procesarlos (p.ej. NUEVO, RECIBIDO). ' +
      'Se guarda en el backend GAS y se aplica a todos los dispositivos.</p>' +

      '<h4>Reglas</h4>' +
      '<p>Configura reglas de acciones automaticas con 9 campos de condicion. Ver seccion <strong>"Motor de reglas"</strong> para detalles.</p>' +

      '<h4>Otros ajustes</h4>' +
      '<ul>' +
      '<li><strong>Intervalo de barrido</strong> — Cada cuantos minutos sincronizar (1-1440, defecto: 15).</li>' +
      '<li><strong>Limite de envio</strong> — Maximo emails por minuto (1-30, defecto: 10).</li>' +
      '<li><strong>Horario laboral</strong> — Dias y horas en que se permiten envios automaticos.</li>' +
      '<li><strong>Resumen matutino</strong> — Activar/desactivar y hora de inicio.</li>' +
      '<li><strong>Reporte de turno</strong> — Activar/desactivar y hora de generacion.</li>' +
      '<li><strong>Sugerencias de recordatorio</strong> — Activar/desactivar.</li>' +
      '<li><strong>Secuencias</strong> — Activar/desactivar e intervalo de evaluacion.</li>' +
      '<li><strong>Patrones regex</strong> — Expresiones para extraer codigo de carga y clasificar emails.</li>' +
      '<li><strong>Fases y estados</strong> — Personaliza las fases logisticas y los estados disponibles.</li>' +
      '</ul>' +

      '<h4>Backup</h4>' +
      '<p>Usa <strong>"Exportar configuracion"</strong> para descargar un JSON con todos tus ajustes. ' +
      '<strong>"Importar configuracion"</strong> restaura desde un archivo previo. ' +
      '<strong>"Restaurar valores por defecto"</strong> reinicia todo.</p>'
  },
  {
    id: 'atajos',
    titulo: 'Referencia rapida',
    contenido:
      '<h3>Referencia rapida</h3>' +

      '<h4>Barra de controles</h4>' +
      '<ul>' +
      '<li><strong>Ejecutar Ahora</strong> — Lanza un barrido inmediato.</li>' +
      '<li><strong>Filtros</strong> — Abre/cierra el panel de filtros.</li>' +
      '<li><strong>Agrupar por hilo</strong> — Agrupa correos por conversacion.</li>' +
      '<li><strong>Responder seleccionados</strong> — Respuesta masiva a los marcados.</li>' +
      '<li><strong>Programados</strong> — Panel de envios programados.</li>' +
      '<li><strong>Recordatorios</strong> — Panel de recordatorios activos.</li>' +
      '<li><strong>Mi Turno</strong> — Dashboard con KPIs del turno.</li>' +
      '<li><strong>Reporte</strong> — Genera resumen de fin de turno.</li>' +
      '<li><strong>Resumen</strong> — Ventana de resumen de alertas.</li>' +
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
      '<li><strong>Click en tarjeta</strong> — Abre detalle con fechas editables.</li>' +
      '<li><strong>Arrastrar tarjeta</strong> — Cambia de fase (escritorio y movil).</li>' +
      '<li><strong>Long-press</strong> — Acciones rapidas (movil).</li>' +
      '<li><strong>Click en cabecera columna</strong> — Colapsar/expandir.</li>' +
      '<li><strong>Chips superiores</strong> — Mostrar/ocultar columnas.</li>' +
      '</ul>' +

      '<h4>Variables de plantilla</h4>' +
      '<ul>' +
      '<li><code>{{codCar}}</code> — Codigo de carga.</li>' +
      '<li><code>{{nombreTransportista}}</code> — Nombre del transportista.</li>' +
      '<li><code>{{referencia}}</code> — Referencia de la carga.</li>' +
      '<li><code>{{interlocutor}}</code> — Email del interlocutor.</li>' +
      '<li><code>{{fechaCorreo}}</code> — Fecha del correo.</li>' +
      '<li><code>{{estado}}</code> — Estado actual.</li>' +
      '<li><code>{{fCarga}}</code> — Fecha de carga.</li>' +
      '<li><code>{{fEntrega}}</code> — Fecha de entrega.</li>' +
      '</ul>' +

      '<h4>Fases logisticas</h4>' +
      '<ul>' +
      '<li><strong>00-02</strong> — Espera / Sin asignar / Alerta transportista.</li>' +
      '<li><strong>05</strong> — Incidencia.</li>' +
      '<li><strong>11-12</strong> — Carga / Posicion carga.</li>' +
      '<li><strong>19</strong> — En ruta.</li>' +
      '<li><strong>21-22</strong> — Descarga / Posicion descarga.</li>' +
      '<li><strong>25</strong> — Incidencia descarga.</li>' +
      '<li><strong>29</strong> — Vacio (pendiente docs).</li>' +
      '<li><strong>30</strong> — Cierre.</li>' +
      '</ul>'
  }
];

function obtenerSecciones() {
  return SECCIONES.map(s => ({ id: s.id, titulo: s.titulo, contenido: s.contenido }));
}

function obtenerSeccion(id) {
  return SECCIONES.find(s => s.id === id) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { obtenerSecciones, obtenerSeccion };
}
