import { leerCookie } from './cookies';

describe('leerCookie', () => {
  it('devuelve null si no hay cabecera', () => {
    expect(leerCookie(undefined, 'inv_access_token')).toBeNull();
  });

  it('encuentra una cookie entre varias y respeta el valor completo', () => {
    const cabecera =
      'otra=1; inv_access_token=abc.def.ghi; inv_refresh_token=xyz';

    expect(leerCookie(cabecera, 'inv_access_token')).toBe('abc.def.ghi');
    expect(leerCookie(cabecera, 'inv_refresh_token')).toBe('xyz');
  });

  it('decodifica el valor y no confunde nombres parecidos', () => {
    const cabecera = 'inv_access_token_extra=no; inv_access_token=a%2Eb';

    expect(leerCookie(cabecera, 'inv_access_token')).toBe('a.b');
  });

  it('devuelve null si la cookie no existe', () => {
    expect(leerCookie('a=1; b=2', 'inv_access_token')).toBeNull();
  });
});
