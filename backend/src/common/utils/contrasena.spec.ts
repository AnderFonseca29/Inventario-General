import { evaluarContrasena } from './contrasena';

describe('evaluarContrasena (backend)', () => {
  it('acepta claves con variedad y longitud suficiente', () => {
    expect(evaluarContrasena('Roble*2026').valida).toBe(true);
  });

  it('rechaza claves comunes', () => {
    expect(evaluarContrasena('password1').valida).toBe(false);
    expect(evaluarContrasena('STOCKORA123').valida).toBe(false);
  });

  it('rechaza secuencias y repeticiones', () => {
    expect(evaluarContrasena('Abcd*2026').valida).toBe(false);
    expect(evaluarContrasena('Abc111*x').valida).toBe(false);
  });

  it('rechaza claves cortas aunque tengan variedad', () => {
    expect(evaluarContrasena('Ab1*').valida).toBe(false);
  });

  it('explica el motivo del rechazo', () => {
    const r = evaluarContrasena('inventario');
    expect(r.errores.length).toBeGreaterThan(0);
  });
});
