// config.js - Vista configuracion + modo outdoor
'use strict';

var VistaConfig = {
  renderizar: function(contenedor) {
    contenedor.innerHTML = '';

    var header = document.createElement('div');
    header.style.cssText = 'padding:16px;font-size:20px;font-weight:bold';
    header.textContent = 'Configuracion';
    contenedor.appendChild(header);

    var scrollable = document.createElement('div');
    scrollable.className = 'contenido';
    var config = Store.obtenerConfig();

    // URL Backend
    this._campo(scrollable, 'URL Backend GAS', 'text', config.gasUrl, function(val) {
      config.gasUrl = val;
      Store.guardarConfig(config);
      API.configurar(val);
      ToastUI.mostrar('URL guardada', { tipo: 'exito' });
    });

    // Intervalo barrido
    this._campo(scrollable, 'Intervalo barrido (min)', 'number', config.intervaloMinutos, function(val) {
      config.intervaloMinutos = parseInt(val) || 15;
      Store.guardarConfig(config);
    });

    // Rate limit
    this._campo(scrollable, 'Emails por minuto', 'number', config.emailsPorMinuto, function(val) {
      config.emailsPorMinuto = parseInt(val) || 10;
      Store.guardarConfig(config);
    });

    // Modo outdoor
    var outdoorDiv = document.createElement('div');
    outdoorDiv.style.cssText = 'padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E0E0E0';
    outdoorDiv.innerHTML = '<span style="font-weight:bold">Modo outdoor</span>';

    var toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = document.body.classList.contains('outdoor');
    toggle.style.cssText = 'width:48px;height:48px';
    toggle.addEventListener('change', function() {
      document.body.classList.toggle('outdoor', toggle.checked);
      localStorage.setItem('tarealog_outdoor', toggle.checked ? '1' : '0');
      Feedback.vibrar('corto');
      ToastUI.mostrar(toggle.checked ? 'Modo outdoor activado' : 'Modo outdoor desactivado', { tipo: 'info' });
    });
    outdoorDiv.appendChild(toggle);
    scrollable.appendChild(outdoorDiv);

    // Pie comun
    var pieDiv = document.createElement('div');
    pieDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    pieDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px">Firma (pie comun)</div>';
    var pieInput = document.createElement('textarea');
    pieInput.style.cssText = 'width:100%;min-height:80px;font-size:16px;padding:8px;border:1px solid #CCC;border-radius:4px';
    pieInput.value = Store.obtenerPieComun();
    pieDiv.appendChild(pieInput);

    var btnPie = document.createElement('button');
    btnPie.className = 'btn btn-primary mt-8';
    btnPie.textContent = 'Guardar firma';
    btnPie.addEventListener('click', function() {
      Store.guardarPieComun(pieInput.value);
      Feedback.vibrar('corto');
      ToastUI.mostrar('Firma guardada', { tipo: 'exito' });
    });
    pieDiv.appendChild(btnPie);
    scrollable.appendChild(pieDiv);

    // Info version
    var info = document.createElement('div');
    info.style.cssText = 'padding:16px;color:var(--text-secondary);font-size:14px;text-align:center';
    info.textContent = 'TareaLog Movil v0.4.0 — TRAYLESA';
    scrollable.appendChild(info);

    contenedor.appendChild(scrollable);
  },

  _campo: function(padre, label, tipo, valor, onChange) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    div.innerHTML = '<div style="font-weight:bold;margin-bottom:8px">' + label + '</div>';

    var input = document.createElement('input');
    input.type = tipo;
    input.value = valor || '';
    input.style.cssText = 'width:100%;font-size:16px;padding:8px;border:1px solid #CCC;border-radius:4px;min-height:40px';
    input.addEventListener('change', function() { onChange(input.value); });
    div.appendChild(input);
    padre.appendChild(div);
  }
};
