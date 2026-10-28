import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';
import { SuscripcionService } from '../services/suscripcion.service';

describe('errorInterceptor (hallazgo U)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mostrar: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    mostrar = vi
      .spyOn(TestBed.inject(ToastService), 'mostrar')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    mostrar.mockRestore();
  });

  function pedirYDetener() {
    http.get('/api/x').subscribe({ error: () => undefined });
    return httpMock.expectOne('/api/x');
  }

  it('avisa cuando no hay conexion (status 0)', () => {
    pedirYDetener().error(new ErrorEvent('network error'));
    expect(mostrar).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('conexión'),
      expect.any(Number),
    );
  });

  it('avisa cuando el servidor aplica throttling (429)', () => {
    pedirYDetener().flush('demasiadas', {
      status: 429,
      statusText: 'Too Many Requests',
    });
    expect(mostrar).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('Demasiadas peticiones'),
      expect.any(Number),
    );
  });

  it('avisa cuando el servidor falla (5xx)', () => {
    pedirYDetener().flush('fallo del servidor', {
      status: 500,
      statusText: 'Server Error',
    });
    expect(mostrar).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('servidor'),
      expect.any(Number),
    );
  });

  it('no muestra toast para errores de validacion (400)', () => {
    pedirYDetener().flush('datos invalidos', {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(mostrar).not.toHaveBeenCalled();
  });

  it('en 402 refresca el plan y no duplica el aviso con un toast', () => {
    const cargar = vi
      .spyOn(TestBed.inject(SuscripcionService), 'cargar')
      .mockImplementation(() => undefined);

    pedirYDetener().flush('periodo vencido', {
      status: 402,
      statusText: 'Payment Required',
    });

    expect(mostrar).not.toHaveBeenCalled();
    expect(cargar).toHaveBeenCalledTimes(1);
    cargar.mockRestore();
  });

  it('no muestra toast para 401 (lo gestiona el authInterceptor)', () => {
    pedirYDetener().flush('sin token', {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(mostrar).not.toHaveBeenCalled();
  });
});
