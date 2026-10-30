import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { NOTA_PRECIOS, PLANES } from '../landing.data';

@Component({
  selector: 'app-planes',
  imports: [RouterLink, BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section planes" aria-labelledby="planes-title">
      <div class="brand-container">
        <div class="brand-head brand-head--center" appReveal>
          <span class="brand-eyebrow">Planes</span>
          <h2 id="planes-title" class="brand-h2">Un precio para cada tamaño de operación</h2>
          <p class="brand-lead">
            Los límites salen de la configuración de los planes de Stockora. Elige
            el que corresponda a tu equipo y a tus bodegas.
          </p>
        </div>

        <div class="planes__grid">
          @for (plan of planes; track plan.codigo; let i = $index) {
            <article
              class="planes__card"
              [class.planes__card--destacado]="plan.destacado"
              appReveal
              [retraso]="i * 70"
            >
              <div class="planes__card-top">
                <span class="brand-badge" [class.brand-badge--olive]="plan.destacado">
                  {{ plan.etiqueta }}
                </span>
                @if (plan.destacado) {
                  <span class="planes__sugerido">Sugerido</span>
                }
              </div>

              <h3>{{ plan.nombre }}</h3>
              <p class="planes__desc">{{ plan.descripcion }}</p>

              <div class="planes__price">
                <strong class="brand-tabular">{{ plan.precio }}</strong>
                <span>{{ plan.periodo }}</span>
              </div>

              <ul class="planes__features">
                @for (feature of plan.incluye; track feature) {
                  <li>
                    <app-brand-icon name="check" class="brand-icon" />
                    <span>{{ feature }}</span>
                  </li>
                }
              </ul>

              <a
                class="brand-btn brand-btn--block"
                [class.brand-btn--primary]="plan.destacado"
                [class.brand-btn--secondary]="!plan.destacado"
                routerLink="/registro"
              >
                Elegir {{ plan.nombre }}
              </a>
            </article>
          }
        </div>

        <p class="planes__note">{{ notaPrecios }}</p>
      </div>
    </section>
  `,
  styleUrl: './planes.component.scss',
})
export class PlanesComponent {
  readonly planes = PLANES;
  readonly notaPrecios = NOTA_PRECIOS;
}
