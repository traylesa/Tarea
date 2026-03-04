// contactos.js - Vista unificada: Contactos + Entidades + Centros
'use strict';

var VistaContactos = {
  _busqueda: '',
  _tab: 'contactos', // contactos | entidades | centros

  renderizar: function(contenedor) {
    var self = this;
    contenedor.innerHTML =
      '<div class="header"><div class="header-title">Datos Maestros</div></div>' +
      '<div class="maestro-tabs">' +
        '<button class="maestro-tab' + (this._tab === 'contactos' ? ' activo' : '') + '" onclick="VistaContactos._cambiarTab(\'contactos\')">Contactos</button>' +
        '<button class="maestro-tab' + (this._tab === 'entidades' ? ' activo' : '') + '" onclick="VistaContactos._cambiarTab(\'entidades\')">Entidades</button>' +
        '<button class="maestro-tab' + (this._tab === 'centros' ? ' activo' : '') + '" onclick="VistaContactos._cambiarTab(\'centros\')">Centros</button>' +
      '</div>' +
      '<div class="search-bar">' +
        '<input type="text" placeholder="Buscar..." value="' + _escC(this._busqueda) + '" oninput="VistaContactos._buscar(this.value)">' +
      '</div>' +
      '<div id="lista-maestros" style="padding:8px"></div>' +
      '<button class="fab" onclick="VistaContactos._abrirCrear()">+</button>';

    this._renderizarLista();
    this._sincronizar();
  },

  _cambiarTab: function(tab) {
    this._tab = tab;
    this._busqueda = '';
    var tabs = document.querySelectorAll('.maestro-tab');
    tabs.forEach(function(t) { t.classList.remove('activo'); });
    var activo = document.querySelector('.maestro-tab:nth-child(' + (tab === 'contactos' ? 1 : tab === 'entidades' ? 2 : 3) + ')');
    if (activo) activo.classList.add('activo');
    var input = document.querySelector('.search-bar input');
    if (input) input.value = '';
    this._renderizarLista();
  },

  _renderizarLista: function() {
    var lista = document.getElementById('lista-maestros');
    if (!lista) return;

    if (this._tab === 'contactos') this._renderContactos(lista);
    else if (this._tab === 'entidades') this._renderEntidades(lista);
    else this._renderCentros(lista);
  },

  // === CONTACTOS ===

  _renderContactos: function(lista) {
    var contactos = Store.obtenerContactos();
    var q = this._busqueda.toLowerCase();
    if (q) {
      contactos = contactos.filter(function(c) {
        return (c.nombre || '').toLowerCase().indexOf(q) !== -1 ||
               (c.telefono || '').indexOf(q) !== -1 ||
               (c.email || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (contactos.length === 0) {
      lista.innerHTML = '<div class="lista-vacia">Sin contactos' +
        (q ? ' para "' + _escC(q) + '"' : '') + '</div>';
      return;
    }

    var entidades = Store.obtenerEntidades();
    var centros = Store.obtenerCentros();
    var entMap = {};
    entidades.forEach(function(e) { entMap[e.id] = e.nombre; });
    var ctrMap = {};
    centros.forEach(function(c) { ctrMap[c.id] = c.nombre; });

    lista.innerHTML = contactos.map(function(c) {
      var iniciales = (c.nombre || '?').charAt(0).toUpperCase();
      var entNombre = c.entidadId && entMap[c.entidadId] ? entMap[c.entidadId] : '';
      var ctrNombre = c.centroId && ctrMap[c.centroId] ? ctrMap[c.centroId] : '';
      var ubicacion = [entNombre, ctrNombre].filter(Boolean).join(' > ');
      return '<div class="contacto-card" onclick="VistaContactos._verContacto(' + "'" + _escC(c.telefono) + "'" + ')">' +
        '<div class="contacto-avatar">' + iniciales + '</div>' +
        '<div class="contacto-info">' +
          '<div class="contacto-nombre">' + _escC(c.nombre) + '</div>' +
          '<div class="contacto-tel">' + _escC(c.telefono) +
            (c.email ? ' &middot; ' + _escC(c.email) : '') + '</div>' +
          (ubicacion ? '<div class="contacto-entidad">' + _escC(ubicacion) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  },

  _verContacto: function(telefono) {
    var contactos = Store.obtenerContactos();
    var c = contactos.find(function(x) { return x.telefono === telefono; });
    if (!c) return;

    var entidades = Store.obtenerEntidades();
    var centros = Store.obtenerCentros();
    var entMap = {};
    entidades.forEach(function(e) { entMap[e.id] = e.nombre; });
    var ctrMap = {};
    centros.forEach(function(ct) { ctrMap[ct.id] = ct.nombre; });

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="tarea-detalle-info">' +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Nombre</span><span>' + _escC(c.nombre) + '</span></div>' +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Telefono</span><span>' + _escC(c.telefono) + '</span></div>' +
        (c.email ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Email</span><span>' + _escC(c.email) + '</span></div>' : '') +
        (c.entidadId && entMap[c.entidadId] ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Entidad</span><span>' + _escC(entMap[c.entidadId]) + '</span></div>' : '') +
        (c.centroId && ctrMap[c.centroId] ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Centro</span><span>' + _escC(ctrMap[c.centroId]) + '</span></div>' : '') +
        (c.notas ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Notas</span><span>' + _escC(c.notas) + '</span></div>' : '') +
      '</div>';

    BottomSheet.abrir({ titulo: c.nombre, contenido: contenido });
  },

  // === ENTIDADES ===

  _renderEntidades: function(lista) {
    var entidades = Store.obtenerEntidades();
    var q = this._busqueda.toLowerCase();
    if (q) {
      entidades = entidades.filter(function(e) {
        return (e.nombre || '').toLowerCase().indexOf(q) !== -1 ||
               (e.cif || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (entidades.length === 0) {
      lista.innerHTML = '<div class="lista-vacia">Sin entidades' +
        (q ? ' para "' + _escC(q) + '"' : '') + '</div>';
      return;
    }

    var centros = Store.obtenerCentros();
    var contactos = Store.obtenerContactos();

    lista.innerHTML = entidades.map(function(e) {
      var numCentros = centros.filter(function(c) { return c.entidadId === e.id; }).length;
      var numContactos = contactos.filter(function(c) { return c.entidadId === e.id; }).length;
      var inicial = (e.nombre || '?').charAt(0).toUpperCase();
      return '<div class="contacto-card" onclick="VistaContactos._verEntidad(' + "'" + _escC(e.id) + "'" + ')">' +
        '<div class="contacto-avatar" style="background:#E8F5E9;color:#2E7D32">' + inicial + '</div>' +
        '<div class="contacto-info">' +
          '<div class="contacto-nombre">' + _escC(e.nombre) + '</div>' +
          '<div class="contacto-tel">' +
            (e.tipo ? _escC(e.tipo) : 'Sin tipo') +
            (e.cif ? ' &middot; ' + _escC(e.cif) : '') + '</div>' +
          '<div class="contacto-entidad">' +
            numCentros + ' centro' + (numCentros !== 1 ? 's' : '') +
            ' &middot; ' + numContactos + ' contacto' + (numContactos !== 1 ? 's' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  _verEntidad: function(id) {
    var entidades = Store.obtenerEntidades();
    var e = entidades.find(function(x) { return x.id === id; });
    if (!e) return;

    var centros = Store.obtenerCentros().filter(function(c) { return c.entidadId === id; });
    var contactos = Store.obtenerContactos().filter(function(c) { return c.entidadId === id; });

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';

    var html =
      '<div class="tarea-detalle-info">' +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Nombre</span><span>' + _escC(e.nombre) + '</span></div>' +
        (e.tipo ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Tipo</span><span>' + _escC(e.tipo) + '</span></div>' : '') +
        (e.cif ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">CIF</span><span>' + _escC(e.cif) + '</span></div>' : '') +
        (e.direccion ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Direccion</span><span>' + _escC(e.direccion) + '</span></div>' : '') +
      '</div>';

    if (centros.length > 0) {
      html += '<div style="margin-top:12px;font-weight:600;font-size:13px;color:var(--text-secondary)">Centros (' + centros.length + ')</div>';
      centros.forEach(function(c) {
        html += '<div class="contacto-card" style="margin-top:4px;padding:8px">' +
          '<div class="contacto-info">' +
            '<div class="contacto-nombre" style="font-size:13px">' + _escC(c.nombre) + '</div>' +
            (c.direccion ? '<div class="contacto-tel">' + _escC(c.direccion) + '</div>' : '') +
          '</div></div>';
      });
    }

    if (contactos.length > 0) {
      html += '<div style="margin-top:12px;font-weight:600;font-size:13px;color:var(--text-secondary)">Contactos (' + contactos.length + ')</div>';
      contactos.forEach(function(c) {
        html += '<div class="contacto-card" style="margin-top:4px;padding:8px">' +
          '<div class="contacto-info">' +
            '<div class="contacto-nombre" style="font-size:13px">' + _escC(c.nombre) + '</div>' +
            '<div class="contacto-tel">' + _escC(c.telefono) + '</div>' +
          '</div></div>';
      });
    }

    contenido.innerHTML = html;
    BottomSheet.abrir({ titulo: e.nombre, contenido: contenido });
  },

  // === CENTROS ===

  _renderCentros: function(lista) {
    var centros = Store.obtenerCentros();
    var q = this._busqueda.toLowerCase();
    if (q) {
      centros = centros.filter(function(c) {
        return (c.nombre || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (centros.length === 0) {
      lista.innerHTML = '<div class="lista-vacia">Sin centros' +
        (q ? ' para "' + _escC(q) + '"' : '') + '</div>';
      return;
    }

    var entidades = Store.obtenerEntidades();
    var entMap = {};
    entidades.forEach(function(e) { entMap[e.id] = e.nombre; });

    lista.innerHTML = centros.map(function(c) {
      var inicial = (c.nombre || '?').charAt(0).toUpperCase();
      var entNombre = c.entidadId && entMap[c.entidadId] ? entMap[c.entidadId] : '';
      return '<div class="contacto-card">' +
        '<div class="contacto-avatar" style="background:#FFF3E0;color:#F57C00">' + inicial + '</div>' +
        '<div class="contacto-info">' +
          '<div class="contacto-nombre">' + _escC(c.nombre) + '</div>' +
          (c.direccion ? '<div class="contacto-tel">' + _escC(c.direccion) + '</div>' : '') +
          (entNombre ? '<div class="contacto-entidad">' + _escC(entNombre) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  },

  // === CREAR (segun tab activa) ===

  _abrirCrear: function() {
    if (this._tab === 'contactos') this._abrirCrearContacto();
    else if (this._tab === 'entidades') this._abrirCrearEntidad();
    else this._abrirCrearCentro();
  },

  // --- Crear Contacto (con creacion en cascada) ---

  _abrirCrearContacto: function() {
    var entidades = Store.obtenerEntidades();
    var centros = Store.obtenerCentros();

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="form-grupo"><label>Nombre *</label><input id="cont-nombre" type="text"></div>' +
      '<div class="form-grupo"><label>Telefono *</label><input id="cont-tel" type="tel" placeholder="612345678" inputmode="tel"></div>' +
      '<div class="form-grupo"><label>Email</label><input id="cont-email" type="email" inputmode="email"></div>' +

      // Entidad con boton inline +
      '<div class="form-grupo">' +
        '<label>Entidad</label>' +
        '<div class="form-fila-inline">' +
          '<select id="cont-entidad" onchange="VistaContactos._filtrarCentrosPorEntidad()">' +
            '<option value="">-- Sin entidad --</option>' +
            entidades.map(function(e) {
              return '<option value="' + _escC(e.id) + '">' + _escC(e.nombre) + '</option>';
            }).join('') +
          '</select>' +
          '<button class="btn-inline-add" onclick="VistaContactos._crearEntidadInline()" title="Crear entidad">+</button>' +
        '</div>' +
      '</div>' +

      // Centro con boton inline + (filtrado por entidad)
      '<div class="form-grupo">' +
        '<label>Centro</label>' +
        '<div class="form-fila-inline">' +
          '<select id="cont-centro">' +
            '<option value="">-- Sin centro --</option>' +
            centros.map(function(c) {
              return '<option value="' + _escC(c.id) + '" data-entidad="' + _escC(c.entidadId || '') + '">' + _escC(c.nombre) + '</option>';
            }).join('') +
          '</select>' +
          '<button class="btn-inline-add" onclick="VistaContactos._crearCentroInline()" title="Crear centro">+</button>' +
        '</div>' +
      '</div>' +

      '<div class="form-grupo"><label>Notas</label><textarea id="cont-notas" rows="2"></textarea></div>' +
      '<div class="form-acciones">' +
        '<button class="btn btn-secondary" onclick="BottomSheet.cerrar()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="VistaContactos._guardarContacto()">Crear</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Nuevo contacto', contenido: contenido });
  },

  _filtrarCentrosPorEntidad: function() {
    var entidadId = document.getElementById('cont-entidad').value;
    var select = document.getElementById('cont-centro');
    var opciones = select.querySelectorAll('option');

    opciones.forEach(function(opt) {
      if (!opt.value) return; // Siempre mostrar "-- Sin centro --"
      var entOpt = opt.getAttribute('data-entidad');
      if (!entidadId || !entOpt || entOpt === entidadId) {
        opt.style.display = '';
      } else {
        opt.style.display = 'none';
        if (opt.selected) select.value = '';
      }
    });
  },

  _guardarContacto: async function() {
    var nombre = document.getElementById('cont-nombre').value.trim();
    var tel = document.getElementById('cont-tel').value.trim();
    if (!nombre) { ToastUI.mostrar('Nombre es obligatorio', { tipo: 'error' }); return; }
    if (!tel) { ToastUI.mostrar('Telefono es obligatorio', { tipo: 'error' }); return; }

    var body = {
      nombre: nombre,
      telefono: tel,
      email: document.getElementById('cont-email').value.trim(),
      entidadId: document.getElementById('cont-entidad').value,
      centroId: document.getElementById('cont-centro').value,
      notas: document.getElementById('cont-notas').value.trim()
    };

    BottomSheet.cerrar();
    ToastUI.mostrar('Creando contacto...', { tipo: 'info' });

    try {
      var data = await API.post('crearContacto', body);
      var contactos = Store.obtenerContactos();
      contactos.unshift(data.contacto);
      Store.guardarContactos(contactos);
      ToastUI.mostrar('Contacto creado', { tipo: 'ok' });
      this._renderizarLista();
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  // --- Crear Entidad (standalone o inline) ---

  _abrirCrearEntidad: function() {
    this._mostrarFormEntidad(false);
  },

  _crearEntidadInline: function() {
    this._mostrarFormEntidad(true);
  },

  _mostrarFormEntidad: function(esInline) {
    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="form-grupo"><label>Nombre *</label><input id="ent-nombre" type="text"></div>' +
      '<div class="form-grupo"><label>Tipo</label>' +
        '<select id="ent-tipo">' +
          '<option value="">-- Seleccionar --</option>' +
          '<option value="Cliente">Cliente</option>' +
          '<option value="Proveedor">Proveedor</option>' +
          '<option value="Transportista">Transportista</option>' +
          '<option value="Colaborador">Colaborador</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-grupo"><label>CIF/NIF</label><input id="ent-cif" type="text" placeholder="B12345678"></div>' +
      '<div class="form-grupo"><label>Direccion</label><input id="ent-direccion" type="text"></div>' +
      '<div class="form-acciones">' +
        '<button class="btn btn-secondary" onclick="BottomSheet.cerrar()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="VistaContactos._guardarEntidad(' + esInline + ')">Crear</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Nueva entidad', contenido: contenido });
  },

  _guardarEntidad: async function(esInline) {
    var nombre = document.getElementById('ent-nombre').value.trim();
    if (!nombre) { ToastUI.mostrar('Nombre es obligatorio', { tipo: 'error' }); return; }

    var body = {
      nombre: nombre,
      tipo: document.getElementById('ent-tipo').value,
      cif: document.getElementById('ent-cif').value.trim(),
      direccion: document.getElementById('ent-direccion').value.trim()
    };

    BottomSheet.cerrar();
    ToastUI.mostrar('Creando entidad...', { tipo: 'info' });

    try {
      var data = await API.post('crearEntidad', body);
      var entidades = Store.obtenerEntidades();
      entidades.unshift(data.entidad);
      Store.guardarEntidades(entidades);
      ToastUI.mostrar('Entidad creada: ' + nombre, { tipo: 'ok' });

      if (esInline) {
        // Reabrir form contacto con la entidad preseleccionada
        this._reabrirContactoConEntidad(data.entidad.id);
      } else {
        this._renderizarLista();
      }
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _reabrirContactoConEntidad: function(entidadId) {
    var self = this;
    // Pequena pausa para que cierre el BottomSheet anterior
    setTimeout(function() {
      self._abrirCrearContacto();
      // Preseleccionar la entidad recien creada
      setTimeout(function() {
        var sel = document.getElementById('cont-entidad');
        if (sel) {
          sel.value = entidadId;
          self._filtrarCentrosPorEntidad();
        }
      }, 100);
    }, 350);
  },

  // --- Crear Centro (standalone o inline) ---

  _abrirCrearCentro: function() {
    this._mostrarFormCentro(false);
  },

  _crearCentroInline: function() {
    this._mostrarFormCentro(true);
  },

  _mostrarFormCentro: function(esInline) {
    var entidades = Store.obtenerEntidades();

    // Si es inline, intentar preseleccionar la entidad del form de contacto
    var entidadPresel = '';
    if (esInline) {
      var selEnt = document.getElementById('cont-entidad');
      if (selEnt) entidadPresel = selEnt.value;
    }

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="form-grupo"><label>Nombre *</label><input id="ctr-nombre" type="text"></div>' +
      '<div class="form-grupo"><label>Entidad</label>' +
        '<select id="ctr-entidad">' +
          '<option value="">-- Sin entidad --</option>' +
          entidades.map(function(e) {
            var sel = e.id === entidadPresel ? ' selected' : '';
            return '<option value="' + _escC(e.id) + '"' + sel + '>' + _escC(e.nombre) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="form-grupo"><label>Direccion</label><input id="ctr-direccion" type="text"></div>' +
      '<div class="form-acciones">' +
        '<button class="btn btn-secondary" onclick="BottomSheet.cerrar()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="VistaContactos._guardarCentro(' + esInline + ')">Crear</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Nuevo centro', contenido: contenido });
  },

  _guardarCentro: async function(esInline) {
    var nombre = document.getElementById('ctr-nombre').value.trim();
    if (!nombre) { ToastUI.mostrar('Nombre es obligatorio', { tipo: 'error' }); return; }

    var body = {
      nombre: nombre,
      entidadId: document.getElementById('ctr-entidad').value,
      direccion: document.getElementById('ctr-direccion').value.trim()
    };

    BottomSheet.cerrar();
    ToastUI.mostrar('Creando centro...', { tipo: 'info' });

    try {
      var data = await API.post('crearCentro', body);
      var centros = Store.obtenerCentros();
      centros.unshift(data.centro);
      Store.guardarCentros(centros);
      ToastUI.mostrar('Centro creado: ' + nombre, { tipo: 'ok' });

      if (esInline) {
        // Reabrir form contacto con entidad y centro preseleccionados
        this._reabrirContactoConCentro(data.centro.entidadId, data.centro.id);
      } else {
        this._renderizarLista();
      }
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _reabrirContactoConCentro: function(entidadId, centroId) {
    var self = this;
    setTimeout(function() {
      self._abrirCrearContacto();
      setTimeout(function() {
        var selEnt = document.getElementById('cont-entidad');
        if (selEnt && entidadId) {
          selEnt.value = entidadId;
          self._filtrarCentrosPorEntidad();
        }
        var selCtr = document.getElementById('cont-centro');
        if (selCtr && centroId) selCtr.value = centroId;
      }, 100);
    }, 350);
  },

  // === BUSQUEDA Y SYNC ===

  _buscar: function(texto) {
    this._busqueda = texto;
    this._renderizarLista();
  },

  _sincronizar: async function() {
    try {
      var results = await Promise.all([
        API.get('getContactos'),
        API.get('getEntidades'),
        API.get('getCentros')
      ]);
      if (results[0].contactos) Store.guardarContactos(results[0].contactos);
      if (results[1].entidades) Store.guardarEntidades(results[1].entidades);
      if (results[2].centros) Store.guardarCentros(results[2].centros);
      VistaContactos._renderizarLista();
    } catch(e) { /* usar cache */ }
  }
};

function _escC(t) {
  return String(t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
