// mi-turno.js - Vista dashboard turno: KPIs, alertas categorizadas, secuencias, reporte
'use strict';

var VistaMiTurno = {
  _secuenciasAbiertas: false,

  renderizar: function(contenedor) {
    contenedor.innerHTML = '';

    var registros = Store.obtenerRegistros();
    var alertas = Store.obtenerAlertas();
    var recordatorios = Store._leerJSON('tarealog_recordatorios', []);
    var ahora = new Date();

    // Sin datos: mostrar boton de carga
    if (registros.length === 0) {
      this._renderizarSinDatos(contenedor);
      return;
    }

    // KPIs
    var kpis = typeof calcularKPIsTurno === 'function'
      ? calcularKPIsTurno(registros, alertas, recordatorios, ahora)
      : { activas: 0, alertasUrgentes: 0, cerradasHoy: 0, recordatoriosHoy: 0 };

    this._renderizarKPIs(contenedor, kpis);

    var scrollable = document.createElement('div');
    scrollable.className = 'contenido';

    // Grafico semanal
    if (typeof calcularGraficoSemanal === 'function') {
      this._renderizarGrafico(scrollable, calcularGraficoSemanal(registros, ahora));
    }

    // Categorias alertas
    if (typeof categorizarAlertas === 'function') {
      this._renderizarCategorias(scrollable, categorizarAlertas(alertas));
    }

    // Secuencias activas
    this._renderizarSecuencias(scrollable);

    // Boton reporte
    var btnReporte = document.createElement('button');
    btnReporte.className = 'btn btn-primary';
    btnReporte.style.cssText = 'width:100%;margin-top:16px';
    btnReporte.textContent = 'GENERAR REPORTE TURNO';
    btnReporte.addEventListener('click', function() {
      VistaMiTurno._generarReporte(registros, alertas, recordatorios, ahora);
    });
    scrollable.appendChild(btnReporte);

    contenedor.appendChild(scrollable);
  },

  _renderizarSinDatos: function(contenedor) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:48px 24px;text-align:center';

    var config = Store.obtenerConfig();
    if (!config.gasUrl) {
      div.innerHTML = '<div style="font-size:48px;margin-bottom:16px">&#9881;</div>'
        + '<div style="font-size:18px;font-weight:bold;margin-bottom:8px">Configura tu conexion</div>'
        + '<div style="color:var(--text-secondary);margin-bottom:24px">Ve a Config y pega la URL de tu backend GAS</div>'
        + '<button class="btn btn-primary" onclick="App.navegar(\'config\')" style="width:100%">Ir a Config</button>';
    } else {
      div.innerHTML = '<div style="font-size:48px;margin-bottom:16px">&#128229;</div>'
        + '<div style="font-size:18px;font-weight:bold;margin-bottom:8px">Sin datos</div>'
        + '<div style="color:var(--text-secondary);margin-bottom:24px">Pulsa para cargar datos del servidor</div>';
      var btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.style.width = '100%';
      btn.textContent = 'Cargar datos';
      btn.addEventListener('click', async function() {
        btn.textContent = 'Cargando...';
        btn.disabled = true;
        try {
          var data = await API.get('getRegistros');
          if (data.registros) {
            Store.guardarRegistros(data.registros);
            if (typeof evaluarAlertas === 'function') {
              Store.guardarAlertas(evaluarAlertas(data.registros, Store.obtenerConfig()));
            }
            Store.guardarUltimoBarrido(new Date().toISOString());
            ToastUI.mostrar(data.registros.length + ' registros cargados', { tipo: 'exito' });
          }
          App.renderizar();
        } catch (e) {
          btn.disabled = false;
          btn.textContent = 'Reintentar';
          ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
        }
      });
      div.appendChild(btn);
    }
    contenedor.appendChild(div);
  },

  _renderizarKPIs: function(contenedor, kpis) {
    var strip = document.createElement('div');
    strip.className = 'kpi-strip';

    var items = [
      { valor: kpis.activas, label: 'Activas', clase: '' },
      { valor: kpis.alertasUrgentes, label: 'Urgentes', clase: 'kpi-urgente' },
      { valor: kpis.cerradasHoy, label: 'Cerradas', clase: 'kpi-ok' },
      { valor: kpis.recordatoriosHoy, label: 'Recordat.', clase: 'kpi-info' }
    ];

    items.forEach(function(item) {
      var chip = document.createElement('div');
      chip.className = 'kpi-chip ' + item.clase;
      chip.innerHTML = '<span class="kpi-valor">' + item.valor + '</span>'
        + '<span class="kpi-label">' + item.label + '</span>';
      strip.appendChild(chip);
    });

    contenedor.appendChild(strip);
  },

  _renderizarGrafico: function(contenedor, dias) {
    var seccion = document.createElement('div');
    seccion.className = 'grafico-semanal';

    var max = 1;
    dias.forEach(function(d) { if (d.conteo > max) max = d.conteo; });

    dias.forEach(function(d) {
      var col = document.createElement('div');
      col.className = 'grafico-col';
      var barra = document.createElement('div');
      barra.className = 'grafico-barra';
      barra.style.height = Math.max(4, (d.conteo / max) * 60) + 'px';
      col.appendChild(barra);
      var label = document.createElement('span');
      label.className = 'grafico-dia';
      label.textContent = d.dia;
      col.appendChild(label);
      seccion.appendChild(col);
    });

    contenedor.appendChild(seccion);
  },

  _renderizarCategorias: function(contenedor, categorias) {
    var cats = [
      { clave: 'urgente', nombre: 'Urgentes', color: 'var(--cat-urgente)', filtro: 'urgentes' },
      { clave: 'sinRespuesta', nombre: 'Sin respuesta', color: 'var(--cat-sin-respuesta)', filtro: 'sinleer' },
      { clave: 'documentacion', nombre: 'Documentacion', color: 'var(--cat-documentacion)', filtro: 'docs' },
      { clave: 'estancadas', nombre: 'Estancadas', color: 'var(--cat-estancadas)', filtro: 'estancadas' }
    ];

    cats.forEach(function(cat) {
      var items = categorias[cat.clave] || [];
      if (items.length === 0) return;

      var tarjeta = document.createElement('div');
      tarjeta.className = 'cat-tarjeta';
      tarjeta.style.borderLeftColor = cat.color;
      tarjeta.innerHTML = '<div class="cat-header">'
        + '<span class="cat-nombre">' + cat.nombre + '</span>'
        + '<span class="cat-badge" style="background:' + cat.color + '">' + items.length + '</span>'
        + '</div>';
      tarjeta.addEventListener('click', function() {
        if (typeof VistaTodo !== 'undefined') {
          VistaTodo._filtroActivo = cat.filtro;
        }
        App.navegar('todo');
      });
      contenedor.appendChild(tarjeta);
    });
  },

  _renderizarSecuencias: function(contenedor) {
    var secuencias = Store._leerJSON('tarealog_secuencias', []);
    var activas = secuencias.filter(function(s) {
      return s.estado === 'ACTIVA' || s.estado === 'activa';
    });

    if (activas.length === 0) return;

    var header = document.createElement('div');
    header.className = 'seccion-header';
    header.innerHTML = '<span>Secuencias activas (' + activas.length + ')</span>'
      + '<span>' + (this._secuenciasAbiertas ? '\u25BC' : '\u25B6') + '</span>';

    var contenido = document.createElement('div');
    contenido.className = 'seccion-contenido' + (this._secuenciasAbiertas ? ' abierta' : '');

    activas.forEach(function(seq) {
      var item = document.createElement('div');
      item.className = 'seq-item';

      var pasoActual = 0;
      if (seq.pasos) {
        for (var i = 0; i < seq.pasos.length; i++) {
          if (seq.pasos[i].estado === 'PENDIENTE' || seq.pasos[i].estado === 'pendiente') {
            pasoActual = i + 1;
            break;
          }
        }
      }

      item.innerHTML = '<div class="seq-nombre">' + (seq.nombre || 'Secuencia') + '</div>'
        + '<div class="seq-info">Carga ' + (seq.codCar || '?') + ' \u2022 Paso ' + pasoActual + '/' + (seq.pasos ? seq.pasos.length : 0) + '</div>';

      item.addEventListener('click', function() {
        VistaMiTurno._abrirDetalleSecuencia(seq);
      });

      contenido.appendChild(item);
    });

    var self = this;
    header.addEventListener('click', function() {
      self._secuenciasAbiertas = !self._secuenciasAbiertas;
      contenido.classList.toggle('abierta');
      header.querySelector('span:last-child').textContent =
        contenido.classList.contains('abierta') ? '\u25BC' : '\u25B6';
    });

    contenedor.appendChild(header);
    contenedor.appendChild(contenido);
  },

  _abrirDetalleSecuencia: function(seq) {
    BottomSheet.abrir({
      titulo: seq.nombre || 'Secuencia',
      opciones: [
        { texto: 'Ver carga', accion: function() {
          App.navegar('detalle/' + seq.codCar);
        }},
        { texto: 'Detener', color: '#F57C00', accion: function() {
          if (typeof detenerSecuencia === 'function') {
            detenerSecuencia(seq);
            var seqs = Store._leerJSON('tarealog_secuencias', []);
            var idx = seqs.findIndex(function(s) { return s.id === seq.id; });
            if (idx !== -1) { seqs[idx] = seq; Store._guardarJSON('tarealog_secuencias', seqs); }
            ToastUI.mostrar('Secuencia detenida', { tipo: 'info' });
            App.renderizar();
          }
        }},
        { texto: 'Cancelar', color: '#D32F2F', accion: function() {
          if (typeof cancelarSecuencia === 'function') {
            cancelarSecuencia(seq);
            var seqs = Store._leerJSON('tarealog_secuencias', []);
            var idx = seqs.findIndex(function(s) { return s.id === seq.id; });
            if (idx !== -1) { seqs[idx] = seq; Store._guardarJSON('tarealog_secuencias', seqs); }
            ToastUI.mostrar('Secuencia cancelada', { tipo: 'info' });
            App.renderizar();
          }
        }}
      ]
    });
  },

  _generarReporte: function(registros, alertas, recordatorios, ahora) {
    var datos = typeof generarDatosReporte === 'function'
      ? generarDatosReporte(registros, alertas, recordatorios, ahora)
      : { cargasGestionadas: 0, incidenciasActivas: 0, recordatoriosPendientes: 0, kpis: { cerradas: 0, emailsEnviados: 0 } };

    var texto = 'REPORTE TURNO - ' + ahora.toLocaleDateString('es-ES') + '\n'
      + '---\n'
      + 'Cargas gestionadas: ' + datos.cargasGestionadas + '\n'
      + 'Cerradas hoy: ' + datos.kpis.cerradas + '\n'
      + 'Emails enviados: ' + datos.kpis.emailsEnviados + '\n'
      + 'Incidencias activas: ' + datos.incidenciasActivas + '\n'
      + 'Recordatorios pendientes: ' + datos.recordatoriosPendientes + '\n'
      + '---\n'
      + 'Generado por TareaLog Movil';

    if (navigator.share) {
      navigator.share({ title: 'Reporte TareaLog', text: texto }).catch(function() {});
    } else {
      navigator.clipboard.writeText(texto).then(function() {
        ToastUI.mostrar('Reporte copiado al portapapeles', { tipo: 'exito' });
      });
    }
    Feedback.vibrar('corto');
  }
};
