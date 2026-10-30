import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { PREGUNTAS } from '../landing.data';

@Component({
  selector: 'app-faq',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section faq" aria-labelledby="faq-title">
      <div class="brand-container faq__grid">
        <div class="faq__intro" appReveal>
          <span class="brand-eyebrow">Preguntas</span>
          <h2 id="faq-title" class="brand-h2">Lo que conviene saber antes de empezar</h2>
          <p class="brand-lead">
            Respuestas directas sobre el alcance actual de Stockora. Si una
            respuesta depende de una decisión pendiente, no la inventamos.
          </p>
        </div>

        <div class="faq__list">
          @for (item of preguntas; track item.pregunta; let i = $index) {
            <details class="faq__item" appReveal [retraso]="i * 40">
              <summary>
                <span>{{ item.pregunta }}</span>
                <span class="faq__toggle" aria-hidden="true">
                  <app-brand-icon name="plus" class="faq__icon-plus" />
                  <app-brand-icon name="minus" class="faq__icon-minus" />
                </span>
              </summary>
              <p>{{ item.respuesta }}</p>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  readonly preguntas = PREGUNTAS;
}
