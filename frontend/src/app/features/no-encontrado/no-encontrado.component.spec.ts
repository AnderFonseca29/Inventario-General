import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { NoEncontradoComponent } from './no-encontrado.component';

describe('NoEncontradoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoEncontradoComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('explica el 404 y ofrece salidas', () => {
    const fixture = TestBed.createComponent(NoEncontradoComponent);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('No encontramos esta página');

    const hrefs = [...fixture.nativeElement.querySelectorAll('a')].map(
      (enlace: HTMLAnchorElement) => enlace.getAttribute('href'),
    );
    expect(hrefs).toContain('/legal');
    expect(hrefs).toContain('/contacto');
  });

  it('pide a los buscadores no indexar la página', () => {
    TestBed.createComponent(NoEncontradoComponent).detectChanges();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
  });
});
