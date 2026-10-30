import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

/**
 * Aparición suave al entrar en el viewport.
 * Solo anima opacity y transform; con prefers-reduced-motion el contenido
 * aparece de inmediato.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[style.--reveal-delay.ms]': 'retraso()',
  },
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  readonly retraso = input(0, { transform: numberAttribute });

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
      this.mostrar();
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.zone.run(() => this.mostrar());
            this.observer?.disconnect();
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
      );
      this.observer.observe(this.element.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private mostrar(): void {
    this.element.nativeElement.classList.add('reveal--visible');
  }
}
