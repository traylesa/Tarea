/**
 * Tests para resilience.js - Modulo de robustez
 * TDD: Escritos ANTES de la implementacion
 */
const {
  dividirEnTandas,
  limitarMensajes,
  ejecutarConRetry,
  DEFAULTS_ROBUSTEZ
} = require('../../../src/extension/resilience.js');

// --- dividirEnTandas ---

describe('dividirEnTandas', () => {
  test('divide 30 items en tandas de 15', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const tandas = dividirEnTandas(items, 15);
    expect(tandas).toHaveLength(2);
    expect(tandas[0]).toHaveLength(15);
    expect(tandas[1]).toHaveLength(15);
  });

  test('1 tanda si items menor que tamano', () => {
    const items = [1, 2, 3];
    const tandas = dividirEnTandas(items, 15);
    expect(tandas).toHaveLength(1);
    expect(tandas[0]).toEqual([1, 2, 3]);
  });

  test('array vacio retorna array vacio', () => {
    expect(dividirEnTandas([], 10)).toEqual([]);
  });

  test('items exactamente igual al tamano da 1 tanda', () => {
    const items = [1, 2, 3, 4, 5];
    const tandas = dividirEnTandas(items, 5);
    expect(tandas).toHaveLength(1);
    expect(tandas[0]).toEqual([1, 2, 3, 4, 5]);
  });

  test('items no multiplo del tamano incluye resto', () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    const tandas = dividirEnTandas(items, 3);
    expect(tandas).toHaveLength(3);
    expect(tandas[0]).toHaveLength(3);
    expect(tandas[1]).toHaveLength(3);
    expect(tandas[2]).toHaveLength(1);
  });

  test('tamano 1 crea una tanda por item', () => {
    const tandas = dividirEnTandas([10, 20, 30], 1);
    expect(tandas).toHaveLength(3);
    expect(tandas[0]).toEqual([10]);
  });

  test('preserva referencias de objetos', () => {
    const obj = { id: 1 };
    const tandas = dividirEnTandas([obj], 10);
    expect(tandas[0][0]).toBe(obj);
  });
});

// --- limitarMensajes ---

describe('limitarMensajes', () => {
  test('corta a limite cuando hay mas mensajes', () => {
    const msgs = Array.from({ length: 120 }, (_, i) => ({ id: i }));
    const resultado = limitarMensajes(msgs, 50);
    expect(resultado.lote).toHaveLength(50);
    expect(resultado.hayMas).toBe(true);
  });

  test('no corta si hay menos que el limite', () => {
    const msgs = Array.from({ length: 30 }, (_, i) => ({ id: i }));
    const resultado = limitarMensajes(msgs, 50);
    expect(resultado.lote).toHaveLength(30);
    expect(resultado.hayMas).toBe(false);
  });

  test('exactamente en el limite: hayMas false', () => {
    const msgs = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const resultado = limitarMensajes(msgs, 50);
    expect(resultado.lote).toHaveLength(50);
    expect(resultado.hayMas).toBe(false);
  });

  test('array vacio retorna lote vacio sin mas', () => {
    const resultado = limitarMensajes([], 50);
    expect(resultado.lote).toEqual([]);
    expect(resultado.hayMas).toBe(false);
  });

  test('preserva orden original', () => {
    const msgs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const resultado = limitarMensajes(msgs, 2);
    expect(resultado.lote[0].id).toBe('a');
    expect(resultado.lote[1].id).toBe('b');
    expect(resultado.hayMas).toBe(true);
  });
});

// --- ejecutarConRetry ---

describe('ejecutarConRetry', () => {
  test('exito en primer intento no reintenta', async () => {
    let llamadas = 0;
    const fn = async () => { llamadas++; return { ok: true }; };
    const resultado = await ejecutarConRetry(fn, 2);
    expect(resultado.ok).toBe(true);
    expect(llamadas).toBe(1);
  });

  test('fallo primer intento, exito en segundo', async () => {
    let llamadas = 0;
    const fn = async () => {
      llamadas++;
      if (llamadas === 1) throw new Error('fallo temporal');
      return { ok: true };
    };
    const resultado = await ejecutarConRetry(fn, 2);
    expect(resultado.ok).toBe(true);
    expect(llamadas).toBe(2);
  });

  test('fallo en todos los intentos retorna error', async () => {
    const fn = async () => { throw new Error('fallo permanente'); };
    const resultado = await ejecutarConRetry(fn, 2);
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe('fallo permanente');
  });

  test('fallo en 3 intentos con maxIntentos 3', async () => {
    let llamadas = 0;
    const fn = async () => { llamadas++; throw new Error('sigue fallando'); };
    const resultado = await ejecutarConRetry(fn, 3);
    expect(resultado.ok).toBe(false);
    expect(llamadas).toBe(3);
  });

  test('maxIntentos 1 no reintenta', async () => {
    let llamadas = 0;
    const fn = async () => { llamadas++; throw new Error('fallo'); };
    const resultado = await ejecutarConRetry(fn, 1);
    expect(resultado.ok).toBe(false);
    expect(llamadas).toBe(1);
  });

  test('retorna datos del exito', async () => {
    const fn = async () => ({ ok: true, datos: [1, 2, 3] });
    const resultado = await ejecutarConRetry(fn, 2);
    expect(resultado.datos).toEqual([1, 2, 3]);
  });
});

// --- DEFAULTS_ROBUSTEZ ---

describe('DEFAULTS_ROBUSTEZ', () => {
  test('tiene timeoutBarridoMs con valor razonable', () => {
    expect(DEFAULTS_ROBUSTEZ.timeoutBarridoMs).toBe(300000);
  });

  test('tiene limiteLoteProcesamiento', () => {
    expect(DEFAULTS_ROBUSTEZ.limiteLoteProcesamiento).toBe(50);
  });

  test('tiene tamanoTandaEnvio', () => {
    expect(DEFAULTS_ROBUSTEZ.tamanoTandaEnvio).toBe(15);
  });
});
