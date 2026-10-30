import { Component } from '@angular/core';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SEGURIDAD } from '../landing.data';

@Component({
  selector: 'app-seguridad',
  imports: [BrandIconComponent, RevealDirective],
  template: `
    <section class="brand-section brand-section--warm seguridad" aria-labelledby="seguridad-title">
      <div class="brand-container seguridad__grid">
        <div class="seguridad__intro" appReveal>
          <span class="brand-eyebrow">Seguridad y privacidad</span>
          <h2 id="seguridad-title" class="brand-h2">Controles que están en el código</h2>
          <p class="brand-lead">
            No mostramos sellos ni certificaciones que no tengamos. Estas son
            prácticas implementadas y verificables en la plataforma.
          </p>
          <p class="seguridad__nota">
            La revisión legal y de seguridad independiente sigue pendiente y se
            documenta fuera de esta página.
          </p>
        </div>

        <ul class="seguridad__list">
          @for (item of items; track item.titulo; let i = $index) {
            <li appReveal [retraso]="i * 60">
              <span class="security-icon">
                <app-brand-icon [name]="item.icono" class="brand-icon" />
              </span>
              <div>
                <h3>{{ item.titulo }}</h3>
                <p>{{ item.texto }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styleUrl: './seguridad.component.scss',
})
export class SeguridadComponent {
  readonly items = SEGURIDAD;
}
