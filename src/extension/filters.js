/**
 * filters.js - Modulo de filtros avanzados para Tabulator
 * Logica pura sin dependencias DOM.
 */

function construirFiltros(definiciones) {
  if (!definiciones || !definiciones.length) return [];

  return definiciones
    .filter(d => d.valor && d.valor.trim() !== '')
    .map(d => {
      if (d.operador === 'contiene') {
        return { field: d.campo, type: 'like', value: d.valor };
      }
      if (d.operador === 'no_contiene') {
        return {
          field: d.campo,
          type: '!=',
          value: d.valor,
          func: (cellValue, filterValue) => {
            if (!cellValue) return true;
            return !String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
          }
        };
      }
      if (d.operador === 'igual') {
        return { field: d.campo, type: '=', value: d.valor };
      }
      if (d.operador === '<' || d.operador === '<=' || d.operador === '>' || d.operador === '>=') {
        return { field: d.campo, type: d.operador, value: d.valor };
      }
      return { field: d.campo, type: 'like', value: d.valor };
    });
}

function filtroRangoFechas(fechaInicio, fechaFin, incluirSinFecha = false) {
  if (!fechaInicio && !fechaFin) return () => true;

  const inicio = fechaInicio ? new Date(fechaInicio) : null;
  const fin = fechaFin ? new Date(fechaFin + 'T23:59:59') : null;

  return (valor) => {
    if (!valor) return incluirSinFecha;
    const fecha = new Date(valor);
    if (inicio && fecha < inicio) return false;
    if (fin && fecha > fin) return false;
    return true;
  };
}

function filtroRangoCarga(hoy) {
  const inicio = new Date(hoy);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(hoy);
  fin.setDate(fin.getDate() + 1);
  fin.setHours(23, 59, 59, 999);

  return (valor) => {
    if (!valor) return false;
    const fecha = new Date(valor);
    return fecha >= inicio && fecha <= fin;
  };
}

function filtroRangoDescarga(hoy) {
  const fin = new Date(hoy);
  fin.setHours(23, 59, 59, 999);
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - 1);
  inicio.setHours(0, 0, 0, 0);

  return (valor) => {
    if (!valor) return false;
    const fecha = new Date(valor);
    return fecha >= inicio && fecha <= fin;
  };
}

function filtroFases(fasesActivas) {
  if (!fasesActivas) return () => true;
  if (fasesActivas.length === 0) return () => false;

  const incluyeSinFase = fasesActivas.includes('__SIN_FASE__');
  return (valor) => {
    if (!valor) return incluyeSinFase;
    return fasesActivas.includes(String(valor));
  };
}

function aplicarCambioMasivo(registros, idsSeleccionados, campo, valor) {
  return registros.map(r => {
    if (idsSeleccionados.includes(r.messageId)) {
      return { ...r, [campo]: valor };
    }
    return { ...r };
  });
}

function obtenerBaterias() {
  const hoy = new Date();
  const hace7dias = new Date(hoy);
  hace7dias.setDate(hoy.getDate() - 7);

  return [
    {
      nombre: 'Alertas activas',
      filtros: [{ field: 'estado', type: '=', value: 'ALERTA' }]
    },
    {
      nombre: 'Sin vincular',
      filtros: [{ field: 'vinculacion', type: '=', value: 'SIN_VINCULAR' }]
    },
    {
      nombre: 'Operativos recientes',
      filtros: [{ field: 'tipoTarea', type: '=', value: 'OPERATIVO' }]
    },
    {
      nombre: 'Administrativos',
      filtros: [{ field: 'tipoTarea', type: '=', value: 'ADMINISTRATIVA' }]
    },
    {
      nombre: 'Gestionados',
      filtros: [{ field: 'estado', type: '=', value: 'GESTIONADO' }]
    },
    {
      nombre: 'Recibidos pendientes',
      filtros: [{ field: 'estado', type: '=', value: 'RECIBIDO' }]
    },
    {
      nombre: 'Sin fase',
      filtros: [{ field: 'fase', type: '=', value: '' }]
    },
    {
      nombre: 'Sin fecha carga',
      filtros: [{ field: 'fCarga', type: '=', value: '' }]
    },
    {
      nombre: 'Incidencias',
      filtros: [{ field: 'fase', func: (data) => ['05', '25'].includes(data.fase || '') }]
    },
    {
      nombre: 'En proceso',
      filtros: [{ field: 'fase', func: (data) => ['11', '12', '21', '22'].includes(data.fase || '') }]
    },
    {
      nombre: 'Completados',
      filtros: [{ field: 'fase', func: (data) => ['19', '29', '30'].includes(data.fase || '') }]
    }
  ];
}

function limpiarFiltros() {
  return [];
}

function filtroGlobal(texto, campos) {
  if (!texto || texto.trim() === '') return () => true;

  const busqueda = texto.toLowerCase();
  return (rowData) => {
    return campos.some(campo => {
      const valor = rowData[campo];
      if (valor === null || valor === undefined) return false;
      return String(valor).toLowerCase().includes(busqueda);
    });
  };
}

function contarFiltrosActivos(filtrosTabulator, tieneGlobal, tieneRangoFechas) {
  let total = filtrosTabulator || 0;
  if (tieneGlobal) total++;
  if (tieneRangoFechas) total++;
  return total;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    construirFiltros, filtroRangoFechas, obtenerBaterias, limpiarFiltros,
    filtroGlobal, contarFiltrosActivos, filtroRangoCarga, filtroRangoDescarga,
    filtroFases, aplicarCambioMasivo
  };
}
