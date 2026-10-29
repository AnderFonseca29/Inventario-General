import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icons';
import {
  ConsultaDerechos,
  DerechosService,
  RadicadoDerechos,
  TipoSolicitudDerechos,
} from '../../core/services/derechos.service';

type CampoFormulario =
  | 'tipo'
  | 'nombre'
  | 'documento'
  | 'correo'
  | 'mensaje'
  | 'autorizacion';

@Component({
  selector: 'app-derechos',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, DatePipe],
  templateUrl: './derechos.component.html',
  styleUrl: './derechos.component.scss',
})
export class DerechosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly derechos = inject(DerechosService);

  readonly anio = new Date().getFullYear();

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly radicado = signal<RadicadoDerechos | null>(null);

  readonly consultando = signal(false);
  readonly errorConsulta = signal<string | null>(null);
  readonly consulta = signal<ConsultaDerechos | null>(null);
  readonly ultimoCorreo = signal('');

  readonly form = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<TipoSolicitudDerechos>('CONSULTA', [
      Validators.required,
    ]),
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
    ],
    documento: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(30),
      ],
    ],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.maxLength(30)]],
    empresa: ['', [Validators.maxLength(160)]],
    mensaje: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(4000),
      ],
    ],
    autorizacion: [false, [Validators.requiredTrue]],
  });

  readonly consultaForm = this.fb.nonNullable.group({
    radicado: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
  });

  invalido(campo: CampoFormulario): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  mensaje(campo: CampoFormulario): string {
    const control = this.form.controls[campo];
    if (control.hasError('required') || control.hasError('requiredTrue')) {
      return 'Este campo es obligatorio.';
    }
    if (control.hasError('email')) {
      return 'Ingresa un correo válido.';
    }
    if (control.hasError('minlength')) {
      return 'El valor es demasiado corto.';
    }
    if (control.hasError('maxlength')) {
      return 'El valor es demasiado largo.';
    }
    return 'Revisa este campo.';
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const datos = this.form.getRawValue();

    this.derechos
      .crear({
        tipo: datos.tipo,
        nombre: datos.nombre.trim(),
        documento: datos.documento.trim(),
        correo: datos.correo.trim(),
        telefono: datos.telefono.trim() || undefined,
        empresa: datos.empresa.trim() || undefined,
        mensaje: datos.mensaje.trim(),
        autorizacion: datos.autorizacion,
      })
      .subscribe({
        next: (respuesta) => {
          this.radicado.set(respuesta);
          this.ultimoCorreo.set(datos.correo.trim());
          this.enviando.set(false);
          this.form.reset({
            tipo: 'CONSULTA',
            nombre: '',
            documento: '',
            correo: '',
            telefono: '',
            empresa: '',
            mensaje: '',
            autorizacion: false,
          });
        },
        error: (error: unknown) => {
          this.error.set(this.textoError(error));
          this.enviando.set(false);
        },
      });
  }

  nueva(): void {
    this.radicado.set(null);
    this.error.set(null);
  }

  prepararConsulta(): void {
    const actual = this.radicado();
    if (!actual) return;
    this.consultaForm.patchValue({
      radicado: actual.radicado,
      correo: this.ultimoCorreo(),
    });
    document
      .getElementById('consulta')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  consultar(): void {
    if (this.consultaForm.invalid) {
      this.consultaForm.markAllAsTouched();
      return;
    }

    this.consultando.set(true);
    this.errorConsulta.set(null);
    this.consulta.set(null);
    const datos = this.consultaForm.getRawValue();

    this.derechos.consultar(datos.radicado, datos.correo).subscribe({
      next: (respuesta) => {
        this.consulta.set(respuesta);
        this.consultando.set(false);
      },
      error: (error: unknown) => {
        this.errorConsulta.set(this.textoError(error));
        this.consultando.set(false);
      },
    });
  }

  private textoError(error: unknown): string {
    const cuerpo = (error as { error?: { message?: string | string[] } })?.error;
    const mensaje = cuerpo?.message;
    if (Array.isArray(mensaje)) return mensaje.join(' ');
    return mensaje ?? 'No fue posible completar la solicitud. Intenta de nuevo.';
  }
}
