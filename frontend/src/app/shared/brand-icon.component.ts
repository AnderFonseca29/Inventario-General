import { Component, computed, input } from '@angular/core';

/**
 * Iconografía lineal original de la marca pública.
 * Trazo de 1,75 px, sin relleno y con terminaciones redondeadas.
 */
const ICONOS: Record<string, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  audit: 'M8 3h8l1 3h2v15H5V6h2l1-3ZM9 12l2 2 4-4',
  bottle: 'M9 3h6v3l2 2v3H7V8l2-2V3ZM7 11h10v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8ZM10 15h4',
  box: 'm12 3 9 5v8l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v8',
  building:
    'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M8 7h4M8 11h4M8 15h4M18 9h2v12M2 21h20',
  catalog: 'M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  check: 'm5 12 4 4 10-10',
  chevron: 'm9 6 6 6-6 6',
  close: 'm6 6 12 12M18 6 6 18',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'eye-off': 'M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.7 6.7C3.7 8.6 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  factory: 'M3 20V9l6 4V9l6 4V4h6v16H3ZM7 16h2M12 16h2M17 16h2',
  leaf: 'M5 19C12 19 17 15 19 5 11 6 6 10 5 19ZM5 19c2-4 5-7 9-9',
  lock: 'M6 10h12v11H6V10ZM8 10V7a4 4 0 0 1 8 0v3M12 14v3',
  mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 11-2l3 3M18 15a7 7 0 0 1-11 2l-3-3',
  report: 'M5 3h14v18H5V3ZM9 16v-3M12 16V8M15 16v-5',
  shield: 'M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3ZM9 12l2 2 4-4',
  spark: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  truck:
    'M3 6h11v10H3V6ZM14 10h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  users:
    'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75',
  warning: 'M12 3 2 21h20L12 3ZM12 9v5M12 18h.01',
};

@Component({
  selector: 'app-brand-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="ruta()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class BrandIconComponent {
  readonly name = input.required<string>();
  readonly ruta = computed(() => ICONOS[this.name()] ?? ICONOS['leaf']);
}
