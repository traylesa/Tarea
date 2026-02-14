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
    { nombre: 'asunto', descripcion: 'Asunto del correo original' },
    { nombre: 'fechaCorreo', descripcion: 'Fecha del correo' },
    { nombre: 'estado', descripcion: 'Estado del registro' },
    { nombre: 'tipoTarea', descripcion: 'Tipo de tarea' }
  ];
}

function sanitizarHtml(html) {
  if (!html) return '';
  let limpio = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  limpio = limpio.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  return limpio;
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
