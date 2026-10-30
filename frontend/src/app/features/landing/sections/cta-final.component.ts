import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { DecorLeavesComponent } from './decor-leaves.component';

@Component({
  selector: 'app-cta-final',
  imports: [RouterLink, BrandIconComponent, RevealDirective, DecorLeavesComponent],
  template: `
    <section class="cta" aria-labelledby="cta-title">
      <div class="cta__leaves" aria-hidden="true">
        <app-decor-leaves variante="espuma" />
      </div>

      <div class="brand-container cta__inner" appReveal>
        <span class="cta__eyebrow">Empieza por ordenar lo que ya tienes</span>
        <h2 id="cta-title">Tu próxima operación puede empezar con los datos en su lugar.</h2>
        <p>
          Crea tu cuenta y revisa cómo Stockora organiza inventario, cargues,
          producción y membresías para tu empresa.
        </p>
        <a class="brand-btn brand-btn--inverse brand-btn--lg" routerLink="/registro">
          Crear cuenta
          <app-brand-icon name="arrow" class="brand-icon" />
        </a>
      </div>
    </section>
  `,
  styleUrl: './cta-final.component.scss',
})
export class CtaFinalComponent {}
