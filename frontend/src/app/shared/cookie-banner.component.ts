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
                <a href="/legal/politica-de-cookies.md">Política de cookies</a>.
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
        border: 1px solid #d7dce5;
        border-radius: 14px;
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
      }
      .cookie-texto {
        flex: 1 1 320px;
        min-width: 0;
      }
      .cookie-texto strong {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 1rem;
      }
      .cookie-texto p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.5;
        color: #334155;
      }
      .cookie-texto a {
        color: #0f766e;
        font-weight: 600;
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
        border-radius: 10px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .cookie-acciones .sec {
        border: 1px solid #94a3b8;
        background: #ffffff;
        color: #0f172a;
      }
      .cookie-acciones .pri {
        border: 1px solid #0f766e;
        background: #0f766e;
        color: #ffffff;
      }
      .cookie-acciones button:focus-visible,
      .fila input:focus-visible {
        outline: 3px solid #0ea5e9;
        outline-offset: 2px;
      }
      .fila {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.55rem 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .fila:last-of-type {
        border-bottom: 0;
      }
      .fila span {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .fila small {
        color: #475569;
        font-size: 0.8rem;
      }
      .fila input {
        width: 22px;
        height: 22px;
        accent-color: #0f766e;
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
