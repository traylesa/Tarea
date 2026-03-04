/**
 * test_endpoints_nuevos.js - Tests TDD para endpoints Tareas/Contactos/IA en Codigo.js
 * Patron AAA con mocks globales
 */

// Mocks globales
global.Logger = { log: jest.fn() };
global.ContentService = {
  createTextOutput: (text) => ({
    setMimeType: () => ({ getContent: () => text }),
    _text: text
  }),
  MimeType: { JSON: 'JSON' }
};

// Mock respuestaJson/respuestaError (mismas que Codigo.js)
function respuestaJson(data) {
  return { _json: data };
}
function respuestaError(mensaje) {
  return respuestaJson({ ok: false, error: mensaje });
}

// Helper para extraer resultado
function resultado(resp) { return resp._json; }

// --- Mocks de Adapters ---

let mockTareas = [];
let mockContactos = [];
let mockEntidades = [];
let mockCentros = [];

global.obtenerTareas = jest.fn(() => mockTareas);
global.crearTarea = jest.fn((t) => {
  var tarea = Object.assign({ id: 'T_MOCK_1', estado: 'PENDIENTE' }, t);
  mockTareas.push(tarea);
  return tarea;
});
global.actualizarTarea = jest.fn((id, campos) => {
  var idx = mockTareas.findIndex(t => t.id === id);
  if (idx === -1) return false;
  Object.assign(mockTareas[idx], campos);
  return true;
});
global.actualizarValoracionIA = jest.fn(() => true);
global.actualizarSubtareas = jest.fn(() => true);
global.valorarConIA = jest.fn(() => ({ prioridad: 4, horas: 6, riesgo: 'ALTO', justificacion: 'Test' }));
global.atomizarConIA = jest.fn(() => [
  { titulo: 'Sub1', descripcion: 'D1', rolSugerido: 'TECNICO', horasEstimadas: 2 },
  { titulo: 'Sub2', descripcion: 'D2', rolSugerido: 'ADMIN', horasEstimadas: 3 },
  { titulo: 'Sub3', descripcion: 'D3', rolSugerido: 'TECNICO', horasEstimadas: 1 }
]);

global.leerContactos = jest.fn(() => mockContactos);
global.buscarContactos = jest.fn((q) => mockContactos.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase())));
global.crearContacto = jest.fn((d) => {
  var c = Object.assign({ telefono: '+34612345678' }, d);
  mockContactos.push(c);
  return c;
});

global.leerEntidades = jest.fn(() => mockEntidades);
global.leerCentros = jest.fn(() => mockCentros);

global.obtenerEmailPropio = jest.fn(() => 'test@empresa.com');
global.ahoraLocalISO = jest.fn(() => '2026-03-04T10:00:00+01:00');

// --- Funciones accion (replican logica de Codigo.js) ---

function accionGetTareas() {
  return respuestaJson({ ok: true, tareas: obtenerTareas() });
}

function accionGetContactos() {
  return respuestaJson({ ok: true, contactos: leerContactos() });
}

function accionBuscarContactos(q) {
  if (!q) return accionGetContactos();
  return respuestaJson({ ok: true, contactos: buscarContactos(q) });
}

function accionGetEntidades() {
  return respuestaJson({ ok: true, entidades: leerEntidades() });
}

function accionGetCentros() {
  return respuestaJson({ ok: true, centros: leerCentros() });
}

function accionCrearTarea(body) {
  if (!body.titulo) return respuestaError('titulo es requerido');
  if (!body.creadoPor) body.creadoPor = obtenerEmailPropio();
  var tarea = crearTarea(body);
  return respuestaJson({ ok: true, tarea: tarea });
}

function accionActualizarTarea(body) {
  if (!body.id) return respuestaError('id es requerido');
  if (!body.campos) return respuestaError('campos es requerido');
  body.campos.actualizadoAt = ahoraLocalISO();
  var ok = actualizarTarea(body.id, body.campos);
  if (!ok) return respuestaError('Tarea no encontrada: ' + body.id);
  return respuestaJson({ ok: true });
}

function accionValorarTareaIA(body) {
  if (!body.id || !body.titulo) return respuestaError('id y titulo son requeridos');
  var valoracion = valorarConIA(body);
  if (!valoracion) return respuestaError('No se pudo valorar (API key o error)');
  actualizarValoracionIA(body.id, valoracion);
  return respuestaJson({ ok: true, valoracion: valoracion });
}

function accionAtomizarTareaIA(body) {
  if (!body.id || !body.descripcion) return respuestaError('id y descripcion son requeridos');
  var subtareas = atomizarConIA(body);
  if (!subtareas) return respuestaError('No se pudo atomizar (API key o error)');
  actualizarSubtareas(body.id, subtareas);
  return respuestaJson({ ok: true, subtareas: subtareas });
}

function accionCrearContacto(body) {
  if (!body.telefono) return respuestaError('telefono es requerido');
  if (!body.nombre) return respuestaError('nombre es requerido');
  if (!body.creadoPor) body.creadoPor = obtenerEmailPropio();
  try {
    var contacto = crearContacto(body);
    return respuestaJson({ ok: true, contacto: contacto });
  } catch (err) {
    return respuestaError(err.message);
  }
}

// === TESTS ===

describe('Endpoints GET', () => {
  beforeEach(() => {
    mockTareas = [];
    mockContactos = [];
    mockEntidades = [];
    mockCentros = [];
    jest.clearAllMocks();
  });

  describe('accionGetTareas', () => {
    test('retorna tareas del store', () => {
      mockTareas = [{ id: 'T1', titulo: 'Test' }];
      var res = resultado(accionGetTareas());
      expect(res.ok).toBe(true);
      expect(res.tareas).toHaveLength(1);
      expect(res.tareas[0].id).toBe('T1');
    });

    test('retorna array vacio sin tareas', () => {
      var res = resultado(accionGetTareas());
      expect(res.ok).toBe(true);
      expect(res.tareas).toEqual([]);
    });
  });

  describe('accionGetContactos', () => {
    test('retorna todos los contactos', () => {
      mockContactos = [{ nombre: 'Juan', telefono: '+34612345678' }];
      var res = resultado(accionGetContactos());
      expect(res.ok).toBe(true);
      expect(res.contactos).toHaveLength(1);
    });
  });

  describe('accionBuscarContactos', () => {
    test('busca por texto parcial', () => {
      mockContactos = [
        { nombre: 'Juan Garcia', telefono: '+34611111111' },
        { nombre: 'Maria Lopez', telefono: '+34622222222' }
      ];
      var res = resultado(accionBuscarContactos('juan'));
      expect(res.ok).toBe(true);
      expect(res.contactos).toHaveLength(1);
      expect(res.contactos[0].nombre).toBe('Juan Garcia');
    });

    test('sin query retorna todos', () => {
      mockContactos = [{ nombre: 'A', telefono: '1' }, { nombre: 'B', telefono: '2' }];
      var res = resultado(accionBuscarContactos(''));
      expect(res.contactos).toHaveLength(2);
    });
  });

  describe('accionGetEntidades', () => {
    test('retorna entidades', () => {
      mockEntidades = [{ id: 'E1', nombre: 'Empresa X' }];
      var res = resultado(accionGetEntidades());
      expect(res.ok).toBe(true);
      expect(res.entidades).toHaveLength(1);
    });
  });

  describe('accionGetCentros', () => {
    test('retorna centros', () => {
      mockCentros = [{ id: 'C1', nombre: 'Centro Madrid' }];
      var res = resultado(accionGetCentros());
      expect(res.ok).toBe(true);
      expect(res.centros).toHaveLength(1);
    });
  });
});

describe('Endpoints POST', () => {
  beforeEach(() => {
    mockTareas = [];
    mockContactos = [];
    jest.clearAllMocks();
  });

  describe('accionCrearTarea', () => {
    test('crea tarea con titulo', () => {
      var res = resultado(accionCrearTarea({ titulo: 'Nueva tarea' }));
      expect(res.ok).toBe(true);
      expect(res.tarea.titulo).toBe('Nueva tarea');
      expect(res.tarea.id).toBeTruthy();
    });

    test('asigna creadoPor automatico si no viene', () => {
      accionCrearTarea({ titulo: 'Test' });
      expect(crearTarea).toHaveBeenCalledWith(
        expect.objectContaining({ creadoPor: 'test@empresa.com' })
      );
    });

    test('rechaza sin titulo', () => {
      var res = resultado(accionCrearTarea({}));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('titulo');
    });
  });

  describe('accionActualizarTarea', () => {
    test('actualiza campos de tarea existente', () => {
      mockTareas = [{ id: 'T1', estado: 'PENDIENTE' }];
      var res = resultado(accionActualizarTarea({ id: 'T1', campos: { estado: 'EN_PROCESO' } }));
      expect(res.ok).toBe(true);
    });

    test('rechaza sin id', () => {
      var res = resultado(accionActualizarTarea({ campos: { estado: 'X' } }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('id');
    });

    test('rechaza sin campos', () => {
      var res = resultado(accionActualizarTarea({ id: 'T1' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('campos');
    });

    test('error si tarea no existe', () => {
      var res = resultado(accionActualizarTarea({ id: 'NO_EXISTE', campos: { estado: 'X' } }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('no encontrada');
    });

    test('añade actualizadoAt automaticamente', () => {
      mockTareas = [{ id: 'T1' }];
      accionActualizarTarea({ id: 'T1', campos: { estado: 'COMPLETADA' } });
      expect(actualizarTarea).toHaveBeenCalledWith('T1',
        expect.objectContaining({ actualizadoAt: '2026-03-04T10:00:00+01:00' })
      );
    });
  });

  describe('accionValorarTareaIA', () => {
    test('valora tarea y actualiza campos IA', () => {
      var res = resultado(accionValorarTareaIA({ id: 'T1', titulo: 'Test', descripcion: 'Desc' }));
      expect(res.ok).toBe(true);
      expect(res.valoracion.prioridad).toBe(4);
      expect(res.valoracion.riesgo).toBe('ALTO');
      expect(actualizarValoracionIA).toHaveBeenCalledWith('T1', expect.any(Object));
    });

    test('rechaza sin id o titulo', () => {
      var res = resultado(accionValorarTareaIA({ titulo: 'Solo titulo' }));
      expect(res.ok).toBe(false);
    });

    test('maneja error de IA (null)', () => {
      valorarConIA.mockReturnValueOnce(null);
      var res = resultado(accionValorarTareaIA({ id: 'T1', titulo: 'Test' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('No se pudo valorar');
    });
  });

  describe('accionAtomizarTareaIA', () => {
    test('atomiza tarea en subtareas', () => {
      var res = resultado(accionAtomizarTareaIA({ id: 'T1', titulo: 'Test', descripcion: 'Desc larga' }));
      expect(res.ok).toBe(true);
      expect(res.subtareas).toHaveLength(3);
      expect(actualizarSubtareas).toHaveBeenCalledWith('T1', expect.any(Array));
    });

    test('rechaza sin descripcion', () => {
      var res = resultado(accionAtomizarTareaIA({ id: 'T1', titulo: 'Test' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('descripcion');
    });

    test('maneja error de IA (null)', () => {
      atomizarConIA.mockReturnValueOnce(null);
      var res = resultado(accionAtomizarTareaIA({ id: 'T1', descripcion: 'Desc' }));
      expect(res.ok).toBe(false);
    });
  });

  describe('accionCrearContacto', () => {
    test('crea contacto con nombre y telefono', () => {
      var res = resultado(accionCrearContacto({
        nombre: 'Juan', telefono: '612345678'
      }));
      expect(res.ok).toBe(true);
      expect(res.contacto.nombre).toBe('Juan');
    });

    test('asigna creadoPor automatico', () => {
      accionCrearContacto({ nombre: 'Test', telefono: '611111111' });
      expect(crearContacto).toHaveBeenCalledWith(
        expect.objectContaining({ creadoPor: 'test@empresa.com' })
      );
    });

    test('rechaza sin telefono', () => {
      var res = resultado(accionCrearContacto({ nombre: 'Juan' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('telefono');
    });

    test('rechaza sin nombre', () => {
      var res = resultado(accionCrearContacto({ telefono: '612345678' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('nombre');
    });

    test('propaga error de duplicado', () => {
      crearContacto.mockImplementationOnce(() => { throw new Error('Contacto duplicado por telefono'); });
      var res = resultado(accionCrearContacto({ nombre: 'Dup', telefono: '612345678' }));
      expect(res.ok).toBe(false);
      expect(res.error).toContain('duplicado');
    });
  });
});
