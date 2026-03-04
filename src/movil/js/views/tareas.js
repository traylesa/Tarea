// tareas.js - Vista de gestion de tareas
'use strict';

var VistaTareas = {
  _filtro: 'todas',
  _busqueda: '',

  renderizar: function(contenedor) {
    var self = this;
    var tareas = Store.obtenerTareas();

    contenedor.innerHTML =
      '<div class="header"><div class="header-title">Tareas</div></div>' +
      '<div class="filtros-rapidos" style="padding:8px">' +
        '<button class="chip ' + (this._filtro === 'todas' ? 'activo' : '') + '" onclick="VistaTareas._filtrar(\'todas\')">Todas</button>' +
        '<button class="chip ' + (this._filtro === 'mis' ? 'activo' : '') + '" onclick="VistaTareas._filtrar(\'mis\')">Mis Tareas</button>' +
        '<button class="chip ' + (this._filtro === 'ia-alta' ? 'activo' : '') + '" onclick="VistaTareas._filtrar(\'ia-alta\')">IA Alta</button>' +
      '</div>' +
      '<div class="search-bar">' +
        '<input type="text" placeholder="Buscar tareas..." value="' + this._busqueda + '" oninput="VistaTareas._buscar(this.value)">' +
      '</div>' +
      '<div id="lista-tareas" style="padding:8px"></div>' +
      '<button class="fab" onclick="VistaTareas._abrirCrear()">+</button>';

    this._renderizarLista(tareas);
    this._sincronizar();
  },

  _renderizarLista: function(tareas) {
    var filtradas = this._aplicarFiltros(tareas);
    var lista = document.getElementById('lista-tareas');
    if (!lista) return;

    if (filtradas.length === 0) {
      lista.innerHTML = '<div class="lista-vacia">Sin tareas' +
        (this._filtro !== 'todas' || this._busqueda ? ' con estos filtros' : '') + '</div>';
      return;
    }

    lista.innerHTML = filtradas.map(function(t) {
      var estrellas = VistaTareas._renderEstrellas(t.prioridadIa);
      var riesgoClass = (t.riesgoIa || '').toLowerCase();
      var estadoClass = (t.estado || 'pendiente').toLowerCase();
      return '<div class="tarea-card" onclick="VistaTareas._abrirDetalle(\'' + t.id + '\')">' +
        '<div class="tarea-card-header">' +
          '<span class="tarea-estrellas">' + estrellas + '</span>' +
          (t.riesgoIa ? '<span class="tarea-badge ' + riesgoClass + '">' + t.riesgoIa + '</span>' : '') +
          '<span class="tarea-badge ' + estadoClass + '">' + (t.estado || 'PENDIENTE') + '</span>' +
        '</div>' +
        '<div class="tarea-titulo">' + _esc(t.titulo) + '</div>' +
        '<div class="tarea-meta">' +
          '<span>' + (t.usuarioAsignado ? t.usuarioAsignado.split('@')[0] : 'Sin asignar') + '</span>' +
          (t.horasIa ? '<span>' + t.horasIa + 'h est</span>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  },

  _aplicarFiltros: function(tareas) {
    var self = this;
    var resultado = tareas;

    if (this._filtro === 'mis') {
      var config = Store.obtenerConfig();
      var email = (config.emailUsuario || '').toLowerCase();
      resultado = resultado.filter(function(t) {
        return (t.usuarioAsignado || '').toLowerCase() === email ||
               (t.creadoPor || '').toLowerCase() === email;
      });
    } else if (this._filtro === 'ia-alta') {
      resultado = resultado.filter(function(t) {
        return parseInt(t.prioridadIa) >= 4 || t.riesgoIa === 'ALTO' || t.riesgoIa === 'CRITICO';
      });
    }

    if (this._busqueda) {
      var q = this._busqueda.toLowerCase();
      resultado = resultado.filter(function(t) {
        return (t.titulo || '').toLowerCase().indexOf(q) !== -1 ||
               (t.descripcion || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    return resultado;
  },

  _filtrar: function(filtro) {
    this._filtro = filtro;
    this._renderizarLista(Store.obtenerTareas());
    // Actualizar chips activos
    document.querySelectorAll('.filtros-rapidos .chip').forEach(function(c) {
      c.classList.toggle('activo', c.textContent.toLowerCase().replace(/\s/g, '-') ===
        (filtro === 'todas' ? 'todas' : filtro === 'mis' ? 'mis-tareas' : 'ia-alta'));
    });
  },

  _buscar: function(texto) {
    this._busqueda = texto;
    this._renderizarLista(Store.obtenerTareas());
  },

  _renderEstrellas: function(prioridad) {
    var n = parseInt(prioridad) || 0;
    var llenas = '';
    for (var i = 0; i < 5; i++) llenas += i < n ? '\u2605' : '\u2606';
    return llenas;
  },

  _abrirCrear: function() {
    var entidades = Store.obtenerEntidades();
    var centros = Store.obtenerCentros();

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="form-grupo"><label>Titulo *</label><input id="tarea-titulo" type="text"></div>' +
      '<div class="form-grupo"><label>Descripcion</label><textarea id="tarea-desc"></textarea></div>' +
      '<div class="form-grupo"><label>Asignar a (email)</label><input id="tarea-asignado" type="email"></div>' +
      '<div class="form-grupo"><label>Entidad</label>' +
        '<select id="tarea-entidad"><option value="">-- Sin entidad --</option>' +
        entidades.map(function(e) { return '<option value="' + e.id + '">' + _esc(e.nombre) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-grupo"><label>Centro</label>' +
        '<select id="tarea-centro"><option value="">-- Sin centro --</option>' +
        centros.map(function(c) { return '<option value="' + c.id + '">' + _esc(c.nombre) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-grupo"><label>Referencia</label><input id="tarea-ref" type="text"></div>' +
      '<div class="form-acciones">' +
        '<button class="btn btn-secondary" onclick="BottomSheet.cerrar()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="VistaTareas._guardarNueva()">Crear</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Nueva tarea', contenido: contenido });
  },

  _guardarNueva: async function() {
    var titulo = document.getElementById('tarea-titulo').value.trim();
    if (!titulo) { ToastUI.mostrar('Titulo es obligatorio', { tipo: 'error' }); return; }

    var body = {
      titulo: titulo,
      descripcion: document.getElementById('tarea-desc').value.trim(),
      usuarioAsignado: document.getElementById('tarea-asignado').value.trim(),
      entidadId: document.getElementById('tarea-entidad').value,
      centroId: document.getElementById('tarea-centro').value,
      referencia: document.getElementById('tarea-ref').value.trim()
    };

    BottomSheet.cerrar();
    ToastUI.mostrar('Creando tarea...', { tipo: 'info' });

    try {
      var data = await API.post('crearTarea', body);
      var tareas = Store.obtenerTareas();
      tareas.unshift(data.tarea);
      Store.guardarTareas(tareas);
      ToastUI.mostrar('Tarea creada', { tipo: 'ok' });
      this._renderizarLista(tareas);
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _abrirDetalle: function(id) {
    var tareas = Store.obtenerTareas();
    var tarea = tareas.find(function(t) { return t.id === id; });
    if (!tarea) return;

    var subtareas = [];
    try { subtareas = JSON.parse(tarea.subtareasJson || '[]'); } catch(e) {}

    var contenido = document.createElement('div');
    contenido.style.padding = '0 16px 16px';
    contenido.innerHTML =
      '<div class="tarea-detalle-info">' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:8px">' + _esc(tarea.titulo) + '</div>' +
        (tarea.descripcion ? '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">' + _esc(tarea.descripcion) + '</div>' : '') +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Estado</span><span class="tarea-badge ' + (tarea.estado || 'pendiente').toLowerCase() + '">' + (tarea.estado || 'PENDIENTE') + '</span></div>' +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Prioridad IA</span><span class="tarea-estrellas">' + this._renderEstrellas(tarea.prioridadIa) + '</span></div>' +
        (tarea.riesgoIa ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Riesgo</span><span class="tarea-badge ' + tarea.riesgoIa.toLowerCase() + '">' + tarea.riesgoIa + '</span></div>' : '') +
        (tarea.horasIa ? '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Horas est.</span><span>' + tarea.horasIa + 'h</span></div>' : '') +
        '<div class="tarea-detalle-row"><span class="tarea-detalle-label">Asignado</span><span>' + (tarea.usuarioAsignado || 'Sin asignar') + '</span></div>' +
        (tarea.justificacionIa ? '<div style="font-size:12px;color:var(--text-secondary);margin-top:8px;font-style:italic">' + _esc(tarea.justificacionIa) + '</div>' : '') +
      '</div>' +
      (subtareas.length > 0 ? '<div style="margin-top:12px"><div style="font-weight:600;margin-bottom:8px">Subtareas</div>' +
        subtareas.map(function(s, i) {
          return '<div class="subtarea-item">' +
            '<input type="checkbox" id="sub-' + i + '">' +
            '<label class="subtarea-titulo" for="sub-' + i + '">' + _esc(s.titulo) + '</label>' +
            (s.rolSugerido ? '<span class="subtarea-rol">' + s.rolSugerido + '</span>' : '') +
          '</div>';
        }).join('') + '</div>' : '') +
      '<div class="tarea-detalle-acciones">' +
        '<button class="btn btn-ia" onclick="VistaTareas._valorarIA(\'' + id + '\')">Valorar IA</button>' +
        '<button class="btn btn-ia" onclick="VistaTareas._atomizarIA(\'' + id + '\')">Atomizar IA</button>' +
      '</div>' +
      '<div class="tarea-detalle-acciones" style="margin-top:8px">' +
        '<button class="btn btn-secondary" style="border:1px solid #ccc" onclick="VistaTareas._cambiarEstado(\'' + id + '\',\'EN_PROCESO\')">En Proceso</button>' +
        '<button class="btn btn-secondary" style="border:1px solid var(--color-ok);color:var(--color-ok)" onclick="VistaTareas._cambiarEstado(\'' + id + '\',\'COMPLETADA\')">Completar</button>' +
      '</div>';

    BottomSheet.abrir({ titulo: 'Detalle tarea', contenido: contenido });
  },

  _valorarIA: async function(id) {
    var tarea = Store.obtenerTareas().find(function(t) { return t.id === id; });
    if (!tarea) return;
    BottomSheet.cerrar();
    ToastUI.mostrar('Valorando con IA...', { tipo: 'info', duracion: 0 });

    try {
      var data = await API.post('valorarTareaIA', { id: id, titulo: tarea.titulo, descripcion: tarea.descripcion });
      var tareas = Store.obtenerTareas();
      var idx = tareas.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) {
        tareas[idx].prioridadIa = data.valoracion.prioridad;
        tareas[idx].horasIa = data.valoracion.horas;
        tareas[idx].riesgoIa = data.valoracion.riesgo;
        tareas[idx].justificacionIa = data.valoracion.justificacion || '';
        Store.guardarTareas(tareas);
      }
      ToastUI.mostrar('Valoracion IA completada', { tipo: 'ok' });
      this._renderizarLista(tareas);
    } catch (e) {
      ToastUI.mostrar('Error IA: ' + e.message, { tipo: 'error' });
    }
  },

  _atomizarIA: async function(id) {
    var tarea = Store.obtenerTareas().find(function(t) { return t.id === id; });
    if (!tarea) return;
    if (!tarea.descripcion) { ToastUI.mostrar('Necesita descripcion para atomizar', { tipo: 'error' }); return; }
    BottomSheet.cerrar();
    ToastUI.mostrar('Atomizando con IA...', { tipo: 'info', duracion: 0 });

    try {
      var data = await API.post('atomizarTareaIA', { id: id, titulo: tarea.titulo, descripcion: tarea.descripcion });
      var tareas = Store.obtenerTareas();
      var idx = tareas.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) {
        tareas[idx].subtareasJson = JSON.stringify(data.subtareas);
        Store.guardarTareas(tareas);
      }
      ToastUI.mostrar('Subtareas generadas: ' + data.subtareas.length, { tipo: 'ok' });
      this._renderizarLista(tareas);
    } catch (e) {
      ToastUI.mostrar('Error IA: ' + e.message, { tipo: 'error' });
    }
  },

  _cambiarEstado: async function(id, estado) {
    BottomSheet.cerrar();
    try {
      await API.post('actualizarTarea', { id: id, campos: { estado: estado } });
      var tareas = Store.obtenerTareas();
      var idx = tareas.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) { tareas[idx].estado = estado; Store.guardarTareas(tareas); }
      ToastUI.mostrar('Estado actualizado', { tipo: 'ok' });
      this._renderizarLista(tareas);
    } catch (e) {
      ToastUI.mostrar('Error: ' + e.message, { tipo: 'error' });
    }
  },

  _sincronizar: async function() {
    try {
      var data = await API.get('getTareas');
      if (data.tareas) {
        Store.guardarTareas(data.tareas);
        VistaTareas._renderizarLista(data.tareas);
      }
    } catch(e) { /* usar cache */ }
  }
};

function _esc(t) { return String(t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
