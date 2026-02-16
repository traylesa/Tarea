/**
 * action-rules.js - Motor de reglas parametrizable para acciones al cambiar fase/estado
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 */

var TIPOS_ACCION_REGLA = {
  PROPAGAR_HILO: 'PROPAGAR_HILO',
  SUGERIR_RECORDATORIO: 'SUGERIR_RECORDATORIO',
  CREAR_RECORDATORIO: 'CREAR_RECORDATORIO',
  INICIAR_SECUENCIA: 'INICIAR_SECUENCIA',
  PRESELECCIONAR_PLANTILLA: 'PRESELECCIONAR_PLANTILLA',
  CAMBIAR_FASE: 'CAMBIAR_FASE',
  CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
  MOSTRAR_AVISO: 'MOSTRAR_AVISO'
};

var NOMBRES_ACCION_REGLA = {
  PROPAGAR_HILO: 'Propagar al hilo',
  SUGERIR_RECORDATORIO: 'Sugerir recordatorio',
  CREAR_RECORDATORIO: 'Crear recordatorio',
  INICIAR_SECUENCIA: 'Iniciar secuencia',
  PRESELECCIONAR_PLANTILLA: 'Preseleccionar plantilla',
  CAMBIAR_FASE: 'Cambiar fase',
  CAMBIAR_ESTADO: 'Cambiar estado',
  MOSTRAR_AVISO: 'Mostrar aviso'
};

function _generarIdRegla() {
  return 'regla_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function crearRegla(nombre, condicion, acciones, orden) {
  if (!nombre || !nombre.trim()) {
    throw new Error('El nombre de la regla es obligatorio');
  }
  if (!condicion || !condicion.campo) {
    throw new Error('La condicion debe tener un campo');
  }
  if (!acciones || !Array.isArray(acciones) || acciones.length === 0) {
    throw new Error('Debe haber al menos una accion');
  }

  return {
    id: _generarIdRegla(),
    nombre: nombre.trim(),
    activa: true,
    condicion: {
      campo: condicion.campo,
      valor: condicion.valor || '*',
      faseOrigen: condicion.faseOrigen || null
    },
    acciones: acciones.map(function(a) {
      return { tipo: a.tipo, params: a.params || {} };
    }),
    orden: typeof orden === 'number' ? orden : 100,
    origen: 'usuario'
  };
}

function editarRegla(regla, cambios) {
  var nueva = {
    id: regla.id,
    nombre: cambios.nombre !== undefined ? cambios.nombre : regla.nombre,
    activa: cambios.activa !== undefined ? cambios.activa : regla.activa,
    condicion: cambios.condicion || regla.condicion,
    acciones: cambios.acciones || regla.acciones,
    orden: cambios.orden !== undefined ? cambios.orden : regla.orden,
    origen: regla.origen
  };
  return nueva;
}

function eliminarRegla(id, lista) {
  return lista.filter(function(r) { return r.id !== id; });
}

function duplicarRegla(regla) {
  return {
    id: _generarIdRegla(),
    nombre: regla.nombre + ' (copia)',
    activa: regla.activa,
    condicion: {
      campo: regla.condicion.campo,
      valor: regla.condicion.valor,
      faseOrigen: regla.condicion.faseOrigen
    },
    acciones: regla.acciones.map(function(a) {
      return { tipo: a.tipo, params: Object.assign({}, a.params) };
    }),
    orden: regla.orden + 1,
    origen: 'usuario'
  };
}

function evaluarReglas(reglas, campo, valorNuevo, valorAnterior) {
  if (!reglas || !Array.isArray(reglas)) return [];

  var coincidentes = reglas.filter(function(r) {
    if (!r.activa) return false;
    if (r.condicion.campo !== campo) return false;
    if (r.condicion.valor !== '*' && r.condicion.valor !== valorNuevo) return false;
    if (r.condicion.faseOrigen && r.condicion.faseOrigen !== valorAnterior) return false;
    return true;
  });

  coincidentes.sort(function(a, b) { return a.orden - b.orden; });

  return coincidentes.map(function(r) {
    return { reglaId: r.id, nombre: r.nombre, acciones: r.acciones };
  });
}

function validarRegla(regla) {
  var errores = [];

  if (!regla.nombre || !regla.nombre.trim()) {
    errores.push('El nombre es obligatorio');
  }

  var camposValidos = ['fase', 'estado', 'codCar'];
  if (!regla.condicion || camposValidos.indexOf(regla.condicion.campo) === -1) {
    errores.push('El campo debe ser fase, estado o codCar');
  }

  if (!regla.acciones || !Array.isArray(regla.acciones) || regla.acciones.length === 0) {
    errores.push('Debe haber al menos una accion');
  } else {
    regla.acciones.forEach(function(a, i) {
      if (!TIPOS_ACCION_REGLA[a.tipo]) {
        errores.push('Accion ' + (i + 1) + ': tipo desconocido "' + a.tipo + '"');
      }
    });
  }

  return { valido: errores.length === 0, errores: errores };
}

function generarReglasDefault() {
  return [
    {
      id: 'default_propagar_fase',
      nombre: 'Propagar fase al hilo',
      activa: true,
      condicion: { campo: 'fase', valor: '*', faseOrigen: null },
      acciones: [{ tipo: 'PROPAGAR_HILO', params: {} }],
      orden: 1,
      origen: 'sistema'
    },
    {
      id: 'default_propagar_estado',
      nombre: 'Propagar estado al hilo',
      activa: true,
      condicion: { campo: 'estado', valor: '*', faseOrigen: null },
      acciones: [{ tipo: 'PROPAGAR_HILO', params: {} }],
      orden: 2,
      origen: 'sistema'
    },
    {
      id: 'default_propagar_codcar',
      nombre: 'Propagar codCar al hilo',
      activa: true,
      condicion: { campo: 'codCar', valor: '*', faseOrigen: null },
      acciones: [{ tipo: 'PROPAGAR_HILO', params: {} }],
      orden: 3,
      origen: 'sistema'
    },
    {
      id: 'default_sugerir_descarga',
      nombre: 'Sugerir: Verificar descarga',
      activa: true,
      condicion: { campo: 'fase', valor: '19', faseOrigen: null },
      acciones: [{ tipo: 'SUGERIR_RECORDATORIO', params: { texto: 'Verificar descarga', horas: 8 } }],
      orden: 10,
      origen: 'sistema'
    },
    {
      id: 'default_sugerir_pod',
      nombre: 'Sugerir: Reclamar POD',
      activa: true,
      condicion: { campo: 'fase', valor: '29', faseOrigen: null },
      acciones: [{ tipo: 'SUGERIR_RECORDATORIO', params: { texto: 'Reclamar POD', horas: 24 } }],
      orden: 11,
      origen: 'sistema'
    },
    {
      id: 'default_descarga_vacio',
      nombre: 'Confirmar descarga → Vacio',
      activa: true,
      condicion: { campo: 'fase', valor: '22', faseOrigen: null },
      acciones: [{ tipo: 'CAMBIAR_FASE', params: { fase: '29' } }],
      orden: 20,
      origen: 'sistema'
    },
    {
      id: 'default_marcar_documentado',
      nombre: 'Marcar documentado',
      activa: true,
      condicion: { campo: 'fase', valor: '29', faseOrigen: null },
      acciones: [{ tipo: 'CAMBIAR_FASE', params: { fase: '30' } }],
      orden: 21,
      origen: 'sistema'
    }
  ];
}

function obtenerAccionesDesdeReglas(reglas, faseActual) {
  if (!reglas || !Array.isArray(reglas)) return [];

  var resultado = [];
  reglas.forEach(function(r) {
    if (!r.activa) return;
    if (r.condicion.campo !== 'fase') return;
    if (r.condicion.valor !== faseActual && r.condicion.valor !== '*') return;

    r.acciones.forEach(function(a) {
      if (a.tipo === 'CAMBIAR_FASE') {
        resultado.push({
          etiqueta: r.nombre,
          faseSiguiente: a.params.fase || null,
          plantilla: null
        });
      } else if (a.tipo === 'PRESELECCIONAR_PLANTILLA') {
        resultado.push({
          etiqueta: r.nombre,
          faseSiguiente: null,
          plantilla: a.params.nombrePlantilla || null
        });
      } else if (a.tipo === 'MOSTRAR_AVISO') {
        resultado.push({
          etiqueta: r.nombre,
          faseSiguiente: null,
          plantilla: null,
          aviso: a.params.mensaje || ''
        });
      }
    });
  });

  return resultado;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearRegla: crearRegla,
    editarRegla: editarRegla,
    eliminarRegla: eliminarRegla,
    duplicarRegla: duplicarRegla,
    evaluarReglas: evaluarReglas,
    validarRegla: validarRegla,
    generarReglasDefault: generarReglasDefault,
    obtenerAccionesDesdeReglas: obtenerAccionesDesdeReglas,
    TIPOS_ACCION_REGLA: TIPOS_ACCION_REGLA,
    NOMBRES_ACCION_REGLA: NOMBRES_ACCION_REGLA
  };
}
