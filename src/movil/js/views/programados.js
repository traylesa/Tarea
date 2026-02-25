// programados.js - Vista envios programados + recordatorios
'use strict';

var VistaProgramados = {
  renderizar: function(contenedor) {
    contenedor.innerHTML = '';

    var header = document.createElement('div');
    header.style.cssText = 'padding:16px;font-size:20px;font-weight:bold';
    header.textContent = 'Programados';
    contenedor.appendChild(header);

    var scrollable = document.createElement('div');
    scrollable.className = 'contenido';

    // Envios programados
    this._renderizarEnvios(scrollable);

    // Recordatorios
    this._renderizarRecordatorios(scrollable);

    contenedor.appendChild(scrollable);
  },

  _renderizarEnvios: async function(contenedor) {
    var seccion = document.createElement('div');
    seccion.innerHTML = '<div class="seccion-header"><span>Envios programados</span></div>';

    try {
      var data = await API.get('getProgramados');
      var programados = data.programados || [];

      if (programados.length === 0) {
        seccion.innerHTML += '<div class="p-16" style="color:var(--text-secondary)">Sin envios programados</div>';
      } else {
        programados.forEach(function(p) {
          var item = document.createElement('div');
          item.className = 'email-item';

          var color = p.estado === 'PENDIENTE' ? 'var(--color-warning)'
            : p.estado === 'ENVIADO' ? 'var(--color-ok)'
            : p.estado === 'ERROR' ? 'var(--color-danger)' : 'var(--text-secondary)';

          item.innerHTML = '<div style="display:flex;justify-content:space-between">'
            + '<span class="email-remitente">' + p.interlocutor + '</span>'
            + '<span style="color:' + color + ';font-weight:bold">' + p.estado + '</span></div>'
            + '<div class="email-fecha">' + new Date(p.fechaProgramada).toLocaleString('es-ES') + '</div>'
            + '<div class="email-cuerpo">' + (p.asunto || '').substring(0, 80) + '</div>';

          if (p.estado === 'PENDIENTE') {
            var btns = document.createElement('div');
            btns.style.cssText = 'display:flex;gap:8px;margin-top:8px';

            var btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-primary';
            btnEditar.textContent = 'Editar';
            btnEditar.style.cssText = 'font-size:13px;padding:6px 12px;min-height:40px;flex:1';
            btnEditar.addEventListener('click', function() {
              VistaProgramados._abrirEditor(p);
            });
            btns.appendChild(btnEditar);

            var btnEnviar = document.createElement('button');
            btnEnviar.className = 'btn btn-outline';
            btnEnviar.textContent = 'Enviar ya';
            btnEnviar.style.cssText = 'font-size:13px;padding:6px 12px;min-height:40px;flex:1';
            btnEnviar.addEventListener('click', function() {
              VistaProgramados._enviarAhora(p.id);
            });
            btns.appendChild(btnEnviar);

            var btnCancelar = document.createElement('button');
            btnCancelar.className = 'btn btn-danger';
            btnCancelar.textContent = 'X';
            btnCancelar.style.cssText = 'font-size:13px;padding:6px 12px;min-height:40px';
            btnCancelar.addEventListener('click', function() {
              VistaProgramados._cancelar(p.id);
            });
            btns.appendChild(btnCancelar);

            item.appendChild(btns);
          }

          if (p.estado === 'ERROR') {
            var btnRetry = document.createElement('button');
            btnRetry.className = 'btn btn-primary';
            btnRetry.textContent = 'Reintentar';
            btnRetry.style.cssText = 'margin-top:8px;font-size:13px;padding:6px 12px;min-height:40px';
            btnRetry.addEventListener('click', function() {
              VistaProgramados._reintentar(p);
            });
            item.appendChild(btnRetry);
            if (p.errorDetalle) {
              var err = document.createElement('div');
              err.style.cssText = 'font-size:11px;color:var(--color-danger);margin-top:4px';
              err.textContent = p.errorDetalle;
              item.appendChild(err);
            }
          }

          seccion.appendChild(item);
        });
      }
    } catch (e) {
      seccion.innerHTML += '<div class="p-16" style="color:var(--color-danger)">Error: ' + e.message + '</div>';
    }

    contenedor.appendChild(seccion);
  },

  _abrirEditor: function(prog) {
    var contenido = document.createElement('div');
    contenido.style.padding = '0 4px 8px';

    var lblDest = document.createElement('div');
    lblDest.style.cssText = 'font-size:12px;color:var(--text-secondary);margin-bottom:2px';
    lblDest.textContent = 'Para: ' + (prog.interlocutor || '—');
    contenido.appendChild(lblDest);

    // Asunto
    var lblAsunto = document.createElement('label');
    lblAsunto.style.cssText = 'font-size:12px;color:var(--text-secondary)';
    lblAsunto.textContent = 'Asunto';
    contenido.appendChild(lblAsunto);
    var inputAsunto = document.createElement('input');
    inputAsunto.type = 'text';
    inputAsunto.value = prog.asunto || '';
    inputAsunto.style.cssText = 'width:100%;font-size:14px;min-height:40px;padding:8px;margin-bottom:8px;border:1px solid #CCC;border-radius:4px;box-sizing:border-box';
    contenido.appendChild(inputAsunto);

    // Cuerpo
    var lblCuerpo = document.createElement('label');
    lblCuerpo.style.cssText = 'font-size:12px;color:var(--text-secondary)';
    lblCuerpo.textContent = 'Cuerpo';
    contenido.appendChild(lblCuerpo);
    var textarea = document.createElement('textarea');
    textarea.value = (prog.cuerpo || '').replace(/<[^>]+>/g, '');
    textarea.style.cssText = 'width:100%;font-size:14px;min-height:100px;padding:8px;margin-bottom:8px;border:1px solid #CCC;border-radius:4px;box-sizing:border-box';
    contenido.appendChild(textarea);

    // Fecha programada
    var lblFecha = document.createElement('label');
    lblFecha.style.cssText = 'font-size:12px;color:var(--text-secondary)';
    lblFecha.textContent = 'Fecha envio';
    contenido.appendChild(lblFecha);
    var inputFecha = document.createElement('input');
    inputFecha.type = 'datetime-local';
    inputFecha.value = prog.fechaProgramada ? prog.fechaProgramada.slice(0, 16) : '';
    inputFecha.style.cssText = 'width:100%;font-size:14px;min-height:40px;padding:8px;margin-bottom:12px;border:1px solid #CCC;border-radius:4px;box-sizing:border-box';
    contenido.appendChild(inputFecha);

    // Boton guardar
    var btnGuardar = document.createElement('button');
    btnGuardar.className = 'btn btn-success';
    btnGuardar.style.cssText = 'width:100%';
    btnGuardar.textContent = 'Guardar cambios';
    btnGuardar.addEventListener('click', async function() {
      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando...';
      try {
        var campos = {
          asunto: inputAsunto.value,
          cuerpo: '<p>' + textarea.value + '</p>',
          fechaProgramada: new Date(inputFecha.value).toISOString()
        };
        await API.post('actualizarProgramadoCampos', { id: prog.id, campos: campos });
        Feedback.vibrar('corto');
        ToastUI.mostrar('Cambios guardados', { tipo: 'exito' });
        BottomSheet.cerrar();
        App.renderizar();
      } catch (e) {
        ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar cambios';
      }
    });
    contenido.appendChild(btnGuardar);

    BottomSheet.abrir({ titulo: 'Editar envio', contenido: contenido });
  },

  _enviarAhora: async function(id) {
    try {
      await API.post('enviarProgramadoAhora', { id: id });
      Feedback.vibrar('doble');
      ToastUI.mostrar('Email enviado', { tipo: 'exito' });
      App.renderizar();
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _cancelar: async function(id) {
    try {
      await API.post('cancelarProgramado', { id: id });
      Feedback.vibrar('corto');
      ToastUI.mostrar('Envio cancelado', { tipo: 'exito' });
      App.renderizar();
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _reintentar: async function(prog) {
    try {
      await API.post('enviarProgramadoAhora', { id: prog.id });
      Feedback.vibrar('doble');
      ToastUI.mostrar('Reintento enviado', { tipo: 'exito' });
      App.renderizar();
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _renderizarRecordatorios: function(contenedor) {
    var seccion = document.createElement('div');
    seccion.innerHTML = '<div class="seccion-header"><span>Recordatorios activos</span></div>';

    var recordatorios = Store._leerJSON('tarealog_recordatorios', []);
    var activos = recordatorios.filter(function(r) {
      return !r.completado && new Date(r.fechaDisparo || r.fechaCreacion) > new Date(Date.now() - 86400000);
    });

    if (activos.length === 0) {
      seccion.innerHTML += '<div class="p-16" style="color:var(--text-secondary)">Sin recordatorios</div>';
    } else {
      activos.forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = '<div class="email-remitente">Carga ' + (r.codCar || r.clave || '?') + '</div>'
          + '<div class="email-fecha">' + new Date(r.fechaDisparo || r.fechaCreacion).toLocaleString('es-ES') + '</div>'
          + '<div class="email-cuerpo">' + (r.texto || '') + '</div>';
        seccion.appendChild(item);
      });
    }

    contenedor.appendChild(seccion);
  }
};
