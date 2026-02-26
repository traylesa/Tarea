## Comprueba e implementa en su caso, que este plan es el más adecuado para el cometido.

## Plan: Herencia de campos en hilos + Tipo de acción HEREDAR_DEL_HILO

 Contexto

 Cuando llega un nuevo correo de un hilo existente, processMessage() (Main.js)       
 hereda el codCar vía ThreadManager/DB_HILOS, pero fase y estado siempre se asignan  
 con valores por defecto (fase='', estado=NUEVO). Esto causa que registros nuevos de 
  hilos ya clasificados aparezcan "sin fase" en el Kanban y con estado incorrecto,   
 obligando al usuario a reclasificarlos manualmente.

 Objetivo: Implementar herencia automática de fase/estado/codCar en el backend GAS + 
  nuevo tipo de acción HEREDAR_DEL_HILO en reglas para permitir excepciones
 configurables.

 ---
 Implementación

 Parte 1: Backend GAS — Herencia automática

 1a. src/gas/AdaptadorHojas.js — Nueva función obtenerUltimoRegistroPorThread()      

 Busca en SEGUIMIENTO el registro más reciente (por fechaCorreo) del mismo threadId: 

 function obtenerUltimoRegistroPorThread(threadId) {
   if (!threadId) return null;
   var hoja = obtenerHoja(HOJA_SEGUIMIENTO);
   var datos = hoja.getDataRange().getValues();
   var headers = datos[0];
   var idxThread = headers.indexOf('threadId');
   var idxFecha = headers.indexOf('fechaCorreo');
   if (idxThread === -1) return null;

   var mejor = null;
   var mejorFecha = '';
   for (var i = 1; i < datos.length; i++) {
     if (datos[i][idxThread] === threadId) {
       var fecha = datos[i][idxFecha] || '';
       if (fecha >= mejorFecha) {
         mejorFecha = fecha;
         mejor = {};
         headers.forEach(function(h, j) { mejor[h] = datos[i][j]; });
       }
     }
   }
   return mejor;
 }

 1b. src/gas/Main.js — Heredar fase/estado en processMessage()

 Después de resolver codCar (línea ~43), buscar último registro del hilo y heredar   
 campos:

 // Después de resolver codCar vía threadManager (línea ~43)
 var faseHeredada = '';
 var estadoHeredado = null;

 if (message.threadId) {
   var ultimo = obtenerUltimoRegistroPorThread(message.threadId);
   if (ultimo) {
     if (!codCar && ultimo.codCar) {
       codCar = ultimo.codCar;
       vinculacion = 'HILO';
     }
     faseHeredada = ultimo.fase || '';
     estadoHeredado = ultimo.estado || null;
   }
 }

 // En el return, usar valores heredados:
 // fase: faseHeredada,
 // estado: auditResult.alerta ? 'ALERTA' : (estadoHeredado ||
 obtenerEstadoInicial()),

 Campos que se heredan: codCar, fase, estado
 Campos que NO se heredan: messageId, asunto, fechaCorreo, cuerpo, interlocutor (son 
  propios del mensaje)

 Parte 2: Reglas — Nuevo tipo HEREDAR_DEL_HILO

 2a. src/extension/action-rules.js — Añadir tipo de acción

 // En TIPOS_ACCION_REGLA (línea 6-15):
 HEREDAR_DEL_HILO: 'HEREDAR_DEL_HILO'

 // En NOMBRES_ACCION_REGLA:
 HEREDAR_DEL_HILO: 'Heredar campo del hilo'

 Actualizar validarRegla() para aceptar params de HEREDAR_DEL_HILO:
 - params.campo: campo a heredar (fase, estado, o codCar)
 - params.estrategia: 'ultimoNoVacio' (default) — toma el valor del último registro  
 del hilo que tenga ese campo no vacío

 2b. src/extension/panel.js — Ejecutar HEREDAR_DEL_HILO

 En ejecutarAccionRegla() (línea ~650), añadir case:

 case 'HEREDAR_DEL_HILO':
   var campoHeredar = params.campo || campo;
   var hermano = registros.slice().reverse().find(function(r) {
     return r.threadId === threadId && r[campoHeredar];
   });
   if (hermano && hermano[campoHeredar]) {
     // Actualizar registro actual
     row[campoHeredar] = hermano[campoHeredar];
     // Sync a backend
     syncBackend('actualizarCampo', {
       messageId: row.messageId,
       campo: campoHeredar,
       valor: hermano[campoHeredar]
     });
     mostrarToast('Heredado ' + campoHeredar + ': ' + hermano[campoHeredar],
 'info');
   }
   break;

 2c. src/extension/config-rules-ui.js — UI para configurar

 Añadir HEREDAR_DEL_HILO a la lista de tipos de acción en el selector del modal de   
 reglas. Mostrar selector de campo a heredar y estrategia cuando se seleccione este  
 tipo.

 2d. Reglas default de ejemplo

 En generarReglasDefault() (action-rules.js), añadir regla de sistema
 comentada/inactiva como ejemplo:

 {
   id: 'default_heredar_cerrado',
   nombre: 'No heredar CERRADO desde INBOX',
   activa: false, // inactiva por defecto, el usuario la activa si quiere
   condicion: { campo: 'vinculacion', valor: 'HILO' },
   acciones: [{ tipo: 'CAMBIAR_ESTADO', params: { estado: 'PENDIENTE' } }],
   orden: 0,
   origen: 'sistema'
 }

 Esta regla permite: "si el correo heredó estado CERRADO pero llega al INBOX,
 ponerlo como PENDIENTE".

 Parte 3: Tests

 3a. tests/TDD/unit/test_action_rules.js

 - TIPOS_ACCION_REGLA incluye HEREDAR_DEL_HILO
 - validarRegla acepta acción HEREDAR_DEL_HILO con params válidos
 - evaluarReglas con condición vinculacion=HILO retorna reglas correctas

 3b. tests/TDD/unit/test_main.js (nuevo o existente)

 - processMessage con threadId existente hereda fase/estado del último registro      
 - processMessage sin threadId previo usa defaults
 - processMessage con alerta NO hereda estado (usa ALERTA)
 - Herencia de codCar mantiene compatibilidad con ThreadManager

 ---
 Archivos a modificar

 Archivo: src/gas/AdaptadorHojas.js
 Cambio: +obtenerUltimoRegistroPorThread() (~20 líneas)
 Complejidad: Baja
 ────────────────────────────────────────
 Archivo: src/gas/Main.js
 Cambio: Heredar fase/estado en processMessage() (~15 líneas)
 Complejidad: Baja
 ────────────────────────────────────────
 Archivo: src/extension/action-rules.js
 Cambio: +HEREDAR_DEL_HILO tipo + validación
 Complejidad: Baja
 ────────────────────────────────────────
 Archivo: src/extension/panel.js
 Cambio: +case HEREDAR_DEL_HILO en ejecutarAccionRegla()
 Complejidad: Baja
 ────────────────────────────────────────
 Archivo: src/extension/config-rules-ui.js
 Cambio: UI para nuevo tipo de acción
 Complejidad: Baja
 ────────────────────────────────────────
 Archivo: tests/TDD/unit/test_action_rules.js
 Cambio: Tests nuevo tipo
 Complejidad: Baja

 ---
 Verificación

 1. npx jest tests/TDD/unit/test_action_rules.js → tests nuevos pasan
 2. npx jest --no-coverage → 882+ tests pasan (sin regresiones)
 3. clasp push && clasp deploy -i [ID] → desplegar GAS
 4. Prueba manual:
   - Enviar correo a hilo existente con fase "19" y estado "GESTIONADO"
   - Ejecutar barrido → nuevo registro debe aparecer con fase "19" y estado
 "GESTIONADO"
   - En Kanban → debe aparecer en columna "En Ruta" (no en "Sin Fase")
 5. Crear regla en Config: vinculacion=HILO → CAMBIAR_ESTADO: PENDIENTE
   - Verificar que sobreescribe el estado heredado