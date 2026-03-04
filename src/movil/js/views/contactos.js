// contactos.js - Vista de contactos
'use strict';

var VistaContactos = {
  _busqueda: '',

  renderizar: function(contenedor) {
    var contactos = Store.obtenerContactos();

    contenedor.innerHTML =
      '<div class="header"><div class="header-title">Contactos</div></div>' +
      '<div class="search-bar">' +
        '<input type="text" placeholder="Buscar por nombre o telefono..." value="' + this._busqueda + '" oninput="VistaContactos._buscar(this.value)">' +
      '</div>' +
      '<div id="lista-contactos" style="padding:8px"></div>' +
      '<button class="fab" onclick="VistaContactos._abrirCrear()">+</button>';

    this._renderizarLista(contactos);
    this._sincronizar();
  },

  _renderizarLista: function(contactos) {
    var filtrados = contactos;
    if (this._busqueda) {
      var q = this._busqueda.toLowerCase();
      filtrados = contactos.filter(function(c) {
        return (c.nombre || '').toLowerCase().indexOf(q) !== -1 ||
               (c.telefono || '').indexOf(q) !== -1;
      });
    }

    var lista = document.getElementById('lista-contactos');
    if (!lista) return;

    if (filtrados.length === 0) {
      lista.innerHTML = '<div class="lista-vacia">Sin contactos</div>';
      return;
    }

    var entidades = Store.obtenerEntidades();
    var entMap = {};
    entidades.forEach(function(e) { entMap[e.id] = e.nombre; });

    lista.innerHTML = filtrados.map(function(c) {
      var iniciales = (c.nombre || '?').charAt(0).toUpperCase();
      return '<div class="contacto-card">' +
        '<div class="contacto-avatar">' + iniciales + '</div>' +
        '<div class="contacto-info">' +
          '<div class="contacto-nombre">' + _escC(c.nombre) + '</div>' +
          '<div class="contacto-tel">' + _escC(c.telefono) + '</div>' +
          (c.entidadId && entMap[c.entidadId] ? '<div class="contacto-entidad">' + _escC(entMap[c.entidadId]) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  },

  _buscar: function(texto) {
    this._busqueda = texto;
    this._renderizarLista(Store.obtenerContactos());
  },

  _abrirCrear: function() {
    var entidades = Store.obtenerEntidades();
    var centros = Store.obtenerCentros();

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="form-grupo"><label>Nombre *</label><input id="cont-nombre" type="text"></div>' +
      '<div class="form-grupo"><label>Telefono *</label><input id="cont-tel" type="tel" placeholder="612345678"></div>' +
      '<div class="form-grupo"><label>Email</label><input id="cont-email" type="email"></div>' +
      '<div class="form-grupo"><label>Entidad</label>' +
        '<select id="cont-entidad"><option value="">-- Sin entidad --</option>' +
        entidades.map(function(e) { return '<option value="' + e.id + '">' + _escC(e.nombre) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-grupo"><label>Centro</label>' +
        '<select id="cont-centro"><option value="">-- Sin centro --</option>' +
        centros.map(function(c) { return '<option value="' + c.id + '">' + _escC(c.nombre) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-grupo"><label>Notas</label><textarea id="cont-notas"></textarea></div>' +
      '<div class="form-acciones">' +
        '<button class="btn btn-secondary" onclick="BottomSheet.cerrar()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="VistaContactos._guardarNuevo()">Crear</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Nuevo contacto', contenido: contenido });
  },

  _guardarNuevo: async function() {
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
      this._renderizarLista(contactos);
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _sincronizar: async function() {
    try {
      var data = await API.get('getContactos');
      if (data.contactos) {
        Store.guardarContactos(data.contactos);
        VistaContactos._renderizarLista(data.contactos);
      }
    } catch(e) { /* usar cache */ }
  }
};

function _escC(t) { return String(t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
