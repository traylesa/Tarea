/**
 * test_action_rules.js - Tests TDD para motor de reglas parametrizable
 * Sistema de acciones al cambiar fase/estado
 */

const {
  crearRegla,
  editarRegla,
  eliminarRegla,
  duplicarRegla,
  evaluarReglas,
  validarRegla,
  generarReglasDefault,
  obtenerAccionesDesdeReglas,
  TIPOS_ACCION_REGLA,
  NOMBRES_ACCION_REGLA
} = require('../../../src/extension/action-rules.js');

describe('action-rules.js', () => {

  // --- Constantes ---

  describe('TIPOS_ACCION_REGLA', () => {
    test('contiene los 8 tipos definidos', () => {
      expect(Object.keys(TIPOS_ACCION_REGLA)).toHaveLength(8);
      expect(TIPOS_ACCION_REGLA.PROPAGAR_HILO).toBe('PROPAGAR_HILO');
      expect(TIPOS_ACCION_REGLA.SUGERIR_RECORDATORIO).toBe('SUGERIR_RECORDATORIO');
      expect(TIPOS_ACCION_REGLA.MOSTRAR_AVISO).toBe('MOSTRAR_AVISO');
    });

    test('NOMBRES_ACCION_REGLA tiene entrada para cada tipo', () => {
      Object.keys(TIPOS_ACCION_REGLA).forEach(tipo => {
        expect(NOMBRES_ACCION_REGLA[tipo]).toBeDefined();
        expect(typeof NOMBRES_ACCION_REGLA[tipo]).toBe('string');
      });
    });
  });

  // --- crearRegla ---

  describe('crearRegla', () => {
    test('crea regla con todos los campos', () => {
      var regla = crearRegla(
        'Test regla',
        { campo: 'fase', valor: '19' },
        [{ tipo: 'MOSTRAR_AVISO', params: { mensaje: 'Hola' } }],
        10
      );

      expect(regla.id).toMatch(/^regla_/);
      expect(regla.nombre).toBe('Test regla');
      expect(regla.activa).toBe(true);
      expect(regla.condicion.campo).toBe('fase');
      expect(regla.condicion.valor).toBe('19');
      expect(regla.condicion.faseOrigen).toBeNull();
      expect(regla.acciones).toHaveLength(1);
      expect(regla.orden).toBe(10);
      expect(regla.origen).toBe('usuario');
    });

    test('usa wildcard si valor no se proporciona', () => {
      var regla = crearRegla(
        'Wildcard',
        { campo: 'estado' },
        [{ tipo: 'PROPAGAR_HILO' }]
      );
      expect(regla.condicion.valor).toBe('*');
    });

    test('usa orden 100 por defecto', () => {
      var regla = crearRegla(
        'Default orden',
        { campo: 'fase', valor: '11' },
        [{ tipo: 'MOSTRAR_AVISO' }]
      );
      expect(regla.orden).toBe(100);
    });

    test('lanza error si nombre vacio', () => {
      expect(() => crearRegla('', { campo: 'fase' }, [{ tipo: 'MOSTRAR_AVISO' }])).toThrow('nombre');
    });

    test('lanza error si no hay condicion', () => {
      expect(() => crearRegla('X', null, [{ tipo: 'MOSTRAR_AVISO' }])).toThrow('condicion');
    });

    test('lanza error si acciones vacio', () => {
      expect(() => crearRegla('X', { campo: 'fase' }, [])).toThrow('accion');
    });

    test('params se inicializa a {} si no se proporciona', () => {
      var regla = crearRegla('X', { campo: 'fase', valor: '11' }, [{ tipo: 'PROPAGAR_HILO' }]);
      expect(regla.acciones[0].params).toEqual({});
    });
  });

  // --- editarRegla ---

  describe('editarRegla', () => {
    var base;
    beforeEach(() => {
      base = crearRegla('Original', { campo: 'fase', valor: '11' }, [{ tipo: 'MOSTRAR_AVISO' }], 5);
    });

    test('modifica nombre sin mutar original', () => {
      var editada = editarRegla(base, { nombre: 'Editada' });
      expect(editada.nombre).toBe('Editada');
      expect(base.nombre).toBe('Original');
      expect(editada.id).toBe(base.id);
    });

    test('modifica activa', () => {
      var editada = editarRegla(base, { activa: false });
      expect(editada.activa).toBe(false);
    });

    test('preserva origen', () => {
      var editada = editarRegla(base, { nombre: 'Otra' });
      expect(editada.origen).toBe('usuario');
    });

    test('modifica condicion completa', () => {
      var editada = editarRegla(base, { condicion: { campo: 'estado', valor: 'OK', faseOrigen: null } });
      expect(editada.condicion.campo).toBe('estado');
    });
  });

  // --- eliminarRegla ---

  describe('eliminarRegla', () => {
    test('elimina regla por id', () => {
      var lista = generarReglasDefault();
      var len = lista.length;
      var result = eliminarRegla(lista[0].id, lista);
      expect(result).toHaveLength(len - 1);
      expect(result.find(r => r.id === lista[0].id)).toBeUndefined();
    });

    test('retorna lista intacta si id no existe', () => {
      var lista = generarReglasDefault();
      var result = eliminarRegla('no_existe', lista);
      expect(result).toHaveLength(lista.length);
    });
  });

  // --- duplicarRegla ---

  describe('duplicarRegla', () => {
    test('crea copia con id diferente y origen usuario', () => {
      var defaults = generarReglasDefault();
      var copia = duplicarRegla(defaults[0]);
      expect(copia.id).not.toBe(defaults[0].id);
      expect(copia.nombre).toContain('(copia)');
      expect(copia.origen).toBe('usuario');
      expect(copia.orden).toBe(defaults[0].orden + 1);
    });

    test('copia profunda de acciones (no referencia)', () => {
      var regla = crearRegla('X', { campo: 'fase', valor: '19' },
        [{ tipo: 'SUGERIR_RECORDATORIO', params: { texto: 'Test', horas: 8 } }]);
      var copia = duplicarRegla(regla);
      copia.acciones[0].params.horas = 24;
      expect(regla.acciones[0].params.horas).toBe(8);
    });
  });

  // --- evaluarReglas ---

  describe('evaluarReglas', () => {
    var reglas;
    beforeEach(() => {
      reglas = generarReglasDefault();
    });

    test('detecta cambio de fase con valor exacto', () => {
      var result = evaluarReglas(reglas, 'fase', '19', '12');
      var nombres = result.map(r => r.nombre);
      expect(nombres).toContain('Propagar fase al hilo');
      expect(nombres).toContain('Sugerir: Verificar descarga');
    });

    test('detecta cambio de estado con wildcard', () => {
      var result = evaluarReglas(reglas, 'estado', 'OK', 'PEND');
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Propagar estado al hilo');
    });

    test('detecta cambio de codCar', () => {
      var result = evaluarReglas(reglas, 'codCar', '12345', '');
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Propagar codCar al hilo');
    });

    test('ignora reglas inactivas', () => {
      reglas[0].activa = false;
      var result = evaluarReglas(reglas, 'fase', '19', '12');
      var nombres = result.map(r => r.nombre);
      expect(nombres).not.toContain('Propagar fase al hilo');
    });

    test('filtra por faseOrigen cuando se especifica', () => {
      var reglasCustom = [
        {
          id: 'custom_1', nombre: 'Solo desde 12', activa: true,
          condicion: { campo: 'fase', valor: '19', faseOrigen: '12' },
          acciones: [{ tipo: 'MOSTRAR_AVISO', params: { mensaje: 'OK' } }],
          orden: 50, origen: 'usuario'
        }
      ];
      expect(evaluarReglas(reglasCustom, 'fase', '19', '12')).toHaveLength(1);
      expect(evaluarReglas(reglasCustom, 'fase', '19', '11')).toHaveLength(0);
    });

    test('ordena por orden ascendente', () => {
      var result = evaluarReglas(reglas, 'fase', '29', '22');
      var ordenes = result.map(r => {
        var reglaOriginal = reglas.find(x => x.id === r.reglaId);
        return reglaOriginal.orden;
      });
      for (var i = 1; i < ordenes.length; i++) {
        expect(ordenes[i]).toBeGreaterThanOrEqual(ordenes[i - 1]);
      }
    });

    test('retorna array vacio si reglas es null', () => {
      expect(evaluarReglas(null, 'fase', '19', '12')).toEqual([]);
    });

    test('retorna array vacio si campo no coincide', () => {
      expect(evaluarReglas(reglas, 'notas', 'algo', '')).toEqual([]);
    });

    test('resultado incluye reglaId, nombre y acciones', () => {
      var result = evaluarReglas(reglas, 'fase', '19', '12');
      result.forEach(r => {
        expect(r).toHaveProperty('reglaId');
        expect(r).toHaveProperty('nombre');
        expect(r).toHaveProperty('acciones');
        expect(Array.isArray(r.acciones)).toBe(true);
      });
    });
  });

  // --- validarRegla ---

  describe('validarRegla', () => {
    test('valida regla correcta', () => {
      var regla = crearRegla('OK', { campo: 'fase', valor: '19' }, [{ tipo: 'PROPAGAR_HILO' }]);
      var res = validarRegla(regla);
      expect(res.valido).toBe(true);
      expect(res.errores).toHaveLength(0);
    });

    test('rechaza nombre vacio', () => {
      var regla = { nombre: '', condicion: { campo: 'fase' }, acciones: [{ tipo: 'PROPAGAR_HILO' }] };
      var res = validarRegla(regla);
      expect(res.valido).toBe(false);
      expect(res.errores[0]).toContain('nombre');
    });

    test('rechaza campo invalido', () => {
      var regla = { nombre: 'X', condicion: { campo: 'nota' }, acciones: [{ tipo: 'PROPAGAR_HILO' }] };
      var res = validarRegla(regla);
      expect(res.valido).toBe(false);
      expect(res.errores[0]).toContain('campo');
    });

    test('rechaza tipo de accion desconocido', () => {
      var regla = { nombre: 'X', condicion: { campo: 'fase' }, acciones: [{ tipo: 'INEXISTENTE' }] };
      var res = validarRegla(regla);
      expect(res.valido).toBe(false);
      expect(res.errores[0]).toContain('tipo desconocido');
    });

    test('rechaza acciones vacio', () => {
      var regla = { nombre: 'X', condicion: { campo: 'fase' }, acciones: [] };
      var res = validarRegla(regla);
      expect(res.valido).toBe(false);
    });

    test('acumula multiples errores', () => {
      var regla = { nombre: '', condicion: { campo: 'invalido' }, acciones: [] };
      var res = validarRegla(regla);
      expect(res.errores.length).toBeGreaterThanOrEqual(3);
    });
  });

  // --- generarReglasDefault ---

  describe('generarReglasDefault', () => {
    test('genera 7 reglas', () => {
      var defaults = generarReglasDefault();
      expect(defaults).toHaveLength(7);
    });

    test('todas las reglas tienen origen sistema', () => {
      var defaults = generarReglasDefault();
      defaults.forEach(r => {
        expect(r.origen).toBe('sistema');
      });
    });

    test('todas las reglas estan activas', () => {
      var defaults = generarReglasDefault();
      defaults.forEach(r => {
        expect(r.activa).toBe(true);
      });
    });

    test('todas las reglas son validas', () => {
      var defaults = generarReglasDefault();
      defaults.forEach(r => {
        var res = validarRegla(r);
        expect(res.valido).toBe(true);
      });
    });

    test('IDs son estables (predecibles)', () => {
      var defaults = generarReglasDefault();
      expect(defaults[0].id).toBe('default_propagar_fase');
      expect(defaults[3].id).toBe('default_sugerir_descarga');
    });

    test('3 reglas de propagacion con wildcard', () => {
      var defaults = generarReglasDefault();
      var propagaciones = defaults.filter(r =>
        r.acciones.some(a => a.tipo === 'PROPAGAR_HILO'));
      expect(propagaciones).toHaveLength(3);
      propagaciones.forEach(r => {
        expect(r.condicion.valor).toBe('*');
      });
    });

    test('2 reglas de sugerencia de recordatorio', () => {
      var defaults = generarReglasDefault();
      var sugerencias = defaults.filter(r =>
        r.acciones.some(a => a.tipo === 'SUGERIR_RECORDATORIO'));
      expect(sugerencias).toHaveLength(2);
    });

    test('sugerencia fase 19 con 8h, fase 29 con 24h', () => {
      var defaults = generarReglasDefault();
      var sug19 = defaults.find(r => r.condicion.valor === '19' &&
        r.acciones.some(a => a.tipo === 'SUGERIR_RECORDATORIO'));
      var sug29 = defaults.find(r => r.condicion.valor === '29' &&
        r.acciones.some(a => a.tipo === 'SUGERIR_RECORDATORIO'));
      expect(sug19.acciones[0].params.horas).toBe(8);
      expect(sug29.acciones[0].params.horas).toBe(24);
    });
  });

  // --- obtenerAccionesDesdeReglas ---

  describe('obtenerAccionesDesdeReglas', () => {
    var reglas;
    beforeEach(() => {
      reglas = generarReglasDefault();
    });

    test('obtiene acciones CAMBIAR_FASE para fase 22', () => {
      var acciones = obtenerAccionesDesdeReglas(reglas, '22');
      expect(acciones).toHaveLength(1);
      expect(acciones[0].etiqueta).toBe('Confirmar descarga → Vacio');
      expect(acciones[0].faseSiguiente).toBe('29');
    });

    test('obtiene acciones para fase 29', () => {
      var acciones = obtenerAccionesDesdeReglas(reglas, '29');
      expect(acciones).toHaveLength(1);
      expect(acciones[0].etiqueta).toBe('Marcar documentado');
      expect(acciones[0].faseSiguiente).toBe('30');
    });

    test('retorna vacio para fase sin reglas de accion', () => {
      var acciones = obtenerAccionesDesdeReglas(reglas, '11');
      expect(acciones).toHaveLength(0);
    });

    test('ignora reglas inactivas', () => {
      reglas.find(r => r.id === 'default_descarga_vacio').activa = false;
      var acciones = obtenerAccionesDesdeReglas(reglas, '22');
      expect(acciones).toHaveLength(0);
    });

    test('retorna vacio si reglas es null', () => {
      expect(obtenerAccionesDesdeReglas(null, '22')).toEqual([]);
    });

    test('incluye acciones PRESELECCIONAR_PLANTILLA con nombre de plantilla', () => {
      var custom = [{
        id: 'x', nombre: 'Usar plantilla', activa: true,
        condicion: { campo: 'fase', valor: '11', faseOrigen: null },
        acciones: [{ tipo: 'PRESELECCIONAR_PLANTILLA', params: { nombrePlantilla: 'Aviso carga' } }],
        orden: 1, origen: 'usuario'
      }];
      var acciones = obtenerAccionesDesdeReglas(custom, '11');
      expect(acciones).toHaveLength(1);
      expect(acciones[0].plantilla).toBe('Aviso carga');
    });

    test('incluye acciones MOSTRAR_AVISO con mensaje', () => {
      var custom = [{
        id: 'y', nombre: 'Aviso test', activa: true,
        condicion: { campo: 'fase', valor: '05', faseOrigen: null },
        acciones: [{ tipo: 'MOSTRAR_AVISO', params: { mensaje: 'Atencion incidencia' } }],
        orden: 1, origen: 'usuario'
      }];
      var acciones = obtenerAccionesDesdeReglas(custom, '05');
      expect(acciones).toHaveLength(1);
      expect(acciones[0].aviso).toBe('Atencion incidencia');
    });

    test('formato compatible con action-bar (etiqueta, faseSiguiente, plantilla)', () => {
      var acciones = obtenerAccionesDesdeReglas(reglas, '22');
      acciones.forEach(a => {
        expect(a).toHaveProperty('etiqueta');
        expect(a).toHaveProperty('faseSiguiente');
        expect(a).toHaveProperty('plantilla');
      });
    });
  });
});
