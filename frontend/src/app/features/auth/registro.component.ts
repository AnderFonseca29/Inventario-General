import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icons';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="login-page">
      <div class="login-aside">
        <a class="aside-brand" routerLink="/">
          <span class="brand-logo">ST</span>
          <span>Stockora</span>
        </a>

        <div class="aside-copy">
          <h2>Crea tu cuenta</h2>
          <p>
            Solicita el alta de tu empresa para empezar a gestionar inventario,
            cargues, botellones y producción desde un solo lugar.
          </p>

          <ul class="features">
            <li>
              <app-icon name="shield" />
              <div>
                <strong>Multiempresa</strong>
                <span>Aislamiento total entre empresas.</span>
              </div>
            </li>
            <li>
              <app-icon name="box" />
              <div>
                <strong>Inventario trazable</strong>
                <span>Movimientos auditados y controlados.</span>
              </div>
            </li>
            <li>
              <app-icon name="users" />
              <div>
                <strong>Roles y permisos</strong>
                <span>Asigna accesos por perfil.</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="aside-foot">© {{ anio }} · Sistema de inventario multiempresa</div>
      </div>

      <div class="login-main">
        <div class="login-card">
          <div class="login-logo">
            <span class="brand-logo">ST</span>
          </div>
          <h1>Crear cuenta</h1>
          <p class="login-sub">Registra los datos para solicitar acceso</p>

          @if (enviado()) {
            <div class="alert alert-success">
              <app-icon name="check" />
              <span>Solicitud enviada. Un administrador revisará tu registro.</span>
            </div>
            <div class="registro-actions">
              <a class="btn btn-outline btn-block" routerLink="/login">Volver a iniciar sesión</a>
              <a class="btn btn-ghost btn-block" routerLink="/">Ir al inicio</a>
            </div>
          } @else {
            @if (error()) {
              <div class="alert alert-error" role="alert" aria-live="polite">
                <app-icon name="warning" />
                <span>{{ error() }}</span>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label for="nombreEmpresa">Nombre de la empresa <span aria-hidden="true">*</span></label>
                  <input
                    id="nombreEmpresa"
                    type="text"
                    class="form-control"
                    formControlName="nombreEmpresa"
                    placeholder="Ej. Distribuidora XYZ"
                    autocomplete="organization"
                    [class.is-invalid]="form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid"
                    aria-required="true"
                  />
                  @if (form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid) {
                    <div class="form-error">El nombre de la empresa es obligatorio (mínimo 2 caracteres)</div>
                  }
                </div>

                <div class="form-group">
                  <label for="nit">NIT (opcional)</label>
                  <input
                    id="nit"
                    type="text"
                    class="form-control"
                    formControlName="nit"
                    placeholder="900123456-7"
                    autocomplete="off"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="nombreAdmin">Nombre del administrador <span aria-hidden="true">*</span></label>
                  <input
                    id="nombreAdmin"
                    type="text"
                    class="form-control"
                    formControlName="nombreAdmin"
                    placeholder="Nombre completo"
                    autocomplete="name"
                    [class.is-invalid]="form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid"
                    aria-required="true"
                  />
                  @if (form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid) {
                    <div class="form-error">El nombre es obligatorio (mínimo 2 caracteres)</div>
                  }
                </div>

                <div class="form-group">
                  <label for="email">Correo electrónico <span aria-hidden="true">*</span></label>
                  <div class="control-icon">
                    <app-icon name="mail" />
                    <input
                      id="email"
                      type="email"
                      class="form-control"
                      formControlName="email"
                      placeholder="usuario@empresa.com"
                      autocomplete="email"
                      [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid"
                      aria-required="true"
                    />
                  </div>
                  @if (form.controls.email.touched && form.controls.email.invalid) {
                    <div class="form-error">Ingresa un correo válido</div>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="telefono">Teléfono (opcional)</label>
                  <input
                    id="telefono"
                    type="tel"
                    class="form-control"
                    formControlName="telefono"
                    placeholder="3001234567"
                    autocomplete="tel"
                    inputmode="tel"
                  />
                </div>

                <div class="form-group">
                  <label for="password">Contraseña <span aria-hidden="true">*</span></label>
                  <div class="control-icon">
                    <app-icon name="lock" />
                    <input
                      id="password"
                      [type]="verClave() ? 'text' : 'password'"
                      class="form-control"
                      formControlName="password"
                      placeholder="Mínimo 8 caracteres"
                      autocomplete="new-password"
                      style="padding-right: 44px"
                      [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid"
                      aria-required="true"
                      aria-describedby="passHelp"
                    />
                    <button
                      type="button"
                      class="ver-btn"
                      (click)="verClave.set(!verClave())"
                      [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                      [title]="verClave() ? 'Ocultar' : 'Mostrar'"
                    >
                      <app-icon name="eye" />
                    </button>
                  </div>
                  <small id="passHelp" class="form-hint">Mínimo 8 caracteres</small>
                  @if (form.controls.password.touched && form.controls.password.invalid) {
                    <div class="form-error">La contraseña debe tener al menos 8 caracteres</div>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="confirmar">Confirmar contraseña <span aria-hidden="true">*</span></label>
                <div class="control-icon">
                  <app-icon name="lock" />
                  <input
                    id="confirmar"
                    [type]="verClave() ? 'text' : 'password'"
                    class="form-control"
                    formControlName="confirmar"
                    placeholder="Repite la contraseña"
                    autocomplete="new-password"
                    [class.is-invalid]="form.touched && form.hasError('noCoincide')"
                    aria-required="true"
                  />
                </div>
                @if (form.touched && form.hasError('noCoincide')) {
                  <div class="form-error">Las contraseñas no coinciden</div>
                }
              </div>

              <div class="form-group registro-legal">
                <label class="legal-check">
                  <input type="checkbox" formControlName="aceptaTerminos" />
                  <span>
                    He leído y acepto los
                    <a href="/legal/terminos-y-condiciones.md" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>,
                    la
                    <a href="/legal/politica-de-privacidad.md" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>
                    y el
                    <a href="/legal/uso-aceptable.md" target="_blank" rel="noopener noreferrer">Uso Aceptable</a>.
                  </span>
                </label>
                @if (form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid) {
                  <div class="form-error">Debes aceptar los documentos legales para continuar</div>
                }
              </div>

              <button type="submit" class="btn btn-primary btn-block" [disabled]="cargando()">
                @if (cargando()) {
                  <span class="spinner" style="width:16px;height:16px;border-width:2px;margin:0" aria-hidden="true"></span>
                  Enviando…
                } @else {
                  Solicitar acceso
                  <app-icon name="arrow-right" />
                }
              </button>

              <p class="registro-login">
                ¿Ya tienes cuenta?
                <a routerLink="/login">Iniciar sesión</a>
              </p>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly anio = new Date().getFullYear();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviado = signal(false);
  readonly verClave = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nombreEmpresa: ['', [Validators.required, Validators.minLength(2)]],
      nit: [''],
      nombreAdmin: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required, Validators.minLength(8)]],
      aceptaTerminos: [false, [Validators.requiredTrue]],
    },
    { validators: (g: any) => {
      const p = g.get('password')?.value;
      const c = g.get('confirmar')?.value;
      if (!p || !c) return null;
      return p === c ? null : { noCoincide: true };
    } }
  );

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos obligatorios e intenta nuevamente.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    // Simulación de envío: el alta real la gestiona el superadministrador
    setTimeout(() => {
      this.cargando.set(false);
      this.enviado.set(true);
    }, 600);
  }
}
