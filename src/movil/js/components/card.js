// card.js - Componente card de carga
'use strict';

var CardUI = {
  crear: function(carga, alertas, config) {
    var el = document.createElement('div');
    el.className = 'card';
    el.dataset.codcar = carga.codCar || '';
    el.dataset.threadid = carga.threadId || '';

    if (carga.estado === 'GESTIONADO') el.classList.add('gestionada');

    // Resolver accion requerida
    var accion = typeof resolverAccion === 'function'
      ? resolverAccion(carga, alertas || [], config || {})
      : null;

    // Banner accion requerida
    if (accion && (accion.tipo === 'alerta' || accion.tipo === 'deadline')) {
      var banner = document.createElement('div');
      var nivelClase = accion.color === '#D32F2F' ? 'critico'
        : accion.color === '#F57C00' ? 'alto' : 'medio';
      banner.className = 'card-banner card-banner-' + nivelClase;
      banner.innerHTML = '&#9888; ACCION REQUERIDA: ' + this._escapar(accion.texto);
      el.appendChild(banner);
    }

    // Cuerpo
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

    // Linea 1: codCar + transportista
    var titulo = document.createElement('div');
    titulo.className = 'card-titulo';
    titulo.innerHTML = '<span class="card-codcar">' + (carga.codCar || 'Sin cod.') + '</span>'
      + '<span class="card-transportista">' + this._escapar(carga.nombreTransportista || '') + '</span>';
    info.appendChild(titulo);

    // Linea 2: chip fase + tiempo
    var estado = document.createElement('div');
    estado.className = 'card-estado';

    var chipFase = document.createElement('span');
    var clFase = this._claseFase(carga.fase);
    chipFase.className = 'chip-fase chip-fase-' + clFase;
    chipFase.textContent = this._nombreFase(carga.fase);
    estado.appendChild(chipFase);

    if (carga.fechaCorreo) {
      var tiempo = document.createElement('span');
      tiempo.className = 'card-tiempo';
      tiempo.textContent = this._tiempoRelativo(carga.fechaCorreo);
      estado.appendChild(tiempo);
    }
    info.appendChild(estado);

    // Linea 3: indicadores
    var indicadores = document.createElement('div');
    indicadores.className = 'card-indicadores';
    if (carga.mensajesEnHilo > 1) {
      indicadores.innerHTML += '<span>\u2709 ' + carga.mensajesEnHilo + ' msgs</span>';
    }
    info.appendChild(indicadores);

    body.appendChild(info);

    // Menu
    var menu = document.createElement('button');
    menu.className = 'card-menu';
    menu.textContent = '\u22EE';
    menu.addEventListener('click', function(e) { e.stopPropagation(); });
    body.appendChild(menu);

    el.appendChild(body);

    // Click para ir a detalle
    el.addEventListener('click', function() {
      if (typeof App !== 'undefined') App.navegar('detalle/' + carga.codCar);
    });

    return el;
  },

  _claseFase: function(fase) {
    if (fase === '05' || fase === '25') return 'incidencia';
    if (fase === '19' || fase === '30') return 'ok';
    return 'default';
  },

  _nombreFase: function(fase) {
    var nombres = {
      '00': '00 Espera', '01': '01 Esp.Carga', '02': '02 Esp.Desc.',
      '05': '05 Incidencia', '11': '11 En Carga', '12': '12 Cargando',
      '19': '19 Cargado', '21': '21 En Desc.', '22': '22 Descargando',
      '25': '25 Incidencia', '29': '29 Vacio', '30': '30 Documentado'
    };
    return nombres[fase] || fase || '--';
  },

  _tiempoRelativo: function(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'min';
    var horas = Math.floor(mins / 60);
    if (horas < 24) return horas + 'h';
    return Math.floor(horas / 24) + 'd';
  },

  _escapar: function(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
};
