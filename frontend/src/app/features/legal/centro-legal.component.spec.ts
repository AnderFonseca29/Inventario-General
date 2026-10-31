import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CentroLegalComponent } from './centro-legal.component';

describe('CentroLegalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroLegalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(CentroLegalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('lista los nueve documentos agrupados', () => {
    const fixture = crear();
    const enlaces = fixture.nativeElement.querySelectorAll('.legal-card');
    expect(enlaces.length).toBe(9);
    expect(fixture.nativeElement.textContent).toContain('Términos y Condiciones');
    expect(fixture.nativeElement.textContent).toContain('Contrato de Encargo de Datos');
  });

  it('muestra el aviso de borrador y las acciones de derechos', () => {
    const fixture = crear();
    expect(fixture.nativeElement.querySelector('.legal-draft')).toBeTruthy();

    const acciones = [...fixture.nativeElement.querySelectorAll('.legal-acciones a')].map(
      (enlace: HTMLAnchorElement) => enlace.getAttribute('href'),
    );
    expect(acciones).toContain('/derechos');
    expect(acciones).toContain('/contacto');
  });

  it('enlaza cada tarjeta con su ruta interna', () => {
    const fixture = crear();
    const hrefs = [...fixture.nativeElement.querySelectorAll('.legal-card')].map(
      (enlace: HTMLAnchorElement) => enlace.getAttribute('href'),
    );
    expect(hrefs).toContain('/legal/terminos');
    expect(hrefs).toContain('/legal/cookies');
  });
});
