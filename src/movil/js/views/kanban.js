// kanban.js - Vista Kanban para PWA Movil
'use strict';

var VistaKanban = {
  // Columnas/estados ocultos (true = oculto). Por defecto solo fases core visibles
  _ocultos: { nada: true, cerrado: true, sin_fase: false, espera: true, vacio: true, documentado: true },
  _sortableInstances: [],
  _columnasColapsadas: {},
  _refreshing: false,
  _filtroActivo: null,
  _busqueda: '',

  renderizar: function(contenedor) {
    // Scroll persistence: guardar posicion antes de re-render
    var board = document.getElementById('kanban-movil-board');
    var scrollAnterior = board ? board.scrollLeft : null;
    if (scrollAnterior === null) {
      var guardado = sessionStorage.getItem('kanban_scroll');
      if (guardado) scrollAnterior = parseInt(guardado, 10);
    }

    // Limpiar sortables previos
    this._sortableInstances.forEach(function(s) { s.destroy(); });
    this._sortableInstances = [];

    var regs = Store.obtenerRegistros();
    var dedup = deduplicarPorCarga(regs);
    dedup = this._aplicarFiltros(dedup);
    var agrupados = agruparPorColumna(dedup);
    var conteos = calcularConteos(agrupados);

    var html = '<div class="kanban-controls">';
    html += '<h2 style="margin:0;font-size:18px">Tablero</h2>';
    html += '</div>';

    // Chips toggle scrollables
    var ocultos = this._ocultos;
    var chips = [
      { id: 'nada', label: 'Nada' },
      { id: 'cerrado', label: 'Cerrado' },
      { id: 'sin_fase', label: 'Sin Fase' },
      { id: 'espera', label: 'Espera' },
      { id: 'carga', label: 'Carga' },
      { id: 'en_ruta', label: 'En Ruta' },
      { id: 'descarga', label: 'Descarga' },
      { id: 'incidencia', label: 'Incidencia' },
      { id: 'vacio', label: 'Vacio' },
      { id: 'documentado', label: 'Doc' }
    ];
    html += '<div class="kanban-chips-scroll">';
    chips.forEach(function(c) {
      html += '<button class="kanban-chip-toggle' + (!ocultos[c.id] ? ' activo' : '') + '" data-chip="' + c.id + '">' + c.label + '</button>';
    });
    html += '</div>';

    html += '<div class="kanban-filtros-movil">';
    html += '<input type="text" id="kanban-m-busqueda" placeholder="Buscar..." value="' + (this._busqueda || '').replace(/"/g, '&quot;') + '">';
    html += '<button id="btn-kanban-m-filtros" class="btn-filtros-movil">' + (this._filtroActivo ? '\u25CF Filtro' : 'Filtros') + '</button>';
    html += '</div>';

    // Pull-to-refresh indicator
    html += '<div class="kanban-pull-indicator" id="kanban-pull-indicator">'
      + '<div class="kanban-pull-spinner"></div>'
      + '</div>';

    html += '<div class="kanban-board" id="kanban-movil-board">';

    var self = this;
    var columnasVisibles = [];
    COLUMNAS_KANBAN.forEach(function(col) {
      if (self._ocultos[col.id]) return;
      columnasVisibles.push(col);

      var regsCol = agrupados[col.id] || [];
      var conteo = conteos[col.id] || { total: 0 };

      var colapsada = !!self._columnasColapsadas[col.id];

      html += '<div class="kanban-columna' + (colapsada ? ' collapsed' : '') + '" data-grupo="' + col.id + '">';
      html += '<div class="kanban-columna-header" data-toggle-col="' + col.id + '">';
      html += '<span>' + col.nombre + '</span>';
      html += '<span class="kanban-columna-count">' + conteo.total + '</span>';
      html += '</div>';

      if (colapsada) {
        html += '<div class="kanban-columna-body kanban-drop kanban-drop-zone" data-columna="' + col.id + '"></div>';
      } else {
        html += '<div class="kanban-columna-body kanban-drop" data-columna="' + col.id + '">';
        if (regsCol.length === 0) {
          html += '<div class="kanban-placeholder">Arrastra aqui</div>';
        }
        regsCol.forEach(function(reg) {
          html += self._crearTarjetaHTML(reg);
        });
        html += '</div>';
      }

      html += '</div>';
    });

    html += '</div>';

    // Dots de posicion
    html += '<div class="kanban-dots" id="kanban-dots">';
    columnasVisibles.forEach(function(col, i) {
      html += '<div class="kanban-dot' + (i === 0 ? ' activo' : '') + '" data-index="' + i + '"></div>';
    });
    html += '</div>';

    contenedor.innerHTML = html;

    // Scroll persistence: restaurar posicion
    var nuevoBoard = document.getElementById('kanban-movil-board');
    if (nuevoBoard && scrollAnterior !== null) {
      nuevoBoard.scrollLeft = scrollAnterior;
    }

    this._inicializarDrag();
    this._inicializarEventos();
    this._inicializarPullRefresh();
    this._inicializarLongPress();
    this._inicializarDots();
    this._inicializarScrollPersistence();
  },

  _crearTarjetaHTML: function(reg) {
    var codCar = reg.codCar || '---';
    var transp = reg.nombreTransportista || reg.interlocutor || '';
    var asunto = reg.asunto || '';
    var estado = reg.estado || '';

    var fechaStr = '';
    if (reg.fechaCorreo) {
      var diff = Date.now() - new Date(reg.fechaCorreo).getTime();
      var horas = Math.floor(diff / 3600000);
      fechaStr = horas < 1 ? '<1h' : horas < 24 ? horas + 'h' : Math.floor(horas / 24) + 'd';
    }

    // Chip estado
    var chipEstado = '';
    if (estado) {
      var est = typeof getDefaultEstados === 'function'
        ? obtenerEstadoPorCodigo(getDefaultEstados(), estado) : null;
      var abrev = est ? est.abreviatura : estado;
      chipEstado = '<span class="chip-estado chip-estado-' + estado.toLowerCase() + '" style="font-size:10px;padding:1px 6px">' + abrev + '</span>';
    }

    // Indicadores enriquecidos
    var indicadores = this._obtenerIndicadores(reg);

    return '<div class="kanban-tarjeta" data-message-id="' + (reg.messageId || '') + '"'
      + ' data-thread-id="' + (reg.threadId || '') + '"'
      + ' data-cod-car="' + (reg.codCar || '') + '"'
      + ' data-fase="' + (reg.fase || '') + '"'
      + ' data-estado="' + estado + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:center">'
        + '<span class="kanban-tarjeta-codcar">' + codCar + '</span>'
        + chipEstado
      + '</div>'
      + '<div class="kanban-tarjeta-transportista">' + transp + '</div>'
      + '<div class="kanban-tarjeta-asunto">' + asunto + '</div>'
      + '<div class="kanban-tarjeta-footer">'
        + '<span>' + fechaStr + '</span>'
        + indicadores
      + '</div>'
    + '</div>';
  },

  _obtenerIndicadores: function(reg) {
    var items = [];

    // Alerta
    var alertas = Store.obtenerAlertas();
    var alertaCritica = false;
    var tieneAlerta = alertas.some(function(a) {
      if (a.threadId !== reg.threadId) return false;
      if (a.nivel === 'CRITICO' || a.nivel === 'ALTO') alertaCritica = true;
      return true;
    });
    if (tieneAlerta) {
      var colorAlerta = alertaCritica ? '#D32F2F' : '#F57F17';
      items.push('<span class="kanban-tarjeta-indicador" style="color:' + colorAlerta + '">&#9888;</span>');
    }

    // Notas
    if (reg.codCar && typeof contarNotas === 'function') {
      var almacenNotas = null;
      try { almacenNotas = JSON.parse(localStorage.getItem('tarealog_notas')); } catch(e) {}
      var numNotas = contarNotas(reg.codCar, almacenNotas);
      if (numNotas > 0) {
        items.push('<span class="kanban-tarjeta-indicador" title="' + numNotas + ' notas">&#128221;' + numNotas + '</span>');
      }
    }

    // Recordatorios
    if (reg.codCar) {
      var recordatorios = [];
      try { recordatorios = JSON.parse(localStorage.getItem('tarealog_recordatorios')) || []; } catch(e) {}
      var cod = String(reg.codCar);
      var tieneRecordatorio = recordatorios.some(function(r) {
        return String(r.codCar) === cod;
      });
      if (tieneRecordatorio) {
        items.push('<span class="kanban-tarjeta-indicador">&#9200;</span>');
      }
    }

    if (items.length === 0) return '';
    return '<span class="kanban-tarjeta-indicadores">' + items.join('') + '</span>';
  },

  _inicializarDrag: function() {
    if (typeof Sortable === 'undefined') return;

    var self = this;
    var dropZones = document.querySelectorAll('.kanban-drop');
    dropZones.forEach(function(zone) {
      var sortable = new Sortable(zone, {
        group: 'kanban-movil',
        animation: 150,
        delay: 300,
        delayOnTouchOnly: true,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        touchStartThreshold: 5,
        onEnd: function(evt) { self._onDragEnd(evt); }
      });
      self._sortableInstances.push(sortable);
    });
  },

  _onDragEnd: async function(evt) {
    var tarjeta = evt.item;
    var columnaDestino = evt.to.dataset.columna;
    var messageId = tarjeta.dataset.messageId;
    var faseActual = tarjeta.dataset.fase;

    if (!messageId || !columnaDestino) return;

    var nuevaFase = resolverFaseAlMover(columnaDestino, faseActual);
    if (nuevaFase === null || nuevaFase === faseActual) return;

    var regs = Store.obtenerRegistros();
    var reg = regs.find(function(r) { return r.messageId === messageId; });
    if (!reg) return;

    var threadId = reg.threadId;

    regs.forEach(function(r) {
      if (r.threadId === threadId) r.fase = nuevaFase;
    });
    Store.guardarRegistros(regs);

    if (typeof Feedback !== 'undefined' && Feedback.vibrar) {
      Feedback.vibrar('ligero');
    }

    if (typeof ToastUI !== 'undefined') {
      ToastUI.mostrar('Fase \u2192 ' + nuevaFase, { tipo: 'exito', duracion: 2000 });
    }

    try {
      await API.post('actualizarCampoPorThread', {
        threadId: threadId, campo: 'fase', valor: nuevaFase
      });
    } catch (e) {
      if (typeof ToastUI !== 'undefined') {
        ToastUI.mostrar('Error al guardar', { tipo: 'error' });
      }
    }

    var contenedor = document.getElementById('app-contenido');
    if (contenedor) this.renderizar(contenedor);
  },

  _inicializarEventos: function() {
    var self = this;

    // Chips toggle columnas/estados
    document.querySelectorAll('.kanban-chip-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.chip;
        self._ocultos[id] = !self._ocultos[id];
        self._rerenderizar();
      });
    });

    // Busqueda y filtros
    var inputBusqueda = document.getElementById('kanban-m-busqueda');
    if (inputBusqueda) {
      var busquedaTimer;
      inputBusqueda.addEventListener('input', function() {
        clearTimeout(busquedaTimer);
        busquedaTimer = setTimeout(function() {
          self._busqueda = inputBusqueda.value.trim();
          self._rerenderizar();
        }, 300);
      });
    }

    var btnFiltros = document.getElementById('btn-kanban-m-filtros');
    if (btnFiltros) {
      btnFiltros.addEventListener('click', function() { self._abrirFiltros(); });
    }

    // Toggle colapsar columna
    document.querySelectorAll('[data-toggle-col]').forEach(function(h) {
      h.addEventListener('click', function() {
        var colId = h.dataset.toggleCol;
        self._columnasColapsadas[colId] = !self._columnasColapsadas[colId];
        self._rerenderizar();
      });
    });

    // Click en tarjeta -> BottomSheet detalle (con delegation para indicadores)
    var tarjetas = document.querySelectorAll('.kanban-tarjeta');
    tarjetas.forEach(function(t) {
      t.addEventListener('click', function(e) {
        if (e.defaultPrevented) return;
        var indicador = e.target.closest('.kanban-tarjeta-indicador');
        if (indicador) {
          var texto = indicador.textContent || '';
          var codCar = t.dataset.codCar;
          if (texto.indexOf('\uD83D\uDCDD') !== -1 && codCar) {
            e.stopPropagation();
            App.navegar('detalle/' + codCar);
            return;
          }
          if (texto.indexOf('\u23F0') !== -1 && codCar) {
            e.stopPropagation();
            self._abrirRecordatorioMovil(t);
            return;
          }
          if (texto.indexOf('\uD83D\uDCC5') !== -1 && codCar) {
            e.stopPropagation();
            self._abrirProgramadoMovil(t);
            return;
          }
        }
        self._abrirDetalleMovil(t);
      });
    });
  },

  _abrirDetalleMovil: function(tarjeta) {
    var messageId = tarjeta.dataset.messageId;
    var codCar = tarjeta.dataset.codCar || '---';
    var regs = Store.obtenerRegistros();
    var reg = regs.find(function(r) { return r.messageId === messageId; });
    if (!reg) {
      if (codCar && codCar !== '---') App.navegar('detalle/' + codCar);
      return;
    }

    var self = this;
    var transp = reg.nombreTransportista || '---';
    var interlocutor = reg.interlocutor || '';
    var estado = reg.estado || '';
    var fase = reg.fase || '';
    var clave = codCar !== '---' ? codCar : reg.threadId;

    // Fecha completa + relativa
    var fechaCompleta = '';
    var fechaRelativa = '';
    if (reg.fechaCorreo) {
      try { fechaCompleta = new Date(reg.fechaCorreo).toLocaleString('es-ES'); } catch(e) { fechaCompleta = reg.fechaCorreo; }
      var diff = Date.now() - new Date(reg.fechaCorreo).getTime();
      var horas = Math.floor(diff / 3600000);
      fechaRelativa = horas < 1 ? '<1h' : horas < 24 ? horas + 'h' : Math.floor(horas / 24) + 'd';
    }

    // Chips: estado + fase + bandeja + tipo
    var chipsHtml = '<div class="kd-chips">';
    if (estado) chipsHtml += '<span class="kd-chip kd-chip-estado" data-accion="estado">' + estado + ' \u25BE</span>';
    if (fase) {
      var nombreFase = fase;
      if (typeof getDefaultFases === 'function') {
        var faseObj = getDefaultFases().find(function(f) { return f.codigo === fase; });
        if (faseObj) nombreFase = faseObj.nombre;
      }
      chipsHtml += '<span class="kd-chip kd-chip-fase" data-accion="fase">' + nombreFase + ' \u25BE</span>';
    }
    if (reg.bandeja && reg.bandeja !== 'INBOX') chipsHtml += '<span class="kd-chip kd-chip-bandeja">' + reg.bandeja + '</span>';
    if (reg.tipoTarea) chipsHtml += '<span class="kd-chip kd-chip-tipo">' + reg.tipoTarea + '</span>';
    chipsHtml += '</div>';

    // Grid info secundaria
    var gridHtml = '<div class="kd-grid">';
    if (interlocutor && interlocutor !== transp) {
      gridHtml += '<span class="kd-label">Interlocutor</span><span class="kd-value">' + interlocutor + '</span>';
    }
    if (fechaCompleta) {
      gridHtml += '<span class="kd-label">Correo</span><span class="kd-value">' + fechaCompleta + ' (' + fechaRelativa + ')</span>';
    }
    if (reg.vinculacion) gridHtml += '<span class="kd-label">Vinculaci\u00f3n</span><span class="kd-value">' + reg.vinculacion + '</span>';
    if (reg.zona) gridHtml += '<span class="kd-label">Zona</span><span class="kd-value">' + reg.zona + (reg.zDest ? ' \u2192 ' + reg.zDest : '') + '</span>';
    if (reg.referencia) gridHtml += '<span class="kd-label">Referencia</span><span class="kd-value">' + reg.referencia + '</span>';
    if (reg.mensajesEnHilo && Number(reg.mensajesEnHilo) > 1) {
      gridHtml += '<span class="kd-label">Mensajes</span><span class="kd-value">' + reg.mensajesEnHilo + ' en hilo</span>';
    }
    gridHtml += '</div>';

    // Fechas logisticas (fCarga, fEntrega)
    var fechasHtml = '';
    if (reg.fCarga || reg.fEntrega) {
      fechasHtml = '<div class="kd-fechas">';
      if (reg.fCarga) {
        fechasHtml += '<div class="kd-fecha-item"><div class="kd-fecha-label">Carga</div>' +
          '<div class="kd-fecha-valor">' + reg.fCarga + (reg.hCarga ? ' ' + reg.hCarga : '') + '</div></div>';
      }
      if (reg.fEntrega) {
        fechasHtml += '<div class="kd-fecha-item"><div class="kd-fecha-label">Entrega</div>' +
          '<div class="kd-fecha-valor">' + reg.fEntrega + (reg.hEntrega ? ' ' + reg.hEntrega : '') + '</div></div>';
      }
      fechasHtml += '</div>';
    }

    // Indicadores
    var indHtml = '';
    var almacenNotas = null;
    try { almacenNotas = JSON.parse(localStorage.getItem('tarealog_notas')); } catch(e) {}
    if (almacenNotas && typeof contarNotas === 'function') {
      var nNotas = contarNotas(codCar, almacenNotas);
      if (nNotas > 0) indHtml += '<span class="kd-indicador" data-ind="notas">\uD83D\uDCDD Notas (' + nNotas + ')</span>';
    }
    var recordatorios = [];
    try { recordatorios = JSON.parse(localStorage.getItem('tarealog_recordatorios')) || []; } catch(e) {}
    var recActivo = recordatorios.find(function(r) { return String(r.codCar) === String(codCar); });
    if (recActivo) {
      var motivo = recActivo.motivo || recActivo.descripcion || 'Recordatorio';
      indHtml += '<span class="kd-indicador" data-ind="record">\u23F0 ' + motivo + '</span>';
    }
    var programados = [];
    try { programados = JSON.parse(localStorage.getItem('tarealog_programados')) || []; } catch(e) {}
    var progActivo = programados.find(function(p) { return p.codCar == clave || p.threadId == reg.threadId; });
    if (progActivo) {
      indHtml += '<span class="kd-indicador" data-ind="programado">\uD83D\uDCC5 Programado</span>';
    }

    // Construir contenido
    var contenido = document.createElement('div');
    contenido.className = 'kd-contenido';
    contenido.innerHTML =
      '<div class="kd-header"><span class="kd-codcar">' + codCar + '</span><span class="kd-transp">' + transp + '</span></div>' +
      chipsHtml +
      (reg.asunto ? '<div class="kd-asunto">' + reg.asunto + '</div>' : '') +
      gridHtml +
      fechasHtml +
      (indHtml ? '<div class="kd-indicadores">' + indHtml + '</div>' : '') +
      '<div class="kd-separador"></div>' +
      '<div class="kd-acciones">' +
        '<button class="btn btn-outline" data-act="responder">\u2709 Responder</button>' +
        '<button class="btn btn-outline" data-act="nota">\uD83D\uDCDD +Nota</button>' +
        '<button class="btn btn-outline" data-act="record">\u23F0 +Record.</button>' +
        '<button class="btn btn-outline" data-act="detalle">Ver detalle \u2192</button>' +
      '</div>';

    // Event delegation para todo el contenido
    contenido.addEventListener('click', function(e) {
      var target = e.target.closest('[data-accion],[data-ind],[data-act]');
      if (!target) return;
      var accion = target.dataset.accion;
      var ind = target.dataset.ind;
      var act = target.dataset.act;

      if (accion === 'estado') { BottomSheet.cerrar(); VistaDetalle._abrirCambioEstado(reg); }
      else if (accion === 'fase') { BottomSheet.cerrar(); VistaDetalle._abrirCambioFase(reg); }
      else if (ind === 'notas' || act === 'nota') { BottomSheet.cerrar(); VistaDetalle._agregarNota(codCar); }
      else if (ind === 'record' || act === 'record') { BottomSheet.cerrar(); VistaDetalle._crearRecordatorio(reg); }
      else if (ind === 'programado') { BottomSheet.cerrar(); App.navegar('detalle/' + codCar); }
      else if (act === 'responder') { BottomSheet.cerrar(); VistaDetalle._abrirEditor(reg); }
      else if (act === 'detalle') { BottomSheet.cerrar(); App.navegar('detalle/' + codCar); }
    });

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({ titulo: '', contenido: contenido, opciones: [] });
    } else {
      App.navegar('detalle/' + codCar);
    }
  },

  _abrirRecordatorioMovil: function(tarjeta) {
    var self = this;
    var codCar = tarjeta.dataset.codCar || '';
    var recordatorios = Store._leerJSON('tarealog_recordatorios', []);
    var rec = recordatorios.find(function(r) { return String(r.codCar) === String(codCar); });

    if (!rec) return;

    var texto = rec.texto || 'Recordatorio';
    var fecha = rec.fechaDisparo ? new Date(rec.fechaDisparo).toLocaleString('es-ES') : '\u2014';
    var tiempoRestante = '';
    if (rec.fechaDisparo) {
      var diff = new Date(rec.fechaDisparo).getTime() - Date.now();
      if (diff > 0) {
        var min = Math.floor(diff / 60000);
        tiempoRestante = min < 60 ? min + ' min' : Math.floor(min / 60) + 'h ' + (min % 60) + 'min';
      } else {
        tiempoRestante = 'Vencido';
      }
    }

    var contenido = document.createElement('div');
    contenido.style.padding = '0 4px 8px';
    contenido.innerHTML =
      '<div style="font-size:16px;font-weight:bold;margin-bottom:8px">\u23F0 ' + texto + '</div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:4px">Carga: <strong>' + codCar + '</strong></div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:4px">Dispara: <strong>' + fecha + '</strong></div>' +
      '<div style="font-size:13px;color:' + (tiempoRestante === 'Vencido' ? '#d32f2f' : '#1565c0') + ';margin-bottom:4px;font-weight:600">' + tiempoRestante + '</div>' +
      (rec.snoozeCount > 0 ? '<div style="font-size:11px;color:#999">Pospuesto ' + rec.snoozeCount + ' vez/veces</div>' : '');

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({
        titulo: 'Recordatorio',
        contenido: contenido,
        opciones: [
          { texto: '\u23F0 Posponer 15 min', accion: function() { self._snoozeRecordatorio(rec, 15); }},
          { texto: '\u23F0 Posponer 1 hora', accion: function() { self._snoozeRecordatorio(rec, 60); }},
          { texto: '\u274C Eliminar', color: '#d32f2f', accion: function() { self._eliminarRecordatorio(rec); }},
          { texto: 'Ver detalle carga', accion: function() { App.navegar('detalle/' + codCar); } }
        ]
      });
    }
  },

  _snoozeRecordatorio: function(rec, minutos) {
    var nuevaFecha = new Date(Date.now() + minutos * 60000).toISOString();
    var lista = Store._leerJSON('tarealog_recordatorios', []);
    lista = lista.map(function(r) {
      if (r.id !== rec.id) return r;
      return Object.assign({}, r, { fechaDisparo: nuevaFecha, snoozeCount: (r.snoozeCount || 0) + 1 });
    });
    Store._guardarJSON('tarealog_recordatorios', lista);
    if (typeof Feedback !== 'undefined') Feedback.vibrar('corto');
    ToastUI.mostrar('Pospuesto ' + minutos + ' min', { tipo: 'info' });
  },

  _eliminarRecordatorio: function(rec) {
    var lista = Store._leerJSON('tarealog_recordatorios', []);
    lista = lista.filter(function(r) { return r.id !== rec.id; });
    Store._guardarJSON('tarealog_recordatorios', lista);
    // Marcar como completado en GAS
    try { API.post('actualizarEstadoRecordatorio', { id: rec.id, estado: 'COMPLETADO' }); } catch(e) {}
    ToastUI.mostrar('Recordatorio eliminado', { tipo: 'info' });
    this.renderizar(document.getElementById('app-content'));
  },

  _abrirProgramadoMovil: function(tarjeta) {
    var codCar = tarjeta.dataset.codCar || '';
    var threadId = tarjeta.dataset.threadId || '';

    if (typeof BottomSheet !== 'undefined') {
      var contenido = document.createElement('div');
      contenido.style.padding = '0 4px 8px';
      contenido.innerHTML =
        '<div style="font-size:16px;font-weight:bold;margin-bottom:8px">\uD83D\uDCC5 Envio programado</div>' +
        '<div style="font-size:13px;color:#666;margin-bottom:12px">Carga: <strong>' + codCar + '</strong></div>';

      BottomSheet.abrir({
        titulo: 'Programado',
        contenido: contenido,
        opciones: [
          { texto: 'Ver detalle carga', accion: function() { App.navegar('detalle/' + codCar); } },
          { texto: 'Ver programados', accion: function() { App.navegar('programados'); } },
          { texto: 'Cerrar', color: '#999', accion: function() {} }
        ]
      });
    } else {
      App.navegar('programados');
    }
  },

  // --- Pull-to-refresh ---
  _inicializarPullRefresh: function() {
    var board = document.getElementById('kanban-movil-board');
    if (!board) return;

    var self = this;
    var startY = 0;
    var indicador = document.getElementById('kanban-pull-indicator');

    board.addEventListener('touchstart', function(e) {
      if (board.scrollTop === 0) startY = e.touches[0].clientY;
      else startY = 0;
    });

    board.addEventListener('touchmove', function(e) {
      if (!startY || self._refreshing) return;
      var deltaY = e.touches[0].clientY - startY;
      if (deltaY > 0 && deltaY <= 80 && indicador) {
        indicador.style.height = Math.min(deltaY, 60) + 'px';
        indicador.style.opacity = String(deltaY / 80);
      }
      if (deltaY > 80 && indicador) {
        indicador.classList.add('activo');
      }
    });

    board.addEventListener('touchend', function() {
      if (!startY || self._refreshing) { startY = 0; return; }
      if (indicador && indicador.classList.contains('activo')) {
        self._ejecutarRefresh();
      } else if (indicador) {
        indicador.style.height = '0';
        indicador.style.opacity = '0';
      }
      startY = 0;
    });
  },

  _ejecutarRefresh: async function() {
    this._refreshing = true;
    var indicador = document.getElementById('kanban-pull-indicator');
    if (indicador) {
      indicador.classList.add('activo');
      indicador.style.height = '48px';
      indicador.style.opacity = '1';
    }

    try {
      var resultado = await API.post('procesarCorreos', { limite: 50 });
      if (resultado.registros) Store.guardarRegistros(resultado.registros);

      if (resultado.hayMas) {
        await new Promise(function(r) { setTimeout(r, 6000); });
        var mas = await API.post('procesarCorreos', { limite: 50 });
        if (mas.registros) Store.guardarRegistros(mas.registros);
      }

      if (typeof evaluarAlertas === 'function') {
        Store.guardarAlertas(evaluarAlertas(Store.obtenerRegistros(), Store.obtenerConfig()));
      }

      Store.guardarUltimoBarrido(new Date().toISOString());
      var total = Store.obtenerRegistros().length;
      if (typeof ToastUI !== 'undefined') {
        ToastUI.mostrar(total + ' cargas actualizadas', { tipo: 'exito' });
      }
    } catch (e) {
      if (typeof ToastUI !== 'undefined') {
        ToastUI.mostrar('Error al actualizar: ' + e.message, { tipo: 'error' });
      }
      if (typeof Feedback !== 'undefined') Feedback.vibrar('error');
    }

    this._refreshing = false;
    if (indicador) {
      indicador.classList.remove('activo');
      indicador.style.height = '0';
      indicador.style.opacity = '0';
    }

    var contenedor = document.getElementById('app-contenido');
    if (contenedor) this.renderizar(contenedor);
  },

  // --- Long-press -> BottomSheet acciones ---
  _inicializarLongPress: function() {
    var self = this;
    var tarjetas = document.querySelectorAll('.kanban-tarjeta');

    tarjetas.forEach(function(t) {
      var timer = null;

      t.addEventListener('touchstart', function(e) {
        timer = setTimeout(function() {
          timer = null;
          e.preventDefault();
          if (typeof Feedback !== 'undefined' && Feedback.vibrar) {
            Feedback.vibrar('corto');
          }
          self._abrirAccionesTarjeta(t);
        }, 500);
      });

      t.addEventListener('touchmove', function() {
        if (timer) { clearTimeout(timer); timer = null; }
      });

      t.addEventListener('touchend', function() {
        if (timer) { clearTimeout(timer); timer = null; }
      });
    });
  },

  _abrirAccionesTarjeta: function(tarjeta) {
    var fase = tarjeta.dataset.fase;
    var codCar = tarjeta.dataset.codCar;
    var opciones = [];

    // Acciones contextuales por fase
    if (typeof obtenerAccionesPorFase === 'function') {
      var acciones = obtenerAccionesPorFase(fase);
      acciones.forEach(function(a) {
        opciones.push({
          texto: a.etiqueta,
          accion: function() {
            if (a.faseSiguiente) {
              VistaKanban._cambiarFaseTarjeta(tarjeta, a.faseSiguiente);
            } else if (typeof ToastUI !== 'undefined') {
              ToastUI.mostrar(a.etiqueta, { tipo: 'info' });
            }
          }
        });
      });
    }

    // Cambiar estado
    var messageId = tarjeta.dataset.messageId;
    var regs = Store.obtenerRegistros();
    var regLP = regs.find(function(r) { return r.messageId === messageId; });
    if (regLP) {
      opciones.push({
        texto: 'Cambiar estado',
        accion: function() { VistaDetalle._abrirCambioEstado(regLP); }
      });
    }

    opciones.push({
      texto: 'Ver detalle',
      accion: function() {
        if (codCar) App.navegar('detalle/' + codCar);
      }
    });

    opciones.push({
      texto: 'Crear recordatorio',
      accion: function() {
        if (codCar) App.navegar('detalle/' + codCar);
      }
    });

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({
        titulo: 'Carga ' + (codCar || '---'),
        opciones: opciones
      });
    }
  },

  _cambiarFaseTarjeta: async function(tarjeta, nuevaFase) {
    var messageId = tarjeta.dataset.messageId;
    var regs = Store.obtenerRegistros();
    var reg = regs.find(function(r) { return r.messageId === messageId; });
    if (!reg) return;

    regs.forEach(function(r) {
      if (r.threadId === reg.threadId) r.fase = nuevaFase;
    });
    Store.guardarRegistros(regs);

    if (typeof Feedback !== 'undefined') Feedback.vibrar('doble');
    if (typeof ToastUI !== 'undefined') {
      ToastUI.mostrar('Fase \u2192 ' + nuevaFase, { tipo: 'exito' });
    }

    try {
      await API.post('actualizarCampoPorThread', {
        threadId: reg.threadId, campo: 'fase', valor: nuevaFase
      });
    } catch (e) {}

    var contenedor = document.getElementById('app-contenido');
    if (contenedor) this.renderizar(contenedor);
  },

  // --- Dots de posicion ---
  _inicializarDots: function() {
    var board = document.getElementById('kanban-movil-board');
    var dotsContainer = document.getElementById('kanban-dots');
    if (!board || !dotsContainer) return;

    var columnas = board.querySelectorAll('.kanban-columna');
    var dots = dotsContainer.querySelectorAll('.kanban-dot');
    if (columnas.length === 0 || dots.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var grupo = entry.target.dataset.grupo;
        var idx = -1;
        columnas.forEach(function(c, i) {
          if (c.dataset.grupo === grupo) idx = i;
        });
        if (idx < 0) return;
        dots.forEach(function(d, i) {
          d.classList.toggle('activo', i === idx);
        });
      });
    }, { root: board, threshold: 0.5 });

    columnas.forEach(function(col) { observer.observe(col); });
  },

  // --- Scroll persistence ---
  _inicializarScrollPersistence: function() {
    var board = document.getElementById('kanban-movil-board');
    if (!board) return;

    board.addEventListener('scroll', function() {
      sessionStorage.setItem('kanban_scroll', String(board.scrollLeft));
    });
  },

  // --- Filtros ---
  _aplicarFiltros: function(regs) {
    var resultado = regs;

    // Ocultar estados NADA/CERRADO segun chips
    if (this._ocultos.nada) {
      resultado = resultado.filter(function(r) { return r.estado !== 'NADA'; });
    }
    if (this._ocultos.cerrado) {
      resultado = resultado.filter(function(r) { return r.estado !== 'CERRADO'; });
    }

    // Busqueda textual
    if (this._busqueda) {
      var texto = this._busqueda.toLowerCase();
      resultado = resultado.filter(function(r) {
        return (r.codCar && String(r.codCar).toLowerCase().indexOf(texto) !== -1) ||
               (r.interlocutor && r.interlocutor.toLowerCase().indexOf(texto) !== -1) ||
               (r.nombreTransportista && r.nombreTransportista.toLowerCase().indexOf(texto) !== -1) ||
               (r.asunto && r.asunto.toLowerCase().indexOf(texto) !== -1) ||
               (r.estado && r.estado.toLowerCase().indexOf(texto) !== -1) ||
               (r.fase && r.fase.toLowerCase().indexOf(texto) !== -1);
      });
    }

    // Filtro predefinido
    if (!this._filtroActivo) return resultado;

    var filtro = this._filtroActivo;

    if (filtro === 'urgentes') {
      var alertas = Store.obtenerAlertas();
      return resultado.filter(function(r) {
        return alertas.some(function(a) { return a.threadId === r.threadId && (a.nivel === 'CRITICO' || a.nivel === 'ALTO'); });
      });
    }
    if (filtro === 'hoy') {
      var hoy = new Date().toISOString().split('T')[0];
      return resultado.filter(function(r) {
        return (r.fCarga && r.fCarga.indexOf(hoy) !== -1) || (r.fEntrega && r.fEntrega.indexOf(hoy) !== -1);
      });
    }
    if (filtro === 'sinleer') {
      return resultado.filter(function(r) { return r.estado === 'NUEVO' || r.estado === 'RECIBIDO'; });
    }
    if (filtro === 'incidencias') {
      return resultado.filter(function(r) { return r.fase === '05' || r.fase === '25'; });
    }
    if (filtro === 'enproceso') {
      return resultado.filter(function(r) { var f = parseInt(r.fase, 10); return !isNaN(f) && f >= 1 && f <= 28; });
    }
    if (filtro.indexOf('fase_') === 0) {
      var codFase = filtro.substring(5);
      return resultado.filter(function(r) { return r.fase === codFase; });
    }
    if (filtro.indexOf('estado_') === 0) {
      var codEstado = filtro.substring(7);
      return resultado.filter(function(r) { return r.estado === codEstado; });
    }

    return resultado;
  },

  _abrirFiltros: function() {
    var self = this;
    var opciones = [
      { texto: 'Urgentes', accion: function() { self._filtroActivo = self._filtroActivo === 'urgentes' ? null : 'urgentes'; self._rerenderizar(); } },
      { texto: 'Hoy', accion: function() { self._filtroActivo = self._filtroActivo === 'hoy' ? null : 'hoy'; self._rerenderizar(); } },
      { texto: 'Sin leer', accion: function() { self._filtroActivo = self._filtroActivo === 'sinleer' ? null : 'sinleer'; self._rerenderizar(); } },
      { texto: 'Incidencias', accion: function() { self._filtroActivo = self._filtroActivo === 'incidencias' ? null : 'incidencias'; self._rerenderizar(); } },
      { texto: 'En proceso', accion: function() { self._filtroActivo = self._filtroActivo === 'enproceso' ? null : 'enproceso'; self._rerenderizar(); } }
    ];

    // Fases dinamicas
    var config = Store.obtenerConfig();
    if (config && config.fases) {
      config.fases.forEach(function(f) {
        if (!f.activa || !f.codigo) return;
        opciones.push({
          texto: 'Fase: ' + (f.nombre || f.codigo),
          accion: function() { self._filtroActivo = 'fase_' + f.codigo; self._rerenderizar(); }
        });
      });
    }

    // Estados dinamicos
    if (config && config.estados) {
      config.estados.forEach(function(e) {
        if (e.activo === false) return;
        opciones.push({
          texto: 'Estado: ' + (e.nombre || e.codigo),
          accion: function() { self._filtroActivo = 'estado_' + e.codigo; self._rerenderizar(); }
        });
      });
    }

    opciones.push({
      texto: 'Resetear filtros', color: '#999',
      accion: function() { self._filtroActivo = null; self._busqueda = ''; self._rerenderizar(); }
    });

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({ titulo: 'Filtros', opciones: opciones });
    }
  },

  _rerenderizar: function() {
    var contenedor = document.getElementById('app-contenido');
    if (contenedor) this.renderizar(contenedor);
  }
};
