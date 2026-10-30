import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { CARACTERISTICAS } from '../landing.data';

@Component({
  selector: 'app-caracteristicas',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section caracteristicas" aria-labelledby="caracteristicas-title">
      <div class="brand-container">
        <div class="brand-head brand-head--center" appReveal>
          <span class="brand-eyebrow">Características</span>
          <h2 id="caracteristicas-title" class="brand-h2">La operación completa, sin piezas sueltas</h2>
          <p class="brand-lead">
            Cada función responde a una necesidad concreta de inventario,
            producción y control por empresa.
          </p>
        </div>

        <div class="caracteristicas__grid">
          @for (item of caracteristicas; track item.titulo; let i = $index) {
            <article class="caracteristicas__card" appReveal [retraso]="i * 55">
              <span class="brand-icon-tile">
                <app-brand-icon [name]="item.icono" class="brand-icon" />
              </span>
              <h3>{{ item.titulo }}</h3>
              <p>{{ item.texto }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './caracteristicas.component.scss',
})
export class CaracteristicasComponent {
  readonly caracteristicas = CARACTERISTICAS;
}
