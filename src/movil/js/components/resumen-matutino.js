// resumen-matutino.js - Modal resumen matutino automatico
'use strict';

var ResumenMatutino = {
  mostrar: function(alertas, config) {
    var categorias = typeof categorizarAlertas === 'function'
      ? categorizarAlertas(alertas) : { urgente: [], sinRespuesta: [], documentacion: [], estancadas: [] };

    var total = categorias.urgente.length + categorias.sinRespuesta.length
      + categorias.documentacion.length + categorias.estancadas.length;

    if (total === 0) {
      this._marcarMostrado();
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay visible';
    overlay.style.zIndex = '250';

    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
      + 'background:white;border-radius:16px;padding:20px;z-index:251;width:90%;max-width:360px;'
      + 'max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.25)';

    var titulo = document.createElement('div');
    titulo.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;text-align:center';
    titulo.textContent = 'Buenos dias \u2615';
    modal.appendChild(titulo);

    var subtitulo = document.createElement('div');
    subtitulo.style.cssText = 'font-size:14px;color:var(--text-secondary);margin-bottom:16px;text-align:center';
    subtitulo.textContent = total + ' elementos requieren atencion';
    modal.appendChild(subtitulo);

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
      tarjeta.style.cssText = 'display:flex;justify-content:space-between;align-items:center;'
        + 'padding:12px;margin-bottom:8px;border-radius:8px;border-left:4px solid ' + cat.color
        + ';background:var(--bg-secondary);cursor:pointer;min-height:48px';

      tarjeta.innerHTML = '<span style="font-weight:bold">' + cat.nombre + '</span>'
        + '<span style="background:' + cat.color + ';color:white;border-radius:12px;padding:2px 10px;font-weight:bold">'
        + items.length + '</span>';

      tarjeta.addEventListener('click', function() {
        overlay.remove();
        modal.remove();
        ResumenMatutino._marcarMostrado();
        if (typeof VistaTodo !== 'undefined') VistaTodo._filtroActivo = cat.filtro;
        App.navegar('todo');
      });

      modal.appendChild(tarjeta);
    });

    var btnCerrar = document.createElement('button');
    btnCerrar.className = 'btn btn-outline';
    btnCerrar.style.cssText = 'width:100%;margin-top:12px';
    btnCerrar.textContent = 'Cerrar';
    btnCerrar.addEventListener('click', function() {
      overlay.remove();
      modal.remove();
      ResumenMatutino._marcarMostrado();
    });
    modal.appendChild(btnCerrar);

    overlay.addEventListener('click', function() {
      overlay.remove();
      modal.remove();
      ResumenMatutino._marcarMostrado();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  },

  _marcarMostrado: function() {
    if (typeof crearFlagMostrado === 'function') {
      Store._guardarJSON('tarealog_resumen_flag', crearFlagMostrado(new Date()));
    }
  }
};
