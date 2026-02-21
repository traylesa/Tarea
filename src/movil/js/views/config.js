// config.js - Vista configuracion completa
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

    // === SECCION: Conexion ===
    this._seccionTitulo(scrollable, 'Conexion al backend');

    // URL Backend GAS
    this._campo(scrollable, 'URL Backend GAS', 'text', config.gasUrl, function(val) {
      config.gasUrl = val;
      Store.guardarConfig(config);
      API.configurar(val);
      ToastUI.mostrar('URL guardada', { tipo: 'exito' });
    }, 'https://script.google.com/macros/s/.../exec');

    // Test de conexion
    var testDiv = document.createElement('div');
    testDiv.style.cssText = 'padding:0 16px 16px';

    var btnTest = document.createElement('button');
    btnTest.className = 'btn btn-primary';
    btnTest.style.width = '100%';
    btnTest.textContent = 'Verificar conexion';
    btnTest.addEventListener('click', function() { VistaConfig._testConexion(testDiv); });
    testDiv.appendChild(btnTest);
    scrollable.appendChild(testDiv);

    // === SECCION: Hoja de calculo ===
    this._seccionTitulo(scrollable, 'Hoja de calculo (Spreadsheet)');

    // Spreadsheet ID
    var ssDiv = document.createElement('div');
    ssDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    ssDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">Spreadsheet ID</div>'
      + '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">'
      + 'El ID esta en la URL de Google Sheets: docs.google.com/spreadsheets/d/<b>ESTE_ES_EL_ID</b>/edit</div>';

    var ssInput = document.createElement('input');
    ssInput.type = 'text';
    ssInput.placeholder = 'Pega el ID de tu spreadsheet';
    ssInput.style.cssText = 'width:100%;font-size:14px;padding:8px;border:1px solid #CCC;border-radius:4px;min-height:40px;margin-bottom:8px';
    ssInput.value = config.spreadsheetId || '';
    ssDiv.appendChild(ssInput);

    var ssStatus = document.createElement('div');
    ssStatus.id = 'ss-status';
    ssStatus.style.cssText = 'font-size:13px;margin-bottom:8px';
    ssDiv.appendChild(ssStatus);

    var btnSS = document.createElement('button');
    btnSS.className = 'btn btn-primary';
    btnSS.style.width = '100%';
    btnSS.textContent = 'Configurar Spreadsheet';
    btnSS.addEventListener('click', function() {
      VistaConfig._configurarSpreadsheet(ssInput.value.trim(), ssStatus);
    });
    ssDiv.appendChild(btnSS);
    scrollable.appendChild(ssDiv);

    // === SECCION: Gmail ===
    this._seccionTitulo(scrollable, 'Busqueda Gmail');

    var queryDiv = document.createElement('div');
    queryDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    queryDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">Gmail Query</div>'
      + '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">'
      + 'Filtro para buscar emails. Default: (in:inbox OR in:sent) newer_than:7d</div>';

    var queryInput = document.createElement('input');
    queryInput.type = 'text';
    queryInput.placeholder = '(in:inbox OR in:sent) newer_than:7d';
    queryInput.style.cssText = 'width:100%;font-size:14px;padding:8px;border:1px solid #CCC;border-radius:4px;min-height:40px;margin-bottom:8px';
    queryInput.value = config.gmailQuery || '';
    queryDiv.appendChild(queryInput);

    var queryStatus = document.createElement('div');
    queryStatus.id = 'query-status';
    queryStatus.style.cssText = 'font-size:13px;margin-bottom:8px';
    queryDiv.appendChild(queryStatus);

    var btnQuery = document.createElement('button');
    btnQuery.className = 'btn btn-outline';
    btnQuery.style.width = '100%';
    btnQuery.textContent = 'Guardar Gmail Query';
    btnQuery.addEventListener('click', function() {
      VistaConfig._configurarGmailQuery(queryInput.value.trim(), queryStatus);
    });
    queryDiv.appendChild(btnQuery);
    scrollable.appendChild(queryDiv);

    // === SECCION: Operacion ===
    this._seccionTitulo(scrollable, 'Operacion');

    // Rate limit
    this._campo(scrollable, 'Emails por minuto (rate limit)', 'number', config.emailsPorMinuto, function(val) {
      config.emailsPorMinuto = parseInt(val) || 10;
      Store.guardarConfig(config);
      ToastUI.mostrar('Rate limit guardado', { tipo: 'exito' });
    });

    // Estado inicial
    var eiDiv = document.createElement('div');
    eiDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    eiDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">Estado inicial de emails</div>'
      + '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">'
      + 'Estado que se asigna a correos nuevos al procesarlos</div>';

    var eiSelect = document.createElement('select');
    eiSelect.style.cssText = 'width:100%;font-size:16px;min-height:48px;padding:8px;border:1px solid #CCC;border-radius:4px';
    var estados = typeof getDefaultEstados === 'function' ? getDefaultEstados() : [];
    estados.forEach(function(e) {
      var opt = document.createElement('option');
      opt.value = e.codigo;
      opt.textContent = (e.icono || '') + ' ' + e.nombre;
      if (e.codigo === (config.estadoInicial || 'NUEVO')) opt.selected = true;
      eiSelect.appendChild(opt);
    });
    if (estados.length === 0) {
      eiSelect.innerHTML = '<option value="NUEVO">NUEVO</option><option value="RECIBIDO">RECIBIDO</option>';
      eiSelect.value = config.estadoInicial || 'NUEVO';
    }
    eiSelect.addEventListener('change', function() {
      config.estadoInicial = eiSelect.value;
      Store.guardarConfig(config);
      API.post('configurarEstadoInicial', { estadoInicial: eiSelect.value })
        .then(function() {
          Feedback.vibrar('corto');
          ToastUI.mostrar('Estado inicial: ' + eiSelect.value, { tipo: 'exito' });
        })
        .catch(function(e) {
          ToastUI.mostrar('Error GAS: ' + e.message, { tipo: 'error' });
        });
    });
    eiDiv.appendChild(eiSelect);
    scrollable.appendChild(eiDiv);

    // Modo outdoor
    var outdoorDiv = document.createElement('div');
    outdoorDiv.style.cssText = 'padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E0E0E0';
    outdoorDiv.innerHTML = '<span style="font-weight:bold">Modo outdoor (alto contraste)</span>';

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

    // === SECCION: Firma y plantillas ===
    this._seccionTitulo(scrollable, 'Firma y plantillas');

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

    // Export/Import plantillas
    var plantillasDiv = document.createElement('div');
    plantillasDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    var nPlantillas = Store.obtenerPlantillas().length;
    plantillasDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px">Plantillas (' + nPlantillas + ' cargadas)</div>';

    var btnExport = document.createElement('button');
    btnExport.className = 'btn btn-outline';
    btnExport.style.cssText = 'width:100%;margin-bottom:8px';
    btnExport.textContent = 'Exportar plantillas';
    btnExport.addEventListener('click', function() {
      var plantillas = Store.obtenerPlantillas();
      var datos = JSON.stringify({ plantillas: plantillas, pie: Store.obtenerPieComun() }, null, 2);
      var blob = new Blob([datos], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'tarealog_plantillas.json';
      a.click();
      URL.revokeObjectURL(url);
      ToastUI.mostrar('Plantillas exportadas', { tipo: 'exito' });
    });
    plantillasDiv.appendChild(btnExport);

    var btnImport = document.createElement('button');
    btnImport.className = 'btn btn-outline';
    btnImport.style.width = '100%';
    btnImport.textContent = 'Importar plantillas';
    btnImport.addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', function() {
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var datos = JSON.parse(e.target.result);
            if (datos.plantillas) {
              Store.guardarPlantillas(datos.plantillas);
              if (datos.pie) Store.guardarPieComun(datos.pie);
              Feedback.vibrar('corto');
              ToastUI.mostrar(datos.plantillas.length + ' plantillas importadas', { tipo: 'exito' });
              App.renderizar();
            }
          } catch (err) {
            ToastUI.mostrar('Archivo invalido', { tipo: 'error' });
          }
        };
        reader.readAsText(input.files[0]);
      });
      input.click();
    });
    plantillasDiv.appendChild(btnImport);
    scrollable.appendChild(plantillasDiv);

    // === SECCION: Info sistema ===
    this._seccionTitulo(scrollable, 'Sistema');

    // Info trigger
    var triggerDiv = document.createElement('div');
    triggerDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    triggerDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px">Trigger barrido automatico</div>'
      + '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">'
      + 'El trigger se configura UNA VEZ desde el editor de Google Apps Script:</div>'
      + '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">'
      + '1. Abre <b>script.google.com</b> > tu proyecto TareaLog</div>'
      + '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">'
      + '2. Selecciona funcion <b>crearTrigger</b> > Run</div>'
      + '<div style="font-size:13px;color:var(--text-secondary)">'
      + '3. Esto activa barrido cada 5 min + cola de envios programados</div>';
    scrollable.appendChild(triggerDiv);

    // Ultimo barrido
    var ultimoBarrido = Store.obtenerUltimoBarrido();
    var barridoDiv = document.createElement('div');
    barridoDiv.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    barridoDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">Ultimo barrido</div>'
      + '<div style="font-size:14px;color:var(--text-secondary)">'
      + (ultimoBarrido ? new Date(ultimoBarrido).toLocaleString('es-ES') : 'Nunca (haz pull-to-refresh en Todo)')
      + '</div>';
    scrollable.appendChild(barridoDiv);

    // Version
    var info = document.createElement('div');
    info.style.cssText = 'padding:16px;color:var(--text-secondary);font-size:14px;text-align:center';
    info.textContent = 'TareaLog Movil v0.4.0 — TRAYLESA';
    scrollable.appendChild(info);

    contenedor.appendChild(scrollable);
  },

  _seccionTitulo: function(padre, texto) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:12px 16px 4px;font-size:13px;font-weight:bold;color:var(--color-primary);text-transform:uppercase;letter-spacing:1px';
    div.textContent = texto;
    padre.appendChild(div);
  },

  _campo: function(padre, label, tipo, valor, onChange, placeholder) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:16px;border-bottom:1px solid #E0E0E0';
    div.innerHTML = '<div style="font-weight:bold;margin-bottom:8px">' + label + '</div>';

    var input = document.createElement('input');
    input.type = tipo;
    input.value = valor || '';
    input.placeholder = placeholder || '';
    input.style.cssText = 'width:100%;font-size:16px;padding:8px;border:1px solid #CCC;border-radius:4px;min-height:40px';
    input.addEventListener('change', function() { onChange(input.value); });
    div.appendChild(input);
    padre.appendChild(div);
  },

  _testConexion: async function(contenedor) {
    var statusEl = contenedor.querySelector('.test-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'test-status';
      statusEl.style.cssText = 'margin-top:8px;padding:12px;border-radius:4px;font-size:14px';
      contenedor.appendChild(statusEl);
    }

    statusEl.style.background = 'var(--bg-secondary)';
    statusEl.style.color = 'var(--text-secondary)';
    statusEl.textContent = 'Verificando...';

    try {
      var data = await API.get('obtenerConfig');
      var lineas = [];
      lineas.push('Conexion OK');
      if (data.spreadsheetNombre) lineas.push('Hoja: ' + data.spreadsheetNombre);
      if (data.spreadsheetId) lineas.push('ID: ' + data.spreadsheetId.substring(0, 20) + '...');
      if (data.gmailQuery) lineas.push('Query: ' + data.gmailQuery);

      statusEl.style.background = '#E8F5E9';
      statusEl.style.color = 'var(--color-ok)';
      statusEl.innerHTML = lineas.join('<br>');

      // Guardar en config local para referencia
      var config = Store.obtenerConfig();
      if (data.spreadsheetId) config.spreadsheetId = data.spreadsheetId;
      if (data.gmailQuery) config.gmailQuery = data.gmailQuery;
      Store.guardarConfig(config);

      Feedback.vibrar('corto');

      // Cargar datos automaticamente tras conexion exitosa
      statusEl.innerHTML += '<br>Cargando datos...';
      try {
        var regData = await API.get('getRegistros');
        if (regData.registros) {
          Store.guardarRegistros(regData.registros);
          if (typeof evaluarAlertas === 'function') {
            Store.guardarAlertas(evaluarAlertas(regData.registros, Store.obtenerConfig()));
          }
          Store.guardarUltimoBarrido(new Date().toISOString());
          statusEl.innerHTML += '<br><b>' + regData.registros.length + ' registros cargados</b>';
        }
      } catch (loadErr) {
        statusEl.innerHTML += '<br>Datos: ' + loadErr.message;
      }
    } catch (e) {
      statusEl.style.background = '#FFEBEE';
      statusEl.style.color = 'var(--color-danger)';
      statusEl.textContent = 'Error: ' + e.message;
      Feedback.vibrar('error');
    }
  },

  _configurarSpreadsheet: async function(id, statusEl) {
    if (!id) {
      statusEl.style.color = 'var(--color-danger)';
      statusEl.textContent = 'Pega el ID del spreadsheet';
      return;
    }

    statusEl.style.color = 'var(--text-secondary)';
    statusEl.textContent = 'Verificando...';

    try {
      var data = await API.post('configurarSpreadsheet', { spreadsheetId: id });
      statusEl.style.color = 'var(--color-ok)';
      statusEl.textContent = 'Conectado: ' + (data.nombre || 'OK');

      var config = Store.obtenerConfig();
      config.spreadsheetId = id;
      Store.guardarConfig(config);

      Feedback.vibrar('corto');
      ToastUI.mostrar('Spreadsheet configurado', { tipo: 'exito' });
    } catch (e) {
      statusEl.style.color = 'var(--color-danger)';
      statusEl.textContent = 'Error: ' + e.message;
      Feedback.vibrar('error');
    }
  },

  _configurarGmailQuery: async function(query, statusEl) {
    if (!query) {
      statusEl.style.color = 'var(--color-danger)';
      statusEl.textContent = 'Escribe una query Gmail';
      return;
    }

    statusEl.style.color = 'var(--text-secondary)';
    statusEl.textContent = 'Validando query...';

    try {
      var data = await API.post('configurarGmailQuery', { gmailQuery: query });
      statusEl.style.color = 'var(--color-ok)';
      statusEl.textContent = 'Query guardada: ' + (data.gmailQuery || query);

      var config = Store.obtenerConfig();
      config.gmailQuery = query;
      Store.guardarConfig(config);

      Feedback.vibrar('corto');
      ToastUI.mostrar('Gmail query configurada', { tipo: 'exito' });
    } catch (e) {
      statusEl.style.color = 'var(--color-danger)';
      statusEl.textContent = 'Error: ' + e.message;
      Feedback.vibrar('error');
    }
  }
};
