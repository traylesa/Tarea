// detalle.js - Vista detalle de carga con emails, notas, historial
'use strict';

var VistaDetalle = {
  _codCar: null,

  renderizar: function(contenedor, codCar) {
    this._codCar = codCar;
    contenedor.innerHTML = '';

    var registros = Store.obtenerRegistrosPorCarga(codCar);
    if (registros.length === 0) {
      contenedor.innerHTML = '<div class="p-16 text-center">Carga no encontrada</div>';
      return;
    }

    // Ordenar: mas reciente primero
    registros.sort(function(a, b) {
      return new Date(b.fechaCorreo) - new Date(a.fechaCorreo);
    });
    var principal = registros[0];

    // Header sticky
    var header = document.createElement('div');
    header.className = 'detalle-header';

    var back = document.createElement('button');
    back.className = 'detalle-back';
    back.innerHTML = '&#8592;';
    back.addEventListener('click', function() { App.navegar('todo'); });
    header.appendChild(back);

    var titulo = document.createElement('div');
    titulo.className = 'detalle-titulo';
    titulo.textContent = codCar;
    header.appendChild(titulo);

    var menuBtn = document.createElement('button');
    menuBtn.className = 'card-menu';
    menuBtn.style.color = 'white';
    menuBtn.textContent = '\u22EE';
    menuBtn.addEventListener('click', function() {
      VistaDetalle._abrirMenuOpciones(principal);
    });
    header.appendChild(menuBtn);

    // Override flex layout del CSS: bloque scrollable, flex:1 del CSS da la altura
    contenedor.style.cssText = 'overflow-y:auto;-webkit-overflow-scrolling:touch;display:block;';
    contenedor.appendChild(header);

    var scrollable = document.createElement('div');
    scrollable.style.cssText = 'padding:2px 6px 0;';

    // === FICHA DATOS PRINCIPALES (siempre visible) ===
    try {
    var ficha = document.createElement('div');
    ficha.className = 'detalle-ficha';

    // Fila fase + estado
    var faseEstado = document.createElement('div');
    faseEstado.className = 'ficha-fila ficha-fila-badges';
    var clFase = typeof CardUI !== 'undefined' && CardUI._claseFase ? CardUI._claseFase(principal.fase) : 'default';
    var nomCorto = typeof CardUI !== 'undefined' && CardUI._nombreFaseCorto ? CardUI._nombreFaseCorto(principal.fase) : (principal.fase || '--');
    var nomLargo = typeof CardUI !== 'undefined' && CardUI._nombreFase ? CardUI._nombreFase(principal.fase) : '';
    var chipFase = '<span class="chip-fase chip-fase-' + clFase + '" style="padding:3px 10px;font-size:12px">'
      + nomCorto + ' ' + nomLargo + '</span>';
    var estObj = typeof obtenerEstadoPorCodigo === 'function' && typeof getDefaultEstados === 'function'
      ? obtenerEstadoPorCodigo(getDefaultEstados(), principal.estado) : null;
    var chipEstado = estObj
      ? '<span class="ficha-estado ficha-estado-' + principal.estado.toLowerCase() + '">' + estObj.icono + ' ' + estObj.nombre + '</span>'
      : '<span class="ficha-estado">' + (principal.estado || '--') + '</span>';
    faseEstado.innerHTML = chipFase + chipEstado;
    if (principal.fechaCorreo) {
      faseEstado.innerHTML += '<span style="margin-left:auto;font-size:11px;color:var(--text-secondary)">'
        + new Date(principal.fechaCorreo).toLocaleString('es-ES') + '</span>';
    }
    ficha.appendChild(faseEstado);

    // Filas de datos
    var campos = [
      { label: 'Transportista', valor: principal.nombreTransportista, icono: '\uD83D\uDE9A' },
      { label: 'Interlocutor', valor: principal.interlocutor || principal.emailRemitente, icono: '\uD83D\uDCE7' },
      { label: 'Asunto', valor: principal.asunto, icono: '\uD83D\uDCDD' },
      { label: 'Cod. Transportista', valor: principal.codTra, icono: '#' },
      { label: 'Referencia', valor: principal.referencia, icono: '\uD83D\uDD17' },
      { label: 'Tipo tarea', valor: principal.tipoTarea, icono: '\uD83D\uDCCB' },
      { label: 'Vinculacion', valor: principal.vinculacion, icono: '\uD83D\uDD04' },
      { label: 'F. Carga', valor: VistaDetalle._formatearFechaHora(principal.fCarga, principal.hCarga), icono: '\uD83D\uDCC5' },
      { label: 'F. Entrega', valor: VistaDetalle._formatearFechaHora(principal.fEntrega, principal.hEntrega), icono: '\uD83C\uDFC1' },
      { label: 'Zona', valor: [principal.zona, principal.zDest].filter(Boolean).join(' \u2192 '), icono: '\uD83D\uDCCD' },
      { label: 'Bandeja', valor: principal.bandeja, icono: '\uD83D\uDCE5' },
      { label: 'Msgs en hilo', valor: principal.mensajesEnHilo, icono: '\u2709' },
      { label: 'Alerta', valor: principal.alerta, icono: '\u26A0' }
    ];

    campos.forEach(function(c) {
      if (!c.valor) return;
      var fila = document.createElement('div');
      fila.className = 'ficha-fila';
      fila.innerHTML = '<span class="ficha-icono">' + c.icono + '</span>'
        + '<span class="ficha-label">' + c.label + '</span>'
        + '<span class="ficha-valor">' + VistaDetalle._escaparHTML(String(c.valor)) + '</span>';
      ficha.appendChild(fila);
    });

    scrollable.appendChild(ficha);

    // === CUERPO ULTIMO EMAIL (expandible) ===
    if (principal.cuerpo) {
      var cuerpoDiv = document.createElement('div');
      cuerpoDiv.className = 'detalle-cuerpo-email';
      var cuerpoTexto = principal.cuerpo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      var esLargo = cuerpoTexto.length > 200;
      cuerpoDiv.innerHTML = '<div class="ficha-label" style="margin-bottom:4px">\uD83D\uDCE8 Ultimo email</div>'
        + '<div class="cuerpo-texto' + (esLargo ? ' truncado' : '') + '">' + VistaDetalle._escaparHTML(cuerpoTexto) + '</div>';
      if (esLargo) {
        var btnVer = document.createElement('button');
        btnVer.className = 'btn-ver-mas';
        btnVer.textContent = 'Ver completo';
        btnVer.addEventListener('click', function() {
          cuerpoDiv.querySelector('.cuerpo-texto').classList.toggle('truncado');
          btnVer.textContent = cuerpoDiv.querySelector('.truncado') ? 'Ver completo' : 'Ver menos';
        });
        cuerpoDiv.appendChild(btnVer);
      }
      scrollable.appendChild(cuerpoDiv);
    }

    // === SECCIONES COLAPSABLES ===

    // Emails del hilo
    if (registros.length > 1) {
      this._renderizarSeccion(scrollable, '\u2709 Emails del hilo (' + registros.length + ')', false, function(cont) {
        registros.forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'email-item';
          var cuerpoResumen = (r.cuerpo || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);
          item.innerHTML = '<div class="email-remitente">' + VistaDetalle._escaparHTML(r.interlocutor || r.emailRemitente || '') + '</div>'
            + '<div class="email-fecha">' + new Date(r.fechaCorreo).toLocaleString('es-ES') + '</div>'
            + '<div class="email-cuerpo">' + VistaDetalle._escaparHTML(cuerpoResumen) + '</div>';
          cont.appendChild(item);
        });
      });
    }

    // Notas
    this._renderizarSeccion(scrollable, '\uD83D\uDCCC Notas', false, function(cont) {
      var notasAlmacen = Store._leerJSON('tarealog_notas', {});
      var notas = notasAlmacen[codCar] || [];
      if (notas.length === 0) {
        cont.innerHTML = '<div class="p-16" style="color:var(--text-secondary)">Sin notas</div>';
        return;
      }
      notas.forEach(function(n) {
        var item = document.createElement('div');
        item.className = 'nota-item';
        item.innerHTML = '<div><div class="nota-texto">' + VistaDetalle._escaparHTML(n.texto) + '</div>'
          + '<div class="nota-fecha">' + new Date(n.fechaCreacion).toLocaleString('es-ES') + '</div></div>'
          + '<button class="nota-eliminar" data-id="' + n.id + '">&times;</button>';
        cont.appendChild(item);
      });
    });

    // Historial
    this._renderizarSeccion(scrollable, '\uD83D\uDCCA Historial', false, function(cont) {
      var histAlmacen = Store._leerJSON('tarealog_historial', {});
      var hist = histAlmacen[codCar] || [];
      if (hist.length === 0) {
        cont.innerHTML = '<div class="p-16" style="color:var(--text-secondary)">Sin historial</div>';
        return;
      }
      hist.forEach(function(h) {
        var item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = '<div class="email-remitente">' + VistaDetalle._escaparHTML(h.tipo) + '</div>'
          + '<div class="email-fecha">' + new Date(h.fechaCreacion).toLocaleString('es-ES') + '</div>'
          + '<div class="email-cuerpo">' + VistaDetalle._escaparHTML(h.descripcion) + '</div>';
        cont.appendChild(item);
      });
    });

    } catch (e) {
      scrollable.innerHTML += '<div class="p-16" style="color:var(--color-danger)">Error renderizando detalle: ' + e.message + '</div>';
      console.error('VistaDetalle error:', e);
    }

    // Espaciador para que al hacer scroll el ultimo contenido no quede pegado al bar
    var spacer = document.createElement('div');
    spacer.style.height = '100px';
    scrollable.appendChild(spacer);

    // Bottom bar dinámico via reglas (sticky bottom dentro del scroll)
    var bottomBar = document.createElement('div');
    bottomBar.style.cssText = 'position:sticky;bottom:0;display:flex;gap:8px;padding:12px 16px;background:white;border-top:1px solid #E0E0E0;z-index:90;';

    var config = Store.obtenerConfig();
    var reglas = config.reglasAcciones || (typeof generarReglasDefault === 'function' ? generarReglasDefault() : []);
    var accionesReglas = typeof obtenerAccionesDesdeReglas === 'function'
      ? obtenerAccionesDesdeReglas(reglas, principal.fase) : [];
    var accionesFase = typeof obtenerAccionesPorFase === 'function'
      ? obtenerAccionesPorFase(principal.fase) : [];

    // Primeros 2 botones: acciones dinámicas (reglas o fallback)
    var botonesDinamicos = accionesReglas.length > 0 ? accionesReglas.slice(0, 2) : accionesFase.slice(0, 2);

    botonesDinamicos.forEach(function(acc) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-flex';
      var tieneDestino = acc.faseSiguiente || acc.plantilla || acc.aviso;
      btn.textContent = tieneDestino ? (acc.etiqueta || acc.texto || 'Accion') : 'Fase';
      btn.addEventListener('click', function() {
        if (acc.faseSiguiente) {
          VistaDetalle._ejecutarCambioFase(principal, acc.faseSiguiente);
        } else if (acc.plantilla) {
          VistaDetalle._abrirEditorConPlantilla(principal, acc.plantilla);
        } else if (acc.aviso) {
          ToastUI.mostrar(acc.aviso, { tipo: 'info' });
        } else {
          VistaDetalle._abrirCambioFase(principal);
        }
      });
      bottomBar.appendChild(btn);
    });

    // Si no hay acciones dinámicas, botones por defecto
    if (botonesDinamicos.length === 0) {
      var btnFase = document.createElement('button');
      btnFase.className = 'btn btn-outline btn-flex';
      btnFase.textContent = 'Fase';
      btnFase.addEventListener('click', function() {
        VistaDetalle._abrirCambioFase(principal);
      });
      bottomBar.appendChild(btnFase);
    }

    // Boton Estado siempre presente
    var btnEstado = document.createElement('button');
    btnEstado.className = 'btn btn-outline btn-flex';
    btnEstado.textContent = 'Estado';
    btnEstado.addEventListener('click', function() {
      VistaDetalle._abrirCambioEstado(principal);
    });
    bottomBar.appendChild(btnEstado);

    // Boton + Nota siempre presente
    var btnNota = document.createElement('button');
    btnNota.className = 'btn btn-outline btn-flex';
    btnNota.textContent = '+ Nota';
    btnNota.addEventListener('click', function() {
      VistaDetalle._agregarNota(codCar);
    });
    bottomBar.appendChild(btnNota);

    var btnRecord = document.createElement('button');
    btnRecord.className = 'btn btn-outline btn-flex';
    btnRecord.textContent = '+ Record.';
    btnRecord.addEventListener('click', function() {
      VistaDetalle._crearRecordatorio(principal);
    });
    bottomBar.appendChild(btnRecord);

    scrollable.appendChild(bottomBar);
    contenedor.appendChild(scrollable);
  },

  _formatearFechaHora: function(fecha, hora) {
    if (!fecha) return '';
    var partes = [fecha];
    if (hora) partes.push(hora);
    return partes.join(' ');
  },

  _escaparHTML: function(texto) {
    var div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  },

  _renderizarSeccion: function(padre, titulo, abierta, renderContenido) {
    var header = document.createElement('div');
    header.className = 'seccion-header';
    header.innerHTML = '<span>' + titulo + '</span><span>' + (abierta ? '\u25BC' : '\u25B6') + '</span>';

    var contenido = document.createElement('div');
    contenido.className = 'seccion-contenido' + (abierta ? ' abierta' : '');
    renderContenido(contenido);

    header.addEventListener('click', function() {
      contenido.classList.toggle('abierta');
      header.querySelector('span:last-child').textContent =
        contenido.classList.contains('abierta') ? '\u25BC' : '\u25B6';
    });

    padre.appendChild(header);
    padre.appendChild(contenido);
  },

  _abrirCambioEstado: function(registro) {
    var estados = typeof getDefaultEstados === 'function'
      ? getDefaultEstados().filter(function(e) { return e.activo; })
      : [];

    BottomSheet.abrir({
      titulo: 'Cambiar estado',
      opciones: estados.map(function(e) {
        return {
          texto: e.icono + ' ' + e.nombre,
          accion: function() {
            VistaDetalle._ejecutarCambioEstado(registro, e.codigo);
          }
        };
      })
    });
  },

  _ejecutarCambioEstado: async function(registro, nuevoEstado) {
    try {
      await API.post('actualizarCampoPorThread', {
        threadId: registro.threadId, campo: 'estado', valor: nuevoEstado
      });

      var todos = Store.obtenerRegistros();
      todos.forEach(function(r) {
        if (r.threadId === registro.threadId) r.estado = nuevoEstado;
      });
      Store.guardarRegistros(todos);

      if (typeof evaluarAlertas === 'function') {
        Store.guardarAlertas(evaluarAlertas(todos, Store.obtenerConfig()));
      }

      Feedback.vibrar('corto');
      ToastUI.mostrar('Estado \u2192 ' + nuevoEstado, { tipo: 'exito' });
      App.renderizar();
    } catch (e) {
      Feedback.vibrar('error');
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _abrirCambioFase: function(registro) {
    var fases = typeof getDefaultFases === 'function'
      ? getDefaultFases().filter(function(f) { return f.activa && f.codigo; })
      : [];

    BottomSheet.abrir({
      titulo: 'Cambiar fase',
      opciones: fases.map(function(f) {
        var color = f.clase_css === 'fase-incidencia' ? '#D32F2F'
          : f.clase_css === 'fase-ok' ? '#2E7D32' : null;
        return {
          texto: f.nombre,
          color: color,
          accion: function() {
            VistaDetalle._ejecutarCambioFase(registro, f.codigo);
          }
        };
      })
    });
  },

  _ejecutarCambioFase: async function(registro, nuevaFase) {
    // Normalizar fase a string con padding (evitar "0" en vez de "00")
    nuevaFase = String(nuevaFase).padStart(2, '0');
    var faseAnterior = registro.fase;
    try {
      // Propagar al hilo completo en backend (como escritorio)
      await API.post('actualizarCampoPorThread', {
        threadId: registro.threadId,
        campo: 'fase',
        valor: nuevaFase
      });

      // Propagar al hilo completo en local
      var todos = Store.obtenerRegistros();
      todos.forEach(function(r) {
        if (r.threadId === registro.threadId) r.fase = nuevaFase;
      });
      Store.guardarRegistros(todos);

      if (typeof evaluarAlertas === 'function') {
        Store.guardarAlertas(evaluarAlertas(todos, Store.obtenerConfig()));
      }

      Feedback.vibrar('corto');
      ToastUI.mostrar('Fase actualizada a ' + nuevaFase, { tipo: 'exito' });

      // Evaluar reglas post-cambio
      VistaDetalle._procesarReglasPostCambio(registro, 'fase', nuevaFase, faseAnterior);

      App.renderizar();
    } catch (e) {
      Feedback.vibrar('error');
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _procesarReglasPostCambio: function(registro, campo, valorNuevo, valorAnterior) {
    if (typeof evaluarReglas !== 'function') return;

    var config = Store.obtenerConfig();
    var reglas = config.reglasAcciones || (typeof generarReglasDefault === 'function' ? generarReglasDefault() : []);
    var resultados = evaluarReglas(reglas, campo, valorNuevo, valorAnterior);

    resultados.forEach(function(r) {
      r.acciones.forEach(function(a) {
        switch (a.tipo) {
          case 'PROPAGAR_HILO':
            // Actualizar registros locales del mismo threadId
            var todos = Store.obtenerRegistros();
            todos.forEach(function(reg) {
              if (reg.threadId === registro.threadId) reg[campo] = valorNuevo;
            });
            Store.guardarRegistros(todos);
            break;

          case 'SUGERIR_RECORDATORIO':
            VistaDetalle._mostrarSugerenciaEmailProgramado(registro, a.params);
            break;

          case 'CREAR_RECORDATORIO':
            if (typeof crearRecordatorio === 'function') {
              var recs = Store._leerJSON('tarealog_recordatorios', []);
              var rec = crearRecordatorio(a.params.texto || 'Recordatorio', String(registro.codCar), (a.params.horas || 1) + 'h', new Date(), recs, registro.asunto || null);
              recs.push(rec);
              Store._guardarJSON('tarealog_recordatorios', recs);
              ToastUI.mostrar('Recordatorio creado', { tipo: 'info' });
            }
            break;

          case 'INICIAR_SECUENCIA':
            if (typeof crearSecuencia === 'function') {
              var seq = crearSecuencia(a.params.nombre || 'Seguimiento', String(registro.codCar), a.params.pasos || []);
              var seqs = Store._leerJSON('tarealog_secuencias', []);
              seqs.push(seq);
              Store._guardarJSON('tarealog_secuencias', seqs);
              ToastUI.mostrar('Secuencia iniciada', { tipo: 'info' });
            }
            break;

          case 'CAMBIAR_FASE':
            if (a.params.fase && registro.threadId) {
              API.post('actualizarCampoPorThread', {
                threadId: registro.threadId, campo: 'fase', valor: a.params.fase
              });
              var todosFase = Store.obtenerRegistros();
              todosFase.forEach(function(reg) {
                if (reg.threadId === registro.threadId) reg.fase = a.params.fase;
              });
              Store.guardarRegistros(todosFase);
            }
            break;

          case 'CAMBIAR_ESTADO':
            if (a.params.estado && registro.threadId) {
              API.post('actualizarCampoPorThread', {
                threadId: registro.threadId, campo: 'estado', valor: a.params.estado
              });
              var todosEst = Store.obtenerRegistros();
              todosEst.forEach(function(reg) {
                if (reg.threadId === registro.threadId) reg.estado = a.params.estado;
              });
              Store.guardarRegistros(todosEst);
            }
            break;

          case 'PRESELECCIONAR_PLANTILLA':
            if (a.params.programarEnvio) {
              VistaDetalle._mostrarSugerenciaEmailProgramado(registro, {
                texto: a.params.nombrePlantilla || 'Email programado',
                horas: 24
              });
            } else {
              VistaDetalle._abrirEditorConPlantilla(registro, a.params.nombrePlantilla);
            }
            break;

          case 'MOSTRAR_AVISO':
            ToastUI.mostrar(a.params.mensaje || r.nombre, { tipo: 'info' });
            break;
        }
      });
    });
  },

  // Mapeo fase → plantilla por defecto para email programado
  _MAPEO_FASE_PLANTILLA: {
    '19': { buscar: 'descarga', hora: '08:00', horas: 8 },
    '29': { buscar: 'pod', hora: '08:00', horas: 24 }
  },

  _mostrarSugerenciaEmailProgramado: function(registro, params) {
    var plantillas = Store.obtenerPlantillas();
    var mapeo = this._MAPEO_FASE_PLANTILLA[registro.fase] || {};
    var textoBuscar = (params.texto || mapeo.buscar || '').toLowerCase();

    // Pre-seleccionar plantilla que coincida
    var plantillaDefault = plantillas.find(function(p) {
      return p.alias.toLowerCase().indexOf(textoBuscar) !== -1;
    });

    // Fecha programada: mañana a la hora configurada
    var manana = new Date();
    manana.setDate(manana.getDate() + 1);
    var hora = mapeo.hora || '08:00';
    var partes = hora.split(':');
    manana.setHours(parseInt(partes[0]) || 8, parseInt(partes[1]) || 0, 0, 0);

    var contenido = document.createElement('div');

    var titulo = document.createElement('div');
    titulo.style.cssText = 'font-weight:bold;font-size:16px;margin-bottom:12px';
    titulo.textContent = params.texto || 'Email programado';
    contenido.appendChild(titulo);

    // Selector plantilla
    var lblPlantilla = document.createElement('div');
    lblPlantilla.style.cssText = 'margin-bottom:4px;font-size:14px;color:var(--text-secondary)';
    lblPlantilla.textContent = 'Plantilla:';
    contenido.appendChild(lblPlantilla);

    var selPlantilla = document.createElement('select');
    selPlantilla.style.cssText = 'width:100%;font-size:16px;min-height:48px;padding:8px;margin-bottom:12px;border:1px solid #CCC;border-radius:4px';
    selPlantilla.innerHTML = '<option value="">Sin plantilla</option>';
    plantillas.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.alias;
      if (plantillaDefault && p.id === plantillaDefault.id) opt.selected = true;
      selPlantilla.appendChild(opt);
    });
    contenido.appendChild(selPlantilla);

    // Fecha/hora
    var lblFecha = document.createElement('div');
    lblFecha.style.cssText = 'margin-bottom:4px;font-size:14px;color:var(--text-secondary)';
    lblFecha.textContent = 'Enviar:';
    contenido.appendChild(lblFecha);

    var inputFecha = document.createElement('input');
    inputFecha.type = 'datetime-local';
    inputFecha.style.cssText = 'width:100%;font-size:16px;min-height:48px;padding:8px;margin-bottom:12px;border:1px solid #CCC;border-radius:4px';
    inputFecha.value = manana.toISOString().slice(0, 16);
    contenido.appendChild(inputFecha);

    // Destinatario
    var lblDest = document.createElement('div');
    lblDest.style.cssText = 'margin-bottom:4px;font-size:14px;color:var(--text-secondary)';
    lblDest.textContent = 'Para:';
    contenido.appendChild(lblDest);

    var destInfo = document.createElement('div');
    destInfo.style.cssText = 'padding:8px;background:var(--bg-secondary);border-radius:4px;margin-bottom:16px;font-size:14px';
    destInfo.textContent = registro.interlocutor || registro.emailRemitente || 'Sin destinatario';
    contenido.appendChild(destInfo);

    // Botones
    var btnProgramar = document.createElement('button');
    btnProgramar.className = 'btn btn-success';
    btnProgramar.style.cssText = 'width:100%;margin-bottom:8px';
    btnProgramar.textContent = 'PROGRAMAR ENVIO';
    btnProgramar.addEventListener('click', function() {
      VistaDetalle._ejecutarEmailProgramado(registro, selPlantilla.value, inputFecha.value);
      BottomSheet.cerrar();
    });
    contenido.appendChild(btnProgramar);

    var btnRecordatorio = document.createElement('button');
    btnRecordatorio.className = 'btn btn-outline';
    btnRecordatorio.style.cssText = 'width:100%;margin-bottom:8px';
    btnRecordatorio.textContent = 'Solo recordatorio';
    btnRecordatorio.addEventListener('click', function() {
      VistaDetalle._guardarRecordatorio(registro, (params.horas || 8) * 60);
      BottomSheet.cerrar();
    });
    contenido.appendChild(btnRecordatorio);

    BottomSheet.abrir({ titulo: params.texto || 'Programar seguimiento', contenido: contenido });
  },

  _ejecutarEmailProgramado: async function(registro, plantillaId, fechaISO) {
    try {
      var plantillas = Store.obtenerPlantillas();
      var plantilla = plantillas.find(function(p) { return p.id === plantillaId; });
      var cuerpo = '';

      if (plantilla && typeof interpolar === 'function') {
        cuerpo = interpolar(plantilla.cuerpo || plantilla.texto || '', {
          codCar: registro.codCar, transportista: registro.nombreTransportista,
          fase: registro.fase, interlocutor: registro.interlocutor
        });
      }

      await API.post('enviarRespuesta', {
        destinatarios: [{
          email: registro.interlocutor || registro.emailRemitente,
          threadId: registro.threadId,
          asunto: 'Re: ' + (registro.asunto || ''),
          cuerpo: '<p>' + cuerpo + '</p>' + Store.obtenerPieComun(),
          para: registro.interlocutor || registro.emailRemitente,
          cc: registro.cc || '', cco: ''
        }],
        programado: true,
        fechaProgramada: new Date(fechaISO).toISOString()
      });

      Feedback.vibrar('doble');
      var fechaLocal = new Date(fechaISO).toLocaleString('es-ES');
      ToastUI.mostrar('Email programado para ' + fechaLocal, { tipo: 'exito' });
    } catch (e) {
      Feedback.vibrar('error');
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _abrirEditorConPlantilla: function(registro, nombrePlantilla) {
    var plantillas = Store.obtenerPlantillas();
    var plantilla = plantillas.find(function(p) {
      return p.alias.toLowerCase().indexOf((nombrePlantilla || '').toLowerCase()) !== -1;
    });

    this._abrirEditor(registro);

    // Pre-seleccionar plantilla si existe
    if (plantilla) {
      setTimeout(function() {
        var select = document.querySelector('.editor-overlay select');
        if (select) {
          select.value = plantilla.id;
          select.dispatchEvent(new Event('change'));
        }
      }, 100);
    }
  },

  _abrirEditor: function(registro) {
    var overlay = document.createElement('div');
    overlay.className = 'editor-overlay';

    var toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';

    var cerrar = document.createElement('button');
    cerrar.className = 'editor-cerrar';
    cerrar.textContent = '\u2715';
    cerrar.addEventListener('click', function() { overlay.remove(); });

    var selPlantilla = document.createElement('select');
    selPlantilla.style.cssText = 'font-size:16px;min-height:48px;padding:8px';
    selPlantilla.innerHTML = '<option value="">Sin plantilla</option>';
    var plantillas = Store.obtenerPlantillas();
    plantillas.forEach(function(p) {
      selPlantilla.innerHTML += '<option value="' + p.id + '">' + p.alias + '</option>';
    });

    toolbar.appendChild(cerrar);
    toolbar.appendChild(selPlantilla);

    var cuerpoDiv = document.createElement('div');
    cuerpoDiv.className = 'editor-cuerpo';
    var textarea = document.createElement('textarea');
    textarea.placeholder = 'Escribe tu respuesta...';
    cuerpoDiv.appendChild(textarea);

    // Pie comun
    var pie = document.createElement('div');
    pie.className = 'editor-pie';
    pie.innerHTML = Store.obtenerPieComun() || '<em>Sin firma configurada</em>';

    var acciones = document.createElement('div');
    acciones.className = 'editor-acciones';

    var btnEnviar = document.createElement('button');
    btnEnviar.className = 'btn btn-success';
    btnEnviar.textContent = 'Enviar ahora';
    btnEnviar.style.width = '100%';
    btnEnviar.addEventListener('click', async function() {
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';
      try {
        await API.post('enviarRespuesta', {
          destinatarios: [{
            email: registro.interlocutor,
            threadId: registro.threadId,
            asunto: 'Re: ' + registro.asunto,
            cuerpo: '<p>' + textarea.value + '</p>' + Store.obtenerPieComun(),
            para: registro.interlocutor,
            cc: registro.cc || '',
            cco: ''
          }]
        });
        Feedback.vibrar('doble');
        ToastUI.mostrar('Email enviado', { tipo: 'exito' });
        overlay.remove();
      } catch (e) {
        Feedback.vibrar('error');
        ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar ahora';
      }
    });

    acciones.appendChild(btnEnviar);

    overlay.appendChild(toolbar);
    overlay.appendChild(cuerpoDiv);
    overlay.appendChild(pie);
    overlay.appendChild(acciones);
    document.body.appendChild(overlay);
  },

  _agregarNota: function(codCar) {
    var texto = prompt('Texto de la nota:');
    if (!texto) return;

    API.post('guardarNota', { clave: String(codCar), texto: texto, tipo: 'CARGA' })
      .then(function() {
        Feedback.vibrar('corto');
        ToastUI.mostrar('Nota guardada', { tipo: 'exito' });
        App.renderizar();
      })
      .catch(function(e) {
        ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
      });
  },

  _abrirMenuOpciones: function(registro) {
    var opciones = [
      { texto: 'Responder', accion: function() {
        VistaDetalle._abrirEditor(registro);
      }},
      { texto: 'Cambiar fase', accion: function() {
        VistaDetalle._abrirCambioFase(registro);
      }},
      { texto: 'Cambiar estado', accion: function() {
        VistaDetalle._abrirCambioEstado(registro);
      }},
      { texto: 'Recordatorio', accion: function() {
        VistaDetalle._crearRecordatorio(registro);
      }},
      { texto: 'Iniciar secuencia', accion: function() {
        VistaDetalle._abrirIniciarSecuencia(registro);
      }},
      { texto: 'Vincular manual', accion: function() {
        var cod = prompt('Codigo de carga:');
        if (cod) {
          API.post('vincularManual', { threadId: registro.threadId, codCar: cod });
        }
      }}
    ];
    BottomSheet.abrir({ titulo: 'Opciones', opciones: opciones });
  },

  _abrirIniciarSecuencia: function(registro) {
    var predefinidas = typeof SECUENCIAS_PREDEFINIDAS !== 'undefined' ? SECUENCIAS_PREDEFINIDAS : {};
    var nombres = Object.keys(predefinidas);
    if (nombres.length === 0) {
      ToastUI.mostrar('Sin secuencias disponibles', { tipo: 'info' });
      return;
    }
    BottomSheet.abrir({
      titulo: 'Iniciar secuencia',
      opciones: nombres.map(function(nombre) {
        return {
          texto: nombre,
          accion: function() {
            if (typeof crearSecuencia === 'function') {
              var config = predefinidas[nombre];
              var seq = crearSecuencia(nombre, String(registro.codCar), config.pasos);
              var seqs = Store._leerJSON('tarealog_secuencias', []);
              seqs.push(seq);
              Store._guardarJSON('tarealog_secuencias', seqs);
              Feedback.vibrar('corto');
              ToastUI.mostrar('Secuencia "' + nombre + '" iniciada', { tipo: 'exito' });
            }
          }
        };
      })
    });
  },

  _crearRecordatorio: function(registro) {
    BottomSheet.abrir({
      titulo: 'Recordatorio',
      opciones: [
        { texto: '15 min', accion: function() { VistaDetalle._guardarRecordatorio(registro, 15); }},
        { texto: '30 min', accion: function() { VistaDetalle._guardarRecordatorio(registro, 30); }},
        { texto: '1 hora', accion: function() { VistaDetalle._guardarRecordatorio(registro, 60); }},
        { texto: '4 horas', accion: function() { VistaDetalle._guardarRecordatorio(registro, 240); }}
      ]
    });
  },

  _guardarRecordatorio: async function(registro, minutos) {
    var fecha = new Date(Date.now() + minutos * 60000).toISOString();
    var id = 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var texto = 'Revisar carga ' + registro.codCar;
    try {
      await API.post('guardarRecordatorio', {
        id: id,
        clave: String(registro.codCar),
        texto: texto,
        asunto: registro.asunto || '',
        fechaDisparo: fecha,
        preset: minutos + 'min',
        origen: 'manual'
      });
      // Guardar tambien en localStorage para indicadores y evaluacion
      var lista = Store._leerJSON('tarealog_recordatorios', []);
      lista.push({ id: id, codCar: String(registro.codCar), texto: texto, asunto: registro.asunto || '', fechaDisparo: fecha, snoozeCount: 0, origen: 'manual' });
      Store._guardarJSON('tarealog_recordatorios', lista);
      Feedback.vibrar('corto');
      ToastUI.mostrar('Recordatorio en ' + minutos + ' min', { tipo: 'exito' });
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  }
};
