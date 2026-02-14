/**
 * help-content.js - Contenido del panel de ayuda
 * Datos estaticos organizados por secciones.
 */

const SECCIONES = [
  {
    id: 'filtros',
    titulo: 'Filtros Avanzados',
    contenido: '<h3>Filtros Avanzados</h3>' +
      '<p>Usa el panel de filtros para buscar registros por cualquier campo.</p>' +
      '<ul>' +
      '<li><strong>Contiene:</strong> Muestra registros donde el campo incluye el texto buscado.</li>' +
      '<li><strong>No contiene:</strong> Excluye registros que contengan el texto.</li>' +
      '<li><strong>Rango de fechas:</strong> Filtra por periodo con fecha inicio y/o fin.</li>' +
      '<li><strong>Baterias:</strong> Filtros predefinidos de un click (Alertas, Sin vincular, etc.).</li>' +
      '</ul>' +
      '<p>Los filtros se combinan con AND: todos deben cumplirse a la vez.</p>'
  },
  {
    id: 'agrupacion',
    titulo: 'Agrupacion por Hilo',
    contenido: '<h3>Agrupacion por Hilo</h3>' +
      '<p>Agrupa los correos por hilo de conversacion (ThreadID).</p>' +
      '<ul>' +
      '<li>Click en "Agrupar por hilo" para activar/desactivar.</li>' +
      '<li>Click en la cabecera del grupo para colapsar/expandir.</li>' +
      '</ul>'
  },
  {
    id: 'respuestas',
    titulo: 'Respuesta Masiva',
    contenido: '<h3>Respuesta Masiva</h3>' +
      '<p>Selecciona multiples correos y responde a todos a la vez.</p>' +
      '<ol>' +
      '<li>Marca las casillas de los correos que quieras responder.</li>' +
      '<li>Click en "Responder seleccionados".</li>' +
      '<li>Elige una plantilla o escribe un mensaje personalizado.</li>' +
      '<li>Previsualiza y envia.</li>' +
      '</ol>'
  },
  {
    id: 'plantillas',
    titulo: 'Plantillas de Respuesta',
    contenido: '<h3>Plantillas de Respuesta</h3>' +
      '<p>Crea y edita plantillas en HTML con variables dinamicas.</p>' +
      '<ul>' +
      '<li><strong>Variables:</strong> Usa <code>{{nombreVariable}}</code> para insertar datos del registro.</li>' +
      '<li><strong>Previsualizar:</strong> Haz click en "Previsualizar" para ver el resultado con datos reales.</li>' +
      '<li><strong>Firma:</strong> Cada plantilla puede incluir firma personalizada.</li>' +
      '</ul>'
  },
  {
    id: 'configuracion',
    titulo: 'Configuracion',
    contenido: '<h3>Configuracion</h3>' +
      '<p>Gestiona los servicios GAS y parametros de la extension.</p>' +
      '<ul>' +
      '<li><strong>Servicios GAS:</strong> Agrega multiples URLs con alias descriptivos.</li>' +
      '<li><strong>Intervalo:</strong> Configura cada cuanto se ejecuta el barrido automatico.</li>' +
      '<li><strong>Patrones:</strong> Personaliza las expresiones regulares de extraccion.</li>' +
      '</ul>'
  }
];

function obtenerSecciones() {
  return SECCIONES.map(s => ({ id: s.id, titulo: s.titulo, contenido: s.contenido }));
}

function obtenerSeccion(id) {
  return SECCIONES.find(s => s.id === id) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { obtenerSecciones, obtenerSeccion };
}
