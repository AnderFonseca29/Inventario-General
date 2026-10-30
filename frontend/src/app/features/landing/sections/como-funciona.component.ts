import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { PASOS } from '../landing.data';

@Component({
  selector: 'app-como-funciona',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section como" aria-labelledby="como-title">
      <div class="brand-container">
        <div class="brand-head brand-head--center" appReveal>
          <span class="brand-eyebrow">Cómo funciona</span>
          <h2 id="como-title" class="brand-h2">De la configuración a la operación</h2>
          <p class="brand-lead">
            Tres pasos para dejar el inventario listo y empezar a registrar lo
            que pasa todos los días.
          </p>
        </div>

        <ol class="como__steps">
          @for (paso of pasos; track paso.numero; let i = $index) {
            <li class="como__step" appReveal [retraso]="i * 80">
              <div class="como__step-top">
                <span class="como__number">{{ paso.numero }}</span>
                <span class="como__icon">
                  <app-brand-icon [name]="i === 0 ? 'building' : i === 1 ? 'catalog' : 'chart'" class="brand-icon" />
                </span>
              </div>
              <h3>{{ paso.titulo }}</h3>
              <p>{{ paso.texto }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styleUrl: './como-funciona.component.scss',
})
export class ComoFuncionaComponent {
  readonly pasos = PASOS;
}
