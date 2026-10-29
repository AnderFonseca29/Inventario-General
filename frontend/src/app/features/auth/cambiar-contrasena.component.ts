import { Component, inject, model, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icons';

/**
 * Modal de cambio de contrasena del usuario que ha iniciado sesion.
 *
 * Usa `POST /api/auth/change-password`, que exige la contrasena actual y una
 * nueva de al menos 10 caracteres con mayuscula, minuscula y numero.
 * Las mismas reglas se comprueban aqui para avisar al usuario antes de
 * llamar a la API.
 */

/** Reglas de contrasena que aplica el backend. */
const REGLAS = {
  minimo: 10,
  mensaje:
    'La nueva contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.',
};

@Component({
  selector: 'app-cambiar-contrasena',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    @if (abierto()) {
      <div class="modal-backdrop" (click)="cerrar()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-contrasena"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h3 id="titulo-contrasena">Cambiar contraseña</h3>
            <button
              type="button"
              class="icon-btn"
              (click)="cerrar()"
              aria-label="Cerrar"
            >
              <app-icon name="close" />
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (error()) {
                <div class="alert alert-error">
                  <app-icon name="warning" />
                  <span>{{ error() }}</span>
                </div>
              }

              <div class="form-group">
                <label for="contrasena-actual">Contraseña actual</label>
                <input
                  id="contrasena-actual"
                  class="form-control"
                  type="password"
                  formControlName="actual"
                  autocomplete="current-password"
                  [class.is-invalid]="invalido('actual')"
                />
              </div>

              <div class="form-group">
                <label for="contrasena-nueva">Contraseña nueva</label>
                <input
                  id="contrasena-nueva"
                  class="form-control"
                  type="password"
                  formControlName="nueva"
                  autocomplete="new-password"
                  [class.is-invalid]="invalido('nueva')"
                />
                <div class="form-hint">
                  Mínimo 10 caracteres, con mayúscula, minúscula y número.
                </div>
              </div>

              <div class="form-group">
                <label for="contrasena-repeticion">Repita la contraseña nueva</label>
                <input
                  id="contrasena-repeticion"
                  class="form-control"
                  type="password"
                  formControlName="repeticion"
                  autocomplete="new-password"
                  [class.is-invalid]="invalido('repeticion')"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cerrar()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="guardando() || form.invalid"
              >
                {{ guardando() ? 'Guardando…' : 'Cambiar contraseña' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
    .modal {
      max-width: 460px;
    }

    @media (max-width: 640px) {
      .modal {
        max-width: none;
      }
    }
  `,
})
export class CambiarContrasenaComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  /** El shell abre y cierra el modal (enlace de dos vias). */
  readonly abierto = model(false);

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    actual: ['', [Validators.required]],
    nueva: [
      '',
      [
        Validators.required,
        Validators.minLength(REGLAS.minimo),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    repeticion: ['', [Validators.required]],
  });

  invalido(campo: 'actual' | 'nueva' | 'repeticion'): boolean {
    const control = this.form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  cerrar(): void {
    if (this.guardando()) return;
    this.error.set(null);
    this.form.reset();
    this.abierto.set(false);
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { actual, nueva, repeticion } = this.form.getRawValue();
    if (nueva !== repeticion) {
      this.error.set('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (nueva === actual) {
      this.error.set('La contraseña nueva debe ser distinta de la actual.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.auth.cambiarContrasena(actual ?? '', nueva ?? '').subscribe({
      next: () => {
        this.guardando.set(false);
        this.form.reset();
        this.abierto.set(false);
        this.toast.exito('Contraseña actualizada');
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.error.set(this.mensaje(err));
      },
    });
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
