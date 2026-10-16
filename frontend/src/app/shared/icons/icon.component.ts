import { Component, computed, input } from '@angular/core';
import { DEFAULT_ICON, ICON_PATHS } from './icon-paths';

@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path [attr.d]="ruta()" /></svg>`,
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly ruta = computed(() => ICON_PATHS[this.name()] ?? DEFAULT_ICON);
}
