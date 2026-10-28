import { ORIGENES_PROPIOS, resolverOrigenes } from './origenes-cors';

describe('resolverOrigenes', () => {
  it('acepta los origenes propios aunque no haya variable de entorno', () => {
    expect(resolverOrigenes(undefined)).toEqual(ORIGENES_PROPIOS);
    expect(resolverOrigenes('')).toEqual(ORIGENES_PROPIOS);
  });

  it('suma los origenes declarados a los propios', () => {
    const origenes = resolverOrigenes('https://otro.example');

    expect(origenes).toContain('https://otro.example');
    expect(origenes).toContain('https://inventario-general-delta.vercel.app');
  });

  it('limpia espacios, ignora vacios y no repite origenes', () => {
    const origenes = resolverOrigenes(
      ' https://otro.example , ,https://inventario-general-delta.vercel.app,',
    );

    expect(origenes).toEqual([
      'https://inventario-general-delta.vercel.app',
      'https://anderfonseca29.github.io',
      'https://otro.example',
    ]);
  });
});
