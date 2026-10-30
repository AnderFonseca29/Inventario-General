import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { ConsentimientoService } from '../core/services/consentimiento.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <section class="cookie" role="region" aria-label="Preferencias de cookies">
        <div class="cookie-caja">
          @if (!panel()) {
            <div class="cookie-texto">
              <strong>Cookies</strong>
              <p>
                Usamos cookies necesarias para el servicio y, con tu permiso,
                analíticas y publicitarias. Puedes aceptar, rechazar o
                configurar.
                <a href="legal/politica-de-cookies.md">Política de cookies</a>.
              </p>
            </div>
            <div class="cookie-acciones">
              <button type="button" class="sec" (click)="rechazar()">
                Rechazar
              </button>
              <button type="button" class="sec" (click)="abrir()">
                Preferencias
              </button>
              <button type="button" class="pri" (click)="aceptar()">
                Aceptar todas
              </button>
            </div>
          } @else {
            <div class="cookie-texto">
              <strong>Preferencias de cookies</strong>
              <label class="fila">
                <span>
                  <b>Necesarias</b>
                  <small>Imprescindibles para la sesión y la seguridad.</small>
                </span>
                <input type="checkbox" checked disabled />
              </label>
              <label class="fila">
                <span>
                  <b>Analíticas</b>
                  <small>Nos ayudan a medir el uso del sitio de forma agregada.</small>
                </span>
                <input
                  type="checkbox"
                  [checked]="analitica()"
                  (change)="analitica.set($any($event.target).checked)"
                />
              </label>
              <label class="fila">
                <span>
                  <b>Publicitarias</b>
                  <small>Miden campañas y permiten remarketing.</small>
                </span>
                <input
                  type="checkbox"
                  [checked]="publicidad()"
                  (change)="publicidad.set($any($event.target).checked)"
                />
              </label>
            </div>
            <div class="cookie-acciones">
              <button type="button" class="sec" (click)="cerrar()">
                Cancelar
              </button>
              <button type="button" class="pri" (click)="guardar()">
                Guardar preferencias
              </button>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .cookie {
        position: fixed;
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        z-index: 1000;
        display: flex;
        justify-content: center;
        pointer-events: none;
        font-family: var(--brand-font-sans);
      }
      .cookie-caja {
        pointer-events: auto;
        width: 100%;
        max-width: 1100px;
        max-height: calc(100vh - 2rem);
        max-height: calc(100dvh - 2rem);
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--brand-border);
        border-radius: var(--brand-radius-lg);
        background: var(--brand-surface);
        color: var(--brand-text);
        box-shadow: var(--brand-shadow-lg);
      }
      .cookie-texto {
        flex: 1 1 320px;
        min-width: 0;
      }
      .cookie-texto strong {
        display: block;
        margin-bottom: 0.35rem;
        color: var(--brand-text);
        font-family: var(--brand-font-serif);
        font-size: 1.05rem;
        font-weight: 600;
      }
      .cookie-texto p {
        margin: 0;
        color: var(--brand-text-muted);
        font-size: 0.9rem;
        line-height: 1.55;
      }
      .cookie-texto a {
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        padding-inline: 2px;
        color: var(--brand-primary-dark);
        font-weight: 650;
      }
      .cookie-acciones {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .cookie-acciones button {
        min-height: 44px;
        padding: 0 1rem;
        border-radius: var(--brand-radius-sm);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .cookie-acciones .sec {
        border: 1px solid var(--brand-border-control);
        background: var(--brand-surface);
        color: var(--brand-text);
      }
      .cookie-acciones .pri {
        border: 1px solid var(--brand-primary);
        background: var(--brand-primary);
        color: var(--brand-primary-contrast);
      }
      .cookie-acciones button:focus-visible,
      .fila input:focus-visible {
        outline: 2px solid var(--brand-primary);
        outline-offset: 3px;
      }
      .fila {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 52px;
        padding: 0.45rem 0;
        border-bottom: 1px solid var(--brand-border);
        cursor: pointer;
      }
      .fila:last-of-type {
        border-bottom: 0;
      }
      .fila span {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .fila b {
        color: var(--brand-text);
      }
      .fila small {
        color: var(--brand-text-muted);
        font-size: 0.8rem;
      }
      .fila input {
        width: 22px;
        height: 22px;
        accent-color: var(--brand-primary);
        flex: 0 0 auto;
      }
      @media (max-width: 640px) {
        .cookie {
          left: 0.6rem;
          right: 0.6rem;
          bottom: 0.6rem;
        }
        .cookie-caja {
          max-height: calc(100vh - 1.2rem);
          max-height: calc(100dvh - 1.2rem);
          padding: 0.9rem;
        }
        .cookie-acciones {
          width: 100%;
          flex-direction: column;
        }
        .cookie-acciones button {
          width: 100%;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .cookie-caja {
          transition: none;
        }
      }
    `,
  ],
})
export class CookieBannerComponent {
  private readonly consentimiento = inject(ConsentimientoService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly panel = this.consentimiento.panelAbierto;
  readonly analitica = signal(true);
  readonly publicidad = signal(true);
  readonly visible = computed(
    () =>
      (this.consentimiento.panelAbierto() || !this.consentimiento.hayDecision()) &&
      !this.url().startsWith('/app'),
  );

  abrir(): void {
    const decision = this.consentimiento.decision();
    this.analitica.set(decision?.analitica ?? true);
    this.publicidad.set(decision?.publicidad ?? true);
    this.consentimiento.abrirPanel();
  }

  aceptar(): void {
    this.consentimiento.aceptarTodo();
  }

  rechazar(): void {
    this.consentimiento.rechazarTodo();
  }

  guardar(): void {
    this.consentimiento.guardar(this.analitica(), this.publicidad());
  }

  cerrar(): void {
    this.consentimiento.cerrarPanel();
  }
}
