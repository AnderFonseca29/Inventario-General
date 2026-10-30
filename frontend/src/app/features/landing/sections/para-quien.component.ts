import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { TIPOS_NEGOCIO } from '../landing.data';

@Component({
  selector: 'app-para-quien',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section para-quien" aria-labelledby="para-quien-title">
      <div class="brand-container">
        <div class="para-quien__head" appReveal>
          <div>
            <span class="brand-eyebrow">Pensado para</span>
            <h2 id="para-quien-title" class="brand-h2">Operaciones que se mueven todos los días</h2>
          </div>
          <p class="brand-lead">
            No es un catálogo de promesas: es el tipo de operación para el que
            están construidos los módulos de Stockora.
          </p>
        </div>

        <ul class="para-quien__grid">
          @for (tipo of tipos; track tipo.titulo; let i = $index) {
            <li class="para-quien__item" appReveal [retraso]="i * 60">
              <span class="brand-icon-tile">
                <app-brand-icon [name]="tipo.icono" class="brand-icon" />
              </span>
              <div>
                <h3>{{ tipo.titulo }}</h3>
                <p>{{ tipo.texto }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styleUrl: './para-quien.component.scss',
})
export class ParaQuienComponent {
  readonly tipos = TIPOS_NEGOCIO;
}
