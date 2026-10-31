import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('enlaza los documentos legales por ruta interna, no al archivo .md', () => {
    const fixture = crear();
    const enlaces = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    const hrefs = enlaces.map((enlace) => enlace.getAttribute('href') ?? '');

    expect(hrefs).toContain('/legal/terminos');
    expect(hrefs).toContain('/legal/privacidad');
    expect(hrefs).toContain('/legal');
    expect(hrefs.some((href) => href.endsWith('.md'))).toBe(false);
  });

  it('ya no ofrece radicar la solicitud desde el pie', () => {
    const fixture = crear();
    expect(fixture.nativeElement.textContent).not.toContain('Radicar solicitud');
    expect(fixture.nativeElement.textContent).toContain('Derechos y PQR');
  });

  it('no publica una identidad inventada en modo borrador', () => {
    const fixture = crear();
    expect(fixture.nativeElement.textContent).toContain('modo borrador');
    expect(fixture.nativeElement.textContent).not.toContain('[DATO PENDIENTE: razón social');
  });

  it('mantiene el acceso al panel de cookies', () => {
    const fixture = crear();
    const boton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.footer__cookies');
    expect(boton.textContent).toContain('Preferencias de cookies');
  });
});
