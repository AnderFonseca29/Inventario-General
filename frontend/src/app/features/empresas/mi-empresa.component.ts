import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresasService } from '../../core/services/empresas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Empresa } from '../../core/models/empresa.model';
import { IconComponent } from '../../shared/icons';

@Component({
  selector: 'app-mi-empresa',
  imports: [ReactiveFormsModule, IconComponent, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Mi empresa</div>
        <div class="page-subtitle">Datos generales e información de contacto.</div>
      </div>
    </div>

    @if (cargando()) {
      <div class="card card-body">
        <div class="skeleton" style="width:30%;height:22px;margin-bottom:16px"></div>
        <div class="skeleton" style="width:100%;margin-bottom:12px"></div>
        <div class="skeleton" style="width:100%;margin-bottom:12px"></div>
        <div class="skeleton" style="width:60%"></div>
      </div>
    } @else {
      <div class="grid-main-side">
        <div class="card card-body anim-up">
          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="form-row">
              <div class="form-group">
                <label for="nombre">Nombre</label>
                <input id="nombre" class="form-control" formControlName="nombre"
                  [class.is-invalid]="form.controls.nombre.touched && form.controls.nombre.invalid" />
                @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                  <div class="form-error">Mínimo 2 caracteres</div>
                }
              </div>
              <div class="form-group">
                <label for="nit">NIT</label>
                <input id="nit" class="form-control" formControlName="nit" />
              </div>
            </div>

            <div class="form-group">
              <label for="razonSocial">Razón social</label>
              <input id="razonSocial" class="form-control" formControlName="razonSocial" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Correo</label>
                <input id="email" type="email" class="form-control" formControlName="email"
                  [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
                @if (form.controls.email.touched && form.controls.email.invalid) {
                  <div class="form-error">Correo inválido</div>
                }
              </div>
              <div class="form-group">
                <label for="telefono">Teléfono</label>
                <input id="telefono" class="form-control" formControlName="telefono" />
              </div>
            </div>

            <div class="form-group">
              <label for="direccion">Dirección</label>
              <input id="direccion" class="form-control" formControlName="direccion" />
            </div>

            @if (puedeEditar()) {
              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                <app-icon name="check" />
                {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            }
          </form>
        </div>

        @if (empresa()) {
          <div class="card card-body anim-up">
            <div class="emp-head">
              <span class="avatar avatar-lg">{{ iniciales(empresa()!.nombre) }}</span>
              <div>
                <div class="emp-name">{{ empresa()!.nombre }}</div>
                @switch (empresa()!.estado) {
                  @case ('ACTIVA') {
                    <span class="badge badge-success"><span class="dot"></span>Activa</span>
                  }
                  @case ('SUSPENDIDA') {
                    <span class="badge badge-warn"><span class="dot"></span>Suspendida</span>
                  }
                  @default {
                    <span class="badge badge-danger"><span class="dot"></span>Cancelada</span>
                  }
                }
              </div>
            </div>
            <div class="divider"></div>
            <div class="info-line"><app-icon name="report" /><span>{{ empresa()!.razonSocial || 'Sin razón social' }}</span></div>
            <div class="info-line"><app-icon name="mail" /><span>{{ empresa()!.email || 'Sin correo' }}</span></div>
            <div class="info-line"><app-icon name="phone" /><span>{{ empresa()!.telefono || 'Sin teléfono' }}</span></div>
            <div class="info-line"><app-icon name="location" /><span>{{ empresa()!.direccion || 'Sin dirección' }}</span></div>
            <div class="info-line"><app-icon name="calendar" /><span>Creada el {{ empresa()!.createdAt | date: 'longDate' }}</span></div>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './mi-empresa.component.scss',
})
export class MiEmpresaComponent {
  private readonly empresasService = inject(EmpresasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly empresa = signal<Empresa | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);

  readonly puedeEditar = () => this.auth.hasPermiso('empresa.configurar');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    nit: [''],
    razonSocial: [''],
    email: ['', [Validators.email]],
    telefono: [''],
    direccion: [''],
  });

  constructor() {
    this.empresasService.miEmpresa().subscribe({
      next: (empresa) => {
        this.empresa.set(empresa);
        this.form.patchValue({
          nombre: empresa.nombre,
          nit: empresa.nit ?? '',
          razonSocial: empresa.razonSocial ?? '',
          email: empresa.email ?? '',
          telefono: empresa.telefono ?? '',
          direccion: empresa.direccion ?? '',
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.empresasService.actualizarMiEmpresa(this.form.getRawValue()).subscribe({
      next: (empresa) => {
        this.empresa.set(empresa);
        this.guardando.set(false);
        this.toast.exito('Datos de la empresa actualizados');
      },
      error: (err) => {
        this.guardando.set(false);
        this.toast.error(this.mensaje(err));
      },
    });
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
