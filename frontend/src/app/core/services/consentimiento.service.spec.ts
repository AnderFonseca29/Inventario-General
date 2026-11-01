import { ConsentimientoService } from './consentimiento.service';
import { environment } from '../../../environments/environment';

describe('ConsentimientoService', () => {
  const CLAVE = 'inv_cookie_consent_v1';
  const CLAVE_ID = 'inv_cookie_id';
  const ventana = window as Window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __stockoraConsentDefault?: boolean;
  };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    localStorage.clear();
    ventana.dataLayer = [];
    ventana.__stockoraConsentDefault = false;
    delete ventana.gtag;
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('registra la decision en el servidor con un identificador anonimo', () => {
    const servicio = new ConsentimientoService();

    servicio.guardar(true, false);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${environment.apiUrl}/cookies/consentimientos`);
    expect(opciones).toMatchObject({ method: 'POST', keepalive: true });
    const cuerpo = JSON.parse(String(opciones.body)) as Record<string, unknown>;
    expect(cuerpo).toMatchObject({ analitica: true, publicidad: false });
    expect(cuerpo['identificador']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(localStorage.getItem(CLAVE_ID)).toBe(cuerpo['identificador']);
  });

  it('reutiliza el identificador del navegador entre decisiones', () => {
    const servicio = new ConsentimientoService();

    servicio.guardar(true, false);
    servicio.guardar(false, true);

    const identificadores = fetchMock.mock.calls.map(
      ([, opciones]) =>
        (JSON.parse(String((opciones as RequestInit).body)) as {
          identificador: string;
        }).identificador,
    );
    expect(identificadores[0]).toBe(identificadores[1]);
  });

  it('conserva la decision local cuando falla el registro remoto', () => {
    fetchMock.mockRejectedValue(new Error('sin red'));
    const servicio = new ConsentimientoService();

    expect(() => servicio.guardar(false, false)).not.toThrow();
    expect(servicio.hayDecision()).toBe(true);
    expect(servicio.decision()?.analitica).toBe(false);
  });
});
