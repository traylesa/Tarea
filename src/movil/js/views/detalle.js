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

    // Bottom bar sticky
    var bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-bar';

    var btnResponder = document.createElement('button');
    btnResponder.className = 'btn btn-primary btn-flex';
    btnResponder.textContent = 'Responder';
    btnResponder.addEventListener('click', function() {
      VistaDetalle._abrirEditor(principal);
    });

    var btnFase = document.createElement('button');
    btnFase.className = 'btn btn-outline btn-flex';
    btnFase.textContent = 'Fase';
    btnFase.addEventListener('click', function() {
      VistaDetalle._abrirCambioFase(principal);
    });

    var btnNota = document.createElement('button');
    btnNota.className = 'btn btn-outline btn-flex';
    btnNota.textContent = '+ Nota';
    btnNota.addEventListener('click', function() {
      VistaDetalle._agregarNota(codCar);
    });

    bottomBar.appendChild(btnResponder);
    bottomBar.appendChild(btnFase);
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
    var fases = [
      { texto: '00 Espera', codigo: '00' },
      { texto: '05 Incidencia', codigo: '05', color: '#D32F2F' },
      { texto: '11 En Carga', codigo: '11' },
      { texto: '12 Cargando', codigo: '12' },
      { texto: '19 Cargado', codigo: '19', color: '#2E7D32' },
      { texto: '21 En Descarga', codigo: '21' },
      { texto: '22 Descargando', codigo: '22' },
      { texto: '25 Incidencia', codigo: '25', color: '#D32F2F' },
      { texto: '29 Vacio', codigo: '29' },
      { texto: '30 Documentado', codigo: '30', color: '#2E7D32' }
    ];

    BottomSheet.abrir({
      titulo: 'Cambiar fase',
      opciones: fases.map(function(f) {
        return {
          texto: f.texto,
          color: f.color,
          accion: function() {
            VistaDetalle._ejecutarCambioFase(registro, f.codigo);
          }
        };
      })
    });
  },

  _ejecutarCambioFase: async function(registro, nuevaFase) {
    try {
      await API.post('actualizarCampo', {
        messageId: registro.messageId,
        campo: 'fase',
        valor: nuevaFase
      });
      Feedback.vibrar('corto');
      ToastUI.mostrar('Fase actualizada a ' + nuevaFase, { tipo: 'exito' });
      App.renderizar();
    } catch (e) {
      Feedback.vibrar('error');
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
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
    BottomSheet.abrir({
      titulo: 'Opciones',
      opciones: [
        { texto: 'Recordatorio', accion: function() {
          VistaDetalle._crearRecordatorio(registro);
        }},
        { texto: 'Vincular manual', accion: function() {
          var cod = prompt('Codigo de carga:');
          if (cod) {
            API.post('vincularManual', { threadId: registro.threadId, codCar: cod });
          }
        }}
      ]
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
