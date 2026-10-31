import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DocumentoLegalComponent } from './documento-legal.component';

describe('DocumentoLegalComponent', () => {
  let parametros: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let http: HttpTestingController;
  let base: string;

  beforeEach(async () => {
    parametros = new BehaviorSubject(convertToParamMap({ clave: 'terminos' }));

    await TestBed.configureTestingModule({
      imports: [DocumentoLegalComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: parametros } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    base = TestBed.inject(DOCUMENT).baseURI;
  });

  afterEach(() => http.verify());

  function crear() {
    const fixture = TestBed.createComponent(DocumentoLegalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga el Markdown y quita el título duplicado', () => {
    const fixture = crear();
    const url = new URL('legal/terminos-y-condiciones.md', base).href;

    http.expectOne(url).flush('# Términos y Condiciones\n\n## 1. Aceptación\n\nTexto de prueba.');

    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;

    expect(elemento.querySelector('.doc-cabecera h1')?.textContent).toContain(
      'Términos y Condiciones',
    );
    expect(elemento.querySelector('.doc-articulo h1')).toBeNull();
    expect(elemento.querySelector('.doc-articulo h2')?.textContent).toContain('1. Aceptación');
    expect(elemento.textContent).toContain('Texto de prueba.');
  });

  it('informa cuando la clave no corresponde a un documento', () => {
    const fixture = crear();
    http.expectOne(() => true).flush('# Términos\n\nTexto.');

    parametros.next(convertToParamMap({ clave: 'no-existe' }));
    fixture.detectChanges();

    http.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain(
      'Ese documento no existe o cambió de dirección.',
    );
  });

  it('permite reintentar cuando falla la carga', () => {
    const fixture = crear();
    const url = new URL('legal/terminos-y-condiciones.md', base).href;

    http.expectOne(url).flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el documento');

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.doc-estado--error button',
    );
    boton.click();
    fixture.detectChanges();

    http.expectOne(url).flush('# Términos\n\nContenido recuperado.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Contenido recuperado.');
  });
});
