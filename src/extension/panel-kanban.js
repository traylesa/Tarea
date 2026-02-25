// panel-kanban.js — Controlador DOM del tablero Kanban
// Depende de globals: registros, configActual, almacenNotas, recordatoriosCache, programadosCache
// Depende de: kanban.js (logica pura), Sortable (libreria)

var _sortableInstances = [];
var _kanbanMostrarEspera = true;
var _kanbanMostrarVacio = true;
var _kanbanMostrarDocumentado = false;
var _kanbanMostrarNada = true;
var _kanbanMostrarCerrado = true;
var _kanbanEstadosActivo = true;
var _kanbanColumnasColapsadas = {};

function _cargarPrefsKanban(cb) {
  chrome.storage.local.get('tarealog_kanban_prefs', function(data) {
    var prefs = data.tarealog_kanban_prefs || {};
    _kanbanColumnasColapsadas = prefs.colapsadas || {};
    if (cb) cb();
  });
}

function _guardarPrefsKanban() {
  chrome.storage.local.set({
    tarealog_kanban_prefs: { colapsadas: _kanbanColumnasColapsadas }
  });
}

function _filtrarParaKanban(regs) {
  var resultado = regs;

  // 1. Filtro global
  if (typeof filtroGlobalActivo !== 'undefined' && filtroGlobalActivo && typeof filtroGlobalFn === 'function') {
    resultado = resultado.filter(filtroGlobalFn);
  }

  // 2. Fases
  if (typeof fasesCardActivas !== 'undefined' && fasesCardActivas !== null) {
    var fnF = filtroFases(fasesCardActivas);
    resultado = resultado.filter(function(r) { return fnF(r.fase); });
  }

  // 3. Estados
  if (typeof estadosCardActivos !== 'undefined' && estadosCardActivos !== null) {
    var fnE = filtroEstados(estadosCardActivos);
    resultado = resultado.filter(function(r) { return fnE(r.estado); });
  }

  // 3b. Ocultar estados NADA/CERRADO (checks kanban independientes)
  if (!_kanbanMostrarNada) {
    resultado = resultado.filter(function(r) { return r.estado !== 'NADA'; });
  }
  if (!_kanbanMostrarCerrado) {
    resultado = resultado.filter(function(r) { return r.estado !== 'CERRADO'; });
  }

  // 4. Correo
  if (typeof filtroCorreoActivo !== 'undefined' && filtroCorreoActivo) {
    var elDesde = document.getElementById('filtro-correo-desde');
    var elHasta = document.getElementById('filtro-correo-hasta');
    var elSinFecha = document.getElementById('chk-correo-sin-fecha');
    if (elDesde && elHasta) {
      var fnCorreo = filtroRangoFechas(elDesde.value, elHasta.value, elSinFecha && elSinFecha.checked);
      resultado = resultado.filter(function(r) { return fnCorreo(r.fechaCorreo); });
    }
  }

  // 5. Carga
  if (typeof filtroCargaActivo !== 'undefined' && filtroCargaActivo) {
    var cDesde = document.getElementById('filtro-carga-desde');
    var cHasta = document.getElementById('filtro-carga-hasta');
    var cSinFecha = document.getElementById('chk-carga-sin-fecha');
    if (cDesde && cHasta) {
      var fnCarga = filtroRangoFechas(cDesde.value, cHasta.value, cSinFecha && cSinFecha.checked);
      resultado = resultado.filter(function(r) { return fnCarga(r.fCarga); });
    }
  }

  // 6. Descarga
  if (typeof filtroDescargaActivo !== 'undefined' && filtroDescargaActivo) {
    var dDesde = document.getElementById('filtro-descarga-desde');
    var dHasta = document.getElementById('filtro-descarga-hasta');
    var dSinFecha = document.getElementById('chk-descarga-sin-fecha');
    if (dDesde && dHasta) {
      var fnDescarga = filtroRangoFechas(dDesde.value, dHasta.value, dSinFecha && dSinFecha.checked);
      resultado = resultado.filter(function(r) { return fnDescarga(r.fEntrega); });
    }
  }

  // 7. Bateria rapida
  if (typeof filtrosBateriaActivos !== 'undefined' && filtrosBateriaActivos) {
    var bat = obtenerBaterias().find(function(b) { return b.nombre === filtrosBateriaActivos; });
    if (bat) {
      resultado = resultado.filter(function(r) {
        return bat.filtros.every(function(f) {
          if (f.func) return f.func(r);
          return String(r[f.field] || '') === f.value;
        });
      });
    }
  }

  // 8. Personalizados
  var filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  var defs = [];
  filas.forEach(function(fila) {
    var campo = fila.querySelector('.filtro-campo').value;
    var valor = fila.querySelector('.filtro-valor').value;
    if (campo && valor) {
      defs.push({ campo: campo, operador: fila.querySelector('.filtro-operador').value, valor: valor });
    }
  });
  if (defs.length > 0) {
    var filtros = construirFiltros(defs);
    resultado = resultado.filter(function(r) {
      return filtros.every(function(f) {
        if (f.func) return f.func(f.value, r[f.field]);
        var v = String(r[f.field] || '').toLowerCase();
        return v.indexOf(String(f.value).toLowerCase()) !== -1;
      });
    });
  }

  return resultado;
}

function _contarFiltrosDatos() {
  var total = 0;
  if (typeof filtroGlobalActivo !== 'undefined' && filtroGlobalActivo) total++;
  if (typeof fasesCardActivas !== 'undefined' && fasesCardActivas !== null) total++;
  if (typeof estadosCardActivos !== 'undefined' && estadosCardActivos !== null) total++;
  if (typeof filtroCorreoActivo !== 'undefined' && filtroCorreoActivo) total++;
  if (typeof filtroCargaActivo !== 'undefined' && filtroCargaActivo) total++;
  if (typeof filtroDescargaActivo !== 'undefined' && filtroDescargaActivo) total++;
  if (typeof filtrosBateriaActivos !== 'undefined' && filtrosBateriaActivos) total++;
  var filas = document.querySelectorAll('#filtros-personalizados .filtro-fila');
  filas.forEach(function(fila) {
    var campo = fila.querySelector('.filtro-campo');
    var valor = fila.querySelector('.filtro-valor');
    if (campo && valor && campo.value && valor.value) total++;
  });
  return total;
}


function renderKanban() {
  var board = document.getElementById('kanban-board');
  if (!board) return;

  _sortableInstances.forEach(function(s) { s.destroy(); });
  _sortableInstances = [];

  var dedup = deduplicarPorCarga(registros || []);
  var agrupadosTotales = agruparPorColumna(dedup);
  var filtrados = _filtrarParaKanban(dedup);
  var agrupadosFiltrados = agruparPorColumna(filtrados);
  var hayFiltros = _contarFiltrosDatos() > 0;
  var conteosDual = calcularConteosDual(agrupadosFiltrados, agrupadosTotales);

  var estados = (configActual && configActual.estados)
    ? configActual.estados.filter(function(e) { return e.activo !== false; }).map(function(e) { return e.codigo; })
    : ['NUEVO', 'ENVIADO', 'RECIBIDO', 'PENDIENTE', 'GESTIONADO', 'ALERTA', 'CERRADO', 'NADA'];

  board.innerHTML = '';
  var totalFiltrado = 0;
  var totalGeneral = 0;

  COLUMNAS_KANBAN.forEach(function(col) {
    if (col.id === 'espera' && !_kanbanMostrarEspera) return;
    if (col.id === 'vacio' && !_kanbanMostrarVacio) return;
    if (col.id === 'documentado' && !_kanbanMostrarDocumentado) return;

    var regsColumna = agrupadosFiltrados[col.id] || [];
    var conteo = conteosDual[col.id] || { filtrado: 0, total: 0, porEstadoFiltrado: {}, porEstadoTotal: {} };
    totalFiltrado += conteo.filtrado;
    totalGeneral += conteo.total;

    var colapsada = _kanbanColumnasColapsadas[col.id] === true;

    var divCol = document.createElement('div');
    divCol.className = 'kanban-columna' + (colapsada ? ' collapsed' : '');
    divCol.dataset.grupo = col.id;

    var header = document.createElement('div');
    header.className = 'kanban-columna-header';

    var nombreSpan = document.createElement('span');
    nombreSpan.className = 'kanban-columna-nombre';
    nombreSpan.textContent = col.nombre;
    nombreSpan.title = 'Clic para colapsar/expandir';
    nombreSpan.style.cursor = 'pointer';
    nombreSpan.addEventListener('click', function(e) {
      e.stopPropagation();
      _kanbanColumnasColapsadas[col.id] = !_kanbanColumnasColapsadas[col.id];
      _guardarPrefsKanban();
      renderKanban();
    });

    var countSpan = document.createElement('span');
    countSpan.className = 'kanban-columna-count';
    if (conteo.total >= 6) countSpan.classList.add('highlight');
    else if (conteo.total === 0) countSpan.classList.add('empty');
    countSpan.textContent = formatearConteo(conteo.filtrado, conteo.total, hayFiltros);

    header.appendChild(nombreSpan);
    header.appendChild(countSpan);
    divCol.appendChild(header);

    var body = document.createElement('div');
    body.className = 'kanban-columna-body';

    if (colapsada) {
      // Drop-zone visible aunque colapsada (franja 40px via CSS)
      body.className += ' kanban-drop-zone';
      body.dataset.columna = col.id;
    } else if (_kanbanEstadosActivo) {
      var porEstado = agruparPorEstado(regsColumna, estados);
      var porEstadoTotal = agruparPorEstado(agrupadosTotales[col.id] || [], estados);
      estados.forEach(function(est) {
        var regsEst = porEstado[est] || [];
        var regsTotalEst = porEstadoTotal[est] || [];

        var grupoEstado = document.createElement('div');
        grupoEstado.className = 'kanban-estado-grupo';

        var grupoHeader = document.createElement('div');
        grupoHeader.className = 'kanban-estado-grupo-header';
        grupoHeader.textContent = est + ' (' + formatearConteo(regsEst.length, regsTotalEst.length, hayFiltros) + ')';
        grupoHeader.addEventListener('click', function() {
          grupoEstado.classList.toggle('collapsed');
        });
        grupoEstado.appendChild(grupoHeader);

        var grupoBody = document.createElement('div');
        grupoBody.className = 'kanban-estado-grupo-body kanban-drop-zone';
        grupoBody.dataset.columna = col.id;
        grupoBody.dataset.estado = est;

        if (regsEst.length === 0) {
          var placeholder = document.createElement('div');
          placeholder.className = 'kanban-placeholder';
          placeholder.textContent = 'Arrastra aqui';
          grupoBody.appendChild(placeholder);
        }
        regsEst.forEach(function(reg) {
          grupoBody.appendChild(_crearTarjetaKanban(reg));
        });

        grupoEstado.appendChild(grupoBody);
        body.appendChild(grupoEstado);
      });
    } else {
      body.className += ' kanban-drop-zone';
      body.dataset.columna = col.id;
      if (regsColumna.length === 0) {
        var ph = document.createElement('div');
        ph.className = 'kanban-placeholder';
        ph.textContent = 'Arrastra aqui';
        body.appendChild(ph);
      }
      regsColumna.forEach(function(reg) {
        body.appendChild(_crearTarjetaKanban(reg));
      });
    }

    divCol.appendChild(body);
    board.appendChild(divCol);

    // SortableJS en TODAS las drop-zones (incluso colapsadas)
    var dropZones = divCol.querySelectorAll('.kanban-drop-zone');
    dropZones.forEach(function(zone) {
      var sortable = new Sortable(zone, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onStart: function() { board.classList.add('drag-active'); },
        onMove: function(evt) {
          var destino = evt.to;
          board.querySelectorAll('.kanban-drop-zone').forEach(function(z) { z.classList.remove('drag-hover'); });
          destino.classList.add('drag-hover');
        },
        onEnd: function(evt) {
          board.classList.remove('drag-active');
          board.querySelectorAll('.kanban-drop-zone').forEach(function(z) { z.classList.remove('drag-hover'); });
          _onKanbanDragEnd(evt);
        }
      });
      _sortableInstances.push(sortable);
    });
  });

  var totalSpan = document.getElementById('kanban-total');
  if (totalSpan) {
    totalSpan.textContent = formatearConteo(totalFiltrado, totalGeneral, hayFiltros) + ' cargas';
  }

}

function _crearTarjetaKanban(reg) {
  var card = document.createElement('div');
  card.className = 'kanban-tarjeta';
  card.dataset.messageId = reg.messageId || '';
  card.dataset.threadId = reg.threadId || '';
  card.dataset.codCar = reg.codCar || '';
  card.dataset.estado = reg.estado || '';
  card.dataset.fase = reg.fase || '';
  card.draggable = true;

  var codCar = reg.codCar || '—';
  var transp = reg.nombreTransportista || reg.interlocutor || '';
  var asunto = reg.asunto || '';

  var fechaStr = '';
  if (reg.fechaCorreo) {
    var diff = Date.now() - new Date(reg.fechaCorreo).getTime();
    var horas = Math.floor(diff / 3600000);
    fechaStr = horas < 1 ? '<1h' : horas < 24 ? horas + 'h' : Math.floor(horas / 24) + 'd';
  }

  // Banner alerta
  var bannerAlerta = '';
  if (reg.alerta && reg.alerta !== '') {
    bannerAlerta = '<div class="kanban-tarjeta-alerta" title="Alerta: ' + reg.alerta + '"></div>';
  }

  // Indicadores enriquecidos
  var indicadores = '';
  var clave = reg.codCar || reg.threadId;

  if (clave && typeof contarNotas === 'function') {
    var nNotas = contarNotas(clave, almacenNotas || {});
    if (nNotas > 0) {
      indicadores += '<span class="kanban-ind-notas" title="' + nNotas + ' nota' + (nNotas > 1 ? 's' : '') + '">\uD83D\uDCDD' + nNotas + '</span>';
    }
  }

  if (clave && (recordatoriosCache || []).some(function(r) { return r.codCar == clave; })) {
    var rec = (recordatoriosCache || []).find(function(r) { return r.codCar == clave; });
    var recMotivo = rec ? (rec.texto || rec.motivo || rec.descripcion || 'Recordatorio activo') : '';
    indicadores += '<span class="kanban-ind-recordatorio" title="' + recMotivo + '">\u23F0</span>';
  }

  if (clave && programadosCache && programadosCache.length > 0) {
    var tieneProg = programadosCache.some(function(p) {
      return p.codCar == clave || p.threadId == reg.threadId;
    });
    if (tieneProg) {
      indicadores += '<span class="kanban-ind-programado" title="Envio programado">\uD83D\uDCC5</span>';
    }
  }

  card.innerHTML =
    bannerAlerta +
    '<div class="kanban-tarjeta-codcar">' + codCar + '</div>' +
    '<div class="kanban-tarjeta-transportista">' + transp + '</div>' +
    '<div class="kanban-tarjeta-asunto">' + asunto + '</div>' +
    '<div class="kanban-tarjeta-footer">' +
      '<span class="chip-estado-' + (reg.estado || '').toLowerCase() + '" style="font-size:10px;padding:1px 6px">' + (reg.estado || '') + '</span>' +
      '<span style="font-size:10px;color:#999">' + fechaStr + '</span>' +
      '<span class="kanban-tarjeta-indicadores">' + indicadores + '</span>' +
    '</div>';

  card.addEventListener('click', function(e) {
    if (e.defaultPrevented) return;
    var target = e.target.closest('.kanban-ind-notas, .kanban-ind-recordatorio, .kanban-ind-programado');
    if (target) {
      e.stopPropagation();
      var clave = reg.codCar || reg.threadId;
      if (target.classList.contains('kanban-ind-notas')) {
        if (typeof abrirModalNotas === 'function') {
          abrirModalNotas(clave, reg.codCar || '');
        }
      } else if (target.classList.contains('kanban-ind-recordatorio')) {
        if (typeof abrirDetallePorCodCar === 'function') {
          abrirDetallePorCodCar(clave, reg.asunto || '');
        } else if (typeof abrirModalRecordatorio === 'function') {
          abrirModalRecordatorio(clave, reg.asunto || '');
        }
      } else if (target.classList.contains('kanban-ind-programado')) {
        if (typeof abrirModalProgramadoPorThread === 'function') {
          abrirModalProgramadoPorThread(reg.threadId);
        }
      }
      return;
    }
    _abrirModalKanban(reg);
  });

  return card;
}

function _seleccionarEnTabla(reg) {
  if (!tabla || !reg.messageId) return;

  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  tabs[0].classList.add('active');
  document.getElementById('tab-datos').classList.add('active');
  tabla.redraw(true);

  setTimeout(function() {
    tabla.deselectRow();
    var row = tabla.getRows().find(function(r) { return r.getData().messageId === reg.messageId; });
    if (row) {
      row.select();
      row.scrollTo();
    }
  }, 100);
}

async function _onKanbanDragEnd(evt) {
  var tarjeta = evt.item;
  var columnaDestino = evt.to.dataset.columna;
  var estadoDestino = evt.to.dataset.estado || null;
  var messageId = tarjeta.dataset.messageId;
  var faseActual = tarjeta.dataset.fase;

  if (!messageId || !columnaDestino) return;

  var nuevaFase = resolverFaseAlMover(columnaDestino, faseActual);
  var reg = registros.find(function(r) { return r.messageId === messageId; });
  if (!reg) return;

  if (nuevaFase && nuevaFase !== reg.fase) {
    await _persistirCambioKanban(reg, 'fase', nuevaFase);
  }

  if (estadoDestino && estadoDestino !== reg.estado) {
    await _persistirCambioKanban(reg, 'estado', estadoDestino);
  }

  renderKanban();
}

async function _persistirCambioKanban(reg, campo, valor) {
  var valorAnterior = reg[campo];
  var threadId = reg.threadId;

  var reglasConfig = configActual && configActual.reglasAcciones;
  var resultadosReglas = typeof evaluarReglas === 'function'
    ? evaluarReglas(reglasConfig, campo, valor, valorAnterior)
    : [];

  var debePropagarHilo = resultadosReglas.some(function(r) {
    return r.acciones.some(function(a) { return a.tipo === 'PROPAGAR_HILO'; });
  });

  if (!reglasConfig && (campo === 'fase' || campo === 'estado')) {
    debePropagarHilo = true;
  }

  var propagarAlHilo = debePropagarHilo && threadId;

  if (propagarAlHilo) {
    registros.forEach(function(r) {
      if (r.threadId === threadId) r[campo] = valor;
    });
  } else {
    reg[campo] = valor;
  }

  await chrome.storage.local.set({ registros: registros });

  // Sync tabla Tabulator con datos actualizados
  if (typeof tabla !== 'undefined' && tabla) {
    tabla.replaceData(registros);
  }

  var url = obtenerUrlActiva();
  if (url) {
    var accion = propagarAlHilo ? 'actualizarCampoPorThread' : 'actualizarCampo';
    var payload = propagarAlHilo
      ? { threadId: threadId, campo: campo, valor: valor }
      : { messageId: reg.messageId, campo: campo, valor: valor };

    ejecutarConRetry(async function() {
      var resp = await fetch(url + '?action=' + accion, {
        method: 'POST', credentials: 'omit',
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return { ok: true };
    }, 2).then(function(res) {
      if (!res.ok) mostrarToast('Error al guardar en tablero', 'error');
    });
  }

  if ((campo === 'fase' || campo === 'estado') && typeof registrarAccion === 'function') {
    try {
      var clave = reg.codCar || reg.threadId || '0';
      var desc = campo === 'fase' ? 'Fase -> ' + valor + ' (tablero)' : 'Estado -> ' + valor + ' (tablero)';
      almacenHistorial = registrarAccion('FASE', clave, desc, almacenHistorial, new Date()).almacen;
      chrome.storage.local.set({ [STORAGE_KEY_HISTORIAL]: almacenHistorial });
      syncBackend('registrarHistorial', { clave: clave, tipo: 'FASE', descripcion: desc });
    } catch (e) { /* silencioso */ }
  }

  for (var ri = 0; ri < resultadosReglas.length; ri++) {
    var accReglas = resultadosReglas[ri].acciones;
    for (var ai = 0; ai < accReglas.length; ai++) {
      if (accReglas[ai].tipo !== 'PROPAGAR_HILO') {
        if (typeof ejecutarAccionRegla === 'function') {
          await ejecutarAccionRegla(accReglas[ai], reg);
        }
      }
    }
  }
}

function _abrirModalKanban(reg) {
  var modal = document.getElementById('modal-kanban-detalle');
  var body = document.getElementById('kanban-detalle-body');
  if (!modal || !body) return;

  var estados = (configActual && configActual.estados)
    ? configActual.estados.filter(function(e) { return e.activo !== false; })
    : [];
  var fases = (configActual && configActual.fases) || [];

  var opcionesEstado = estados.map(function(e) {
    var sel = e.codigo === reg.estado ? ' selected' : '';
    return '<option value="' + e.codigo + '"' + sel + '>' + e.codigo + '</option>';
  }).join('');

  var opcionesFase = fases.map(function(f) {
    var cod = f.codigo || f.id || '';
    var sel = cod === reg.fase ? ' selected' : '';
    return '<option value="' + cod + '"' + sel + '>' + cod + ' - ' + (f.nombre || '') + '</option>';
  }).join('');

  var fechaStr = '';
  if (reg.fechaCorreo) {
    try { fechaStr = new Date(reg.fechaCorreo).toLocaleString('es-ES'); } catch (e) { fechaStr = reg.fechaCorreo; }
  }

  var indicadores = '';
  var clave = reg.codCar || reg.threadId;
  var tieneNotasFlag = clave && typeof tieneNotas === 'function' && tieneNotas(clave, almacenNotas || {});
  var tieneRecordatorioFlag = clave && (recordatoriosCache || []).some(function(r) { return r.codCar == clave; });
  var tieneProgramadoFlag = clave && programadosCache && programadosCache.some(function(p) {
    return p.codCar == clave || p.threadId == reg.threadId;
  });

  if (tieneNotasFlag) {
    var nNotas = typeof contarNotas === 'function' ? contarNotas(clave, almacenNotas || {}) : 0;
    indicadores += '<span class="kanban-detalle-indicador kanban-detalle-ind-notas" title="Notas">\uD83D\uDCDD Notas (' + nNotas + ')</span>';
  }
  if (tieneRecordatorioFlag) {
    indicadores += '<span class="kanban-detalle-indicador kanban-detalle-ind-recordatorio" title="Recordatorio">\u23F0 Recordatorio</span>';
  }
  if (tieneProgramadoFlag) {
    indicadores += '<span class="kanban-detalle-indicador kanban-detalle-ind-programado" title="Programado">\uD83D\uDCC5 Programado</span>';
  }

  body.innerHTML =
    '<div class="kanban-detalle-titulo">' + (reg.codCar || 'Sin codigo') + '</div>' +
    '<div class="kanban-detalle-grid">' +
      '<span class="kanban-detalle-label">Transportista</span>' +
      '<span>' + (reg.nombreTransportista || reg.interlocutor || '---') + '</span>' +
      '<span class="kanban-detalle-label">Asunto</span>' +
      '<span class="kanban-detalle-asunto">' + (reg.asunto || '---') + '</span>' +
      '<span class="kanban-detalle-label">Estado</span>' +
      '<select id="kanban-detalle-estado" class="kanban-detalle-select">' + opcionesEstado + '</select>' +
      '<span class="kanban-detalle-label">Fase</span>' +
      '<select id="kanban-detalle-fase" class="kanban-detalle-select">' + opcionesFase + '</select>' +
      '<span class="kanban-detalle-label">Interlocutor</span>' +
      '<span>' + (reg.interlocutor || '---') + '</span>' +
      '<span class="kanban-detalle-label">Fecha</span>' +
      '<span>' + (fechaStr || '---') + '</span>' +
    '</div>' +
    (indicadores ? '<div class="kanban-detalle-indicadores">' + indicadores + '</div>' : '') +
    '<div class="kanban-detalle-acciones">' +
      '<button id="btn-kanban-add-nota" class="btn-secundario" title="Añadir nota">\uD83D\uDCDD +Nota</button>' +
      '<button id="btn-kanban-add-record" class="btn-secundario" title="Crear recordatorio">\u23F0 +Record.</button>' +
      '<button id="btn-kanban-responder" class="btn-secundario" title="Responder correo">\u2709\uFE0F Responder</button>' +
      '<button id="btn-kanban-ver-tabla" class="btn-secundario">Ver en tabla</button>' +
    '</div>';

  modal.classList.remove('hidden');

  document.getElementById('kanban-detalle-estado').addEventListener('change', function() {
    _persistirCambioKanban(reg, 'estado', this.value);
    renderKanban();
  });

  document.getElementById('kanban-detalle-fase').addEventListener('change', function() {
    _persistirCambioKanban(reg, 'fase', this.value);
    renderKanban();
  });

  document.getElementById('btn-kanban-ver-tabla').addEventListener('click', function() {
    _cerrarModalKanban();
    _seleccionarEnTabla(reg);
  });

  document.getElementById('btn-kanban-add-nota').addEventListener('click', function() {
    _cerrarModalKanban();
    if (typeof abrirModalNotas === 'function') abrirModalNotas(clave, reg.codCar || '');
  });

  document.getElementById('btn-kanban-add-record').addEventListener('click', function() {
    _cerrarModalKanban();
    if (typeof abrirModalRecordatorio === 'function') abrirModalRecordatorio(clave, reg.asunto || '');
  });

  document.getElementById('btn-kanban-responder').addEventListener('click', function() {
    _cerrarModalKanban();
    if (typeof abrirModalRespuestaDesdeRegla === 'function') abrirModalRespuestaDesdeRegla(reg, {});
  });

  // Indicadores clicables en modal
  var indNotas = body.querySelector('.kanban-detalle-ind-notas');
  if (indNotas) {
    indNotas.addEventListener('click', function() {
      _cerrarModalKanban();
      if (typeof abrirModalNotas === 'function') abrirModalNotas(clave, reg.codCar || '');
    });
  }
  var indRecord = body.querySelector('.kanban-detalle-ind-recordatorio');
  if (indRecord) {
    indRecord.addEventListener('click', function() {
      _cerrarModalKanban();
      if (typeof abrirDetallePorCodCar === 'function') abrirDetallePorCodCar(clave, reg.asunto || '');
    });
  }
  var indProg = body.querySelector('.kanban-detalle-ind-programado');
  if (indProg) {
    indProg.addEventListener('click', function() {
      _cerrarModalKanban();
      if (typeof abrirModalProgramadoPorThread === 'function') abrirModalProgramadoPorThread(reg.threadId);
    });
  }
}

function _cerrarModalKanban() {
  var modal = document.getElementById('modal-kanban-detalle');
  if (modal) modal.classList.add('hidden');
}

function _syncCheckboxesKanban() {
  var e = document.getElementById('chk-kanban-espera');
  var v = document.getElementById('chk-kanban-vacio');
  var d = document.getElementById('chk-kanban-documentado');
  var n = document.getElementById('chk-kanban-nada');
  var c = document.getElementById('chk-kanban-cerrado');
  if (e) e.checked = _kanbanMostrarEspera;
  if (v) v.checked = _kanbanMostrarVacio;
  if (d) d.checked = _kanbanMostrarDocumentado;
  if (n) n.checked = _kanbanMostrarNada;
  if (c) c.checked = _kanbanMostrarCerrado;
}

function inicializarKanbanEventos() {
  var btnRefresh = document.getElementById('btn-kanban-refresh');
  if (btnRefresh) btnRefresh.addEventListener('click', renderKanban);

  var chkEspera = document.getElementById('chk-kanban-espera');
  if (chkEspera) chkEspera.addEventListener('change', function() {
    _kanbanMostrarEspera = chkEspera.checked;
    renderKanban();
  });

  var chkVacio = document.getElementById('chk-kanban-vacio');
  if (chkVacio) chkVacio.addEventListener('change', function() {
    _kanbanMostrarVacio = chkVacio.checked;
    renderKanban();
  });

  var chkDoc = document.getElementById('chk-kanban-documentado');
  if (chkDoc) chkDoc.addEventListener('change', function() {
    _kanbanMostrarDocumentado = chkDoc.checked;
    renderKanban();
  });

  var chkNada = document.getElementById('chk-kanban-nada');
  if (chkNada) chkNada.addEventListener('change', function() {
    _kanbanMostrarNada = chkNada.checked;
    renderKanban();
  });

  var chkCerrado = document.getElementById('chk-kanban-cerrado');
  if (chkCerrado) chkCerrado.addEventListener('change', function() {
    _kanbanMostrarCerrado = chkCerrado.checked;
    renderKanban();
  });

  var btnTodas = document.getElementById('btn-kanban-todas');
  if (btnTodas) btnTodas.addEventListener('click', function() {
    _kanbanMostrarEspera = true;
    _kanbanMostrarVacio = true;
    _kanbanMostrarDocumentado = true;
    _kanbanMostrarNada = true;
    _kanbanMostrarCerrado = true;
    _syncCheckboxesKanban();
    renderKanban();
  });

  var btnNinguna = document.getElementById('btn-kanban-ninguna');
  if (btnNinguna) btnNinguna.addEventListener('click', function() {
    _kanbanMostrarEspera = false;
    _kanbanMostrarVacio = false;
    _kanbanMostrarDocumentado = false;
    _kanbanMostrarNada = false;
    _kanbanMostrarCerrado = false;
    _syncCheckboxesKanban();
    renderKanban();
  });

  var chkEstados = document.getElementById('chk-kanban-estados');
  if (chkEstados) chkEstados.addEventListener('change', function() {
    _kanbanEstadosActivo = chkEstados.checked;
    renderKanban();
  });

}

document.addEventListener('DOMContentLoaded', function() {
  _cargarPrefsKanban(function() {
    inicializarKanbanEventos();
  });

  var btnCerrar = document.getElementById('btn-cerrar-kanban-detalle');
  if (btnCerrar) btnCerrar.addEventListener('click', _cerrarModalKanban);

  var modalKanban = document.getElementById('modal-kanban-detalle');
  if (modalKanban) {
    modalKanban.addEventListener('click', function(e) {
      if (e.target === modalKanban) _cerrarModalKanban();
    });
  }

  // Keyboard shortcuts (solo activos cuando tab tablero visible)
  document.addEventListener('keydown', function(e) {
    var tableroTab = document.getElementById('tab-tablero');
    if (!tableroTab || !tableroTab.classList.contains('active')) return;

    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

    if (e.key === 'Escape') {
      if (modalKanban && !modalKanban.classList.contains('hidden')) {
        _cerrarModalKanban();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
      var busqueda = document.getElementById('filtro-global');
      if (busqueda) {
        busqueda.focus();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      renderKanban();
      e.preventDefault();
    }
  });
});
