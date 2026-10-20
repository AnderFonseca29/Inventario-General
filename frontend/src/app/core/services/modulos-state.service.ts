import { Injectable, inject, signal } from '@angular/core';
import { ModulosService } from './modulos.service';
import { Modulo } from '../models/modulo.model';

// Estado compartido de los módulos del menú de operación. El shell lo consume
// para pintar el sidebar y la pantalla de Módulos lo recarga al editar.
@Injectable({ providedIn: 'root' })
export class ModulosStateService {
  private readonly modulosService = inject(ModulosService);

  private readonly _menu = signal<Modulo[]>([]);
  readonly menu = this._menu.asReadonly();

  cargar(): void {
    this.modulosService.listarMenu().subscribe({
      next: (modulos) => this._menu.set(modulos),
      error: () => this._menu.set([]),
    });
  }
}
