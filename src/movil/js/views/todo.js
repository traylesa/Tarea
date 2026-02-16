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
    searchInput.placeholder = 'Buscar codCar...';
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
    bottomBar.innerHTML = '<span id="seleccion-count">0 seleccionadas</span>'
      + '<button class="btn btn-primary" onclick="VistaTodo._cambiarFaseMasivo()">Fase</button>'
      + '<button class="btn btn-primary" onclick="VistaTodo._responderMasivo()">Responder</button>'
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

    // Filtrar por busqueda
    if (this._busqueda) {
      var q = this._busqueda.toLowerCase();
      cargas = cargas.filter(function(c) {
        return String(c.codCar || '').includes(q)
          || (c.nombreTransportista || '').toLowerCase().includes(q);
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

    cargas.forEach(function(carga) {
      var card = CardUI.crear(carga, alertas, config);
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
    BottomSheet.abrir({
      titulo: 'Filtros avanzados',
      opciones: [
        { texto: 'Incidencias (05, 25)', accion: function() {
          VistaTodo._filtroActivo = 'incidencias';
          App.renderizar();
        }},
        { texto: 'En proceso (11-22)', accion: function() {
          VistaTodo._filtroActivo = 'enproceso';
          App.renderizar();
        }},
        { texto: 'Sin vincular', accion: function() {
          VistaTodo._filtroActivo = 'sinvincular';
          App.renderizar();
        }},
        { texto: 'Resetear filtros', color: '#D32F2F', accion: function() {
          VistaTodo._filtroActivo = null;
          App.renderizar();
        }}
      ]
    });
  },

  _cambiarFaseMasivo: function() {
    // Placeholder: se conecta con bottom sheet de fases
  },

  _responderMasivo: function() {
    // Placeholder: se conecta con editor de respuesta
  },

  _limpiarSeleccion: function() {
    this._seleccionadas.clear();
    var bar = document.getElementById('seleccion-bar');
    if (bar) bar.classList.add('hidden');
  }
};
