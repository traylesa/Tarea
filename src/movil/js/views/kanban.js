// kanban.js - Vista Kanban para PWA Movil
'use strict';

var VistaKanban = {
  _mostrarEspera: true,
  _mostrarVacio: true,
  _mostrarDocumentado: false,
  _mostrarNada: true,
  _mostrarCerrado: true,
  _sortableInstances: [],
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
    html += '<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-left:auto">';
    html += '<label style="display:flex;align-items:center;gap:3px"><input type="checkbox" id="chk-m-espera"' + (this._mostrarEspera ? ' checked' : '') + '> Espera</label>';
    html += '<label style="display:flex;align-items:center;gap:3px"><input type="checkbox" id="chk-m-vacio"' + (this._mostrarVacio ? ' checked' : '') + '> Vacio</label>';
    html += '<label style="display:flex;align-items:center;gap:3px"><input type="checkbox" id="chk-m-documentado"' + (this._mostrarDocumentado ? ' checked' : '') + '> Doc</label>';
    html += '<label style="display:flex;align-items:center;gap:3px"><input type="checkbox" id="chk-m-nada"' + (this._mostrarNada ? ' checked' : '') + '> Nada</label>';
    html += '<label style="display:flex;align-items:center;gap:3px"><input type="checkbox" id="chk-m-cerrado"' + (this._mostrarCerrado ? ' checked' : '') + '> Cerrado</label>';
    html += '</div>';
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
      if (col.id === 'espera' && !self._mostrarEspera) return;
      if (col.id === 'vacio' && !self._mostrarVacio) return;
      if (col.id === 'documentado' && !self._mostrarDocumentado) return;
      columnasVisibles.push(col);

      var regsCol = agrupados[col.id] || [];
      var conteo = conteos[col.id] || { total: 0 };

      html += '<div class="kanban-columna" data-grupo="' + col.id + '">';
      html += '<div class="kanban-columna-header">';
      html += '<span>' + col.nombre + '</span>';
      html += '<span class="kanban-columna-count">' + conteo.total + '</span>';
      html += '</div>';
      html += '<div class="kanban-columna-body kanban-drop" data-columna="' + col.id + '">';

      if (regsCol.length === 0) {
        html += '<div class="kanban-placeholder">Arrastra aqui</div>';
      }
      regsCol.forEach(function(reg) {
        html += self._crearTarjetaHTML(reg);
      });

      html += '</div></div>';
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
    if (!nuevaFase || nuevaFase === faseActual) return;

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

    var chkEspera = document.getElementById('chk-m-espera');
    if (chkEspera) {
      chkEspera.addEventListener('change', function() {
        self._mostrarEspera = chkEspera.checked;
        var contenedor = document.getElementById('app-contenido');
        if (contenedor) self.renderizar(contenedor);
      });
    }

    var chkVacio = document.getElementById('chk-m-vacio');
    if (chkVacio) {
      chkVacio.addEventListener('change', function() {
        self._mostrarVacio = chkVacio.checked;
        var contenedor = document.getElementById('app-contenido');
        if (contenedor) self.renderizar(contenedor);
      });
    }

    var chkNada = document.getElementById('chk-m-nada');
    if (chkNada) {
      chkNada.addEventListener('change', function() {
        self._mostrarNada = chkNada.checked;
        var contenedor = document.getElementById('app-contenido');
        if (contenedor) self.renderizar(contenedor);
      });
    }

    var chkCerrado = document.getElementById('chk-m-cerrado');
    if (chkCerrado) {
      chkCerrado.addEventListener('change', function() {
        self._mostrarCerrado = chkCerrado.checked;
        var contenedor = document.getElementById('app-contenido');
        if (contenedor) self.renderizar(contenedor);
      });
    }

    var chkDoc = document.getElementById('chk-m-documentado');
    if (chkDoc) {
      chkDoc.addEventListener('change', function() {
        self._mostrarDocumentado = chkDoc.checked;
        var contenedor = document.getElementById('app-contenido');
        if (contenedor) self.renderizar(contenedor);
      });
    }

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

    var transp = reg.nombreTransportista || reg.interlocutor || '---';
    var estado = reg.estado || '';
    var fase = reg.fase || '';

    var fechaStr = '';
    if (reg.fechaCorreo) {
      var diff = Date.now() - new Date(reg.fechaCorreo).getTime();
      var horas = Math.floor(diff / 3600000);
      fechaStr = horas < 1 ? '<1h' : horas < 24 ? horas + 'h' : Math.floor(horas / 24) + 'd';
    }

    // Indicadores existentes
    var indHtml = '';
    var almacenNotas = null;
    try { almacenNotas = JSON.parse(localStorage.getItem('tarealog_notas')); } catch(e) {}
    if (almacenNotas && typeof contarNotas === 'function') {
      var nNotas = contarNotas(codCar, almacenNotas);
      if (nNotas > 0) {
        indHtml += '<span style="cursor:pointer;margin-right:8px" data-ind="notas">\uD83D\uDCDD' + nNotas + '</span>';
      }
    }
    var recordatorios = [];
    try { recordatorios = JSON.parse(localStorage.getItem('tarealog_recordatorios')) || []; } catch(e) {}
    var recActivo = recordatorios.find(function(r) { return String(r.codCar) === String(codCar); });
    if (recActivo) {
      var motivo = recActivo.motivo || recActivo.descripcion || 'Recordatorio';
      indHtml += '<span style="cursor:pointer;margin-right:8px" data-ind="record" title="' + motivo + '">\u23F0 ' + motivo + '</span>';
    }

    var contenido = document.createElement('div');
    contenido.style.padding = '0 4px 8px';
    contenido.innerHTML =
      '<div style="font-family:monospace;font-size:20px;font-weight:bold;margin-bottom:8px">' + codCar + '</div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:4px">Transportista: <strong>' + transp + '</strong></div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:4px">Estado: <strong>' + estado + '</strong> | Fase: <strong>' + fase + '</strong></div>' +
      (fechaStr ? '<div style="font-size:12px;color:#999;margin-bottom:8px">Hace: ' + fechaStr + '</div>' : '') +
      (indHtml ? '<div style="font-size:13px;margin-bottom:8px">' + indHtml + '</div>' : '');

    // Indicadores clicables
    var indNotas = contenido.querySelector('[data-ind="notas"]');
    if (indNotas) indNotas.addEventListener('click', function() { App.navegar('detalle/' + codCar); });
    var indRec = contenido.querySelector('[data-ind="record"]');
    if (indRec) indRec.addEventListener('click', function() { App.navegar('detalle/' + codCar); });

    var opciones = [
      { texto: '\uD83D\uDCDD +Nota', accion: function() { VistaDetalle._agregarNota(codCar); } },
      { texto: '\u23F0 +Record.', accion: function() { VistaDetalle._crearRecordatorio(reg); } },
      { texto: 'Cambiar fase', accion: function() { VistaDetalle._abrirCambioFase(reg); } },
      { texto: 'Ver detalle completo \u2192', accion: function() { App.navegar('detalle/' + codCar); } },
      { texto: 'Cerrar', color: '#999', accion: function() {} }
    ];

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({ titulo: 'Detalle carga', contenido: contenido, opciones: opciones });
    } else {
      App.navegar('detalle/' + codCar);
    }
  },

  _abrirRecordatorioMovil: function(tarjeta) {
    var codCar = tarjeta.dataset.codCar || '';
    var recordatorios = [];
    try { recordatorios = JSON.parse(localStorage.getItem('tarealog_recordatorios')) || []; } catch(e) {}
    var rec = recordatorios.find(function(r) { return String(r.codCar) === String(codCar); });

    if (!rec) return;

    var contenido = document.createElement('div');
    contenido.style.padding = '0 4px 8px';
    var motivo = rec.motivo || rec.descripcion || 'Recordatorio';
    var fecha = rec.fechaDisparo ? new Date(rec.fechaDisparo).toLocaleString('es-ES') : '—';
    contenido.innerHTML =
      '<div style="font-size:16px;font-weight:bold;margin-bottom:8px">\u23F0 ' + motivo + '</div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:4px">Carga: <strong>' + codCar + '</strong></div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:12px">Dispara: <strong>' + fecha + '</strong></div>';

    if (typeof BottomSheet !== 'undefined') {
      BottomSheet.abrir({
        titulo: 'Recordatorio',
        contenido: contenido,
        opciones: [
          { texto: 'Ver detalle carga', accion: function() { App.navegar('detalle/' + codCar); } },
          { texto: 'Cerrar', color: '#999', accion: function() {} }
        ]
      });
    }
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

    // Ocultar estados NADA/CERRADO
    if (!this._mostrarNada) {
      resultado = resultado.filter(function(r) { return r.estado !== 'NADA'; });
    }
    if (!this._mostrarCerrado) {
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
