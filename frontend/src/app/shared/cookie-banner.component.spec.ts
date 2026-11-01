import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CookieBannerComponent } from './cookie-banner.component';

describe('CookieBannerComponent', () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(async () => {
    localStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function crear() {
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('enlaza la politica interna y no el archivo Markdown', () => {
    const fixture = crear();
    const enlace = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(enlace.getAttribute('href')).toBe('/legal/cookies');
    expect(enlace.getAttribute('href')).not.toContain('.md');
  });

  it('guarda la decision y oculta el banner', () => {
    const fixture = crear();
    const botones = [
      ...fixture.nativeElement.querySelectorAll('button'),
    ] as HTMLButtonElement[];

    botones.find((boton) => boton.textContent?.includes('Preferencias'))?.click();
    fixture.detectChanges();

    const guardar = [...fixture.nativeElement.querySelectorAll('button')].find(
      (boton: HTMLButtonElement) => boton.textContent?.includes('Guardar'),
    ) as HTMLButtonElement;
    guardar.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('section.cookie'),
    ).toBeNull();
    expect(localStorage.getItem('inv_cookie_consent_v1')).toContain(
      '"analitica":true',
    );
  });
});
