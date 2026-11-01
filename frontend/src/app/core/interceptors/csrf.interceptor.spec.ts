import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('agrega X-Requested-With a las peticiones que modifican estado', () => {
    http.post('/api/auth/logout', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/logout');

    expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    req.flush({});
  });

  it('no agrega la cabecera a GET', () => {
    http.get('/api/auth/me').subscribe();
    const req = httpMock.expectOne('/api/auth/me');

    expect(req.request.headers.has('X-Requested-With')).toBe(false);
    req.flush({});
  });
});
