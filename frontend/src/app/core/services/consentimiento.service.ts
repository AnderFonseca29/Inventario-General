import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface DecisionCookies {
  version: number;
  fecha: string;
  analitica: boolean;
  publicidad: boolean;
  /** Identificador anónimo del navegador; no identifica al usuario. */
  identificador: string;
}

const CLAVE = 'inv_cookie_consent_v1';
const CLAVE_ID = 'inv_cookie_id';
const VERSION = 1;
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;
const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generarIdentificador(): string {
  const cripto =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cripto && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cripto && typeof cripto.getRandomValues === 'function') {
    cripto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

@Injectable({ providedIn: 'root' })
export class ConsentimientoService {
  private readonly identificador = this.obtenerIdentificador();
  private readonly decisionInterna = signal<DecisionCookies | null>(this.leer());
  private readonly panelInterno = signal(false);

  readonly decision = this.decisionInterna.asReadonly();
  readonly hayDecision = computed(() => this.decisionInterna() !== null);
  readonly panelAbierto = this.panelInterno.asReadonly();

  constructor() {
    this.aplicarConsentMode(this.decisionInterna());
  }

  aceptarTodo(): void {
    this.guardar(true, true);
  }

  rechazarTodo(): void {
    this.guardar(false, false);
  }

  guardar(analitica: boolean, publicidad: boolean): void {
    const decision: DecisionCookies = {
      version: VERSION,
      fecha: new Date().toISOString(),
      analitica,
      publicidad,
      identificador: this.identificador,
    };
    try {
      localStorage.setItem(CLAVE, JSON.stringify(decision));
    } catch {
      // Navegacion privada o almacenamiento bloqueado: se mantiene en memoria.
    }
    this.decisionInterna.set(decision);
    this.aplicarConsentMode(decision);
    this.panelInterno.set(false);
    this.registrarEnServidor(decision);
  }

  abrirPanel(): void {
    this.panelInterno.set(true);
  }

  cerrarPanel(): void {
    this.panelInterno.set(false);
  }

  private obtenerIdentificador(): string {
    try {
      const guardado = localStorage.getItem(CLAVE_ID);
      if (guardado && PATRON_UUID.test(guardado)) return guardado;
    } catch {
      // Si el almacenamiento esta bloqueado se usa uno temporal en memoria.
    }
    const nuevo = generarIdentificador();
    try {
      localStorage.setItem(CLAVE_ID, nuevo);
    } catch {
      // Sin persistencia el identificador cambia en la siguiente carga.
    }
    return nuevo;
  }

  /**
   * Envia la decision al servidor para dejar evidencia. Es un envio de mejor
   * esfuerzo: si falla la red, la decision local sigue siendo la fuente de
   * verdad para el navegador y no se interrumpe al usuario.
   */
  private registrarEnServidor(decision: DecisionCookies): void {
    if (typeof fetch !== 'function') return;
    try {
      void fetch(`${environment.apiUrl}/cookies/consentimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // La API exige esta cabecera en peticiones que modifican estado
          // para bloquear CSRF. `fetch` nativo no pasa por los interceptores
          // de Angular, asi que se agrega aqui.
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          identificador: decision.identificador,
          analitica: decision.analitica,
          publicidad: decision.publicidad,
        }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // La decision local se conserva aunque el registro remoto no este disponible.
    }
  }

  private leer(): DecisionCookies | null {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return null;
      const dato = JSON.parse(crudo) as Partial<DecisionCookies>;
      if (
        dato.version !== VERSION ||
        typeof dato.analitica !== 'boolean' ||
        typeof dato.publicidad !== 'boolean'
      ) {
        return null;
      }
      const fecha = Date.parse(String(dato.fecha ?? ''));
      if (!Number.isFinite(fecha) || Date.now() - fecha > VIGENCIA_MS) {
        try {
          localStorage.removeItem(CLAVE);
        } catch {
          // Si el almacenamiento esta bloqueado, la decision simplemente no se usa.
        }
        return null;
      }
      const decision: DecisionCookies = {
        version: VERSION,
        fecha: String(dato.fecha ?? ''),
        analitica: dato.analitica,
        publicidad: dato.publicidad,
        identificador: this.identificador,
      };
      try {
        // Migra decisiones anteriores que todavia no guardaban el identificador.
        localStorage.setItem(CLAVE, JSON.stringify(decision));
      } catch {
        // Sin persistencia se conserva la decision en memoria.
      }
      return decision;
    } catch {
      return null;
    }
  }

  private aplicarConsentMode(decision: DecisionCookies | null): void {
    if (typeof window === 'undefined') return;
    const w = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      __stockoraConsentDefault?: boolean;
    };
    w.dataLayer = w.dataLayer ?? [];
    const gtag: (...args: unknown[]) => void =
      typeof w.gtag === 'function'
        ? w.gtag
        : (...args: unknown[]) => {
            w.dataLayer?.push(args);
          };
    w.gtag = gtag;
    if (!w.__stockoraConsentDefault) {
      w.__stockoraConsentDefault = true;
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
    gtag('consent', 'update', {
      analytics_storage: decision?.analitica ? 'granted' : 'denied',
      ad_storage: decision?.publicidad ? 'granted' : 'denied',
      ad_user_data: decision?.publicidad ? 'granted' : 'denied',
      ad_personalization: decision?.publicidad ? 'granted' : 'denied',
    });
  }
}
