import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMarkComponent } from '../../shared/brand-mark.component';

/** Encabezado común de las páginas públicas de información legal. */
@Component({
  selector: 'app-encabezado-publico',
  imports: [RouterLink, BrandMarkComponent],
  template: `
    <header class="pub-top">
      <div class="brand-container pub-top__inner">
        <a class="pub-top__brand" routerLink="/" aria-label="Stockora, ir al inicio">
          <app-brand-mark />
        </a>

        <nav class="pub-top__nav" aria-label="Información legal">
          <a routerLink="/legal">Centro legal</a>
          <a routerLink="/contacto">Contacto</a>
          <a routerLink="/derechos">Derechos y PQR</a>
          <a class="pub-top__cta" routerLink="/login">Iniciar sesión</a>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .pub-top {
      border-bottom: 1px solid var(--brand-border);
      background: color-mix(in srgb, var(--brand-surface) 92%, transparent);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .pub-top__inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 24px;
      min-height: var(--brand-nav-h);
    }

    .pub-top__brand {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      text-decoration: none;
    }

    .pub-top__nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 18px;
    }

    .pub-top__nav a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--brand-text-muted);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }

    .pub-top__nav a:hover {
      color: var(--brand-primary);
    }

    .pub-top__nav a.pub-top__cta {
      padding-inline: 16px;
      border: 1px solid var(--brand-primary);
      border-radius: var(--brand-radius-sm);
      color: var(--brand-primary);
    }

    .pub-top__nav a.pub-top__cta:hover {
      background: var(--brand-primary);
      color: var(--brand-primary-contrast);
    }

    .pub-top__nav a:focus-visible {
      outline: 3px solid var(--brand-info);
      outline-offset: 2px;
    }

    @media (max-width: 560px) {
      .pub-top__inner {
        justify-content: center;
      }

      .pub-top__nav {
        justify-content: center;
      }
    }
  `,
})
export class EncabezadoPublicoComponent {}
