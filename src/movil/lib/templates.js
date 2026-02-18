/**
 * templates.js - Modulo de plantillas de respuesta
 * Logica pura: CRUD, interpolacion, sanitizacion.
 */

let contadorId = 0;

function generarId() {
  contadorId++;
  return 'tpl_' + Date.now() + '_' + contadorId;
}

function crearPlantilla(alias, asunto, cuerpo, firma) {
  const ahora = new Date().toISOString();
  return {
    id: generarId(),
    alias,
    asunto,
    cuerpo,
    firma,
    created_at: ahora,
    updated_at: ahora
  };
}

function editarPlantilla(plantilla, cambios) {
  return {
    ...plantilla,
    ...cambios,
    id: plantilla.id,
    created_at: plantilla.created_at,
    updated_at: new Date().toISOString()
  };
}

function eliminarPlantilla(id, plantillas) {
  return plantillas.filter(p => p.id !== id);
}

function interpolar(texto, variables) {
  if (!texto) return texto;
  return texto.replace(/\{\{(\w+)\}\}/g, (match, nombre) => {
    return variables.hasOwnProperty(nombre) ? String(variables[nombre]) : match;
  });
}

function obtenerVariablesDisponibles() {
  return [
    { nombre: 'codCar', descripcion: 'Codigo de carga' },
    { nombre: 'nombreTransportista', descripcion: 'Nombre del transportista' },
    { nombre: 'codTra', descripcion: 'Codigo transportista' },
    { nombre: 'emailRemitente', descripcion: 'Email del remitente' },
    { nombre: 'interlocutor', descripcion: 'Interlocutor (de/para sin email propio)' },
    { nombre: 'referencia', descripcion: 'Referencia de la carga' },
    { nombre: 'asunto', descripcion: 'Asunto del correo original' },
    { nombre: 'fechaCorreo', descripcion: 'Fecha del correo' },
    { nombre: 'estado', descripcion: 'Estado del registro' },
    { nombre: 'tipoTarea', descripcion: 'Tipo de tarea' }
  ];
}

const TAGS_SEGUROS = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'blockquote', 'pre', 'code', 'hr', 'sub', 'sup'];

const ATRIBUTOS_SEGUROS = ['href', 'src', 'alt', 'title', 'class', 'style',
  'colspan', 'rowspan', 'target', 'width', 'height'];

function sanitizarHtml(html) {
  if (!html) return '';

  // 1. Eliminar tags peligrosos con contenido (script, style, iframe, object, embed, form)
  var limpio = html.replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Tags auto-cerrados peligrosos (sin cierre)
  limpio = limpio.replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi, '');

  // 2. Procesar tags restantes: permitir solo whitelist
  limpio = limpio.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, function(match, tag, attrs) {
    var tagLower = tag.toLowerCase();
    if (TAGS_SEGUROS.indexOf(tagLower) === -1) return '';

    // Tag de cierre: no tiene atributos
    if (match.charAt(1) === '/') return '</' + tagLower + '>';

    // Filtrar atributos: solo permitidos
    var attrLimpios = _filtrarAtributos(attrs);
    return '<' + tagLower + (attrLimpios ? ' ' + attrLimpios : '') + '>';
  });

  return limpio;
}

function _filtrarAtributos(attrsStr) {
  if (!attrsStr || !attrsStr.trim()) return '';
  var resultado = [];
  // Captura atributos: nombre="valor", nombre='valor', nombre=valor, nombre (sin valor)
  var regex = /([a-zA-Z_][\w-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  var m;
  while ((m = regex.exec(attrsStr)) !== null) {
    var nombre = m[1].toLowerCase();
    var valor = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] || ''));

    // Rechazar atributos on*
    if (nombre.indexOf('on') === 0 && nombre.length > 2) continue;
    // Solo atributos en whitelist
    if (ATRIBUTOS_SEGUROS.indexOf(nombre) === -1) continue;
    // Validar URLs en href/src
    if ((nombre === 'href' || nombre === 'src') && /^\s*(javascript|data|vbscript)\s*:/i.test(valor)) continue;

    resultado.push(nombre + '="' + valor + '"');
  }
  return resultado.join(' ');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearPlantilla,
    editarPlantilla,
    eliminarPlantilla,
    interpolar,
    obtenerVariablesDisponibles,
    sanitizarHtml
  };
}
