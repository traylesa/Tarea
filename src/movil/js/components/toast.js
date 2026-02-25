// toast.js - Componente toast con auto-dismiss y undo
'use strict';

var ToastUI = {
  _contenedor: null,
  _contadorId: 0,

  _obtenerContenedor: function() {
    if (this._contenedor) return this._contenedor;
    this._contenedor = document.createElement('div');
    this._contenedor.className = 'toast-container';
    document.body.appendChild(this._contenedor);
    return this._contenedor;
  },

  mostrar: function(mensaje, opciones) {
    opciones = opciones || {};
    var tipo = opciones.tipo || 'info';
    var duracion = opciones.duracion || 3000;
    var deshacer = opciones.deshacer || null;
    var id = 'toast-' + (++this._contadorId);

    var el = document.createElement('div');
    el.id = id;
    el.className = 'toast toast-' + tipo;

    var texto = document.createElement('span');
    texto.textContent = mensaje;
    el.appendChild(texto);

    if (deshacer) {
      var btn = document.createElement('button');
      btn.className = 'toast-deshacer';
      btn.textContent = 'Deshacer';
      btn.addEventListener('click', function() {
        deshacer();
        el.remove();
      });
      el.appendChild(btn);
    }

    var accion = opciones.accion || null;
    if (accion) {
      var btnAccion = document.createElement('button');
      btnAccion.className = 'toast-deshacer';
      btnAccion.textContent = accion.texto || 'Aceptar';
      btnAccion.addEventListener('click', function() {
        accion.fn();
        el.remove();
      });
      el.appendChild(btnAccion);
    }

    this._obtenerContenedor().appendChild(el);

    if (duracion > 0) {
      setTimeout(function() { el.remove(); }, duracion);
    }

    return id;
  }
};
