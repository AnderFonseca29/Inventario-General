import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MiPlan } from '../models/suscripcion.model';

/**
 * Estado de la suscripcion de la empresa (periodo de prueba de 3 dias + 1 de
 * gracia). Lo lee el shell para el aviso y la pantalla de bloqueo.
 *
 * El backend es la unica fuente de verdad: aqui no se calculan dias ni
 * vencimientos, para que el navegador no pueda alargar la prueba cambiando la
 * hora del equipo.
 */
@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suscripciones`;

  private readonly _plan = signal<MiPlan | null>(null);
  readonly plan = this._plan.asReadonly();

  readonly bloqueado = computed(() => this._plan()?.bloqueado === true);

  cargar(): void {
    this.http.get<MiPlan>(`${this.base}/mi-plan`).subscribe({
      next: (plan) => this._plan.set(plan),
      // Sin respuesta no se bloquea la interfaz: el guard del backend sigue
      // siendo el que corta el acceso si de verdad esta vencida.
      error: () => this._plan.set(null),
    });
  }

  limpiar(): void {
    this._plan.set(null);
  }
}
