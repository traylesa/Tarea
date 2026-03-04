// === TareaLog — TareasAdapter (CRUD sobre hoja TAREAS) ===
// Fase C: Gestion de tareas para sistema multiusuario

function crearTarea(tarea) {
  if (!tarea || !tarea.titulo) {
    throw new Error('Campo obligatorio: titulo');
  }
  if (!tarea.creadoPor) {
    throw new Error('Campo obligatorio: creadoPor');
  }

  var ahora = ahoraLocalISO();
  var registro = {
    id: 'T_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    titulo: tarea.titulo,
    descripcion: tarea.descripcion || '',
    referencia: tarea.referencia || '',
    contactoTel: tarea.contactoTel || '',
    entidadId: tarea.entidadId || '',
    centroId: tarea.centroId || '',
    usuarioAsignado: tarea.usuarioAsignado || '',
    creadoPor: tarea.creadoPor,
    estado: 'PENDIENTE',
    fase: tarea.fase || '',
    prioridadIa: '', horasIa: '', riesgoIa: '',
    justificacionIa: '', subtareasJson: '',
    creadoAt: ahora,
    actualizadoAt: ahora
  };

  var hoja = obtenerHoja(HOJA_TAREAS);
  var fila = HEADERS_TAREAS.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);

  return registro;
}

function obtenerTareas() {
  var hoja = obtenerHoja(HOJA_TAREAS);
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return [];

  var headers = datos[0];
  return datos.slice(1).map(function(fila) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = fila[i]; });
    return obj;
  });
}

function obtenerTareasPorUsuario(email) {
  var tareas = obtenerTareas();
  return tareas.filter(function(t) {
    return t.usuarioAsignado === email;
  });
}

function actualizarTarea(id, campos) {
  var hoja = obtenerHoja(HOJA_TAREAS);
  var datos = hoja.getDataRange().getValues();
  var headers = datos[0];
  var colId = headers.indexOf('id');

  for (var i = 1; i < datos.length; i++) {
    if (datos[i][colId] === id) {
      Object.keys(campos).forEach(function(campo) {
        var col = headers.indexOf(campo);
        if (col !== -1) {
          hoja.getRange(i + 1, col + 1).setValue(campos[campo]);
        }
      });
      return true;
    }
  }
  return false;
}

function actualizarValoracionIA(id, valoracion) {
  return actualizarTarea(id, {
    prioridadIa: valoracion.prioridad,
    horasIa: valoracion.horas,
    riesgoIa: valoracion.riesgo,
    justificacionIa: valoracion.justificacion || ''
  });
}

function actualizarSubtareas(id, subtareas) {
  return actualizarTarea(id, {
    subtareasJson: JSON.stringify(subtareas)
  });
}

// Patron dual-compat GAS/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearTarea,
    obtenerTareas,
    obtenerTareasPorUsuario,
    actualizarTarea,
    actualizarValoracionIA,
    actualizarSubtareas
  };
}
