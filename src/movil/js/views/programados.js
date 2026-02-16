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
            var btn = document.createElement('button');
            btn.className = 'btn btn-danger';
            btn.textContent = 'Cancelar';
            btn.style.cssText = 'margin-top:8px;font-size:13px;padding:6px 12px;min-height:40px';
            btn.addEventListener('click', function() {
              API.post('cancelarProgramado', { id: p.id }).then(function() {
                Feedback.vibrar('corto');
                ToastUI.mostrar('Envio cancelado', { tipo: 'exito' });
                App.renderizar();
              });
            });
            item.appendChild(btn);
          }

          seccion.appendChild(item);
        });
      }
    } catch (e) {
      seccion.innerHTML += '<div class="p-16" style="color:var(--color-danger)">Error: ' + e.message + '</div>';
    }

    contenedor.appendChild(seccion);
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
