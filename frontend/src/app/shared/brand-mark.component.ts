import { Component, input } from '@angular/core';

/**
 * Marca provisional de Stockora.
 *
 * TODO(marca): sustituir el monograma «ST» por el logotipo vectorial definitivo
 * cuando exista. Se conserva el recurso actual y se adapta a los tokens de la
 * marca pública sin inventar un símbolo nuevo.
 */
@Component({
  selector: 'app-brand-mark',
  template: `
    <span class="brand-mark" [class.brand-mark--inverse]="invertido()" [class.brand-mark--lg]="tamano() === 'lg'">
      <span class="brand-mark__symbol" aria-hidden="true">ST</span>{{ ' ' }}
      @if (conTexto()) {
        <span class="brand-mark__name">Stockora</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      min-width: 0;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--brand-text);
      line-height: 1;
    }

    .brand-mark__symbol {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 11px;
      background: var(--brand-primary);
      color: var(--brand-primary-contrast);
      font-family: var(--brand-font-sans);
      font-size: 0.8125rem;
      font-weight: 750;
      letter-spacing: 0.04em;
      box-shadow: 0 5px 14px color-mix(in srgb, var(--brand-primary) 22%, transparent);
      flex: 0 0 auto;
    }

    .brand-mark__name {
      font-family: var(--brand-font-serif);
      font-size: 1.3125rem;
      font-weight: 600;
      letter-spacing: -0.025em;
    }

    .brand-mark--lg .brand-mark__symbol {
      width: 44px;
      height: 44px;
      border-radius: 13px;
      font-size: 0.9375rem;
    }

    .brand-mark--lg .brand-mark__name {
      font-size: 1.5rem;
    }

    .brand-mark--inverse {
      color: var(--brand-on-dark);
    }

    .brand-mark--inverse .brand-mark__symbol {
      background: var(--brand-on-dark);
      color: var(--brand-espresso);
      box-shadow: none;
    }
  `,
})
export class BrandMarkComponent {
  readonly conTexto = input(true);
  readonly invertido = input(false);
  readonly tamano = input<'md' | 'lg'>('md');
}
