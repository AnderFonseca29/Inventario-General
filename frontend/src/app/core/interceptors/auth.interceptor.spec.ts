import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (cookies httpOnly)', () => {
  let http: HttpClient;
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
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envia credenciales y reintenta una vez despues de refrescar', () => {
    http.get('/api/datos').subscribe();

    const original = httpMock.expectOne('/api/datos');
    expect(original.request.withCredentials).toBe(true);
    original.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne((peticion) =>
      peticion.url.endsWith('/auth/refresh'),
    );
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ user: usuario });

    const reintento = httpMock.expectOne('/api/datos');
    expect(reintento.request.withCredentials).toBe(true);
    reintento.flush({ ok: true });
  });

  it('si el refresh falla, limpia la sesion sin desviar la portada publica', () => {
    const navegar = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    let estado = 0;
    http.get('/api/datos').subscribe({
      error: (error: { status: number }) => (estado = error.status),
    });

    httpMock
      .expectOne('/api/datos')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne((peticion) => peticion.url.endsWith('/auth/refresh'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(estado).toBe(401);
    expect(localStorage.getItem('inv_user')).toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('un fallo transitorio del refresh no cierra la sesion local', () => {
    localStorage.setItem('inv_user', JSON.stringify(usuario));
    let estado = 0;
    http.get('/api/datos').subscribe({
      error: (error: { status: number }) => (estado = error.status),
    });

    httpMock
      .expectOne('/api/datos')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne((peticion) => peticion.url.endsWith('/auth/refresh'))
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(estado).toBe(500);
    expect(localStorage.getItem('inv_user')).not.toBeNull();
  });
});
