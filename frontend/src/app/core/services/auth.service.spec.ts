import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService (sesion en cookies)', () => {
  let servicio: AuthService;
  let httpMock: HttpTestingController;

  const usuario = {
    id: 'u1',
    email: 'ana@empresa.com',
    empresaId: 'e1',
    esSuperAdmin: false,
    esPropietario: true,
    permisos: [],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    servicio = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('elimina los tokens antiguos de localStorage al arrancar', () => {
    localStorage.setItem('inv_access_token', 'viejo');
    localStorage.setItem('inv_refresh_token', 'viejo');

    crear();

    expect(localStorage.getItem('inv_access_token')).toBeNull();
    expect(localStorage.getItem('inv_refresh_token')).toBeNull();
  });

  it('login guarda solo el usuario, nunca los tokens', () => {
    crear();
    servicio.login({ email: 'ana@empresa.com', password: 'Roble*2026' }).subscribe();

    const req = httpMock.expectOne((peticion) =>
      peticion.url.endsWith('/auth/login'),
    );
    expect(req.request.withCredentials).toBe(false);
    req.flush({ user: usuario });

    const verificacion = httpMock.expectOne((peticion) =>
      peticion.url.endsWith('/auth/me'),
    );
    verificacion.flush(usuario);

    expect(JSON.parse(localStorage.getItem('inv_user') ?? '{}')).toMatchObject({
      id: 'u1',
    });
    expect(localStorage.getItem('inv_access_token')).toBeNull();
    expect(localStorage.getItem('inv_refresh_token')).toBeNull();
  });

  it('falla el login si el navegador no conserva la cookie de sesion', () => {
    crear();
    let mensaje = '';
    servicio.login({ email: 'ana@empresa.com', password: 'Roble*2026' }).subscribe({
      error: (error: Error) => (mensaje = error.message),
    });

    httpMock
      .expectOne((peticion) => peticion.url.endsWith('/auth/login'))
      .flush({ user: usuario });
    httpMock
      .expectOne((peticion) => peticion.url.endsWith('/auth/me'))
      .flush(
        { message: 'No autenticado' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(mensaje).toContain('cookies');
    expect(servicio.user()).toBeNull();
  });

  it('refresh envia un cuerpo vacio y actualiza el usuario', () => {
    crear();
    servicio.refrescar().subscribe();

    const req = httpMock.expectOne((peticion) =>
      peticion.url.endsWith('/auth/refresh'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ user: usuario });

    expect(servicio.user()?.id).toBe('u1');
  });

  it('cerrarSesion limpia el usuario y navega al login', () => {
    crear();
    localStorage.setItem('inv_user', JSON.stringify(usuario));
    const navegar = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    servicio.cerrarSesion();

    const req = httpMock.expectOne((peticion) =>
      peticion.url.endsWith('/auth/logout'),
    );
    req.flush({ ok: true });
    expect(localStorage.getItem('inv_user')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
