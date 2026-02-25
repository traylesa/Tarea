// bottom-sheet.js - Bottom sheet modal generico
'use strict';

var BottomSheet = {
  _overlay: null,
  _sheet: null,

  abrir: function(opciones) {
    this.cerrar();

    var overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay visible';
    overlay.addEventListener('click', this.cerrar.bind(this));

    var sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';

    var handle = document.createElement('div');
    handle.className = 'bottom-sheet-handle';
    sheet.appendChild(handle);

    if (opciones.titulo) {
      var titulo = document.createElement('div');
      titulo.className = 'bottom-sheet-titulo';
      titulo.textContent = opciones.titulo;
      sheet.appendChild(titulo);
    }

    if (opciones.contenido) {
      if (typeof opciones.contenido === 'string') {
        sheet.innerHTML += opciones.contenido;
      } else {
        sheet.appendChild(opciones.contenido);
      }
    }

    if (opciones.opciones) {
      var lista = document.createElement('div');
      opciones.opciones.forEach(function(op) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-flex';
        btn.style.marginBottom = '8px';
        btn.style.width = '100%';
        btn.style.justifyContent = 'flex-start';
        if (op.color) {
          btn.style.borderColor = op.color;
          btn.style.color = op.color;
        }
        btn.textContent = op.texto;
        btn.addEventListener('click', function() {
          BottomSheet.cerrar();
          if (op.accion) op.accion(op);
        });
        lista.appendChild(btn);
      });
      sheet.appendChild(lista);
    }

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    this._overlay = overlay;
    this._sheet = sheet;

    requestAnimationFrame(function() {
      sheet.classList.add('visible');
    });
  },

  cerrar: function() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    if (this._sheet) { this._sheet.remove(); this._sheet = null; }
  }
};
