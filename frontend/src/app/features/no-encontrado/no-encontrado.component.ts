import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BrandMarkComponent } from '../../shared/brand-mark.component';
import { SiteFooterComponent } from '../landing/sections/site-footer.component';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, BrandMarkComponent, SiteFooterComponent],
  template: `
    <header class="nf-top brand-container">
      <a routerLink="/" aria-label="Stockora, ir al inicio">
        <app-brand-mark />
      </a>
    </header>

    <main class="nf-main brand-container" id="contenido">
      <p class="nf-code">Error 404</p>
      <h1>No encontramos esta página</h1>
      <p class="nf-lead">
        Puede que el enlace esté mal escrito, que la página haya cambiado de dirección o que ya no
        exista.
      </p>

      <div class="nf-acciones">
        <a class="nf-btn" routerLink="/">Ir al inicio</a>
        <a class="nf-btn nf-btn--sec" routerLink="/legal">Centro legal</a>
        <a class="nf-btn nf-btn--sec" routerLink="/contacto">Contacto</a>
      </div>

      <p class="nf-nota">
        Si venías de un enlace del pie de página o de un documento legal,
        <a routerLink="/contacto">cuéntanos</a> para corregirlo.
      </p>
    </main>

    <app-site-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .nf-top {
      padding-block: 16px;
    }

    .nf-top a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      text-decoration: none;
    }

    .nf-main {
      flex: 1;
      max-width: 760px;
      padding-block: clamp(48px, 10vw, 120px);
    }

    .nf-code {
      margin: 0 0 12px;
      color: var(--brand-primary);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-family: var(--brand-font-serif);
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.08;
      letter-spacing: -0.02em;
    }

    .nf-lead {
      margin: 16px 0 0;
      color: var(--brand-text-muted);
      font-size: 1.0625rem;
      line-height: 1.65;
    }

    .nf-acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 26px;
    }

    .nf-btn {
      display: inline-flex;
      align-items: center;
      min-height: 46px;
      padding-inline: 22px;
      border: 1px solid var(--brand-primary);
      border-radius: var(--brand-radius-sm);
      background: var(--brand-primary);
      color: var(--brand-primary-contrast);
      font-size: 0.9375rem;
      font-weight: 700;
      text-decoration: none;
    }

    .nf-btn:hover {
      background: var(--brand-primary-dark);
      border-color: var(--brand-primary-dark);
    }

    .nf-btn--sec {
      background: transparent;
      color: var(--brand-primary);
    }

    .nf-btn--sec:hover {
      background: var(--brand-primary-soft);
      color: var(--brand-primary-dark);
    }

    .nf-btn:focus-visible,
    .nf-nota a:focus-visible {
      outline: 3px solid var(--brand-info);
      outline-offset: 2px;
    }

    .nf-nota {
      margin: 28px 0 0;
      color: var(--brand-text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .nf-nota a {
      color: var(--brand-primary);
      font-weight: 600;
    }
  `,
})
export class NoEncontradoComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Página no encontrada | Stockora');
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }
}
