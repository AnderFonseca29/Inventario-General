import { Component, input } from '@angular/core';

/**
 * Hojas lineales decorativas. Nunca transmiten información: son aria-hidden.
 */
@Component({
  selector: 'app-decor-leaves',
  template: `
    <svg
      viewBox="0 0 520 420"
      fill="none"
      aria-hidden="true"
      focusable="false"
      [class]="'decor decor--' + variante()"
    >
      <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M44 388C128 292 188 213 318 96" />
        <path d="M128 306C80 291 58 253 61 220C99 225 130 255 128 306Z" />
        <path d="M169 258C130 234 119 195 130 161C165 176 184 211 169 258Z" />
        <path d="M219 198C195 165 194 125 213 95C242 118 249 154 219 198Z" />
        <path d="M270 151C260 114 273 78 299 58C318 88 313 123 270 151Z" />
        <path d="M314 111C318 75 342 47 373 39C381 73 362 102 314 111Z" />
        <path d="M125 307C107 342 73 357 41 359C44 327 74 305 125 307Z" />
        <path d="M220 197C212 235 186 257 153 267C146 233 169 207 220 197Z" />
        <path d="M365 74C350 105 321 121 288 125C288 91 315 69 365 74Z" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: contents;
    }

    .decor {
      display: block;
      width: 100%;
      height: 100%;
      color: var(--brand-olive);
      opacity: 0.085;
    }

    .decor--espuma {
      color: var(--brand-peach);
      opacity: 0.14;
    }
  `,
})
export class DecorLeavesComponent {
  readonly variante = input<'oliva' | 'espuma'>('oliva');
}
