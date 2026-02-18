// todo.js - Vista lista de cargas con alertas inline y pull-to-refresh
'use strict';

var VistaTodo = {
  _busqueda: '',
  _filtroActivo: null,
  _seleccionadas: new Set(),
  _refreshing: false,

  renderizar: function(contenedor) {
    contenedor.innerHTML = '';

    // Busqueda
    var searchDiv = document.createElement('div');
    searchDiv.className = 'search-bar';
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar en todos los campos...';
    searchInput.value = this._busqueda;
    searchInput.addEventListener('input', function(e) {
      VistaTodo._busqueda = e.target.value;
      VistaTodo._renderizarLista(contenedor.querySelector('.lista-cargas'));
    });
    searchDiv.appendChild(searchInput);
    contenedor.appendChild(searchDiv);

    // Filtros rapidos
    var filtros = document.createElement('div');
    filtros.className = 'filtros-rapidos';
    var alertas = Store.obtenerAlertas();
    var urgentes = alertas.filter(function(a) {
      return a.nivel === 'CRITICO' || a.nivel === 'ALTO';
    }).length;

    this._crearChip(filtros, 'Urgentes', urgentes, 'urgentes');
    this._crearChip(filtros, 'Hoy', this._contarHoy(), 'hoy');
    this._crearChip(filtros, 'Sin leer', this._contarSinLeer(), 'sinleer');

    var chipMas = document.createElement('button');
    chipMas.className = 'chip';
    chipMas.textContent = '+';
    chipMas.addEventListener('click', function() {
      VistaTodo._abrirFiltrosAvanzados();
    });
    filtros.appendChild(chipMas);

    contenedor.appendChild(filtros);

    // Lista
    var lista = document.createElement('div');
    lista.className = 'lista-cargas contenido';
    contenedor.appendChild(lista);

    // Pull-to-refresh
    this._configurarPullRefresh(lista);

    // Renderizar cards
    this._renderizarLista(lista);

    // Bottom bar seleccion (oculta por defecto)
    var bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-bar hidden';
    bottomBar.id = 'seleccion-bar';
    bottomBar.innerHTML = '<span id="seleccion-count">0</span>'
      + '<button class="btn btn-primary" onclick="VistaTodo._cambiarFaseMasivo()">Fase</button>'
      + '<button class="btn btn-primary" onclick="VistaTodo._cambiarEstadoMasivo()">Estado</button>'
      + '<button class="btn btn-primary" onclick="VistaTodo._responderMasivo()">Resp</button>'
      + '<button class="btn btn-outline" onclick="VistaTodo._limpiarSeleccion()">X</button>';
    contenedor.appendChild(bottomBar);
  },

  _renderizarLista: function(lista) {
    if (!lista) return;
    lista.innerHTML = '';

    var registros = Store.obtenerRegistros();
    var alertas = Store.obtenerAlertas();
    var config = Store.obtenerConfig();

    // Agrupar por codCar (tomar el mas reciente por carga)
    var mapa = {};
    registros.forEach(function(r) {
      var clave = r.codCar || r.threadId;
      if (!mapa[clave] || new Date(r.fechaCorreo) > new Date(mapa[clave].fechaCorreo)) {
        mapa[clave] = r;
      }
    });
    var cargas = Object.values(mapa);

    // Filtrar por busqueda (todos los campos, como escritorio)
    if (this._busqueda) {
      var q = this._busqueda.toLowerCase();
      cargas = cargas.filter(function(c) {
        var campos = [
          c.codCar, c.codTra, c.nombreTransportista, c.interlocutor,
          c.asunto, c.fase, c.estado, c.tipoTarea, c.emailRemitente,
          c.referencia, c.zona, c.zDest, c.extracto, c.cuerpoTexto
        ];
        return campos.some(function(v) {
          return v && String(v).toLowerCase().includes(q);
        });
      });
    }

    // Filtros rapidos
    if (this._filtroActivo === 'urgentes') {
      var threadIdsUrgentes = new Set(alertas.filter(function(a) {
        return a.nivel === 'CRITICO' || a.nivel === 'ALTO';
      }).map(function(a) { return a.threadId; }));
      cargas = cargas.filter(function(c) { return threadIdsUrgentes.has(c.threadId); });
    } else if (this._filtroActivo === 'hoy') {
      var hoy = new Date().toISOString().slice(0, 10);
      cargas = cargas.filter(function(c) { return c.fCarga === hoy; });
    } else if (this._filtroActivo === 'sinleer') {
      cargas = cargas.filter(function(c) { return c.estado === 'RECIBIDO'; });
    } else if (this._filtroActivo === 'incidencias') {
      cargas = cargas.filter(function(c) { return c.fase === '05' || c.fase === '25'; });
    } else if (this._filtroActivo === 'enproceso') {
      cargas = cargas.filter(function(c) {
        var f = c.fase;
        return f === '11' || f === '12' || f === '19' || f === '21' || f === '22';
      });
    } else if (this._filtroActivo === 'sinvincular') {
      cargas = cargas.filter(function(c) { return c.vinculacion === 'SIN_VINCULAR' || !c.codCar; });
    } else if (this._filtroActivo && this._filtroActivo.indexOf('fase_') === 0) {
      var faseFilter = this._filtroActivo.substring(5);
      cargas = cargas.filter(function(c) { return c.fase === faseFilter; });
    } else if (this._filtroActivo && this._filtroActivo.indexOf('estado_') === 0) {
      var estadoFilter = this._filtroActivo.substring(7);
      cargas = cargas.filter(function(c) { return c.estado === estadoFilter; });
    }

    // Ordenar: criticas primero, luego por fecha descendente
    var alertasPorThread = {};
    alertas.forEach(function(a) {
      if (!alertasPorThread[a.threadId] || a.nivel === 'CRITICO') {
        alertasPorThread[a.threadId] = a.nivel;
      }
    });

    cargas.sort(function(a, b) {
      var nivelA = alertasPorThread[a.threadId] === 'CRITICO' ? 0 : 1;
      var nivelB = alertasPorThread[b.threadId] === 'CRITICO' ? 0 : 1;
      if (nivelA !== nivelB) return nivelA - nivelB;
      return new Date(b.fechaCorreo) - new Date(a.fechaCorreo);
    });

    if (cargas.length === 0) {
      lista.innerHTML = '<div class="text-center p-16" style="color:var(--text-secondary)">'
        + 'No hay cargas' + (this._busqueda ? ' que coincidan' : '') + '</div>';
      return;
    }

    var self = this;
    cargas.forEach(function(carga) {
      var card = CardUI.crear(carga, alertas, config, registros);
      var check = card.querySelector('input[type="checkbox"]');
      if (check) {
        check.checked = self._seleccionadas.has(String(carga.codCar));
        check.addEventListener('change', function() {
          var cod = String(carga.codCar);
          if (check.checked) { self._seleccionadas.add(cod); }
          else { self._seleccionadas.delete(cod); }
          self._actualizarBarraSeleccion();
        });
      }
      lista.appendChild(card);
    });
  },

  _crearChip: function(contenedor, texto, conteo, filtro) {
    var chip = document.createElement('button');
    chip.className = 'chip' + (this._filtroActivo === filtro ? ' activo' : '');
    chip.innerHTML = texto + (conteo > 0 ? '<span class="badge">' + conteo + '</span>' : '');
    chip.addEventListener('click', function() {
      VistaTodo._filtroActivo = VistaTodo._filtroActivo === filtro ? null : filtro;
      App.renderizar();
    });
    contenedor.appendChild(chip);
  },

  _contarHoy: function() {
    var hoy = new Date().toISOString().slice(0, 10);
    return Store.obtenerRegistros().filter(function(r) { return r.fCarga === hoy; }).length;
  },

  _contarSinLeer: function() {
    return Store.obtenerRegistros().filter(function(r) { return r.estado === 'RECIBIDO'; }).length;
  },

  _configurarPullRefresh: function(lista) {
    var startY = 0;
    var self = this;

    lista.addEventListener('touchstart', function(e) {
      if (lista.scrollTop === 0) startY = e.touches[0].clientY;
    });

    lista.addEventListener('touchend', function(e) {
      if (startY && e.changedTouches[0].clientY - startY > 80 && !self._refreshing) {
        self._ejecutarRefresh(lista);
      }
      startY = 0;
    });
  },

  _ejecutarRefresh: async function(lista) {
    this._refreshing = true;
    lista.innerHTML = '<div class="skeleton skeleton-card"></div>'
      + '<div class="skeleton skeleton-card"></div>'
      + '<div class="skeleton skeleton-card"></div>';

    try {
      var resultado = await API.post('procesarCorreos', { limite: 50 });
      if (resultado.registros) {
        Store.guardarRegistros(resultado.registros);
      }

      if (resultado.hayMas) {
        await new Promise(function(r) { setTimeout(r, 6000); });
        var mas = await API.post('procesarCorreos', { limite: 50 });
        if (mas.registros) Store.guardarRegistros(mas.registros);
      }

      // Evaluar alertas
      if (typeof evaluarAlertas === 'function') {
        var alertasNuevas = evaluarAlertas(Store.obtenerRegistros(), Store.obtenerConfig());
        Store.guardarAlertas(alertasNuevas);
      }

      Store.guardarUltimoBarrido(new Date().toISOString());
      var total = Store.obtenerRegistros().length;
      ToastUI.mostrar(total + ' cargas actualizadas', { tipo: 'exito' });
    } catch (e) {
      ToastUI.mostrar('Error al actualizar: ' + e.message, { tipo: 'error' });
      Feedback.vibrar('error');
    }

    this._refreshing = false;
    this._renderizarLista(lista);
  },

  _abrirFiltrosAvanzados: function() {
    var opciones = [
      { texto: 'Incidencias (05, 25)', accion: function() {
        VistaTodo._filtroActivo = 'incidencias'; App.renderizar();
      }},
      { texto: 'En proceso (11-22)', accion: function() {
        VistaTodo._filtroActivo = 'enproceso'; App.renderizar();
      }},
      { texto: 'Sin vincular', accion: function() {
        VistaTodo._filtroActivo = 'sinvincular'; App.renderizar();
      }}
    ];

    // Fases dinamicas
    var fases = typeof getDefaultFases === 'function'
      ? getDefaultFases().filter(function(f) { return f.activa && f.codigo; }) : [];
    fases.forEach(function(f) {
      opciones.push({
        texto: f.nombre,
        color: f.clase_css === 'fase-incidencia' ? '#D32F2F'
          : f.clase_css === 'fase-ok' ? '#2E7D32' : null,
        accion: function() {
          VistaTodo._filtroActivo = 'fase_' + f.codigo; App.renderizar();
        }
      });
    });

    // Separador visual
    opciones.push({ texto: '--- ESTADOS ---', accion: function() {} });

    // Estados dinamicos
    var estados = typeof getDefaultEstados === 'function'
      ? getDefaultEstados().filter(function(e) { return e.activo; }) : [];
    estados.forEach(function(e) {
      opciones.push({
        texto: e.icono + ' ' + e.nombre,
        accion: function() {
          VistaTodo._filtroActivo = 'estado_' + e.codigo; App.renderizar();
        }
      });
    });

    opciones.push({ texto: 'Resetear filtros', color: '#D32F2F', accion: function() {
      VistaTodo._filtroActivo = null; App.renderizar();
    }});

    BottomSheet.abrir({ titulo: 'Filtros avanzados', opciones: opciones });
  },

  _cambiarFaseMasivo: function() {
    if (this._seleccionadas.size === 0) {
      ToastUI.mostrar('Selecciona al menos una carga', { tipo: 'info' });
      return;
    }

    var fases = typeof getDefaultFases === 'function'
      ? getDefaultFases().filter(function(f) { return f.activa && f.codigo; })
      : [];

    var self = this;
    BottomSheet.abrir({
      titulo: 'Cambiar fase (' + this._seleccionadas.size + ' cargas)',
      opciones: fases.map(function(f) {
        var color = f.clase_css === 'fase-incidencia' ? '#D32F2F'
          : f.clase_css === 'fase-ok' ? '#2E7D32' : null;
        return {
          texto: f.nombre,
          color: color,
          accion: function() {
            self._ejecutarCambioMasivo('fase', f.codigo);
          }
        };
      })
    });
  },

  _cambiarEstadoMasivo: function() {
    if (this._seleccionadas.size === 0) {
      ToastUI.mostrar('Selecciona al menos una carga', { tipo: 'info' });
      return;
    }

    var estados = typeof getDefaultEstados === 'function'
      ? getDefaultEstados().filter(function(e) { return e.activo; })
      : [];

    var self = this;
    BottomSheet.abrir({
      titulo: 'Cambiar estado (' + this._seleccionadas.size + ' cargas)',
      opciones: estados.map(function(e) {
        return {
          texto: e.icono + ' ' + e.nombre,
          accion: function() {
            self._ejecutarCambioMasivo('estado', e.codigo);
          }
        };
      })
    });
  },

  _responderMasivo: function() {
    if (this._seleccionadas.size === 0) {
      ToastUI.mostrar('Selecciona al menos una carga', { tipo: 'info' });
      return;
    }

    var plantillas = Store.obtenerPlantillas();
    if (plantillas.length === 0) {
      ToastUI.mostrar('Sin plantillas configuradas', { tipo: 'info' });
      return;
    }

    var self = this;
    BottomSheet.abrir({
      titulo: 'Responder (' + this._seleccionadas.size + ' cargas)',
      opciones: plantillas.map(function(p) {
        return {
          texto: p.alias,
          accion: function() {
            self._ejecutarRespuestaMasiva(p);
          }
        };
      })
    });
  },

  _ejecutarCambioMasivo: async function(campo, valor) {
    // Normalizar fase a string con padding (evitar "0" en vez de "00")
    if (campo === 'fase') valor = String(valor).padStart(2, '0');
    var registros = Store.obtenerRegistros();
    var seleccionadas = this._seleccionadas;

    // 1. Recopilar threadIds unicos de los seleccionados (como escritorio)
    var threadsAfectados = {};
    registros.forEach(function(r) {
      if (seleccionadas.has(String(r.codCar)) && r.threadId) {
        threadsAfectados[r.threadId] = true;
      }
    });
    var threadIds = Object.keys(threadsAfectados);

    // 2. Propagar a TODO el hilo localmente (como escritorio)
    registros.forEach(function(r) {
      if (r.threadId && threadsAfectados[r.threadId]) {
        r[campo] = valor;
      }
    });
    Store.guardarRegistros(registros);

    // 3. Re-evaluar alertas
    if (typeof evaluarAlertas === 'function') {
      Store.guardarAlertas(evaluarAlertas(registros, Store.obtenerConfig()));
    }

    // 4. Backend: un request por threadId (como escritorio)
    var errores = 0;
    var exitos = 0;
    for (var i = 0; i < threadIds.length; i++) {
      try {
        await API.post('actualizarCampoPorThread', {
          threadId: threadIds[i], campo: campo, valor: valor
        });
        exitos++;
      } catch (e) { errores++; }
    }

    Feedback.vibrar('doble');
    ToastUI.mostrar(exitos + ' hilos actualizados' + (errores ? ', ' + errores + ' errores' : ''), {
      tipo: errores ? 'error' : 'exito'
    });
    this._limpiarSeleccion();
    App.renderizar();
  },

  _ejecutarRespuestaMasiva: async function(plantilla) {
    var registros = Store.obtenerRegistros();
    var seleccionadas = this._seleccionadas;
    var pie = Store.obtenerPieComun();
    var destinatarios = [];

    registros.forEach(function(r) {
      if (!seleccionadas.has(String(r.codCar))) return;
      var cuerpo = typeof interpolar === 'function'
        ? interpolar(plantilla.cuerpo || plantilla.texto || '', {
            codCar: r.codCar, transportista: r.nombreTransportista,
            fase: r.fase, interlocutor: r.interlocutor
          }) : (plantilla.cuerpo || plantilla.texto || '');
      destinatarios.push({
        email: r.interlocutor || r.emailRemitente,
        threadId: r.threadId,
        asunto: 'Re: ' + (r.asunto || ''),
        cuerpo: '<p>' + cuerpo + '</p>' + pie,
        para: r.interlocutor || r.emailRemitente,
        cc: r.cc || '', cco: ''
      });
    });

    if (destinatarios.length === 0) return;

    try {
      await API.post('enviarRespuesta', { destinatarios: destinatarios });
      Feedback.vibrar('doble');
      ToastUI.mostrar(destinatarios.length + ' emails enviados', { tipo: 'exito' });
    } catch (e) {
      Feedback.vibrar('error');
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
    this._limpiarSeleccion();
    App.renderizar();
  },

  _actualizarBarraSeleccion: function() {
    var bar = document.getElementById('seleccion-bar');
    var count = document.getElementById('seleccion-count');
    if (bar) {
      bar.classList.toggle('hidden', this._seleccionadas.size === 0);
    }
    if (count) {
      count.textContent = this._seleccionadas.size + ' seleccionadas';
    }
  },

  _limpiarSeleccion: function() {
    this._seleccionadas.clear();
    var bar = document.getElementById('seleccion-bar');
    if (bar) bar.classList.add('hidden');
  }
};
