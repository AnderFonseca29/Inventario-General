import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMarkComponent } from '../../../shared/brand-mark.component';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { ConsentimientoService } from '../../../core/services/consentimiento.service';
import { IDENTIDAD_STOCKORA } from '../../../core/legal/documentos';
import { environment } from '../../../../environments/environment';

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
            Inventario, producción y membresías para empresas que necesitan saber qué pasó, dónde y
            cuándo.
          </p>
          <span class="footer__note">Precios en pesos colombianos (COP).</span>
        </div>

        <nav class="footer__col" aria-label="Producto">
          <h3>Producto</h3>
          <a routerLink="/" fragment="caracteristicas">Características</a>
          <a routerLink="/" fragment="modulos">Módulos</a>
          <a routerLink="/" fragment="como-funciona">Cómo funciona</a>
          <a routerLink="/" fragment="planes">Planes</a>
          <a routerLink="/" fragment="preguntas">Preguntas</a>
        </nav>

        <nav class="footer__col" aria-label="Cuenta">
          <h3>Cuenta</h3>
          <a routerLink="/login">Iniciar sesión</a>
          <a routerLink="/registro">Crear cuenta</a>
          <a routerLink="/contacto">Contacto</a>
          <a routerLink="/derechos">Derechos y PQR</a>
        </nav>

        <nav class="footer__col" aria-label="Legal">
          <h3>Legal</h3>
          <a routerLink="/legal">Centro legal</a>
          <a routerLink="/legal/terminos">Términos y condiciones</a>
          <a routerLink="/legal/privacidad">Privacidad</a>
          <a routerLink="/legal/cookies">Cookies</a>
          <a routerLink="/legal/uso-aceptable">Uso aceptable</a>
          <a routerLink="/legal/encargo">Encargo de datos</a>
          <a routerLink="/legal/derechos">Derechos de los titulares</a>
          <button type="button" class="footer__cookies" (click)="abrirCookies()">
            Preferencias de cookies
          </button>
        </nav>
      </div>

      <div class="brand-container footer__bottom">
        <div class="footer__legal">
          <span>© {{ anio }} Stockora. Todos los derechos reservados.</span>
          @if (borrador) {
            <span class="footer__pendiente">
              Identidad del prestador pendiente de completar (modo borrador).
            </span>
          } @else {
            <span>
              {{ identidad.razonSocial }} · NIT {{ identidad.nit }} ·
              {{ identidad.domicilio }}
            </span>
          }
        </div>
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
  readonly borrador = environment.legalMode === 'draft';
  readonly identidad = IDENTIDAD_STOCKORA;

  abrirCookies(): void {
    this.consentimiento.abrirPanel();
  }
}
