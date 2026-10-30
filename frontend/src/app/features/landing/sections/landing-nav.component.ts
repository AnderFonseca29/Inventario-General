import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrandMarkComponent } from '../../../shared/brand-mark.component';
import { BrandIconComponent } from '../../../shared/brand-icon.component';
import { ENLACES_NAVEGACION } from '../landing.data';

@Component({
  selector: 'app-landing-nav',
  imports: [RouterLink, BrandMarkComponent, BrandIconComponent],
  template: `
    <header class="nav" [class.nav--solid]="desplazado() || abierto()">
      <div class="nav__inner">
        <a class="nav__brand" routerLink="/" aria-label="ST Stockora, ir al inicio">
          <app-brand-mark />
        </a>

        <nav class="nav__links" aria-label="Navegación principal">
          @for (enlace of enlaces; track enlace.id) {
            <a [href]="'#' + enlace.id">{{ enlace.etiqueta }}</a>
          }
        </nav>

        <div class="nav__actions">
          <a class="brand-btn brand-btn--ghost" routerLink="/login">Iniciar sesión</a>
          <a class="brand-btn brand-btn--primary" routerLink="/registro">Comenzar</a>
        </div>

        <button
          #burger
          type="button"
          class="nav__burger"
          [attr.aria-expanded]="abierto()"
          aria-controls="menu-movil"
          [attr.aria-label]="abierto() ? 'Cerrar menú' : 'Abrir menú'"
          (click)="alternar()"
        >
          <app-brand-icon [name]="abierto() ? 'close' : 'menu'" class="brand-icon" />
        </button>
      </div>
    </header>

    @if (abierto()) {
      <div class="nav__overlay" (click)="cerrar()" aria-hidden="true"></div>
      <aside
        #drawer
        id="menu-movil"
        class="nav__drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        (keydown)="atraparFoco($event)"
      >
        <div class="nav__drawer-head">
          <app-brand-mark />
          <button
            type="button"
            class="nav__drawer-close"
            aria-label="Cerrar menú"
            (click)="cerrar()"
          >
            <app-brand-icon name="close" class="brand-icon" />
          </button>
        </div>

        <nav class="nav__drawer-links" aria-label="Navegación móvil">
          @for (enlace of enlaces; track enlace.id) {
            <a [href]="'#' + enlace.id" (click)="cerrar()">{{ enlace.etiqueta }}</a>
          }
        </nav>

        <div class="nav__drawer-actions">
          <a class="brand-btn brand-btn--secondary brand-btn--block" routerLink="/login" (click)="cerrar()">
            Iniciar sesión
          </a>
          <a class="brand-btn brand-btn--primary brand-btn--block" routerLink="/registro" (click)="cerrar()">
            Comenzar
          </a>
        </div>

        <p class="nav__drawer-note">
          Inventario, producción y membresías en una sola plataforma.
        </p>
      </aside>
    }
  `,
  styleUrl: './landing-nav.component.scss',
})
export class LandingNavComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');

  readonly enlaces = ENLACES_NAVEGACION;
  readonly abierto = signal(false);
  readonly desplazado = signal(false);

  private overflowAnterior = '';

  constructor() {
    this.desplazado.set(window.scrollY > 12);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.desplazado.set(window.scrollY > 12);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.abierto()) {
      this.cerrar();
    }
  }

  alternar(): void {
    if (this.abierto()) {
      this.cerrar();
      return;
    }

    this.overflowAnterior = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.abierto.set(true);
    setTimeout(() => {
      this.drawer()?.nativeElement.querySelector<HTMLElement>('a, button')?.focus();
    });
  }

  cerrar(): void {
    this.abierto.set(false);
    this.document.body.style.overflow = this.overflowAnterior;
    setTimeout(() => this.burger()?.nativeElement.focus());
  }

  atraparFoco(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusables = Array.from(
      this.drawer()?.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (focusables.length === 0) return;

    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    const activo = this.document.activeElement;

    if (event.shiftKey && activo === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && activo === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.overflowAnterior;
  }
}
