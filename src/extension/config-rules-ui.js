// config-rules-ui.js — UI para gestion de reglas de acciones en tab Config
// Depende de: action-rules.js (TIPOS_ACCION_REGLA, NOMBRES_ACCION_REGLA, crearRegla, editarRegla,
//   eliminarRegla, duplicarRegla, validarRegla, generarReglasDefault)
// Depende de globals: fasesEditando, estadosEditando (de config-ui.js)

var reglasEditando = [];
var reglaEditandoIdx = null;

function renderListaReglasConfig() {
  var container = document.getElementById('lista-reglas-config');
  if (!container) return;
  container.innerHTML = '';

  if (!reglasEditando || reglasEditando.length === 0) {
    container.innerHTML = '<div style="color:#999;font-size:12px;padding:8px">Sin reglas configuradas</div>';
    return;
  }

  var ordenadas = reglasEditando.slice().sort(function(a, b) { return a.orden - b.orden; });

  ordenadas.forEach(function(regla) {
    var idx = reglasEditando.indexOf(regla);
    var item = document.createElement('div');
    item.className = 'fase-item';

    var badges = '';
    if (regla.origen === 'sistema') badges += '<span class="badge-clase">sistema</span>';
    if (!regla.activa) badges += '<span class="badge-inactiva">inactiva</span>';

    var desc = _descripcionRegla(regla);

    item.innerHTML =
      '<span class="fase-codigo" style="min-width:30px">' + regla.orden + '</span>' +
      '<span class="fase-nombre" title="' + desc + '">' + regla.nombre + '</span>' +
      badges +
      '<label style="margin:0 4px;font-size:11px;cursor:pointer"><input type="checkbox" class="regla-toggle" data-idx="' + idx + '"' +
        (regla.activa ? ' checked' : '') + '> on</label>' +
      '<button class="btn-icon" data-action="editar" title="Editar">&#9998;</button>' +
      '<button class="btn-icon" data-action="duplicar" title="Duplicar">&#10697;</button>' +
      (regla.origen !== 'sistema'
        ? '<button class="btn-icon btn-danger" data-action="eliminar" title="Eliminar">&#10005;</button>'
        : '');

    // Toggle activa/inactiva
    var toggle = item.querySelector('.regla-toggle');
    toggle.addEventListener('change', function() {
      reglasEditando[idx] = editarRegla(reglasEditando[idx], { activa: this.checked });
      renderListaReglasConfig();
    });

    item.querySelectorAll('.btn-icon').forEach(function(btn) {
      btn.addEventListener('click', function() { accionRegla(btn.dataset.action, idx); });
    });

    container.appendChild(item);
  });
}

function _descripcionRegla(regla) {
  var cond = regla.condicion;
  var valorDesc = cond.valor === '*' ? 'cualquiera' : cond.valor;
  var texto = 'Cuando ' + cond.campo + ' = ' + valorDesc;
  if (cond.faseOrigen) texto += ' (desde ' + cond.faseOrigen + ')';
  texto += ' → ' + regla.acciones.map(function(a) {
    return NOMBRES_ACCION_REGLA[a.tipo] || a.tipo;
  }).join(', ');
  return texto;
}

function accionRegla(accion, idx) {
  if (accion === 'editar') {
    abrirModalRegla(idx);
  } else if (accion === 'duplicar') {
    var copia = duplicarRegla(reglasEditando[idx]);
    reglasEditando.push(copia);
    renderListaReglasConfig();
  } else if (accion === 'eliminar') {
    reglasEditando.splice(idx, 1);
    renderListaReglasConfig();
  }
}

function abrirModalRegla(idx) {
  reglaEditandoIdx = idx;
  var modal = document.getElementById('modal-regla');
  var titulo = document.getElementById('modal-regla-titulo');
  var errorEl = document.getElementById('modal-regla-error');
  errorEl.classList.add('hidden');

  _poblarSelectValores();

  if (idx !== null && idx >= 0) {
    titulo.textContent = 'Editar Regla';
    var regla = reglasEditando[idx];
    document.getElementById('regla-nombre').value = regla.nombre;
    document.getElementById('regla-activa').checked = regla.activa;
    document.getElementById('regla-campo').value = regla.condicion.campo;
    _poblarSelectValores();
    document.getElementById('regla-valor').value = regla.condicion.valor;
    document.getElementById('regla-fase-origen').value = regla.condicion.faseOrigen || '';
    document.getElementById('regla-orden').value = regla.orden;
    _renderAccionesRegla(regla.acciones);
  } else {
    titulo.textContent = 'Nueva Regla';
    document.getElementById('regla-nombre').value = '';
    document.getElementById('regla-activa').checked = true;
    document.getElementById('regla-campo').value = 'fase';
    document.getElementById('regla-valor').value = '*';
    document.getElementById('regla-fase-origen').value = '';
    var maxOrden = reglasEditando.reduce(function(m, r) { return Math.max(m, r.orden); }, 0);
    document.getElementById('regla-orden').value = maxOrden + 10;
    _renderAccionesRegla([{ tipo: 'MOSTRAR_AVISO', params: { mensaje: '' } }]);
  }

  modal.classList.remove('hidden');
}

function cerrarModalRegla() {
  document.getElementById('modal-regla').classList.add('hidden');
  reglaEditandoIdx = null;
}

function _poblarSelectValores() {
  var campoSel = document.getElementById('regla-campo').value;
  var valorSel = document.getElementById('regla-valor');
  var origenSel = document.getElementById('regla-fase-origen');

  valorSel.innerHTML = '<option value="*">Cualquiera (*)</option>';
  origenSel.innerHTML = '<option value="">(cualquiera)</option>';

  var opciones = [];
  if (campoSel === 'fase' && typeof fasesEditando !== 'undefined') {
    opciones = fasesEditando.filter(function(f) { return f.activa; })
      .map(function(f) { return { cod: f.codigo, nom: f.nombre }; });
  } else if (campoSel === 'estado' && typeof estadosEditando !== 'undefined') {
    opciones = estadosEditando.filter(function(e) { return e.activo; })
      .map(function(e) { return { cod: e.codigo, nom: e.nombre }; });
  }

  opciones.forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.cod;
    opt.textContent = o.cod + ' - ' + o.nom;
    valorSel.appendChild(opt);

    var opt2 = opt.cloneNode(true);
    origenSel.appendChild(opt2);
  });
}

function _renderAccionesRegla(acciones) {
  var container = document.getElementById('regla-acciones-lista');
  container.innerHTML = '';

  acciones.forEach(function(acc, i) {
    var div = document.createElement('div');
    div.className = 'regla-accion-row';
    div.style.cssText = 'display:flex;gap:4px;align-items:center;margin-bottom:4px;flex-wrap:wrap';

    var select = document.createElement('select');
    select.className = 'regla-accion-tipo';
    select.style.cssText = 'flex:0 0 160px';
    Object.keys(TIPOS_ACCION_REGLA).forEach(function(tipo) {
      var opt = document.createElement('option');
      opt.value = tipo;
      opt.textContent = NOMBRES_ACCION_REGLA[tipo];
      select.appendChild(opt);
    });
    select.value = acc.tipo;
    select.addEventListener('change', function() {
      _renderParamsAccion(div, this.value, {});
    });
    div.appendChild(select);

    _renderParamsAccion(div, acc.tipo, acc.params || {});

    if (acciones.length > 1) {
      var btnElim = document.createElement('button');
      btnElim.type = 'button';
      btnElim.className = 'btn-icon btn-danger';
      btnElim.textContent = 'X';
      btnElim.style.cssText = 'font-size:10px;padding:1px 4px';
      btnElim.addEventListener('click', function() { div.remove(); });
      div.appendChild(btnElim);
    }

    container.appendChild(div);
  });
}

function _renderParamsAccion(container, tipo, params) {
  // Limpiar params anteriores
  var existentes = container.querySelectorAll('.regla-param');
  existentes.forEach(function(el) { el.remove(); });

  if (tipo === 'SUGERIR_RECORDATORIO' || tipo === 'CREAR_RECORDATORIO') {
    var inpTexto = document.createElement('input');
    inpTexto.type = 'text';
    inpTexto.className = 'regla-param';
    inpTexto.placeholder = 'Texto recordatorio';
    inpTexto.dataset.param = 'texto';
    inpTexto.value = params.texto || '';
    inpTexto.style.cssText = 'flex:1;min-width:120px';
    container.appendChild(inpTexto);

    var inpHoras = document.createElement('input');
    inpHoras.type = 'number';
    inpHoras.className = 'regla-param';
    inpHoras.placeholder = 'Horas';
    inpHoras.dataset.param = 'horas';
    inpHoras.value = params.horas || 8;
    inpHoras.min = 0.25;
    inpHoras.step = 0.25;
    inpHoras.style.cssText = 'width:60px';
    container.appendChild(inpHoras);
  } else if (tipo === 'CAMBIAR_FASE') {
    var selFase = document.createElement('select');
    selFase.className = 'regla-param';
    selFase.dataset.param = 'fase';
    selFase.style.cssText = 'flex:1';
    if (typeof fasesEditando !== 'undefined') {
      fasesEditando.filter(function(f) { return f.activa; }).forEach(function(f) {
        var opt = document.createElement('option');
        opt.value = f.codigo;
        opt.textContent = f.codigo + ' - ' + f.nombre;
        selFase.appendChild(opt);
      });
    }
    selFase.value = params.fase || '';
    container.appendChild(selFase);
  } else if (tipo === 'CAMBIAR_ESTADO') {
    var selEstado = document.createElement('select');
    selEstado.className = 'regla-param';
    selEstado.dataset.param = 'estado';
    selEstado.style.cssText = 'flex:1';
    if (typeof estadosEditando !== 'undefined') {
      estadosEditando.filter(function(e) { return e.activo; }).forEach(function(e) {
        var opt = document.createElement('option');
        opt.value = e.codigo;
        opt.textContent = e.codigo + ' - ' + e.nombre;
        selEstado.appendChild(opt);
      });
    }
    selEstado.value = params.estado || '';
    container.appendChild(selEstado);
  } else if (tipo === 'MOSTRAR_AVISO') {
    var inpMsg = document.createElement('input');
    inpMsg.type = 'text';
    inpMsg.className = 'regla-param';
    inpMsg.placeholder = 'Mensaje del aviso';
    inpMsg.dataset.param = 'mensaje';
    inpMsg.value = params.mensaje || '';
    inpMsg.style.cssText = 'flex:1;min-width:150px';
    container.appendChild(inpMsg);
  } else if (tipo === 'PRESELECCIONAR_PLANTILLA') {
    var inpPlant = document.createElement('input');
    inpPlant.type = 'text';
    inpPlant.className = 'regla-param';
    inpPlant.placeholder = 'Nombre plantilla';
    inpPlant.dataset.param = 'nombrePlantilla';
    inpPlant.value = params.nombrePlantilla || '';
    inpPlant.style.cssText = 'flex:1;min-width:150px';
    container.appendChild(inpPlant);
  } else if (tipo === 'INICIAR_SECUENCIA') {
    var inpSeq = document.createElement('input');
    inpSeq.type = 'text';
    inpSeq.className = 'regla-param';
    inpSeq.placeholder = 'Nombre secuencia';
    inpSeq.dataset.param = 'nombreSecuencia';
    inpSeq.value = params.nombreSecuencia || '';
    inpSeq.style.cssText = 'flex:1;min-width:150px';
    container.appendChild(inpSeq);
  }
}

function _agregarAccionRegla() {
  var container = document.getElementById('regla-acciones-lista');
  var div = document.createElement('div');
  div.className = 'regla-accion-row';
  div.style.cssText = 'display:flex;gap:4px;align-items:center;margin-bottom:4px;flex-wrap:wrap';

  var select = document.createElement('select');
  select.className = 'regla-accion-tipo';
  select.style.cssText = 'flex:0 0 160px';
  Object.keys(TIPOS_ACCION_REGLA).forEach(function(tipo) {
    var opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = NOMBRES_ACCION_REGLA[tipo];
    select.appendChild(opt);
  });
  select.value = 'MOSTRAR_AVISO';
  select.addEventListener('change', function() {
    _renderParamsAccion(div, this.value, {});
  });
  div.appendChild(select);
  _renderParamsAccion(div, 'MOSTRAR_AVISO', {});

  var btnElim = document.createElement('button');
  btnElim.type = 'button';
  btnElim.className = 'btn-icon btn-danger';
  btnElim.textContent = 'X';
  btnElim.style.cssText = 'font-size:10px;padding:1px 4px';
  btnElim.addEventListener('click', function() { div.remove(); });
  div.appendChild(btnElim);

  container.appendChild(div);
}

function guardarReglaDesdeModal() {
  var nombre = document.getElementById('regla-nombre').value.trim();
  var activa = document.getElementById('regla-activa').checked;
  var campo = document.getElementById('regla-campo').value;
  var valor = document.getElementById('regla-valor').value;
  var faseOrigen = document.getElementById('regla-fase-origen').value || null;
  var orden = parseInt(document.getElementById('regla-orden').value, 10) || 100;

  // Leer acciones del DOM
  var filas = document.querySelectorAll('#regla-acciones-lista .regla-accion-row');
  var acciones = [];
  filas.forEach(function(fila) {
    var tipo = fila.querySelector('.regla-accion-tipo').value;
    var params = {};
    fila.querySelectorAll('.regla-param').forEach(function(inp) {
      var key = inp.dataset.param;
      var val = inp.value;
      if (inp.type === 'number') val = parseFloat(val);
      params[key] = val;
    });
    acciones.push({ tipo: tipo, params: params });
  });

  var regla = {
    id: (reglaEditandoIdx !== null && reglaEditandoIdx >= 0)
      ? reglasEditando[reglaEditandoIdx].id : _generarIdRegla(),
    nombre: nombre,
    activa: activa,
    condicion: { campo: campo, valor: valor, faseOrigen: faseOrigen },
    acciones: acciones,
    orden: orden,
    origen: (reglaEditandoIdx !== null && reglaEditandoIdx >= 0)
      ? reglasEditando[reglaEditandoIdx].origen : 'usuario'
  };

  var res = validarRegla(regla);
  if (!res.valido) {
    var errorEl = document.getElementById('modal-regla-error');
    errorEl.textContent = res.errores.join(', ');
    errorEl.classList.remove('hidden');
    return;
  }

  if (reglaEditandoIdx !== null && reglaEditandoIdx >= 0) {
    reglasEditando[reglaEditandoIdx] = regla;
  } else {
    reglasEditando.push(regla);
  }

  cerrarModalRegla();
  renderListaReglasConfig();
}

function restaurarReglasDefault() {
  // Conservar reglas de usuario, regenerar solo las de sistema
  var reglasUsuario = reglasEditando.filter(function(r) { return r.origen !== 'sistema'; });
  var defaults = generarReglasDefault();
  reglasEditando = defaults.concat(reglasUsuario);
  renderListaReglasConfig();
}

// _generarIdRegla: usa la de action-rules.js (cargado antes via script tag)
