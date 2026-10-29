import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import {
  DocumentoLegalPendiente,
  LegalService,
} from '../../core/services/legal.service';

/**
 * Modal bloqueante de aceptacion de documentos legales.
 *
 * Se muestra en el shell autenticado cuando el backend informa que el usuario
 * no ha aceptado la version vigente. No se puede cerrar con Escape ni con clic
 * fuera: la unica salida es aceptar o cerrar sesion.
 */
@Component({
  selector: 'app-aceptacion-legal',
  templateUrl: './aceptacion-legal.component.html',
  styleUrl: './aceptacion-legal.component.scss',
})
export class AceptacionLegalComponent {
  private readonly legal = inject(LegalService);
  private readonly auth = inject(AuthService);
  private readonly checkRef =
    viewChild<ElementRef<HTMLInputElement>>('checkAceptacion');

  readonly pendientes = signal<DocumentoLegalPendiente[]>([]);
  readonly version = signal('');
  readonly acepto = signal(false);
  readonly aceptando = signal(false);
  readonly error = signal('');
  private readonly cargando = signal(true);

  readonly visible = computed(
    () => !this.cargando() && this.pendientes().length > 0,
  );

  constructor() {
    this.legal.pendientes().subscribe({
      next: (respuesta) => {
        this.version.set(respuesta.version);
        this.pendientes.set(respuesta.documentos);
        this.cargando.set(false);
      },
      error: () => {
        // Si la consulta falla no se bloquea el panel: la aceptacion se
        // reintenta en la siguiente carga. Bloquear por una caida de red
        // dejaria al usuario sin acceso a sus propios datos.
        this.cargando.set(false);
      },
    });

    effect(() => {
      if (!this.visible()) return;
      queueMicrotask(() => this.checkRef()?.nativeElement.focus());
    });

    effect((onCleanup) => {
      if (!this.visible()) return;
      const anterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = anterior;
      });
    });
  }

  aceptar(): void {
    if (!this.acepto() || this.aceptando()) return;

    this.aceptando.set(true);
    this.error.set('');
    const documentos = this.pendientes().map((item) => item.documento);

    this.legal.aceptar(documentos, 'PRIMER_LOGIN').subscribe({
      next: () => {
        this.aceptando.set(false);
        this.acepto.set(false);
        this.pendientes.set([]);
      },
      error: () => {
        this.aceptando.set(false);
        this.error.set(
          'No pudimos registrar la aceptacion. Revisa tu conexion e intenta de nuevo.',
        );
      },
    });
  }

  salir(): void {
    this.auth.cerrarSesion();
  }
}
