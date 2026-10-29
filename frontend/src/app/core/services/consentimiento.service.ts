import { computed, Injectable, signal } from '@angular/core';

export interface DecisionCookies {
  version: number;
  fecha: string;
  analitica: boolean;
  publicidad: boolean;
}

const CLAVE = 'inv_cookie_consent_v1';
const VERSION = 1;
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class ConsentimientoService {
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
    };
    try {
      localStorage.setItem(CLAVE, JSON.stringify(decision));
    } catch {
      // Navegación privada o almacenamiento bloqueado: se mantiene en memoria.
    }
    this.decisionInterna.set(decision);
    this.aplicarConsentMode(decision);
    this.panelInterno.set(false);
  }

  abrirPanel(): void {
    this.panelInterno.set(true);
  }

  cerrarPanel(): void {
    this.panelInterno.set(false);
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
      return {
        version: VERSION,
        fecha: String(dato.fecha ?? ''),
        analitica: dato.analitica,
        publicidad: dato.publicidad,
      };
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
