import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { DecorLeavesComponent } from './decor-leaves.component';

@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink, BrandIconComponent, RevealDirective, DecorLeavesComponent],
  template: `
    <section class="landing-hero" aria-labelledby="hero-title">
      <div class="hero__leaves" aria-hidden="true">
        <app-decor-leaves />
      </div>

      <div class="brand-container hero__grid">
        <div class="hero__copy">
          <span class="brand-badge hero__badge">
            <app-brand-icon name="spark" class="brand-icon" />
            Inventario multiempresa en la nube
          </span>

          <h1 id="hero-title" class="hero__title">
            Tu inventario, <span>en orden.</span> Tu operación, bajo control.
          </h1>

          <p class="hero__lead">
            Catálogo, inventario, cargues, botellones, producción y membresías en
            una sola plataforma. Cada empresa con sus datos, sus roles y su
            historial de movimientos.
          </p>

          <div class="hero__actions">
            <a class="brand-btn brand-btn--primary brand-btn--lg" routerLink="/registro">
              Crear cuenta
              <app-brand-icon name="arrow" class="brand-icon" />
            </a>
            <a class="brand-btn brand-btn--secondary brand-btn--lg" href="#como-funciona">
              Ver cómo funciona
            </a>
          </div>

          <ul class="hero__checks" aria-label="Características de la plataforma">
            <li><app-brand-icon name="check" class="brand-icon" /> Datos separados por empresa</li>
            <li><app-brand-icon name="check" class="brand-icon" /> Permisos por rol</li>
            <li><app-brand-icon name="check" class="brand-icon" /> Movimientos auditables</li>
          </ul>
        </div>

        <div
          class="hero__visual"
          appReveal
          [retraso]="140"
          role="img"
          aria-label="Vista previa de ejemplo del panel de Stockora: productos, movimientos y bodegas."
        >
          <div class="app-window">
            <div class="app-window__bar">
              <span class="app-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="app-window__path">stockora / panel</span>
              <span class="app-window__demo">Datos de ejemplo</span>
            </div>

            <div class="app-window__body">
              <aside class="app-side" aria-hidden="true">
                <span class="app-side__mark">ST</span>
                <span class="app-side__item app-side__item--active"><app-brand-icon name="chart" class="brand-icon" /> Resumen</span>
                <span class="app-side__item"><app-brand-icon name="box" class="brand-icon" /> Inventario</span>
                <span class="app-side__item"><app-brand-icon name="truck" class="brand-icon" /> Cargues</span>
                <span class="app-side__item"><app-brand-icon name="factory" class="brand-icon" /> Producción</span>
                <span class="app-side__item"><app-brand-icon name="users" class="brand-icon" /> Membresía</span>
              </aside>

              <div class="app-main">
                <div class="app-main__head">
                  <div>
                    <span class="app-main__eyebrow">Operación de hoy</span>
                    <strong>Todo a la vista</strong>
                  </div>
                  <span class="app-main__period">Octubre</span>
                </div>

                <div class="app-kpis">
                  <div class="app-kpi">
                    <span class="app-kpi__icon app-kpi__icon--olive"><app-brand-icon name="box" class="brand-icon" /></span>
                    <strong>248</strong>
                    <span>Productos</span>
                  </div>
                  <div class="app-kpi">
                    <span class="app-kpi__icon app-kpi__icon--ochre"><app-brand-icon name="refresh" class="brand-icon" /></span>
                    <strong>32</strong>
                    <span>Movimientos</span>
                  </div>
                  <div class="app-kpi">
                    <span class="app-kpi__icon app-kpi__icon--info"><app-brand-icon name="factory" class="brand-icon" /></span>
                    <strong>5</strong>
                    <span>Órdenes</span>
                  </div>
                </div>

                <div class="app-list">
                  <div class="app-row">
                    <span class="app-row__avatar">BC</span>
                    <div class="app-row__copy">
                      <strong>Bodega Central</strong>
                      <span>Inventario · 1.240 unidades</span>
                    </div>
                    <span class="app-status app-status--olive">Al día</span>
                  </div>
                  <div class="app-row">
                    <span class="app-row__avatar">PN</span>
                    <div class="app-row__copy">
                      <strong>Planta Norte</strong>
                      <span>Producción · Orden 184</span>
                    </div>
                    <span class="app-status app-status--ochre">En proceso</span>
                  </div>
                  <div class="app-row">
                    <span class="app-row__avatar">R3</span>
                    <div class="app-row__copy">
                      <strong>Ruta Vendedor 3</strong>
                      <span>Cargues · 18 envases</span>
                    </div>
                    <span class="app-status app-status--info">Confirmado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './landing-hero.component.scss',
})
export class LandingHeroComponent {}
