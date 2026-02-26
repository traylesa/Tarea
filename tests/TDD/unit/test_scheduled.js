// Tests TDD para scheduled.js — Logica pura de envios programados

const {
  ESTADOS_PROGRAMADO,
  CAMPOS_EDITABLES_PROG,
  formatearEstadoProgramado,
  filtrarProgramados,
  ordenarPorFechaProgramada,
  formatearFechaCorta,
  contarPorEstado,
  esEditable,
  validarEdicionProgramado,
  buscarPorThread,
  buscarPendientesPorThread
} = require('../../../src/extension/scheduled');

// --- Datos de prueba ---

function crearProgramado(overrides) {
  return Object.assign({
    id: 'prog_1234_abcd',
    threadId: 'thread_001',
    interlocutor: 'test@example.com',
    asunto: 'Test asunto',
    cuerpo: '<p>Hola</p>',
    cc: '',
    bcc: '',
    fechaProgramada: '2026-02-15T10:00:00.000Z',
    estado: 'PENDIENTE',
    fechaEnvio: '',
    errorDetalle: '',
    creadoPor: 'admin@traylesa.com',
    creadoAt: '2026-02-14T08:00:00.000Z'
  }, overrides);
}

function crearListaMixta() {
  return [
    crearProgramado({ id: 'p1', estado: 'PENDIENTE', fechaProgramada: '2026-02-15T10:00:00Z' }),
    crearProgramado({ id: 'p2', estado: 'ENVIADO', fechaProgramada: '2026-02-14T08:00:00Z' }),
    crearProgramado({ id: 'p3', estado: 'ERROR', fechaProgramada: '2026-02-16T12:00:00Z' }),
    crearProgramado({ id: 'p4', estado: 'CANCELADO', fechaProgramada: '2026-02-13T06:00:00Z' }),
    crearProgramado({ id: 'p5', estado: 'PENDIENTE', fechaProgramada: '2026-02-17T09:00:00Z' })
  ];
}

// === TESTS ===

describe('ESTADOS_PROGRAMADO', () => {
  test('contiene los 4 estados', () => {
    expect(Object.keys(ESTADOS_PROGRAMADO)).toEqual(['PENDIENTE', 'ENVIADO', 'ERROR', 'CANCELADO']);
  });

  test('cada estado tiene icono, clase y texto', () => {
    Object.values(ESTADOS_PROGRAMADO).forEach(estado => {
      expect(estado).toHaveProperty('icono');
      expect(estado).toHaveProperty('clase');
      expect(estado).toHaveProperty('texto');
    });
  });
});

describe('formatearEstadoProgramado', () => {
  test('PENDIENTE retorna datos correctos', () => {
    var result = formatearEstadoProgramado('PENDIENTE');
    expect(result.icono).toBe('\u23F3');
    expect(result.clase).toBe('prog-pendiente');
    expect(result.texto).toBe('Pendiente');
    expect(result.html).toBe('\u23F3 Pendiente');
  });

  test('ENVIADO retorna datos correctos', () => {
    var result = formatearEstadoProgramado('ENVIADO');
    expect(result.icono).toBe('\u2705');
    expect(result.clase).toBe('prog-enviado');
    expect(result.texto).toBe('Enviado');
  });

  test('ERROR retorna datos correctos', () => {
    var result = formatearEstadoProgramado('ERROR');
    expect(result.icono).toBe('\u274C');
    expect(result.clase).toBe('prog-error');
    expect(result.texto).toBe('Error');
  });

  test('CANCELADO retorna datos correctos', () => {
    var result = formatearEstadoProgramado('CANCELADO');
    expect(result.icono).toBe('\u26D4');
    expect(result.clase).toBe('prog-cancelado');
    expect(result.texto).toBe('Cancelado');
  });

  test('estado desconocido retorna fallback', () => {
    var result = formatearEstadoProgramado('INVENTADO');
    expect(result.icono).toBe('\u2753');
    expect(result.texto).toBe('INVENTADO');
  });

  test('null retorna fallback con texto Desconocido', () => {
    var result = formatearEstadoProgramado(null);
    expect(result.icono).toBe('\u2753');
    expect(result.texto).toBe('Desconocido');
  });

  test('undefined retorna fallback', () => {
    var result = formatearEstadoProgramado(undefined);
    expect(result.texto).toBe('Desconocido');
  });
});

describe('filtrarProgramados', () => {
  var lista = crearListaMixta();

  test('TODOS retorna lista completa', () => {
    expect(filtrarProgramados(lista, 'TODOS')).toHaveLength(5);
  });

  test('null retorna lista completa', () => {
    expect(filtrarProgramados(lista, null)).toHaveLength(5);
  });

  test('string vacio retorna lista completa', () => {
    expect(filtrarProgramados(lista, '')).toHaveLength(5);
  });

  test('PENDIENTE retorna solo pendientes', () => {
    var result = filtrarProgramados(lista, 'PENDIENTE');
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.estado).toBe('PENDIENTE'));
  });

  test('ENVIADO retorna solo enviados', () => {
    var result = filtrarProgramados(lista, 'ENVIADO');
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('ENVIADO');
  });

  test('ERROR retorna solo errores', () => {
    var result = filtrarProgramados(lista, 'ERROR');
    expect(result).toHaveLength(1);
  });

  test('CANCELADO retorna solo cancelados', () => {
    var result = filtrarProgramados(lista, 'CANCELADO');
    expect(result).toHaveLength(1);
  });

  test('lista vacia retorna array vacio', () => {
    expect(filtrarProgramados([], 'PENDIENTE')).toEqual([]);
  });

  test('estado inexistente retorna array vacio', () => {
    expect(filtrarProgramados(lista, 'INVENTADO')).toHaveLength(0);
  });
});

describe('ordenarPorFechaProgramada', () => {
  test('ordena descendente por fecha', () => {
    var lista = crearListaMixta();
    var result = ordenarPorFechaProgramada(lista);
    expect(result[0].id).toBe('p5'); // 2026-02-17
    expect(result[1].id).toBe('p3'); // 2026-02-16
    expect(result[2].id).toBe('p1'); // 2026-02-15
    expect(result[3].id).toBe('p2'); // 2026-02-14
    expect(result[4].id).toBe('p4'); // 2026-02-13
  });

  test('lista vacia retorna array vacio', () => {
    expect(ordenarPorFechaProgramada([])).toEqual([]);
  });

  test('no muta array original', () => {
    var lista = crearListaMixta();
    var idOriginal = lista[0].id;
    ordenarPorFechaProgramada(lista);
    expect(lista[0].id).toBe(idOriginal);
  });

  test('maneja fechas nulas', () => {
    var lista = [
      crearProgramado({ id: 'a', fechaProgramada: '2026-02-15T10:00:00Z' }),
      crearProgramado({ id: 'b', fechaProgramada: null }),
      crearProgramado({ id: 'c', fechaProgramada: '2026-02-16T10:00:00Z' })
    ];
    var result = ordenarPorFechaProgramada(lista);
    expect(result[0].id).toBe('c');
    expect(result[result.length - 1].id).toBe('b');
  });
});

describe('formatearFechaCorta', () => {
  test('formatea fecha ISO correctamente', () => {
    var result = formatearFechaCorta('2026-02-15T10:30:00.000Z');
    // El formato depende del locale del sistema, verificamos que no sea '--'
    expect(result).not.toBe('--');
    expect(result.length).toBeGreaterThan(5);
  });

  test('string vacio retorna --', () => {
    expect(formatearFechaCorta('')).toBe('--');
  });

  test('null retorna --', () => {
    expect(formatearFechaCorta(null)).toBe('--');
  });

  test('undefined retorna --', () => {
    expect(formatearFechaCorta(undefined)).toBe('--');
  });

  test('fecha invalida retorna string original', () => {
    expect(formatearFechaCorta('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('contarPorEstado', () => {
  test('cuenta correctamente lista mixta', () => {
    var lista = crearListaMixta();
    var result = contarPorEstado(lista);
    expect(result.PENDIENTE).toBe(2);
    expect(result.ENVIADO).toBe(1);
    expect(result.ERROR).toBe(1);
    expect(result.CANCELADO).toBe(1);
  });

  test('lista vacia retorna todos en 0', () => {
    var result = contarPorEstado([]);
    expect(result.PENDIENTE).toBe(0);
    expect(result.ENVIADO).toBe(0);
    expect(result.ERROR).toBe(0);
    expect(result.CANCELADO).toBe(0);
  });

  test('lista solo pendientes', () => {
    var lista = [
      crearProgramado({ estado: 'PENDIENTE' }),
      crearProgramado({ estado: 'PENDIENTE' }),
      crearProgramado({ estado: 'PENDIENTE' })
    ];
    var result = contarPorEstado(lista);
    expect(result.PENDIENTE).toBe(3);
    expect(result.ENVIADO).toBe(0);
  });

  test('ignora estados desconocidos sin error', () => {
    var lista = [
      crearProgramado({ estado: 'INVENTADO' }),
      crearProgramado({ estado: 'PENDIENTE' })
    ];
    var result = contarPorEstado(lista);
    expect(result.PENDIENTE).toBe(1);
  });
});

// === Nuevas funciones: edicion y busqueda ===

describe('esEditable', () => {
  test('PENDIENTE es editable', () => {
    expect(esEditable(crearProgramado({ estado: 'PENDIENTE' }))).toBe(true);
  });

  test('ENVIADO no es editable', () => {
    expect(esEditable(crearProgramado({ estado: 'ENVIADO' }))).toBe(false);
  });

  test('ERROR es editable para corregir y reactivar', () => {
    expect(esEditable(crearProgramado({ estado: 'ERROR' }))).toBe(true);
  });

  test('CANCELADO no es editable', () => {
    expect(esEditable(crearProgramado({ estado: 'CANCELADO' }))).toBe(false);
  });

  test('null retorna false', () => {
    expect(esEditable(null)).toBe(false);
  });

  test('undefined retorna false', () => {
    expect(esEditable(undefined)).toBe(false);
  });
});

describe('validarEdicionProgramado', () => {
  test('cambios validos aceptados', () => {
    var r = validarEdicionProgramado({ asunto: 'Nuevo asunto' });
    expect(r.valido).toBe(true);
  });

  test('multiples campos validos', () => {
    var r = validarEdicionProgramado({ asunto: 'X', cuerpo: 'Y', cc: 'a@b.com' });
    expect(r.valido).toBe(true);
  });

  test('campo no editable rechazado', () => {
    var r = validarEdicionProgramado({ estado: 'ENVIADO' });
    expect(r.valido).toBe(false);
    expect(r.error).toContain('estado');
  });

  test('campo id rechazado', () => {
    var r = validarEdicionProgramado({ id: 'nuevo_id' });
    expect(r.valido).toBe(false);
  });

  test('sin cambios rechazado', () => {
    var r = validarEdicionProgramado({});
    expect(r.valido).toBe(false);
    expect(r.error).toContain('Sin cambios');
  });

  test('null rechazado', () => {
    var r = validarEdicionProgramado(null);
    expect(r.valido).toBe(false);
  });

  test('fecha invalida rechazada', () => {
    var r = validarEdicionProgramado({ fechaProgramada: 'no-es-fecha' });
    expect(r.valido).toBe(false);
    expect(r.error).toContain('Fecha invalida');
  });

  test('fecha valida aceptada', () => {
    var r = validarEdicionProgramado({ fechaProgramada: '2026-03-01T10:00:00.000Z' });
    expect(r.valido).toBe(true);
  });

  test('todos los campos editables aceptados', () => {
    var cambios = {};
    CAMPOS_EDITABLES_PROG.forEach(function(c) { cambios[c] = 'test'; });
    // fechaProgramada necesita formato valido
    cambios.fechaProgramada = '2026-03-01T10:00:00Z';
    var r = validarEdicionProgramado(cambios);
    expect(r.valido).toBe(true);
  });
});

describe('buscarPorThread', () => {
  var lista = [
    crearProgramado({ id: 'p1', threadId: 'thread_A' }),
    crearProgramado({ id: 'p2', threadId: 'thread_B' }),
    crearProgramado({ id: 'p3', threadId: 'thread_A' }),
    crearProgramado({ id: 'p4', threadId: 'thread_C' })
  ];

  test('encuentra programados del thread', () => {
    var r = buscarPorThread(lista, 'thread_A');
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe('p1');
    expect(r[1].id).toBe('p3');
  });

  test('thread sin programados retorna vacio', () => {
    expect(buscarPorThread(lista, 'thread_X')).toHaveLength(0);
  });

  test('lista null retorna vacio', () => {
    expect(buscarPorThread(null, 'thread_A')).toHaveLength(0);
  });

  test('threadId null retorna vacio', () => {
    expect(buscarPorThread(lista, null)).toHaveLength(0);
  });
});

describe('buscarPendientesPorThread', () => {
  var lista = [
    crearProgramado({ id: 'p1', threadId: 'thread_A', estado: 'PENDIENTE' }),
    crearProgramado({ id: 'p2', threadId: 'thread_A', estado: 'ENVIADO' }),
    crearProgramado({ id: 'p3', threadId: 'thread_A', estado: 'PENDIENTE' }),
    crearProgramado({ id: 'p4', threadId: 'thread_B', estado: 'PENDIENTE' })
  ];

  test('solo retorna pendientes del thread', () => {
    var r = buscarPendientesPorThread(lista, 'thread_A');
    expect(r).toHaveLength(2);
    r.forEach(function(p) { expect(p.estado).toBe('PENDIENTE'); });
  });

  test('thread sin pendientes retorna vacio', () => {
    var lista2 = [crearProgramado({ threadId: 'thread_X', estado: 'ENVIADO' })];
    expect(buscarPendientesPorThread(lista2, 'thread_X')).toHaveLength(0);
  });
});
