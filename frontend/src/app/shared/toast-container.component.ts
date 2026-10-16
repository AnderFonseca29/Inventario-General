import { Component, inject } from '@angular/core';
import { ToastService, ToastTipo } from '../core/services/toast.service';
import { IconComponent } from './icons';

@Component({
  selector: 'app-toast-container',
  imports: [IconComponent],
  template: `
    <div class="toast-wrap">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class]="t.tipo">
          <app-icon class="toast-icon" [name]="icono(t.tipo)" />
          <div class="toast-msg">{{ t.mensaje }}</div>
          <button class="icon-btn" (click)="toastService.cerrar(t.id)">
            <app-icon name="close" />
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  icono(tipo: ToastTipo): string {
    if (tipo === 'success') return 'check';
    if (tipo === 'error') return 'warning';
    return 'info';
  }
}
