import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogoService } from '../core/services/dialogo.service';
import { IconComponent } from './icons';

/**
 * Contenedor global de dialogos (confirmacion, pregunta y aviso).
 *
 * Se monta una sola vez en el componente raiz, de modo que cualquier
 * pantalla puede abrir un dialogo sin depender de su propio arbol de
 * componentes.
 */
@Component({
  selector: 'app-dialogo-container',
  imports: [FormsModule, IconComponent],
  template: `
    @if (dialogo(); as d) {
      <div class="modal-backdrop" (click)="cancelar()">
        <div
          class="modal modal-dialogo"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="tituloId"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h3 [id]="tituloId">{{ d.titulo }}</h3>
            <button
              type="button"
              class="icon-btn"
              (click)="cancelar()"
              aria-label="Cerrar"
            >
              <app-icon name="close" />
            </button>
          </div>

          @if (d.tipo === 'aviso') {
            <div class="modal-body">
              <p class="dialogo-mensaje">{{ d.mensaje }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" (click)="cerrar()">
                {{ d.textoCerrar }}
              </button>
            </div>
          } @else {
            <div class="modal-body">
              @if (d.mensaje) {
                <p class="dialogo-mensaje">{{ d.mensaje }}</p>
              }

              @if (d.tipo === 'preguntar') {
                <div class="form-group">
                  <label for="dialogo-campo">{{ d.etiqueta }}</label>
                  <input
                    #campo
                    id="dialogo-campo"
                    class="form-control"
                    [type]="d.tipoEntrada"
                    [placeholder]="d.placeholder"
                    [(ngModel)]="valor"
                    (keyup.enter)="aceptar()"
                    [class.is-invalid]="!!error()"
                  />
                  @if (error(); as e) {
                    <div class="form-error">{{ e }}</div>
                  }
                </div>

                @if (d.repetir) {
                  <div class="form-group">
                    <label for="dialogo-campo-repeticion">
                      Repita {{ d.etiqueta.toLowerCase() }}
                    </label>
                    <input
                      id="dialogo-campo-repeticion"
                      class="form-control"
                      [type]="d.tipoEntrada"
                      [placeholder]="d.placeholder"
                      [(ngModel)]="valorRepetido"
                      (keyup.enter)="aceptar()"
                      [class.is-invalid]="!!error()"
                    />
                  </div>
                }
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelar()">
                {{ d.textoCancelar }}
              </button>
              <button
                type="button"
                class="btn"
                [class.btn-danger]="d.peligro"
                [class.btn-primary]="!d.peligro"
                (click)="aceptar()"
              >
                {{ d.textoConfirmar }}
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './dialogo-container.component.scss',
})
export class DialogoContainerComponent {
  private readonly dialogoService = inject(DialogoService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly dialogo = this.dialogoService.dialogo;

  /** Valor escrito en el dialogo de tipo "preguntar". */
  readonly valor = signal('');
  /** Segunda escritura, cuando el dialogo pide repetir el valor. */
  readonly valorRepetido = signal('');
  readonly error = signal<string | null>(null);

  readonly tituloId = 'dialogo-titulo';

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  constructor() {
    // Al abrirse un dialogo nuevo se limpia el valor y el error, y el foco
    // pasa al campo para poder escribir de inmediato.
    effect(() => {
      const d = this.dialogo();
      if (!d) return;
      this.valor.set('');
      this.valorRepetido.set('');
      this.error.set(null);
      setTimeout(() => this.campo()?.nativeElement.focus(), 0);
    });
  }

  /** Escape cancela el dialogo abierto. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialogo()) this.cancelar();
  }

  /** Atrapa el foco dentro del dialogo mientras esta abierto. */
  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: Event): void {
    const d = this.dialogo();
    if (!d) return;
    const teclado = event as KeyboardEvent;
    const focoables = Array.from(
      this.host.nativeElement.querySelectorAll(
        '.modal-dialogo button, .modal-dialogo input, .modal-dialogo [tabindex]:not([tabindex="-1"])',
      ),
    ) as HTMLElement[];
    if (focoables.length === 0) return;
    const primero = focoables[0];
    const ultimo = focoables[focoables.length - 1];
    const activo = document.activeElement as HTMLElement | null;
    if (teclado.shiftKey && activo === primero) {
      teclado.preventDefault();
      ultimo.focus();
    } else if (!teclado.shiftKey && activo === ultimo) {
      teclado.preventDefault();
      primero.focus();
    }
  }

  aceptar(): void {
    const d = this.dialogo();
    if (!d) return;

    if (d.tipo === 'preguntar') {
      const valor = this.valor().trim();
      if (valor.length < d.minimo) {
        this.error.set(
          d.minimo > 1
            ? `Debe tener al menos ${d.minimo} caracteres.`
            : 'Este campo es obligatorio.',
        );
        return;
      }
      if (d.repetir && valor !== this.valorRepetido().trim()) {
        this.error.set('Los valores escritos no coinciden.');
        return;
      }
      this.dialogoService.resolver(valor);
      return;
    }

    this.dialogoService.resolver(true);
  }

  cancelar(): void {
    const d = this.dialogo();
    if (!d) return;
    if (d.tipo === 'preguntar') {
      this.dialogoService.resolver(null);
      return;
    }
    this.dialogoService.resolver(false);
  }

  cerrar(): void {
    this.dialogoService.resolver(null);
  }
}
