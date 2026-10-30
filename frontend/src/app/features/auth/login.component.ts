import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { BrandIconComponent } from '../../shared/brand-icon.component';
import { BrandMarkComponent } from '../../shared/brand-mark.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, BrandIconComponent, BrandMarkComponent],
  template: `
    <div class="auth brand-page">
      <a class="brand-skip-link" href="#auth-main">Saltar al contenido</a>

      <aside class="auth__aside">
        <app-brand-icon name="leaf" class="auth__leaf" />
        <a class="auth__brand" routerLink="/" aria-label="ST Stockora, ir al inicio">
          <app-brand-mark [tamano]="'lg'" />
        </a>

        <div class="auth__aside-copy">
          <span class="brand-eyebrow">Operación ordenada</span>
          <p class="auth__aside-title">
            Todo lo que necesitas para saber qué pasó en tu inventario.
          </p>
          <p class="auth__aside-text">
            Un solo lugar para catálogo, existencias, cargues, producción y
            membresías, con los datos de tu empresa separados de los demás.
          </p>

          <ul class="auth__points">
            <li>
              <app-brand-icon name="building" class="brand-icon" />
              <span><strong>Aislamiento por empresa</strong> Cada usuario ve la información de su empresa.</span>
            </li>
            <li>
              <app-brand-icon name="shield" class="brand-icon" />
              <span><strong>Permisos por rol</strong> El backend valida cada operación antes de ejecutarla.</span>
            </li>
            <li>
              <app-brand-icon name="audit" class="brand-icon" />
              <span><strong>Movimientos auditables</strong> Consulta qué cambió, cuándo y quién lo hizo.</span>
            </li>
          </ul>
        </div>

        <p class="auth__aside-foot">© {{ anio }} Stockora · Inventario multiempresa</p>
      </aside>

      <main id="auth-main" class="auth__main" tabindex="-1">
        <div class="auth__panel">
          <a class="auth__mobile-brand" routerLink="/" aria-label="ST Stockora, ir al inicio">
            <app-brand-mark />
          </a>

          <div class="auth__header">
            <span class="auth__kicker">Acceso a tu cuenta</span>
            <h1>Bienvenido de nuevo</h1>
            <p>Ingresa con tu cuenta para continuar.</p>
          </div>

          @if (error()) {
            <div class="auth__alert auth__alert--error" role="alert" aria-live="polite">
              <app-brand-icon name="warning" class="brand-icon" />
              <span>{{ error() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="brand-field auth__field">
              <label class="brand-label" for="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                class="brand-input"
                formControlName="email"
                placeholder="usuario@empresa.com"
                autocomplete="username"
                inputmode="email"
                [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
                [attr.aria-describedby]="form.controls.email.touched && form.controls.email.invalid ? 'email-error' : null"
              />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <p id="email-error" class="brand-error">Ingresa un correo válido.</p>
              }
            </div>

            <div class="brand-field auth__field">
              <label class="brand-label" for="password">Contraseña</label>
              <div class="auth__password">
                <input
                  id="password"
                  [type]="verClave() ? 'text' : 'password'"
                  class="brand-input"
                  formControlName="password"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                  [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid"
                  [attr.aria-describedby]="form.controls.password.touched && form.controls.password.invalid ? 'password-error' : null"
                />
                <button
                  type="button"
                  class="auth__eye"
                  (click)="verClave.set(!verClave())"
                  [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="verClave()"
                >
                  <app-brand-icon [name]="verClave() ? 'eye-off' : 'eye'" class="brand-icon" />
                </button>
              </div>
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <p id="password-error" class="brand-error">La contraseña es obligatoria.</p>
              }
            </div>

            <button
              type="submit"
              class="brand-btn brand-btn--primary brand-btn--block brand-btn--lg auth__submit"
              [disabled]="cargando()"
              [attr.aria-busy]="cargando()"
            >
              @if (cargando()) {
                <span class="auth__spinner" aria-hidden="true"></span>
                Ingresando…
              } @else {
                Ingresar
                <app-brand-icon name="arrow" class="brand-icon" />
              }
            </button>
          </form>

          <div class="auth__footer">
            <p>¿No tienes cuenta?</p>
            <a class="brand-btn brand-btn--secondary brand-btn--block" routerLink="/registro">
              Crear cuenta
            </a>
            <a class="auth__back" routerLink="/">Volver al inicio</a>
          </div>
        </div>
      </main>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly anio = new Date().getFullYear();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly verClave = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    this.seo.setPagina({
      titulo: 'Iniciar sesión | Stockora',
      descripcion: 'Ingresa a tu cuenta de Stockora para continuar con la operación de tu empresa.',
      ruta: '/login',
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const destino =
          this.route.snapshot.queryParamMap.get('redirect') ?? '/app/dashboard';
        void this.router.navigateByUrl(destino);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg =
          err?.error?.message ??
          'No se pudo iniciar sesión. Verifica tus credenciales.';
        this.error.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}
