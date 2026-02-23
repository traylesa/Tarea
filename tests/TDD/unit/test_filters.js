const {
  construirFiltros,
  filtroRangoFechas,
  obtenerBaterias,
  limpiarFiltros,
  filtroGlobal,
  contarFiltrosActivos,
  filtroRangoCarga,
  filtroRangoDescarga,
  filtroFases,
  filtroEstados,
  aplicarCambioMasivo
} = require('../../../src/extension/filters');

describe('filters', () => {
  describe('construirFiltros', () => {
    test('construye filtro "contiene" para un campo', () => {
      const defs = [{ campo: 'emailRemitente', operador: 'contiene', valor: 'gmail' }];
      const result = construirFiltros(defs);

      expect(result[0]).toMatchObject({ field: 'emailRemitente', type: 'like', value: 'gmail' });
      expect(result[0].func).toEqual(expect.any(Function));
    });

    test('filtro "contiene" es case-insensitive', () => {
      const defs = [{ campo: 'estado', operador: 'contiene', valor: 'envi' }];
      const filtroFn = construirFiltros(defs)[0].func;

      // Tabulator llama func(filterValue, cellValue)
      expect(filtroFn('envi', 'ENVIADO')).toBe(true);
      expect(filtroFn('envi', 'enviado')).toBe(true);
      expect(filtroFn('ENVI', 'enviado')).toBe(true);
      expect(filtroFn('envi', 'RECIBIDO')).toBe(false);
      expect(filtroFn('envi', null)).toBe(false);
    });

    test('construye filtro "no contiene" para un campo', () => {
      const defs = [{ campo: 'emailRemitente', operador: 'no_contiene', valor: 'spam' }];
      const result = construirFiltros(defs);

      expect(result).toEqual([{ field: 'emailRemitente', type: '!=', value: 'spam', func: expect.any(Function) }]);
    });

    test('filtro "no contiene" excluye registros correctamente', () => {
      const defs = [{ campo: 'emailRemitente', operador: 'no_contiene', valor: 'spam' }];
      const filtroFn = construirFiltros(defs)[0].func;

      // Tabulator llama func(filterValue, cellValue)
      expect(filtroFn('spam', 'buencorreo@gmail.com')).toBe(true);
      expect(filtroFn('spam', 'spam@correo.com')).toBe(false);
      expect(filtroFn('spam', null)).toBe(true);
    });

    test('filtro "no contiene" es case-insensitive', () => {
      const defs = [{ campo: 'estado', operador: 'no_contiene', valor: 'nada' }];
      const filtroFn = construirFiltros(defs)[0].func;

      // "ENVIADO" no contiene "nada" → true (debe pasar)
      expect(filtroFn('nada', 'ENVIADO')).toBe(true);
      expect(filtroFn('NADA', 'ENVIADO')).toBe(true);
      // "NADA" contiene "nada" → false (debe excluir)
      expect(filtroFn('nada', 'NADA')).toBe(false);
      expect(filtroFn('NADA', 'nada')).toBe(false);
    });

    test('filtro "igual" es case-insensitive', () => {
      const defs = [{ campo: 'estado', operador: 'igual', valor: 'enviado' }];
      const filtroFn = construirFiltros(defs)[0].func;

      expect(filtroFn('enviado', 'ENVIADO')).toBe(true);
      expect(filtroFn('ENVIADO', 'enviado')).toBe(true);
      expect(filtroFn('enviado', 'RECIBIDO')).toBe(false);
      expect(filtroFn('enviado', null)).toBe(false);
    });

    test('combina multiples filtros con AND', () => {
      const defs = [
        { campo: 'emailRemitente', operador: 'contiene', valor: 'gmail' },
        { campo: 'estado', operador: 'igual', valor: 'ALERTA' }
      ];
      const result = construirFiltros(defs);

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('emailRemitente');
      expect(result[1].field).toBe('estado');
    });

    test('retorna array vacio para definiciones vacias', () => {
      expect(construirFiltros([])).toEqual([]);
    });

    test('ignora definiciones sin valor', () => {
      const defs = [{ campo: 'email', operador: 'contiene', valor: '' }];
      expect(construirFiltros(defs)).toEqual([]);
    });

    test('construye filtro "<" (menor que)', () => {
      const defs = [{ campo: 'codCar', operador: '<', valor: '168000' }];
      const result = construirFiltros(defs);

      expect(result).toEqual([{ field: 'codCar', type: '<', value: '168000' }]);
    });

    test('construye filtro "<=" (menor o igual)', () => {
      const defs = [{ campo: 'codCar', operador: '<=', valor: '168000' }];
      const result = construirFiltros(defs);

      expect(result).toEqual([{ field: 'codCar', type: '<=', value: '168000' }]);
    });

    test('construye filtro ">" (mayor que)', () => {
      const defs = [{ campo: 'codCar', operador: '>', valor: '168000' }];
      const result = construirFiltros(defs);

      expect(result).toEqual([{ field: 'codCar', type: '>', value: '168000' }]);
    });

    test('construye filtro ">=" (mayor o igual)', () => {
      const defs = [{ campo: 'codCar', operador: '>=', valor: '168000' }];
      const result = construirFiltros(defs);

      expect(result).toEqual([{ field: 'codCar', type: '>=', value: '168000' }]);
    });
  });

  describe('filtroRangoFechas', () => {
    const registros = [
      { fechaCorreo: '2026-02-01T10:00:00Z' },
      { fechaCorreo: '2026-02-10T10:00:00Z' },
      { fechaCorreo: '2026-02-20T10:00:00Z' },
      { fechaCorreo: '2026-03-01T10:00:00Z' }
    ];

    test('filtra entre dos fechas', () => {
      const filtro = filtroRangoFechas('2026-02-05', '2026-02-15');

      const filtrados = registros.filter(r => filtro(r.fechaCorreo));
      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].fechaCorreo).toContain('2026-02-10');
    });

    test('filtra solo con fecha inicio', () => {
      const filtro = filtroRangoFechas('2026-02-15', null);

      const filtrados = registros.filter(r => filtro(r.fechaCorreo));
      expect(filtrados).toHaveLength(2);
    });

    test('filtra solo con fecha fin', () => {
      const filtro = filtroRangoFechas(null, '2026-02-15');

      const filtrados = registros.filter(r => filtro(r.fechaCorreo));
      expect(filtrados).toHaveLength(2);
    });

    test('retorna true para todo si sin fechas', () => {
      const filtro = filtroRangoFechas(null, null);
      expect(filtro('2026-01-01')).toBe(true);
    });

    test('incluirSinFecha=true incluye registros con fecha null', () => {
      const filtro = filtroRangoFechas('2026-02-01', '2026-02-28', true);

      expect(filtro(null)).toBe(true);
      expect(filtro(undefined)).toBe(true);
    });

    test('incluirSinFecha=true incluye registros con fecha vacia', () => {
      const filtro = filtroRangoFechas('2026-02-01', '2026-02-28', true);

      expect(filtro('')).toBe(true);
    });

    test('incluirSinFecha=false excluye registros con fecha null', () => {
      const filtro = filtroRangoFechas('2026-02-01', '2026-02-28', false);

      expect(filtro(null)).toBe(false);
      expect(filtro('')).toBe(false);
    });

    test('incluirSinFecha=true incluye null Y fechas en rango', () => {
      const filtro = filtroRangoFechas('2026-02-05', '2026-02-15', true);

      expect(filtro(null)).toBe(true);
      expect(filtro('2026-02-10T10:00:00Z')).toBe(true);
      expect(filtro('2026-03-01T10:00:00Z')).toBe(false);
    });
  });

  describe('filtroRangoCarga', () => {
    test('incluye registros con fCarga entre hoy y manana', () => {
      const hoy = new Date('2026-02-14');
      const filtro = filtroRangoCarga(hoy);

      expect(filtro('2026-02-14')).toBe(true);
      expect(filtro('2026-02-15')).toBe(true);
      expect(filtro('2026-02-13')).toBe(false);
      expect(filtro('2026-02-16')).toBe(false);
    });

    test('retorna false para valor null o vacio', () => {
      const hoy = new Date('2026-02-14');
      const filtro = filtroRangoCarga(hoy);

      expect(filtro(null)).toBe(false);
      expect(filtro('')).toBe(false);
      expect(filtro(undefined)).toBe(false);
    });
  });

  describe('filtroRangoDescarga', () => {
    test('incluye registros con fEntrega entre ayer y hoy', () => {
      const hoy = new Date('2026-02-14');
      const filtro = filtroRangoDescarga(hoy);

      expect(filtro('2026-02-13')).toBe(true);
      expect(filtro('2026-02-14')).toBe(true);
      expect(filtro('2026-02-12')).toBe(false);
      expect(filtro('2026-02-15')).toBe(false);
    });

    test('retorna false para valor null o vacio', () => {
      const hoy = new Date('2026-02-14');
      const filtro = filtroRangoDescarga(hoy);

      expect(filtro(null)).toBe(false);
      expect(filtro('')).toBe(false);
    });
  });

  describe('filtroFases', () => {
    test('acepta registros cuya fase esta en la lista activa', () => {
      const filtro = filtroFases(['11', '12', '19']);

      expect(filtro('11')).toBe(true);
      expect(filtro('12')).toBe(true);
      expect(filtro('19')).toBe(true);
      expect(filtro('00')).toBe(false);
      expect(filtro('30')).toBe(false);
    });

    test('rechaza todo si fasesActivas esta vacio', () => {
      const filtro = filtroFases([]);

      expect(filtro('11')).toBe(false);
      expect(filtro('00')).toBe(false);
    });

    test('acepta todo si fasesActivas es null', () => {
      const filtro = filtroFases(null);

      expect(filtro('11')).toBe(true);
      expect(filtro('00')).toBe(true);
    });

    test('maneja fase null o undefined del registro', () => {
      const filtro = filtroFases(['11']);

      expect(filtro(null)).toBe(false);
      expect(filtro(undefined)).toBe(false);
      expect(filtro('')).toBe(false);
    });

    test('__SIN_FASE__ incluye registros con fase null', () => {
      const filtro = filtroFases(['__SIN_FASE__']);

      expect(filtro(null)).toBe(true);
      expect(filtro(undefined)).toBe(true);
    });

    test('__SIN_FASE__ incluye registros con fase vacia', () => {
      const filtro = filtroFases(['__SIN_FASE__']);

      expect(filtro('')).toBe(true);
    });

    test('sin __SIN_FASE__ excluye registros con fase null', () => {
      const filtro = filtroFases(['05', '11']);

      expect(filtro(null)).toBe(false);
      expect(filtro('')).toBe(false);
    });

    test('combina __SIN_FASE__ con fases normales', () => {
      const filtro = filtroFases(['05', '__SIN_FASE__']);

      expect(filtro('05')).toBe(true);
      expect(filtro(null)).toBe(true);
      expect(filtro('')).toBe(true);
      expect(filtro('11')).toBe(false);
    });
  });

  describe('filtroEstados', () => {
    test('null retorna siempre true (sin filtro)', () => {
      const filtro = filtroEstados(null);
      expect(filtro('NUEVO')).toBe(true);
      expect(filtro('ALERTA')).toBe(true);
      expect(filtro(null)).toBe(true);
    });

    test('array vacio retorna siempre false', () => {
      const filtro = filtroEstados([]);
      expect(filtro('NUEVO')).toBe(false);
      expect(filtro('ALERTA')).toBe(false);
    });

    test('array con estados filtra correctamente', () => {
      const filtro = filtroEstados(['NUEVO', 'PENDIENTE']);
      expect(filtro('NUEVO')).toBe(true);
      expect(filtro('PENDIENTE')).toBe(true);
      expect(filtro('ALERTA')).toBe(false);
      expect(filtro('GESTIONADO')).toBe(false);
    });

    test('valor null o undefined no pasa el filtro', () => {
      const filtro = filtroEstados(['NUEVO']);
      expect(filtro(null)).toBe(false);
      expect(filtro(undefined)).toBe(false);
      expect(filtro('')).toBe(false);
    });

    test('comparacion exacta (no substring)', () => {
      const filtro = filtroEstados(['NUEVO']);
      expect(filtro('NUEVO')).toBe(true);
      expect(filtro('NUEVOS')).toBe(false);
      expect(filtro('NU')).toBe(false);
    });
  });

  describe('aplicarCambioMasivo', () => {
    const registros = [
      { messageId: 'msg1', estado: 'RECIBIDO', fase: '00' },
      { messageId: 'msg2', estado: 'RECIBIDO', fase: '00' },
      { messageId: 'msg3', estado: 'ENVIADO', fase: '11' }
    ];

    test('actualiza campo en registros seleccionados', () => {
      const result = aplicarCambioMasivo(registros, ['msg1', 'msg2'], 'fase', '19');

      expect(result[0].fase).toBe('19');
      expect(result[1].fase).toBe('19');
      expect(result[2].fase).toBe('11');
    });

    test('no modifica el array original (inmutable)', () => {
      const original = JSON.parse(JSON.stringify(registros));
      aplicarCambioMasivo(registros, ['msg1'], 'estado', 'GESTIONADO');

      expect(registros).toEqual(original);
    });

    test('retorna copia completa si idsSeleccionados esta vacio', () => {
      const result = aplicarCambioMasivo(registros, [], 'fase', '19');

      expect(result).toHaveLength(3);
      expect(result[0].fase).toBe('00');
    });

    test('actualiza campo estado correctamente', () => {
      const result = aplicarCambioMasivo(registros, ['msg3'], 'estado', 'GESTIONADO');

      expect(result[2].estado).toBe('GESTIONADO');
      expect(result[0].estado).toBe('RECIBIDO');
    });

    test('ignora ids que no existen en registros', () => {
      const result = aplicarCambioMasivo(registros, ['msgNoExiste'], 'fase', '30');

      expect(result[0].fase).toBe('00');
      expect(result[1].fase).toBe('00');
      expect(result[2].fase).toBe('11');
    });
  });

  describe('obtenerBaterias', () => {
    test('retorna al menos 5 baterias predefinidas', () => {
      const baterias = obtenerBaterias();
      expect(baterias.length).toBeGreaterThanOrEqual(5);
    });

    test('cada bateria tiene nombre y filtros', () => {
      const baterias = obtenerBaterias();
      baterias.forEach(b => {
        expect(b).toHaveProperty('nombre');
        expect(b).toHaveProperty('filtros');
        expect(Array.isArray(b.filtros)).toBe(true);
      });
    });

    test('contiene bateria "Alertas activas"', () => {
      const baterias = obtenerBaterias();
      const alertas = baterias.find(b => b.nombre === 'Alertas activas');
      expect(alertas).toBeDefined();
      expect(alertas.filtros).toContainEqual({ field: 'estado', type: '=', value: 'ALERTA' });
    });

    test('contiene bateria "Sin vincular"', () => {
      const baterias = obtenerBaterias();
      const sinVinc = baterias.find(b => b.nombre === 'Sin vincular');
      expect(sinVinc).toBeDefined();
      expect(sinVinc.filtros).toContainEqual({ field: 'vinculacion', type: '=', value: 'SIN_VINCULAR' });
    });

    test('contiene bateria "Sin fase"', () => {
      const baterias = obtenerBaterias();
      const sinFase = baterias.find(b => b.nombre === 'Sin fase');
      expect(sinFase).toBeDefined();
      expect(sinFase.filtros).toContainEqual({ field: 'fase', type: '=', value: '' });
    });

    test('contiene bateria "Sin fecha carga"', () => {
      const baterias = obtenerBaterias();
      const sinFCarga = baterias.find(b => b.nombre === 'Sin fecha carga');
      expect(sinFCarga).toBeDefined();
      expect(sinFCarga.filtros).toContainEqual({ field: 'fCarga', type: '=', value: '' });
    });
  });

  describe('limpiarFiltros', () => {
    test('retorna array vacio', () => {
      expect(limpiarFiltros()).toEqual([]);
    });
  });

  describe('filtroGlobal', () => {
    const campos = ['estado', 'codCar', 'nombreTransportista', 'emailRemitente', 'asunto'];

    test('busca texto en todos los campos dados', () => {
      const filtro = filtroGlobal('Garcia', campos);
      const fila1 = { estado: 'ENVIADO', codCar: 100, nombreTransportista: 'Transportes Garcia', emailRemitente: 'a@test.com', asunto: 'Carga' };
      const fila2 = { estado: 'ENVIADO', codCar: 200, nombreTransportista: 'Transportes Lopez', emailRemitente: 'b@test.com', asunto: 'Otro' };

      expect(filtro(fila1)).toBe(true);
      expect(filtro(fila2)).toBe(false);
    });

    test('busqueda es case insensitive', () => {
      const filtro = filtroGlobal('garcia', campos);
      const fila = { estado: 'ENVIADO', codCar: 100, nombreTransportista: 'Transportes GARCIA SL', emailRemitente: 'a@test.com', asunto: 'Carga' };

      expect(filtro(fila)).toBe(true);
    });

    test('texto vacio retorna funcion que acepta todo', () => {
      const filtro = filtroGlobal('', campos);

      expect(filtro({ estado: 'cualquier', codCar: 1 })).toBe(true);
    });

    test('busca en campos numericos convertidos a string', () => {
      const filtro = filtroGlobal('168', campos);
      const fila = { estado: 'ENVIADO', codCar: 168345, nombreTransportista: 'Trans', emailRemitente: 'a@test.com', asunto: 'Carga' };

      expect(filtro(fila)).toBe(true);
    });

    test('retorna false si ningun campo coincide', () => {
      const filtro = filtroGlobal('ZZZZZZZ', campos);
      const fila = { estado: 'ENVIADO', codCar: 100, nombreTransportista: 'Trans', emailRemitente: 'a@test.com', asunto: 'Carga' };

      expect(filtro(fila)).toBe(false);
    });

    test('maneja campos null o undefined sin error', () => {
      const filtro = filtroGlobal('test', campos);
      const fila = { estado: null, codCar: undefined, nombreTransportista: '', emailRemitente: 'test@t.com', asunto: null };

      expect(filtro(fila)).toBe(true);
    });

    test('busca en campos nuevos zona y zDest', () => {
      const camposAmpliados = [...campos, 'zona', 'zDest', 'fCarga', 'fEntrega'];
      const filtro = filtroGlobal('MADRID', camposAmpliados);
      const fila = { estado: 'ENVIADO', codCar: 100, nombreTransportista: 'Trans', emailRemitente: 'a@test.com', asunto: 'Carga', zona: 'MADRID', zDest: 'BARCELONA' };

      expect(filtro(fila)).toBe(true);
    });
  });

  describe('contarFiltrosActivos', () => {
    test('retorna 0 cuando no hay filtros', () => {
      expect(contarFiltrosActivos(0, false, false)).toBe(0);
    });

    test('cuenta filtros Tabulator activos', () => {
      expect(contarFiltrosActivos(3, false, false)).toBe(3);
    });

    test('suma 1 si hay filtro global activo', () => {
      expect(contarFiltrosActivos(2, true, false)).toBe(3);
    });

    test('suma 1 si hay rango de fechas activo', () => {
      expect(contarFiltrosActivos(0, false, true)).toBe(1);
    });

    test('suma todo: tabulator + global + fechas', () => {
      expect(contarFiltrosActivos(3, true, true)).toBe(5);
    });
  });
});
