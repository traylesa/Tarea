/**
 * notes.js - Notas rapidas por carga
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 4: HU-12
 */

var MAX_NOTAS_POR_CARGA = 50;

function _generarId() {
  return 'nota_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function crearNota(texto, codCar, almacen, ahora) {
  if (!texto || !texto.trim()) {
    throw new Error('El texto de la nota es obligatorio');
  }

  var clave = String(codCar);
  var existentes = (almacen && almacen[clave]) ? almacen[clave] : [];

  if (existentes.length >= MAX_NOTAS_POR_CARGA) {
    throw new Error('Se ha alcanzado el limite de ' + MAX_NOTAS_POR_CARGA + ' notas por carga');
  }

  var nota = {
    id: _generarId(),
    texto: texto.trim(),
    fechaCreacion: ahora.toISOString()
  };

  var nuevoAlmacen = {};
  if (almacen) {
    Object.keys(almacen).forEach(function(k) {
      nuevoAlmacen[k] = almacen[k].slice();
    });
  }
  if (!nuevoAlmacen[clave]) nuevoAlmacen[clave] = [];
  nuevoAlmacen[clave].push(nota);

  return { almacen: nuevoAlmacen, nota: nota };
}

function obtenerNotas(codCar, almacen) {
  if (!almacen) return [];
  var clave = String(codCar);
  var notas = almacen[clave];
  if (!notas || !Array.isArray(notas)) return [];

  return notas.slice().sort(function(a, b) {
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });
}

function eliminarNota(id, codCar, almacen) {
  if (!almacen) return {};
  var clave = String(codCar);

  var nuevoAlmacen = {};
  Object.keys(almacen).forEach(function(k) {
    if (k === clave) {
      nuevoAlmacen[k] = almacen[k].filter(function(n) { return n.id !== id; });
    } else {
      nuevoAlmacen[k] = almacen[k].slice();
    }
  });

  return nuevoAlmacen;
}

function contarNotas(codCar, almacen) {
  if (!almacen) return 0;
  var notas = almacen[String(codCar)];
  return (notas && Array.isArray(notas)) ? notas.length : 0;
}

function tieneNotas(codCar, almacen) {
  return contarNotas(codCar, almacen) > 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearNota: crearNota,
    obtenerNotas: obtenerNotas,
    eliminarNota: eliminarNota,
    contarNotas: contarNotas,
    tieneNotas: tieneNotas,
    MAX_NOTAS_POR_CARGA: MAX_NOTAS_POR_CARGA
  };
}
