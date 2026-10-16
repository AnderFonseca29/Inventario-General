import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  mostrar(tipo: ToastTipo, mensaje: string, duracion = 4000): void {
    const id = ++this.contador;
    this._toasts.update((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), duracion);
  }

  exito(mensaje: string): void {
    this.mostrar('success', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje, 6000);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    this._toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
