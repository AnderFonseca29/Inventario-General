import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { MODULOS } from '../landing.data';

@Component({
  selector: 'app-modulos',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section brand-section--warm modulos" aria-labelledby="modulos-title">
      <div class="brand-container">
        <div class="modulos__head" appReveal>
          <div>
            <span class="brand-eyebrow">Módulos</span>
            <h2 id="modulos-title" class="brand-h2">Ocho módulos, una misma operación</h2>
          </div>
          <p class="brand-lead">
            El plan que elijas activa las piezas que tu empresa necesita. Los
            datos siguen viviendo en el mismo espacio aislado.
          </p>
        </div>

        <div class="modulos__grid">
          @for (modulo of modulos; track modulo.nombre; let i = $index) {
            <article class="modulos__item" appReveal [retraso]="(i % 4) * 45">
              <span class="modulos__icon">
                <app-brand-icon [name]="modulo.icono" class="brand-icon" />
              </span>
              <div>
                <h3>{{ modulo.nombre }}</h3>
                <p>{{ modulo.texto }}</p>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './modulos.component.scss',
})
export class ModulosComponent {
  readonly modulos = MODULOS;
}
