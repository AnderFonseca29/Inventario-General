import { Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { PANTALLAS_DEMO } from '../landing.data';

@Component({
  selector: 'app-vista-previa',
  imports: [RevealDirective],
  template: `
    <section class="brand-section vista" aria-labelledby="vista-title">
      <div class="brand-container">
        <div class="vista__head" appReveal>
          <div>
            <span class="brand-eyebrow">Vista previa</span>
            <h2 id="vista-title" class="brand-h2">Así se ve la operación por dentro</h2>
          </div>
          <p class="brand-lead">
            Tres pantallas de ejemplo para mostrar cómo se organiza la
            información. Los datos son ilustrativos.
          </p>
        </div>

        <div class="vista__frame" appReveal [retraso]="80">
          <div class="vista__bar">
            <span class="vista__bar-title">Panel de operación</span>
            <span class="vista__demo">Datos de ejemplo</span>
          </div>

          <div class="vista__tabs" role="tablist" aria-label="Pantallas de ejemplo">
            @for (pantalla of pantallas; track pantalla.id; let i = $index) {
              <button
                type="button"
                role="tab"
                [id]="'tab-' + pantalla.id"
                [attr.aria-selected]="activa() === pantalla.id"
                [attr.aria-controls]="'panel-' + pantalla.id"
                [attr.tabindex]="activa() === pantalla.id ? 0 : -1"
                [class.is-active]="activa() === pantalla.id"
                (click)="activa.set(pantalla.id)"
                (keydown)="mover($event, i)"
              >
                {{ pantalla.etiqueta }}
              </button>
            }
          </div>

          @if (pantallaActiva(); as pantalla) {
            <div
              class="vista__panel"
              role="tabpanel"
              [id]="'panel-' + pantalla.id"
              [attr.aria-labelledby]="'tab-' + pantalla.id"
              tabindex="0"
            >
              <div class="vista__panel-head">
                <div>
                  <h3>{{ pantalla.titulo }}</h3>
                  <p>{{ pantalla.descripcion }}</p>
                </div>
                <span class="vista__panel-tag">Datos de ejemplo</span>
              </div>

              <div class="vista__kpis">
                @for (kpi of pantalla.kpis; track kpi.etiqueta) {
                  <div class="vista__kpi">
                    <span>{{ kpi.etiqueta }}</span>
                    <strong>{{ kpi.valor }}</strong>
                    <small>{{ kpi.detalle }}</small>
                  </div>
                }
              </div>

              <div class="vista__rows">
                @for (fila of pantalla.filas; track fila.nombre) {
                  <div class="vista__row">
                    <span class="vista__row-mark" aria-hidden="true"></span>
                    <div class="vista__row-copy">
                      <strong>{{ fila.nombre }}</strong>
                      <span>{{ fila.detalle }}</span>
                    </div>
                    <span [class]="'vista__status vista__status--' + fila.tono">{{ fila.estado }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './vista-previa.component.scss',
})
export class VistaPreviaComponent {
  private readonly document = inject(DOCUMENT);

  readonly pantallas = PANTALLAS_DEMO;
  readonly activa = signal(PANTALLAS_DEMO[0].id);
  readonly pantallaActiva = computed(() =>
    this.pantallas.find((pantalla) => pantalla.id === this.activa()),
  );

  mover(event: KeyboardEvent, indice: number): void {
    const teclas = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!teclas.includes(event.key)) return;

    event.preventDefault();
    let destino = indice;

    if (event.key === 'ArrowRight') destino = (indice + 1) % this.pantallas.length;
    if (event.key === 'ArrowLeft') {
      destino = (indice - 1 + this.pantallas.length) % this.pantallas.length;
    }
    if (event.key === 'Home') destino = 0;
    if (event.key === 'End') destino = this.pantallas.length - 1;

    const id = this.pantallas[destino].id;
    this.activa.set(id);
    setTimeout(() =>
      this.document.getElementById(`tab-${id}`)?.focus(),
    );
  }
}
