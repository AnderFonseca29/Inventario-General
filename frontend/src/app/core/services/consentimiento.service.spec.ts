import { ConsentimientoService } from './consentimiento.service';

describe('ConsentimientoService', () => {
  const CLAVE = 'inv_cookie_consent_v1';
  const ventana = window as Window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __stockoraConsentDefault?: boolean;
  };

  beforeEach(() => {
    localStorage.clear();
    ventana.dataLayer = [];
    ventana.__stockoraConsentDefault = false;
    delete ventana.gtag;
  });

  it('descarta una decision con mas de 12 meses', () => {
    const fecha = new Date(
      Date.now() - 400 * 24 * 60 * 60 * 1000,
    ).toISOString();
    localStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: 1,
        fecha,
        analitica: true,
        publicidad: true,
      }),
    );

    const servicio = new ConsentimientoService();

    expect(servicio.hayDecision()).toBe(false);
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });

  it('conserva una decision reciente', () => {
    const fecha = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    localStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: 1,
        fecha,
        analitica: false,
        publicidad: false,
      }),
    );

    const servicio = new ConsentimientoService();

    expect(servicio.hayDecision()).toBe(true);
    expect(servicio.decision()?.analitica).toBe(false);
  });

  it('guarda las preferencias y actualiza Consent Mode', () => {
    const servicio = new ConsentimientoService();

    servicio.guardar(true, false);

    expect(servicio.hayDecision()).toBe(true);
    expect(servicio.decision()).toMatchObject({
      version: 1,
      analitica: true,
      publicidad: false,
    });

    const dataLayer = ventana.dataLayer as unknown[][];
    const actualizacion = dataLayer[dataLayer.length - 1];
    expect(actualizacion[0]).toBe('consent');
    expect(actualizacion[1]).toBe('update');
    expect(
      (actualizacion[2] as Record<string, string>)['analytics_storage'],
    ).toBe('granted');
    expect(
      (actualizacion[2] as Record<string, string>)['ad_storage'],
    ).toBe('denied');
  });
});
