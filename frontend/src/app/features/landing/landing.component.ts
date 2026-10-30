import { Component, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { LandingNavComponent } from './sections/landing-nav.component';
import { LandingHeroComponent } from './sections/landing-hero.component';
import { ParaQuienComponent } from './sections/para-quien.component';
import { CaracteristicasComponent } from './sections/caracteristicas.component';
import { ModulosComponent } from './sections/modulos.component';
import { VistaPreviaComponent } from './sections/vista-previa.component';
import { ComoFuncionaComponent } from './sections/como-funciona.component';
import { SeguridadComponent } from './sections/seguridad.component';
import { PlanesComponent } from './sections/planes.component';
import { FaqComponent } from './sections/faq.component';
import { CtaFinalComponent } from './sections/cta-final.component';
import { SiteFooterComponent } from './sections/site-footer.component';
import { PLANES } from './landing.data';

@Component({
  selector: 'app-landing',
  imports: [
    LandingNavComponent,
    LandingHeroComponent,
    ParaQuienComponent,
    CaracteristicasComponent,
    ModulosComponent,
    VistaPreviaComponent,
    ComoFuncionaComponent,
    SeguridadComponent,
    PlanesComponent,
    FaqComponent,
    CtaFinalComponent,
    SiteFooterComponent,
  ],
  template: `
    <div class="brand-page landing-page">
      <a class="brand-skip-link" href="#contenido">Saltar al contenido</a>
      <app-landing-nav />

      <main id="contenido" class="landing" tabindex="-1">
        <app-landing-hero />

      <div id="para-quien" class="defer-anchor" aria-hidden="false">
        @defer (on viewport; prefetch on idle) {
          <app-para-quien />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="caracteristicas" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-caracteristicas />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="modulos" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-modulos />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="vista-previa" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-vista-previa />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="como-funciona" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-como-funciona />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="seguridad" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-seguridad />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="planes" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-planes />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div id="preguntas" class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-faq />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot" aria-hidden="true"></div>
        }
      </div>

      <div class="defer-anchor">
        @defer (on viewport; prefetch on idle) {
          <app-cta-final />
        } @placeholder (minimum 100ms) {
          <div class="defer-slot defer-slot--cta" aria-hidden="true"></div>
        }
      </div>
    </main>

    @defer (on viewport; prefetch on idle) {
      <app-site-footer />
    } @placeholder (minimum 100ms) {
      <div class="defer-slot defer-slot--footer" aria-hidden="true"></div>
    }
    </div>
  `,
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.setPagina({
      titulo: 'Stockora | Inventario, producción y membresías en una sola plataforma',
      descripcion:
        'Controla catálogo, inventario, cargues, botellones, producción y membresías con datos separados por empresa y trazabilidad de cada movimiento.',
      ruta: '/',
    });

    this.seo.setDatosEstructurados({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Stockora',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'es-CO',
      description:
        'Plataforma de inventario multiempresa para catálogo, inventario, cargues, botellones, producción, membresías y auditoría.',
      offers: PLANES.map((plan) => ({
        '@type': 'Offer',
        name: plan.nombre,
        price: String(plan.precioMensual),
        priceCurrency: 'COP',
        url: this.seo.url('/registro'),
      })),
    });
  }
}
