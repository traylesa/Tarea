// detalle.js - Vista detalle de carga con emails, notas, historial
'use strict';

var VistaDetalle = {
  _codCar: null,

  renderizar: function(contenedor, codCar) {
    this._codCar = codCar;
    contenedor.innerHTML = '';

    var registros = Store.obtenerRegistrosPorCarga(Number(codCar));
    if (registros.length === 0) {
      contenedor.innerHTML = '<div class="p-16 text-center">Carga no encontrada</div>';
      return;
    }

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
    titulo.textContent = codCar + ' \u2022 ' + (principal.nombreTransportista || '');
    header.appendChild(titulo);

    var menuBtn = document.createElement('button');
    menuBtn.className = 'card-menu';
    menuBtn.textContent = '\u22EE';
    menuBtn.addEventListener('click', function() {
      VistaDetalle._abrirMenuOpciones(principal);
    });
    header.appendChild(menuBtn);

    contenedor.appendChild(header);

    // Chip fase
    var faseDiv = document.createElement('div');
    faseDiv.style.cssText = 'padding:8px 16px;background:var(--color-primary-light)';
    var chipFase = document.createElement('span');
    chipFase.className = 'chip-fase chip-fase-' + CardUI._claseFase(principal.fase);
    chipFase.textContent = CardUI._nombreFase(principal.fase);
    faseDiv.appendChild(chipFase);
    contenedor.appendChild(faseDiv);

    var scrollable = document.createElement('div');
    scrollable.className = 'contenido';

    // Seccion Emails (abierta)
    this._renderizarSeccion(scrollable, 'Emails (' + registros.length + ')', true, function(cont) {
      registros.sort(function(a, b) {
        return new Date(b.fechaCorreo) - new Date(a.fechaCorreo);
      });
      registros.forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = '<div class="email-remitente">' + (r.interlocutor || r.emailRemitente || '') + '</div>'
          + '<div class="email-fecha">' + new Date(r.fechaCorreo).toLocaleString('es-ES') + '</div>'
          + '<div class="email-cuerpo">' + (r.cuerpo || r.asunto || '').substring(0, 200) + '</div>';
        cont.appendChild(item);
      });
    });

    // Seccion Notas (cerrada)
    this._renderizarSeccion(scrollable, 'Notas', false, function(cont) {
      var notasAlmacen = Store._leerJSON('tarealog_notas', {});
      var notas = notasAlmacen[codCar] || [];
      if (notas.length === 0) {
        cont.innerHTML = '<div class="p-16" style="color:var(--text-secondary)">Sin notas</div>';
        return;
      }
      notas.forEach(function(n) {
        var item = document.createElement('div');
        item.className = 'nota-item';
        item.innerHTML = '<div><div class="nota-texto">' + n.texto + '</div>'
          + '<div class="nota-fecha">' + new Date(n.fechaCreacion).toLocaleString('es-ES') + '</div></div>'
          + '<button class="nota-eliminar" data-id="' + n.id + '">&times;</button>';
        cont.appendChild(item);
      });
    });

    // Seccion Historial (cerrada)
    this._renderizarSeccion(scrollable, 'Historial', false, function(cont) {
      var histAlmacen = Store._leerJSON('tarealog_historial', {});
      var hist = histAlmacen[codCar] || [];
      if (hist.length === 0) {
        cont.innerHTML = '<div class="p-16" style="color:var(--text-secondary)">Sin historial</div>';
        return;
      }
      hist.forEach(function(h) {
        var item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = '<div class="email-remitente">' + h.tipo + '</div>'
          + '<div class="email-fecha">' + new Date(h.fechaCreacion).toLocaleString('es-ES') + '</div>'
          + '<div class="email-cuerpo">' + h.descripcion + '</div>';
        cont.appendChild(item);
      });
    });

    contenedor.appendChild(scrollable);

    // Bottom bar dinámico via reglas
    var bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-bar';

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
      btn.textContent = acc.etiqueta || acc.texto || 'Accion';
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

    // Boton + Nota siempre presente
    var btnNota = document.createElement('button');
    btnNota.className = 'btn btn-outline btn-flex';
    btnNota.textContent = '+ Nota';
    btnNota.addEventListener('click', function() {
      VistaDetalle._agregarNota(codCar);
    });
    bottomBar.appendChild(btnNota);
    contenedor.appendChild(bottomBar);
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
    var faseAnterior = registro.fase;
    try {
      await API.post('actualizarCampo', {
        messageId: registro.messageId,
        campo: 'fase',
        valor: nuevaFase
      });
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
              var rec = crearRecordatorio(a.params.texto || 'Recordatorio', String(registro.codCar), a.params.horas || 1);
              var recs = Store._leerJSON('tarealog_recordatorios', []);
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
            if (a.params.fase) {
              API.post('actualizarCampo', {
                messageId: registro.messageId, campo: 'fase', valor: a.params.fase
              });
            }
            break;

          case 'CAMBIAR_ESTADO':
            if (a.params.estado) {
              API.post('actualizarCampo', {
                messageId: registro.messageId, campo: 'estado', valor: a.params.estado
              });
            }
            break;

          case 'PRESELECCIONAR_PLANTILLA':
            VistaDetalle._abrirEditorConPlantilla(registro, a.params.nombrePlantilla);
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
    var textoBuscar = (mapeo.buscar || params.texto || '').toLowerCase();

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
    try {
      await API.post('guardarRecordatorio', {
        clave: String(registro.codCar),
        texto: 'Revisar carga ' + registro.codCar,
        fechaDisparo: fecha,
        preset: minutos + 'min',
        origen: 'manual'
      });
      Feedback.vibrar('corto');
      ToastUI.mostrar('Recordatorio en ' + minutos + ' min', { tipo: 'exito' });
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  }
};
