import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { contrasenaSeguraValidator } from '../../core/validators/contrasena.validator';
import { evaluarContrasena, LONGITUD_MINIMA } from '../../core/utils/contrasena';
import { BrandIconComponent } from '../../shared/brand-icon.component';
import { BrandMarkComponent } from '../../shared/brand-mark.component';

@Component({
  selector: 'app-registro',
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
          <span class="brand-eyebrow">Nueva empresa</span>
          <p class="auth__aside-title">
            Empieza con una operación ordenada desde el primer movimiento.
          </p>
          <p class="auth__aside-text">
            Registra los datos de tu empresa y la persona administradora. La
            solicitud queda lista para revisión.
          </p>

          <ul class="auth__points">
            <li>
              <app-brand-icon name="building" class="brand-icon" />
              <span><strong>Multiempresa</strong> Los datos de cada empresa se mantienen separados.</span>
            </li>
            <li>
              <app-brand-icon name="box" class="brand-icon" />
              <span><strong>Inventario trazable</strong> Movimientos con documento, consecutivo y auditoría.</span>
            </li>
            <li>
              <app-brand-icon name="users" class="brand-icon" />
              <span><strong>Roles y permisos</strong> Define qué puede hacer cada persona del equipo.</span>
            </li>
          </ul>
        </div>

        <p class="auth__aside-foot">© {{ anio }} Stockora · Inventario multiempresa</p>
      </aside>

      <main id="auth-main" class="auth__main" tabindex="-1">
        <div class="auth__panel auth__panel--registro">
          <a class="auth__mobile-brand" routerLink="/" aria-label="ST Stockora, ir al inicio">
            <app-brand-mark />
          </a>

          <div class="auth__header">
            <span class="auth__kicker">Solicitud de acceso</span>
            <h1>Crear cuenta</h1>
            <p>Cuéntanos de tu empresa para preparar el alta.</p>
          </div>

          @if (enviado()) {
            <div class="auth__alert auth__alert--success" role="status" aria-live="polite">
              <app-brand-icon name="check" class="brand-icon" />
              <span>Solicitud enviada. Un administrador revisará tu registro.</span>
            </div>
            <div class="auth__success-actions">
              <a class="brand-btn brand-btn--primary brand-btn--block" routerLink="/login">
                Volver a iniciar sesión
              </a>
              <a class="brand-btn brand-btn--secondary brand-btn--block" routerLink="/">
                Ir al inicio
              </a>
            </div>
          } @else {
            @if (error()) {
              <div class="auth__alert auth__alert--error" role="alert" aria-live="polite">
                <app-brand-icon name="warning" class="brand-icon" />
                <span>{{ error() }}</span>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="nombreEmpresa">
                    Nombre de la empresa <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="nombreEmpresa"
                    type="text"
                    class="brand-input"
                    formControlName="nombreEmpresa"
                    placeholder="Ej. Distribuidora El Roble"
                    autocomplete="organization"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid"
                    [attr.aria-describedby]="form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid ? 'empresa-error' : null"
                  />
                  @if (form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid) {
                    <p id="empresa-error" class="brand-error">Escribe el nombre de la empresa (mínimo 2 caracteres).</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="nit">NIT <span class="auth__optional">(opcional)</span></label>
                  <input
                    id="nit"
                    type="text"
                    class="brand-input"
                    formControlName="nit"
                    placeholder="900123456-7"
                    autocomplete="off"
                  />
                </div>
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="nombreAdmin">
                    Nombre del administrador <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="nombreAdmin"
                    type="text"
                    class="brand-input"
                    formControlName="nombreAdmin"
                    placeholder="Nombre completo"
                    autocomplete="name"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid"
                    [attr.aria-describedby]="form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid ? 'admin-error' : null"
                  />
                  @if (form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid) {
                    <p id="admin-error" class="brand-error">Escribe el nombre (mínimo 2 caracteres).</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="email">
                    Correo electrónico <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    class="brand-input"
                    formControlName="email"
                    placeholder="usuario@empresa.com"
                    autocomplete="email"
                    inputmode="email"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
                    [attr.aria-describedby]="form.controls.email.touched && form.controls.email.invalid ? 'email-error' : null"
                  />
                  @if (form.controls.email.touched && form.controls.email.invalid) {
                    <p id="email-error" class="brand-error">Ingresa un correo válido.</p>
                  }
                </div>
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="telefono">
                    Teléfono <span class="auth__optional">(opcional)</span>
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    class="brand-input"
                    formControlName="telefono"
                    placeholder="3001234567"
                    autocomplete="tel"
                    inputmode="tel"
                  />
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="password">
                    Contraseña <span aria-hidden="true">*</span>
                  </label>
                  <div class="auth__password">
                    <input
                      id="password"
                      [type]="verClave() ? 'text' : 'password'"
                      class="brand-input"
                      formControlName="password"
                      placeholder="Ej. Roble*2026"
                      autocomplete="new-password"
                      aria-required="true"
                      aria-describedby="passHelp"
                      [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid"
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
                  <div class="auth__clave" [attr.data-fuerza]="claveEstado().fuerza">
                    <div class="auth__clave-barra" aria-hidden="true"><span></span></div>
                    <p class="auth__clave-texto">
                      Seguridad: <strong>{{ etiquetaFuerza() }}</strong>
                    </p>
                  </div>
                  <ul id="passHelp" class="auth__requisitos" aria-label="Requisitos de la contraseña">
                    @for (requisito of claveEstado().requisitos; track requisito.id) {
                      <li [class.auth__requisito--ok]="requisito.cumple">
                        <span class="auth__requisito-marca" aria-hidden="true">{{ requisito.cumple ? '✓' : '○' }}</span>
                        <span>{{ requisito.texto }}</span>
                        <span class="brand-sr-only">{{ requisito.cumple ? 'cumplido' : 'pendiente' }}</span>
                      </li>
                    }
                  </ul>
                  @if (form.controls.password.touched && form.controls.password.invalid) {
                    <p class="brand-error">{{ primerErrorClave() }}</p>
                  }
                </div>
              </div>

              <div class="brand-field auth__field">
                <label class="brand-label" for="confirmar">
                  Confirmar contraseña <span aria-hidden="true">*</span>
                </label>
                <input
                  id="confirmar"
                  [type]="verClave() ? 'text' : 'password'"
                  class="brand-input"
                  formControlName="confirmar"
                  placeholder="Repite la contraseña"
                  autocomplete="new-password"
                  aria-required="true"
                  aria-describedby="confirmar-error"
                  [attr.aria-invalid]="form.touched && form.hasError('noCoincide')"
                />
                @if (form.touched && form.hasError('noCoincide')) {
                  <p id="confirmar-error" class="brand-error">Las contraseñas no coinciden.</p>
                }
              </div>

              <div class="brand-field auth__field">
                <label class="brand-check">
                  <span class="brand-check__control">
                    <input
                      type="checkbox"
                      formControlName="aceptaTerminos"
                      aria-required="true"
                      [attr.aria-invalid]="form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid"
                      [attr.aria-describedby]="form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid ? 'terminos-error' : null"
                    />
                    <span class="brand-check__box" aria-hidden="true"></span>
                  </span>
                  <span>
                    He leído y acepto los
                    <a href="legal/terminos-y-condiciones.md" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>,
                    la
                    <a href="legal/politica-de-privacidad.md" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>,
                    el
                    <a href="legal/aviso-de-privacidad.md" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a>
                    y el
                    <a href="legal/uso-aceptable.md" target="_blank" rel="noopener noreferrer">Uso Aceptable</a>.
                  </span>
                </label>
                @if (form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid) {
                  <p id="terminos-error" class="brand-error">Debes aceptar los documentos legales para continuar.</p>
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
                  Enviando…
                } @else {
                  Solicitar acceso
                  <app-brand-icon name="arrow" class="brand-icon" />
                }
              </button>

              <p class="auth__login-link">
                ¿Ya tienes cuenta?
                <a routerLink="/login">Iniciar sesión</a>
              </p>
            </form>
          }

          <a class="auth__back" routerLink="/">Volver al inicio</a>
        </div>
      </main>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

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
      password: [
        '',
        [Validators.required, Validators.minLength(LONGITUD_MINIMA), contrasenaSeguraValidator],
      ],
      confirmar: ['', [Validators.required, Validators.minLength(8)]],
      aceptaTerminos: [false, [Validators.requiredTrue]],
    },
    {
      validators: (g) => {
        const p = g.get('password')?.value;
        const c = g.get('confirmar')?.value;
        if (!p || !c) return null;
        return p === c ? null : { noCoincide: true };
      },
    },
  );

  private readonly claveTexto = toSignal(this.form.controls.password.valueChanges, {
    initialValue: this.form.controls.password.value,
  });

  readonly claveEstado = computed(() => evaluarContrasena(this.claveTexto() ?? ''));

  readonly etiquetaFuerza = computed(() => {
    const fuerza = this.claveEstado().fuerza;
    return fuerza === 'fuerte' ? 'fuerte' : fuerza === 'media' ? 'media' : 'débil';
  });

  readonly primerErrorClave = computed(
    () =>
      this.claveEstado().errores[0] ??
      'La contraseña no cumple los requisitos de seguridad.',
  );

  constructor() {
    this.seo.setPagina({
      titulo: 'Crear cuenta | Stockora',
      descripcion:
        'Solicita el alta de tu empresa en Stockora y empieza a ordenar inventario, producción y membresías.',
      ruta: '/registro',
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos obligatorios e intenta nuevamente.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    // Simulación de envío: el alta real la gestiona el superadministrador.
    setTimeout(() => {
      this.cargando.set(false);
      this.enviado.set(true);
    }, 600);
  }
}
