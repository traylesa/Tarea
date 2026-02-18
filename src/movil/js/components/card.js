// card.js - Componente card de carga
'use strict';

var CardUI = {
  crear: function(carga, alertas, config, registros) {
    var el = document.createElement('div');
    el.className = 'card';
    el.dataset.codcar = carga.codCar || '';
    el.dataset.threadid = carga.threadId || '';

    if (carga.estado === 'GESTIONADO') el.classList.add('gestionada');

    // Banner accion requerida
    var accion = typeof resolverAccion === 'function'
      ? resolverAccion(carga, alertas || [], config || {}) : null;
    if (accion && (accion.tipo === 'alerta' || accion.tipo === 'deadline')) {
      var banner = document.createElement('div');
      var nivelClase = accion.color === '#D32F2F' ? 'critico'
        : accion.color === '#F57C00' ? 'alto' : 'medio';
      banner.className = 'card-banner card-banner-' + nivelClase;
      banner.innerHTML = '&#9888; ' + this._escapar(accion.texto);
      el.appendChild(banner);
    }

    var body = document.createElement('div');
    body.className = 'card-body';

    // Checkbox
    var checkDiv = document.createElement('div');
    checkDiv.className = 'card-checkbox';
    var check = document.createElement('input');
    check.type = 'checkbox';
    check.addEventListener('click', function(e) { e.stopPropagation(); });
    checkDiv.appendChild(check);
    body.appendChild(checkDiv);

    // Info
    var info = document.createElement('div');
    info.className = 'card-info';

    // Linea 1: codCar + fase + estado
    var titulo = document.createElement('div');
    titulo.className = 'card-titulo';
    titulo.innerHTML = '<span class="card-codcar">' + (carga.codCar || 'Sin cod.') + '</span>'
      + this._chipFaseHTML(carga.fase)
      + this._chipEstadoHTML(carga.estado)
      + '<span class="card-tiempo">' + this._tiempoRelativo(carga.fechaCorreo) + '</span>';
    info.appendChild(titulo);

    // Linea 2: transportista
    if (carga.nombreTransportista) {
      var trans = document.createElement('div');
      trans.className = 'card-transportista';
      trans.textContent = carga.nombreTransportista;
      info.appendChild(trans);
    }

    // Linea 3: asunto
    if (carga.asunto) {
      var asunto = document.createElement('div');
      asunto.className = 'card-asunto';
      asunto.textContent = carga.asunto;
      info.appendChild(asunto);
    }

    // Linea 4: preview ultimo mensaje
    var ultimoMsg = this._obtenerUltimoMensaje(carga, registros || []);
    if (ultimoMsg) {
      var preview = document.createElement('div');
      preview.className = 'card-preview';
      preview.textContent = ultimoMsg;
      info.appendChild(preview);
    }

    body.appendChild(info);

    // Menu
    var menu = document.createElement('button');
    menu.className = 'card-menu';
    menu.textContent = '\u22EE';
    menu.addEventListener('click', function(e) { e.stopPropagation(); });
    body.appendChild(menu);

    el.appendChild(body);

    el.addEventListener('click', function() {
      if (typeof App !== 'undefined') App.navegar('detalle/' + carga.codCar);
    });

    return el;
  },

  _chipFaseHTML: function(fase) {
    var cl = this._claseFase(fase);
    var nombre = this._nombreFaseCorto(fase);
    return '<span class="chip-fase chip-fase-' + cl + '">' + nombre + '</span>';
  },

  _chipEstadoHTML: function(estado) {
    if (!estado) return '';
    var est = typeof getDefaultEstados === 'function'
      ? obtenerEstadoPorCodigo(getDefaultEstados(), estado) : null;
    var icono = est ? est.icono : '';
    return '<span class="chip-estado">' + icono + '</span>';
  },

  _claseFase: function(fase) {
    var fases = typeof getDefaultFases === 'function' ? getDefaultFases() : [];
    var claseCSS = typeof obtenerClaseCSS === 'function'
      ? obtenerClaseCSS(fases, fase) : '';
    if (claseCSS === 'fase-incidencia') return 'incidencia';
    if (claseCSS === 'fase-ok') return 'ok';
    return 'default';
  },

  _nombreFaseCorto: function(fase) {
    if (!fase) return '--';
    var fases = typeof getDefaultFases === 'function' ? getDefaultFases() : [];
    var f = typeof obtenerFasePorCodigo === 'function'
      ? obtenerFasePorCodigo(fases, fase) : null;
    // Mostrar solo codigo (ej: "19") para ahorrar espacio
    return fase;
  },

  _tiempoRelativo: function(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'min';
    var horas = Math.floor(mins / 60);
    if (horas < 24) return horas + 'h';
    return Math.floor(horas / 24) + 'd';
  },

  _obtenerUltimoMensaje: function(carga, registros) {
    var hiloMsgs = registros.filter(function(r) {
      return r.threadId && r.threadId === carga.threadId;
    }).sort(function(a, b) {
      return new Date(b.fechaCorreo) - new Date(a.fechaCorreo);
    });
    var ultimo = hiloMsgs[0];
    if (!ultimo) return '';
    var texto = ultimo.extracto || ultimo.cuerpoTexto || '';
    return texto.substring(0, 80).replace(/\s+/g, ' ').trim();
  },

  _escapar: function(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
};
