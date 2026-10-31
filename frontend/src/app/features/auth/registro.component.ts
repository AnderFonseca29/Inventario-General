import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
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
            Registra los datos de tu empresa y la persona administradora. La cuenta queda activa
            con 7 días de prueba.
          </p>

          <ul class="auth__points">
            <li>
              <app-brand-icon name="building" class="brand-icon" />
              <span
                ><strong>Multiempresa</strong> Los datos de cada empresa se mantienen
                separados.</span
              >
            </li>
            <li>
              <app-brand-icon name="box" class="brand-icon" />
              <span
                ><strong>Inventario trazable</strong> Movimientos con documento, consecutivo y
                auditoría.</span
              >
            </li>
            <li>
              <app-brand-icon name="users" class="brand-icon" />
              <span
                ><strong>Roles y permisos</strong> Define qué puede hacer cada persona del
                equipo.</span
              >
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
            <span class="auth__kicker">Registro de empresa</span>
            <h1>Crear cuenta</h1>
            <p>Completa los datos de tu empresa y empieza la prueba de 7 días.</p>
          </div>

          @if (enviado()) {
            <div class="auth__alert auth__alert--success" role="status" aria-live="polite">
              <app-brand-icon name="check" class="brand-icon" />
              <span>Cuenta creada. Te estamos llevando a tu panel.</span>
            </div>
            <div class="auth__success-actions">
              <a class="brand-btn brand-btn--primary brand-btn--block" routerLink="/app/dashboard">
                Ir a mi panel
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
              <p class="auth__seccion">Datos de la empresa</p>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="razonSocial">
                    Razón social <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="razonSocial"
                    type="text"
                    class="brand-input"
                    formControlName="razonSocial"
                    placeholder="Ej. Distribuidora El Roble S.A.S."
                    autocomplete="organization"
                    aria-required="true"
                    aria-describedby="razonSocial-help"
                    [attr.aria-invalid]="
                      form.controls.razonSocial.touched && form.controls.razonSocial.invalid
                    "
                  />
                  <p id="razonSocial-help" class="brand-hint">
                    Tal como aparece en el certificado de Cámara de Comercio.
                  </p>
                  @if (form.controls.razonSocial.touched && form.controls.razonSocial.invalid) {
                    <p class="brand-error">Escribe la razón social (mínimo 3 caracteres).</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="nombreEmpresa">
                    Nombre comercial <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="nombreEmpresa"
                    type="text"
                    class="brand-input"
                    formControlName="nombreEmpresa"
                    placeholder="Ej. El Roble"
                    aria-required="true"
                    aria-describedby="nombreEmpresa-help"
                    [attr.aria-invalid]="
                      form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid
                    "
                  />
                  <p id="nombreEmpresa-help" class="brand-hint">
                    Cómo verás la empresa dentro de Stockora.
                  </p>
                  @if (form.controls.nombreEmpresa.touched && form.controls.nombreEmpresa.invalid) {
                    <p class="brand-error">Escribe el nombre comercial (mínimo 2 caracteres).</p>
                  }
                </div>
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="nit"
                    >NIT <span class="auth__optional">(opcional)</span></label
                  >
                  <input
                    id="nit"
                    type="text"
                    class="brand-input"
                    formControlName="nit"
                    placeholder="Ej. 901.234.567-8"
                    autocomplete="off"
                    aria-describedby="nit-help"
                  />
                  <p id="nit-help" class="brand-hint">
                    Con dígito de verificación. Si aún no lo tienes, déjalo vacío.
                  </p>
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="matricula">
                    Matrícula mercantil <span class="auth__optional">(opcional)</span>
                  </label>
                  <input
                    id="matricula"
                    type="text"
                    class="brand-input"
                    formControlName="matricula"
                    placeholder="Ej. 00123456-12"
                    autocomplete="off"
                    aria-describedby="matricula-help"
                  />
                  <p id="matricula-help" class="brand-hint">
                    Número del certificado de existencia y representación.
                  </p>
                </div>
              </div>

              <div class="brand-field auth__field">
                <label class="brand-label" for="direccion">
                  Domicilio <span aria-hidden="true">*</span>
                </label>
                <input
                  id="direccion"
                  type="text"
                  class="brand-input"
                  formControlName="direccion"
                  placeholder="Ej. Calle 93 No. 15-20, oficina 302"
                  autocomplete="street-address"
                  aria-required="true"
                  aria-describedby="direccion-help"
                  [attr.aria-invalid]="
                    form.controls.direccion.touched && form.controls.direccion.invalid
                  "
                />
                <p id="direccion-help" class="brand-hint">
                  Dirección física donde opera la empresa.
                </p>
                @if (form.controls.direccion.touched && form.controls.direccion.invalid) {
                  <p class="brand-error">Escribe el domicilio (mínimo 5 caracteres).</p>
                }
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="ciudad">
                    Ciudad <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="ciudad"
                    type="text"
                    class="brand-input"
                    formControlName="ciudad"
                    placeholder="Ej. Bogotá D.C."
                    autocomplete="address-level2"
                    aria-required="true"
                    [attr.aria-invalid]="
                      form.controls.ciudad.touched && form.controls.ciudad.invalid
                    "
                  />
                  @if (form.controls.ciudad.touched && form.controls.ciudad.invalid) {
                    <p class="brand-error">Escribe la ciudad.</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="departamento">
                    Departamento <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="departamento"
                    type="text"
                    class="brand-input"
                    formControlName="departamento"
                    placeholder="Ej. Cundinamarca"
                    autocomplete="address-level1"
                    aria-required="true"
                    [attr.aria-invalid]="
                      form.controls.departamento.touched && form.controls.departamento.invalid
                    "
                  />
                  @if (form.controls.departamento.touched && form.controls.departamento.invalid) {
                    <p class="brand-error">Escribe el departamento.</p>
                  }
                </div>
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="representante">
                    Representante legal <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="representante"
                    type="text"
                    class="brand-input"
                    formControlName="representante"
                    placeholder="Ej. María Fernanda Gómez"
                    autocomplete="name"
                    aria-required="true"
                    aria-describedby="representante-help"
                    [attr.aria-invalid]="
                      form.controls.representante.touched && form.controls.representante.invalid
                    "
                  />
                  <p id="representante-help" class="brand-hint">
                    Quien firma el contrato de tratamiento de datos.
                  </p>
                  @if (form.controls.representante.touched && form.controls.representante.invalid) {
                    <p class="brand-error">Escribe el nombre del representante legal.</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="telefono">
                    Teléfono <span class="auth__optional">(opcional)</span>
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    class="brand-input"
                    formControlName="telefono"
                    placeholder="Ej. +57 601 555 0123"
                    autocomplete="tel"
                    inputmode="tel"
                  />
                </div>
              </div>

              <div class="auth__row">
                <div class="brand-field auth__field">
                  <label class="brand-label" for="correoDatos">
                    Correo para temas de datos <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="correoDatos"
                    type="email"
                    class="brand-input"
                    formControlName="correoDatos"
                    placeholder="Ej. privacidad@elroble.com"
                    autocomplete="off"
                    inputmode="email"
                    aria-required="true"
                    aria-describedby="correoDatos-help"
                    [attr.aria-invalid]="
                      form.controls.correoDatos.touched && form.controls.correoDatos.invalid
                    "
                  />
                  <p id="correoDatos-help" class="brand-hint">
                    Aquí llegan las solicitudes sobre datos personales.
                  </p>
                  @if (form.controls.correoDatos.touched && form.controls.correoDatos.invalid) {
                    <p class="brand-error">Ingresa un correo válido.</p>
                  }
                </div>

                <div class="brand-field auth__field">
                  <label class="brand-label" for="sitioWeb"
                    >Sitio web <span class="auth__optional">(opcional)</span></label
                  >
                  <input
                    id="sitioWeb"
                    type="url"
                    class="brand-input"
                    formControlName="sitioWeb"
                    placeholder="Ej. https://elroble.com"
                    autocomplete="url"
                    inputmode="url"
                  />
                </div>
              </div>

              <p class="auth__seccion">Persona administradora</p>

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
                    [attr.aria-invalid]="
                      form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid
                    "
                    [attr.aria-describedby]="
                      form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid
                        ? 'admin-error'
                        : null
                    "
                  />
                  @if (form.controls.nombreAdmin.touched && form.controls.nombreAdmin.invalid) {
                    <p id="admin-error" class="brand-error">
                      Escribe el nombre (mínimo 2 caracteres).
                    </p>
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
                    [attr.aria-describedby]="
                      form.controls.email.touched && form.controls.email.invalid
                        ? 'email-error'
                        : null
                    "
                  />
                  @if (form.controls.email.touched && form.controls.email.invalid) {
                    <p id="email-error" class="brand-error">Ingresa un correo válido.</p>
                  }
                </div>
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
                    [attr.aria-invalid]="
                      form.controls.password.touched && form.controls.password.invalid
                    "
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
                      <span class="auth__requisito-marca" aria-hidden="true">{{
                        requisito.cumple ? '✓' : '○'
                      }}</span>
                      <span>{{ requisito.texto }}</span>
                      <span class="brand-sr-only">{{
                        requisito.cumple ? 'cumplido' : 'pendiente'
                      }}</span>
                    </li>
                  }
                </ul>
                @if (form.controls.password.touched && form.controls.password.invalid) {
                  <p class="brand-error">{{ primerErrorClave() }}</p>
                }
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
                      [attr.aria-invalid]="
                        form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid
                      "
                      [attr.aria-describedby]="
                        form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid
                          ? 'terminos-error'
                          : null
                      "
                    />
                    <span class="brand-check__box" aria-hidden="true"></span>
                  </span>
                  <span>
                    He leído y acepto los
                    <a
                      href="legal/terminos-y-condiciones.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      >Términos y Condiciones</a
                    >, la
                    <a
                      href="legal/politica-de-privacidad.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      >Política de Privacidad</a
                    >, el
                    <a href="legal/aviso-de-privacidad.md" target="_blank" rel="noopener noreferrer"
                      >Aviso de Privacidad</a
                    >
                    y el
                    <a href="legal/uso-aceptable.md" target="_blank" rel="noopener noreferrer"
                      >Uso Aceptable</a
                    >.
                  </span>
                </label>
                @if (form.controls.aceptaTerminos.touched && form.controls.aceptaTerminos.invalid) {
                  <p id="terminos-error" class="brand-error">
                    Debes aceptar los documentos legales para continuar.
                  </p>
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
                  Crear cuenta y empezar
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
  private readonly auth = inject(AuthService);

  readonly anio = new Date().getFullYear();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviado = signal(false);
  readonly verClave = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      razonSocial: ['', [Validators.required, Validators.minLength(3)]],
      nombreEmpresa: ['', [Validators.required, Validators.minLength(2)]],
      nit: ['', [Validators.pattern(/^[0-9.\-\s]{6,20}$/)]],
      matricula: ['', [Validators.pattern(/^[0-9.\-\s]{4,20}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      ciudad: ['', [Validators.required]],
      departamento: ['', [Validators.required]],
      representante: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.pattern(/^[+0-9()\-\s]{7,20}$/)]],
      correoDatos: ['', [Validators.required, Validators.email]],
      sitioWeb: ['', [Validators.pattern(/^https?:\/\/[^\s]+\.[^\s]+$/)]],
      nombreAdmin: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(LONGITUD_MINIMA), contrasenaSeguraValidator],
      ],
      confirmar: ['', [Validators.required, Validators.minLength(LONGITUD_MINIMA)]],
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
    () => this.claveEstado().errores[0] ?? 'La contraseña no cumple los requisitos de seguridad.',
  );

  constructor() {
    this.seo.setPagina({
      titulo: 'Crear cuenta | Stockora',
      descripcion:
        'Crea la cuenta de tu empresa en Stockora: 7 días de prueba para ordenar inventario, producción y membresías.',
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

    const v = this.form.getRawValue();
    const opcional = (valor: string) => {
      const limpio = valor.trim();
      return limpio.length > 0 ? limpio : undefined;
    };

    this.auth
      .registro({
        razonSocial: v.razonSocial.trim(),
        nombre: v.nombreEmpresa.trim(),
        nit: opcional(v.nit),
        matricula: opcional(v.matricula),
        direccion: v.direccion.trim(),
        ciudad: v.ciudad.trim(),
        departamento: v.departamento.trim(),
        representante: v.representante.trim(),
        telefono: opcional(v.telefono),
        correoDatos: v.correoDatos.trim(),
        sitioWeb: opcional(v.sitioWeb),
        nombreAdmin: v.nombreAdmin.trim(),
        email: v.email.trim(),
        password: v.password,
        aceptaTerminos: v.aceptaTerminos,
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.enviado.set(true);
          void this.router.navigate(['/app/dashboard']);
        },
        error: (err) => {
          this.cargando.set(false);
          const msg =
            err?.error?.message ??
            'No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.';
          this.error.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }
}
