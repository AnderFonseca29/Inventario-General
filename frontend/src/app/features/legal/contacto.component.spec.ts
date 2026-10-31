import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContactoComponent } from './contacto.component';

describe('ContactoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactoComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('dirige las solicitudes de datos al formulario de derechos', () => {
    const fixture = crear();
    const enlace: HTMLAnchorElement = fixture.nativeElement.querySelector('.ct-card .ct-btn');
    expect(enlace.getAttribute('href')).toBe('/derechos');
  });

  it('muestra la identidad pendiente sin inventar datos', () => {
    const fixture = crear();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('pendientes de completar');
    expect(texto).toContain('[DATO PENDIENTE: razón social de la S.A.S.]');
    expect(texto).not.toMatch(/NIT 9\d{2}/);
  });
});
