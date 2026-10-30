import { evaluarContrasena, LONGITUD_MAXIMA, LONGITUD_MINIMA } from './contrasena';

describe('evaluarContrasena', () => {
  it('acepta una clave con variedad y longitud suficiente', () => {
    expect(evaluarContrasena('Roble*2026').valida).toBe(true);
    expect(evaluarContrasena('Inventario*27b').valida).toBe(true);
  });

  it('rechaza menos de 8 caracteres', () => {
    const r = evaluarContrasena('Ab1*');
    expect(r.valida).toBe(false);
    expect(r.errores).toContain(`Usa al menos ${LONGITUD_MINIMA} caracteres.`);
  });

  it('rechaza más de 128 caracteres', () => {
    const r = evaluarContrasena(`${'Aa1*'.repeat(33)}`);
    expect(r.valida).toBe(false);
    expect(r.errores.some((e) => e.includes(String(LONGITUD_MAXIMA)))).toBe(true);
  });

  it('rechaza claves comunes, sin importar mayúsculas ni tildes', () => {
    expect(evaluarContrasena('password1').valida).toBe(false);
    expect(evaluarContrasena('Contraseña').valida).toBe(false);
    expect(evaluarContrasena('STOCKORA123').valida).toBe(false);
  });

  it('rechaza caracteres repetidos tres veces', () => {
    const r = evaluarContrasena('Abc111*x');
    expect(r.valida).toBe(false);
    expect(r.errores.some((e) => e.includes('repeticiones'))).toBe(true);
  });

  it('rechaza secuencias ascendentes y descendentes', () => {
    expect(evaluarContrasena('Abcd*2026').valida).toBe(false);
    expect(evaluarContrasena('X9876*ab').valida).toBe(false);
  });

  it('exige variedad cuando la clave es corta', () => {
    const r = evaluarContrasena('inventario');
    expect(r.valida).toBe(false);
    expect(r.errores.some((e) => e.includes('Combina'))).toBe(true);
  });

  it('permite dos clases si la clave tiene 12 caracteres o más', () => {
    expect(evaluarContrasena('inventario2026').valida).toBe(true);
    expect(evaluarContrasena('inventariolargo').valida).toBe(false);
  });

  it('expone el estado de cada requisito para la interfaz', () => {
    const r = evaluarContrasena('inventario');
    const porId = Object.fromEntries(r.requisitos.map((x) => [x.id, x.cumple]));
    expect(porId).toEqual({ longitud: true, comun: false, variedad: false, patron: true });

    const buena = Object.fromEntries(
      evaluarContrasena('Roble*2026').requisitos.map((x) => [x.id, x.cumple]),
    );
    expect(buena).toEqual({ longitud: true, comun: true, variedad: true, patron: true });
  });

  it('calcula la fuerza en tres niveles', () => {
    expect(evaluarContrasena('inventario2026').fuerza).toBe('debil');
    expect(evaluarContrasena('roble*2026abc').fuerza).toBe('media');
    expect(evaluarContrasena('Roble*2026-Inventario!').fuerza).toBe('fuerte');
  });
});
