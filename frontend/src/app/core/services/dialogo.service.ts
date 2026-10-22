import { Injectable, signal } from '@angular/core';

/**
 * Servicio de dialogos propios de la aplicacion.
 *
 * Sustituye a `window.confirm`, `window.alert` y `window.prompt`, que no se
 * pueden estilizar, bloquean la pagina y (en el caso de `prompt`) muestran
 * el texto en claro. Los dialogos se dibujan en un unico contenedor global
 * (`DialogoContainerComponent`), de modo que el flujo de la aplicacion no
 * depende de que el componente que los pide este visible.
 */

export interface OpcionesConfirmar {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Boton de confirmacion destructivo (rojo). */
  peligro?: boolean;
}

export interface OpcionesPreguntar {
  titulo: string;
  mensaje?: string;
  etiqueta?: string;
  placeholder?: string;
  /** Tipo del campo: `password` oculta lo que se escribe. */
  tipo?: 'text' | 'password';
  /** Longitud minima del valor. */
  minimo?: number;
  textoConfirmar?: string;
  textoCancelar?: string;
}

export interface OpcionesAviso {
  titulo: string;
  /** Puede traer saltos de linea: se conserva el formato en el modal. */
  mensaje: string;
  textoCerrar?: string;
}

export type Dialogo =
  | {
      tipo: 'confirmar';
      titulo: string;
      mensaje: string;
      textoConfirmar: string;
      textoCancelar: string;
      peligro: boolean;
    }
  | {
      tipo: 'preguntar';
      titulo: string;
      mensaje: string;
      etiqueta: string;
      placeholder: string;
      tipoEntrada: 'text' | 'password';
      minimo: number;
      textoConfirmar: string;
      textoCancelar: string;
      peligro: boolean;
    }
  | {
      tipo: 'aviso';
      titulo: string;
      mensaje: string;
      textoCerrar: string;
    };

@Injectable({ providedIn: 'root' })
export class DialogoService {
  private readonly _dialogo = signal<Dialogo | null>(null);

  /** Dialogo visible en pantalla, o `null` si no hay ninguno. */
  readonly dialogo = this._dialogo.asReadonly();

  private resolverActual: ((valor: boolean | string | null) => void) | null = null;

  /**
   * Pide confirmacion al usuario.
   * Resuelve `true` si confirma y `false` si cancela.
   */
  confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
    this.cerrarPendiente();
    return new Promise<boolean>((resolve) => {
      this._dialogo.set({
        tipo: 'confirmar',
        titulo: opciones.titulo,
        mensaje: opciones.mensaje,
        textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
        textoCancelar: opciones.textoCancelar ?? 'Cancelar',
        peligro: opciones.peligro ?? false,
      });
      this.resolverActual = (aceptado) => resolve(aceptado === true);
    });
  }

  /**
   * Pide un dato al usuario.
   * Resuelve el valor escrito, o `null` si cancela.
   */
  preguntar(opciones: OpcionesPreguntar): Promise<string | null> {
    this.cerrarPendiente();
    return new Promise<string | null>((resolve) => {
      this._dialogo.set({
        tipo: 'preguntar',
        titulo: opciones.titulo,
        mensaje: opciones.mensaje ?? '',
        etiqueta: opciones.etiqueta ?? 'Valor',
        placeholder: opciones.placeholder ?? '',
        tipoEntrada: opciones.tipo ?? 'text',
        minimo: opciones.minimo ?? 1,
        textoConfirmar: opciones.textoConfirmar ?? 'Guardar',
        textoCancelar: opciones.textoCancelar ?? 'Cancelar',
        peligro: false,
      });
      this.resolverActual = (aceptado) =>
        resolve(typeof aceptado === 'string' ? aceptado : null);
    });
  }

  /**
   * Muestra un aviso informativo (sin decision).
   */
  avisar(opciones: OpcionesAviso): void {
    this.cerrarPendiente();
    this._dialogo.set({
      tipo: 'aviso',
      titulo: opciones.titulo,
      mensaje: opciones.mensaje,
      textoCerrar: opciones.textoCerrar ?? 'Cerrar',
    });
  }

  /**
   * Cierra el dialogo abierto sin confirmar.
   *
   * La promesa pendiente se resuelve como cancelada: si no, el codigo que
   * espera la respuesta se quedaria bloqueado para siempre.
   */
  cerrar(): void {
    this.cerrarPendiente();
    this._dialogo.set(null);
  }

  /** Resuelve el dialogo actual. Lo usa el contenedor global. */
  resolver(valor: boolean | string | null): void {
    const resolver = this.resolverActual;
    this.resolverActual = null;
    this._dialogo.set(null);
    if (resolver) resolver(valor);
  }

  /**
   * Si habia un dialogo pendiente (por ejemplo, otro `confirmar` encadenado),
   * se cierra como cancelado para no dejar una promesa sin resolver.
   */
  private cerrarPendiente(): void {
    if (this.resolverActual) {
      const resolver = this.resolverActual;
      this.resolverActual = null;
      resolver(false);
    }
  }
}
