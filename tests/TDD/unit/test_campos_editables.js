/**
 * test_campos_editables.js - Tests para validación de campos editables en backend
 */

// Simular el módulo directamente (Codigo.js no tiene dual-compat,
// así que extraemos la lógica a testear)
const CAMPOS_EDITABLES = [
  'codCar', 'codTra', 'nombreTransportista',
  'tipoTarea', 'estado', 'fase', 'alerta', 'vinculacion',
  'referencia', 'fCarga', 'hCarga', 'fEntrega', 'hEntrega',
  'zona', 'zDest'
];

function validarCampoEditable(campo) {
  if (!campo || typeof campo !== 'string') return false;
  return CAMPOS_EDITABLES.indexOf(campo) !== -1;
}

describe('CAMPOS_EDITABLES', () => {
  describe('validarCampoEditable', () => {
    test('acepta campo fase (editable)', () => {
      expect(validarCampoEditable('fase')).toBe(true);
    });

    test('acepta campo estado (editable)', () => {
      expect(validarCampoEditable('estado')).toBe(true);
    });

    test('acepta campo codCar (editable)', () => {
      expect(validarCampoEditable('codCar')).toBe(true);
    });

    test('acepta todos los campos editables', () => {
      CAMPOS_EDITABLES.forEach(campo => {
        expect(validarCampoEditable(campo)).toBe(true);
      });
    });

    test('rechaza messageId (campo interno)', () => {
      expect(validarCampoEditable('messageId')).toBe(false);
    });

    test('rechaza threadId (campo interno)', () => {
      expect(validarCampoEditable('threadId')).toBe(false);
    });

    test('rechaza procesadoAt (campo interno)', () => {
      expect(validarCampoEditable('procesadoAt')).toBe(false);
    });

    test('rechaza emailRemitente (campo interno)', () => {
      expect(validarCampoEditable('emailRemitente')).toBe(false);
    });

    test('rechaza campo inexistente', () => {
      expect(validarCampoEditable('campoFalso')).toBe(false);
    });

    test('rechaza campo vacio', () => {
      expect(validarCampoEditable('')).toBe(false);
    });

    test('rechaza null', () => {
      expect(validarCampoEditable(null)).toBe(false);
    });

    test('rechaza undefined', () => {
      expect(validarCampoEditable(undefined)).toBe(false);
    });

    test('rechaza numero', () => {
      expect(validarCampoEditable(123)).toBe(false);
    });
  });

  describe('lista CAMPOS_EDITABLES', () => {
    test('tiene 15 campos', () => {
      expect(CAMPOS_EDITABLES).toHaveLength(15);
    });

    test('NO contiene campos de solo lectura', () => {
      const soloLectura = ['messageId', 'threadId', 'mensajesEnHilo',
        'emailRemitente', 'emailErp', 'asunto', 'fechaCorreo',
        'para', 'cc', 'cco', 'interlocutor', 'cuerpo', 'procesadoAt'];
      soloLectura.forEach(campo => {
        expect(CAMPOS_EDITABLES).not.toContain(campo);
      });
    });
  });
});
