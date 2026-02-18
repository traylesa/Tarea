/**
 * action-bar.js - Acciones contextuales por fase de transporte
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 4: HU-11
 */

var MAPA_FASE_A_GRUPO = {
  '00': 'espera',
  '01': 'espera',
  '02': 'espera',
  '05': 'incidencia',
  '11': 'carga',
  '12': 'carga',
  '19': 'en_ruta',
  '21': 'descarga',
  '22': 'descarga',
  '25': 'incidencia',
  '29': 'vacio'
};

var ACCIONES_POR_GRUPO = {
  espera: [
    { etiqueta: 'Confirmar hora carga', faseSiguiente: null, plantilla: 'Consulta hora carga' },
    { etiqueta: 'Retrasar carga', faseSiguiente: null, plantilla: null }
  ],
  carga: [
    { etiqueta: 'Solicitar posicion', faseSiguiente: null, plantilla: null },
    { etiqueta: 'Avisar destino', faseSiguiente: null, plantilla: null }
  ],
  en_ruta: [
    { etiqueta: 'Verificar ETA', faseSiguiente: null, plantilla: null },
    { etiqueta: 'Avisar destino', faseSiguiente: null, plantilla: null }
  ],
  descarga: [
    { etiqueta: 'Confirmar descarga', faseSiguiente: '29', plantilla: null }
  ],
  vacio: [
    { etiqueta: 'Reclamar POD', faseSiguiente: null, plantilla: 'Solicitud docs descarga' },
    { etiqueta: 'Marcar documentado', faseSiguiente: '30', plantilla: null }
  ],
  incidencia: [
    { etiqueta: 'Solicitar detalle', faseSiguiente: null, plantilla: null },
    { etiqueta: 'Escalar responsable', faseSiguiente: null, plantilla: null }
  ]
};

function obtenerGrupoFase(codigoFase) {
  if (!codigoFase) return null;
  return MAPA_FASE_A_GRUPO[codigoFase] || null;
}

function obtenerAccionesPorFase(codigoFase) {
  var grupo = obtenerGrupoFase(codigoFase);
  if (!grupo) return [];
  var acciones = ACCIONES_POR_GRUPO[grupo];
  if (!acciones) return [];
  return acciones.map(function(a) {
    return { etiqueta: a.etiqueta, faseSiguiente: a.faseSiguiente, plantilla: a.plantilla };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    obtenerAccionesPorFase: obtenerAccionesPorFase,
    obtenerGrupoFase: obtenerGrupoFase,
    ACCIONES_POR_GRUPO: ACCIONES_POR_GRUPO,
    MAPA_FASE_A_GRUPO: MAPA_FASE_A_GRUPO
  };
}
