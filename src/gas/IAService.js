// === TareaLog — IAService (Integracion con Gemini Flash 2.0) ===
// Fase C: Valoracion y atomizacion de tareas con IA

var GEMINI_MODEL = 'gemini-2.0-flash';
var GEMINI_TIMEOUT = 8000;

function _obtenerGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

function _llamarGemini(prompt, jsonSchema) {
  var apiKey = _obtenerGeminiApiKey();
  if (!apiKey) return null;

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    GEMINI_MODEL + ':generateContent?key=' + apiKey;

  try {
    var payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    if (jsonSchema) {
      payload.generationConfig.responseSchema = jsonSchema;
    }

    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var data = JSON.parse(res.getContentText());
    if (data.error) return null;

    var texto = data.candidates[0].content.parts[0].text;
    return JSON.parse(texto);
  } catch (e) {
    Logger.log('Error Gemini: ' + e.message);
    return null;
  }
}

function valorarConIA(tarea) {
  if (!tarea || !tarea.titulo) return null;

  var prompt = _construirPromptValoracion(tarea);
  var schema = {
    type: 'OBJECT',
    properties: {
      horas: { type: 'NUMBER' },
      prioridad: { type: 'INTEGER' },
      riesgo: { type: 'STRING', enum: ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] },
      justificacion: { type: 'STRING' }
    },
    required: ['horas', 'prioridad', 'riesgo']
  };

  return _llamarGemini(prompt, schema);
}

function atomizarConIA(tarea) {
  if (!tarea || !tarea.descripcion) return null;

  var prompt = _construirPromptAtomizacion(tarea);
  var resultado = _llamarGemini(prompt, null);

  if (!Array.isArray(resultado)) return null;
  if (resultado.length < 3 || resultado.length > 7) return null;

  return resultado;
}

function _construirPromptValoracion(tarea) {
  return 'Valora esta tarea profesional:\n' +
    'Titulo: ' + tarea.titulo + '\n' +
    'Descripcion: ' + (tarea.descripcion || 'Sin descripcion') + '\n' +
    'Responde con JSON: {horas, prioridad: 1-5, riesgo: BAJO|MEDIO|ALTO|CRITICO, justificacion}';
}

function _construirPromptAtomizacion(tarea) {
  return 'Divide esta tarea en 3-7 subtareas:\n' +
    'Titulo: ' + tarea.titulo + '\n' +
    'Descripcion: ' + tarea.descripcion + '\n' +
    'Roles disponibles: TECNICO, ADMINISTRATIVO, SUPERVISOR\n' +
    'Responde con array JSON: [{titulo, descripcion, rolSugerido, horasEstimadas}]';
}

// Patron dual-compat GAS/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    valorarConIA,
    atomizarConIA,
    _construirPromptValoracion,
    _construirPromptAtomizacion,
    _llamarGemini
  };
}
