import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMarkComponent } from '../../../shared/brand-mark.component';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { ConsentimientoService } from '../../../core/services/consentimiento.service';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, BrandMarkComponent, BrandIconComponent],
  template: `
    <footer class="footer">
      <div class="brand-container footer__grid">
        <div class="footer__brand">
          <a class="footer__brand-link" routerLink="/" aria-label="ST Stockora, ir al inicio">
            <app-brand-mark [invertido]="true" />
          </a>
          <p>
            Inventario, producción y membresías para empresas que necesitan
            saber qué pasó, dónde y cuándo.
          </p>
          <span class="footer__note">Precios en pesos colombianos (COP).</span>
        </div>

        <nav class="footer__col" aria-label="Producto">
          <h3>Producto</h3>
          <a href="#caracteristicas">Características</a>
          <a href="#modulos">Módulos</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </nav>

        <nav class="footer__col" aria-label="Cuenta">
          <h3>Cuenta</h3>
          <a routerLink="/login">Iniciar sesión</a>
          <a routerLink="/registro">Crear cuenta</a>
          <a routerLink="/derechos">Radicar solicitud</a>
        </nav>

        <nav class="footer__col" aria-label="Legal">
          <h3>Legal</h3>
          <a href="legal/terminos-y-condiciones.md" target="_blank" rel="noopener noreferrer">
            Términos y condiciones
          </a>
          <a href="legal/politica-de-privacidad.md" target="_blank" rel="noopener noreferrer">
            Privacidad
          </a>
          <a href="legal/politica-de-cookies.md" target="_blank" rel="noopener noreferrer">
            Cookies
          </a>
          <a href="legal/uso-aceptable.md" target="_blank" rel="noopener noreferrer">
            Uso aceptable
          </a>
          <a href="legal/derechos-de-los-titulares.md" target="_blank" rel="noopener noreferrer">
            Derechos de los titulares
          </a>
          <a href="legal/politica-de-retencion.md" target="_blank" rel="noopener noreferrer">
            Retención
          </a>
          <a href="legal/contrato-de-encargo.md" target="_blank" rel="noopener noreferrer">
            Encargo de datos
          </a>
          <button type="button" class="footer__cookies" (click)="abrirCookies()">
            Preferencias de cookies
          </button>
        </nav>
      </div>

      <div class="brand-container footer__bottom">
        <span>© {{ anio }} Stockora. Todos los derechos reservados.</span>
        <a href="#contenido" class="footer__top">
          Volver arriba
          <app-brand-icon name="arrow" class="brand-icon" />
        </a>
      </div>
    </footer>
  `,
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  private readonly consentimiento = inject(ConsentimientoService);
  readonly anio = new Date().getFullYear();

  abrirCookies(): void {
    this.consentimiento.abrirPanel();
  }
}
