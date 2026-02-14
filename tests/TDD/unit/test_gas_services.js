const {
  agregarServicio,
  eliminarServicio,
  obtenerServicioActivo,
  cambiarServicioActivo,
  validarUrlServicio
} = require('../../../src/extension/gas-services');

describe('gas-services', () => {
  const datosMock = () => ({
    services: [
      { id: 'svc_1', alias: 'Produccion', url: 'https://script.google.com/macros/s/abc/exec' },
      { id: 'svc_2', alias: 'Testing', url: 'https://script.google.com/macros/s/xyz/exec' }
    ],
    activeServiceId: 'svc_1'
  });

  describe('agregarServicio', () => {
    test('agrega servicio con id generado', () => {
      const datos = datosMock();
      const result = agregarServicio('Staging', 'https://script.google.com/macros/s/stg/exec', datos);

      expect(result.services).toHaveLength(3);
      const nuevo = result.services[2];
      expect(nuevo.alias).toBe('Staging');
      expect(nuevo.id).toMatch(/^svc_/);
    });

    test('no modifica datos originales', () => {
      const datos = datosMock();
      agregarServicio('Nuevo', 'https://example.com', datos);
      expect(datos.services).toHaveLength(2);
    });
  });

  describe('eliminarServicio', () => {
    test('elimina servicio por id', () => {
      const datos = datosMock();
      const result = eliminarServicio('svc_2', datos);

      expect(result.services).toHaveLength(1);
      expect(result.services[0].id).toBe('svc_1');
    });

    test('si se elimina el activo, pone el primero como activo', () => {
      const datos = datosMock();
      const result = eliminarServicio('svc_1', datos);

      expect(result.activeServiceId).toBe('svc_2');
    });

    test('si se elimina el unico, activeServiceId queda null', () => {
      const datos = { services: [{ id: 'svc_1', alias: 'Unico', url: 'https://x.com' }], activeServiceId: 'svc_1' };
      const result = eliminarServicio('svc_1', datos);

      expect(result.services).toHaveLength(0);
      expect(result.activeServiceId).toBeNull();
    });
  });

  describe('obtenerServicioActivo', () => {
    test('retorna servicio activo', () => {
      const datos = datosMock();
      const activo = obtenerServicioActivo(datos);

      expect(activo.id).toBe('svc_1');
      expect(activo.alias).toBe('Produccion');
    });

    test('retorna null si no hay servicios', () => {
      expect(obtenerServicioActivo({ services: [], activeServiceId: null })).toBeNull();
    });
  });

  describe('cambiarServicioActivo', () => {
    test('cambia el servicio activo', () => {
      const datos = datosMock();
      const result = cambiarServicioActivo('svc_2', datos);

      expect(result.activeServiceId).toBe('svc_2');
    });

    test('no cambia si id no existe', () => {
      const datos = datosMock();
      const result = cambiarServicioActivo('inexistente', datos);

      expect(result.activeServiceId).toBe('svc_1');
    });
  });

  describe('validarUrlServicio', () => {
    test('acepta URL https valida', () => {
      const result = validarUrlServicio('https://script.google.com/macros/s/abc/exec');
      expect(result.valido).toBe(true);
    });

    test('rechaza URL sin https', () => {
      const result = validarUrlServicio('http://example.com');
      expect(result.valido).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rechaza URL vacia', () => {
      const result = validarUrlServicio('');
      expect(result.valido).toBe(false);
    });

    test('rechaza texto que no es URL', () => {
      const result = validarUrlServicio('no es una url');
      expect(result.valido).toBe(false);
    });
  });
});
