import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-page">
      <div class="login-aside">
        <div class="aside-brand">
          <span class="brand-logo">ST</span>
          <span>Stockora</span>
        </div>

        <div class="aside-copy">
          <h2>Control total de tu inventario</h2>
          <p>
            Plataforma multempresa para gestionar bodegas, cargues, botellones y
            producción con trazabilidad completa.
          </p>

          <ul class="features">
            <li>
              <app-icon name="shield" />
              <div>
                <strong>Aislamiento por empresa</strong>
                <span>Cada empresa ve únicamente su información.</span>
              </div>
            </li>
            <li>
              <app-icon name="box" />
              <div>
                <strong>Inventario trazable</strong>
                <span>Movimientos, ajustes y confirmaciones auditadas.</span>
              </div>
            </li>
            <li>
              <app-icon name="bolt" />
              <div>
                <strong>Roles y permisos</strong>
                <span>Control fino de lo que puede hacer cada usuario.</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="aside-foot">© {{ anio }} · Sistema de inventario multempresa</div>
      </div>

      <div class="login-main">
        <div class="login-card">
          <div class="login-logo">
            <span class="brand-logo">ST</span>
          </div>
          <h1>Bienvenido de nuevo</h1>
          <p class="login-sub">Ingresa con tu cuenta para continuar</p>

          @if (error()) {
            <div class="alert alert-error">
              <app-icon name="warning" />
              <span>{{ error() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="enviar()">
            <div class="form-group">
              <label for="email">Correo electrónico</label>
              <div class="control-icon">
                <app-icon name="mail" />
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder="usuario@empresa.com"
                  autocomplete="username"
                />
              </div>
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <div class="form-error">Ingresa un correo válido</div>
              }
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="control-icon">
                <app-icon name="lock" />
                <input
                  id="password"
                  [type]="verClave() ? 'text' : 'password'"
                  class="form-control"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  style="padding-right: 44px"
                />
                <button
                  type="button"
                  class="ver-btn"
                  (click)="verClave.set(!verClave())"
                  [title]="verClave() ? 'Ocultar' : 'Mostrar'"
                >
                  <app-icon name="eye" />
                </button>
              </div>
              @if (
                form.controls.password.touched && form.controls.password.invalid
              ) {
                <div class="form-error">La contraseña es obligatoria</div>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="cargando()"
            >
              @if (cargando()) {
                <span class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></span>
                Ingresando…
              } @else {
                Ingresar
                <app-icon name="arrow-right" />
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly anio = new Date().getFullYear();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly verClave = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

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
          this.route.snapshot.queryParamMap.get('redirect') ?? '/dashboard';
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
