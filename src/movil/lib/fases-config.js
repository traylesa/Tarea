/**
 * fases-config.js - Logica pura para fases de transporte configurables.
 * Sin dependencias DOM. Testeable unitariamente.
 */

const CLASES_CSS_VALIDAS = ['', 'fase-incidencia', 'fase-ok'];

function getDefaultFases() {
  return [
    { codigo: '',   nombre: '--',                  orden: 0,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '00', nombre: '00 Espera',           orden: 1,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '01', nombre: '01 Espera en Carga',  orden: 2,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '02', nombre: '02 Espera en Descarga',orden: 3, es_critica: false, clase_css: '',                activa: true },
    { codigo: '05', nombre: '05 Incidencia',       orden: 4,  es_critica: true,  clase_css: 'fase-incidencia', activa: true },
    { codigo: '11', nombre: '11 En Carga',         orden: 5,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '12', nombre: '12 Cargando',         orden: 6,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '19', nombre: '19 Cargado',          orden: 7,  es_critica: false, clase_css: 'fase-ok',        activa: true },
    { codigo: '21', nombre: '21 En Descarga',      orden: 8,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '22', nombre: '22 Descargando',      orden: 9,  es_critica: false, clase_css: '',                activa: true },
    { codigo: '25', nombre: '25 Incidencia',       orden: 10, es_critica: true,  clase_css: 'fase-incidencia', activa: true },
    { codigo: '29', nombre: '29 Vacio',            orden: 11, es_critica: false, clase_css: '',                activa: true },
    { codigo: '30', nombre: '30 Documentado',      orden: 12, es_critica: false, clase_css: 'fase-ok',        activa: true }
  ];
}

function validarFases(fases) {
  const errores = [];

  if (!Array.isArray(fases) || fases.length === 0) {
    return { valido: false, errores: ['Debe haber al menos una fase'] };
  }

  const codigos = new Set();
  const ordenes = new Set();

  for (const f of fases) {
    if (codigos.has(f.codigo)) {
      errores.push(`Codigo duplicado: "${f.codigo}". Los codigos deben ser unicos`);
    }
    codigos.add(f.codigo);

    if (ordenes.has(f.orden)) {
      errores.push(`Orden duplicado: ${f.orden}. Cada fase debe tener un orden unico`);
    }
    ordenes.add(f.orden);

    if (!CLASES_CSS_VALIDAS.includes(f.clase_css)) {
      errores.push(`Clase CSS invalida: "${f.clase_css}". Validas: ${CLASES_CSS_VALIDAS.join(', ')}`);
    }
  }

  return { valido: errores.length === 0, errores };
}

function obtenerFasePorCodigo(fases, codigo) {
  return fases.find(f => f.codigo === codigo) || null;
}

function obtenerClaseCSS(fases, codigo) {
  const fase = obtenerFasePorCodigo(fases, codigo);
  return fase ? fase.clase_css : '';
}

function esFaseCritica(fases, codigo) {
  const fase = obtenerFasePorCodigo(fases, codigo);
  return fase ? fase.es_critica : false;
}

function obtenerFasesOrdenadas(fases) {
  return [...fases].sort((a, b) => a.orden - b.orden);
}

function fasesAMapaLegacy(fases) {
  const mapa = {};
  obtenerFasesOrdenadas(fases)
    .filter(f => f.activa)
    .forEach(f => { mapa[f.codigo] = f.nombre; });
  return mapa;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDefaultFases, validarFases, obtenerFasePorCodigo,
    obtenerClaseCSS, esFaseCritica, obtenerFasesOrdenadas,
    fasesAMapaLegacy, CLASES_CSS_VALIDAS
  };
}
