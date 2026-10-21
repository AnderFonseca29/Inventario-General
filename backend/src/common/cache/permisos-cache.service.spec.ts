import { ConfigService } from '@nestjs/config';
import { PermisosCacheService } from './permisos-cache.service';

function crearServicio(ttl?: string): PermisosCacheService {
  const config = {
    get: (key: string) => (key === 'PERMISOS_CACHE_TTL_SEGUNDOS' ? ttl : undefined),
  } as unknown as ConfigService;
  return new PermisosCacheService(config);
}

describe('PermisosCacheService (hallazgo R)', () => {
  it('guarda y devuelve los permisos', () => {
    const cache = crearServicio('60');
    expect(cache.obtener('u1')).toBeUndefined();
    cache.guardar('u1', ['usuarios.crear']);
    expect(cache.obtener('u1')).toEqual(['usuarios.crear']);
  });

  it('invalida un usuario concreto', () => {
    const cache = crearServicio('60');
    cache.guardar('u1', ['a']);
    cache.guardar('u2', ['b']);
    cache.invalidar('u1');
    expect(cache.obtener('u1')).toBeUndefined();
    expect(cache.obtener('u2')).toEqual(['b']);
  });

  it('invalida varios usuarios a la vez', () => {
    const cache = crearServicio('60');
    cache.guardar('u1', ['a']);
    cache.guardar('u2', ['b']);
    cache.invalidarVarios(['u1', 'u2']);
    expect(cache.obtener('u1')).toBeUndefined();
    expect(cache.obtener('u2')).toBeUndefined();
  });

  it('expira la entrada pasado el TTL', () => {
    jest.useFakeTimers();
    const cache = crearServicio('1');
    cache.guardar('u1', ['a']);
    expect(cache.obtener('u1')).toEqual(['a']);
    jest.advanceTimersByTime(1500);
    expect(cache.obtener('u1')).toBeUndefined();
    jest.useRealTimers();
  });

  it('no cachea cuando el TTL es 0', () => {
    const cache = crearServicio('0');
    cache.guardar('u1', ['a']);
    expect(cache.obtener('u1')).toBeUndefined();
    expect(cache.tamano).toBe(0);
  });
});
