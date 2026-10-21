import { Pipe, PipeTransform } from '@angular/core';
import { ZONA_HORARIA } from '../core/utils/fechas';

/**
 * Pipe de fecha con zona horaria fija (hallazgo T).
 *
 * El pipe `date` de Angular usa la zona horaria del navegador, por lo que un
 * mismo registro se mostraba con horas distintas segun la maquina del
 * usuario. Este pipe fija `America/Bogota`, la zona de operacion del
 * negocio.
 *
 * Formatos: `short`, `medium`, `shortDate`, `longDate`, `time`.
 */
@Pipe({ name: 'fechaCol', standalone: true })
export class FechaColPipe implements PipeTransform {
  transform(
    valor: string | Date | null | undefined,
    formato: 'short' | 'medium' | 'shortDate' | 'longDate' | 'time' = 'medium',
  ): string {
    if (!valor) return '-';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';

    const opciones: Intl.DateTimeFormatOptions = { timeZone: ZONA_HORARIA };

    switch (formato) {
      case 'short':
        return fecha.toLocaleString('es-CO', {
          ...opciones,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'shortDate':
        return fecha.toLocaleDateString('es-CO', {
          ...opciones,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      case 'longDate':
        return fecha.toLocaleDateString('es-CO', {
          ...opciones,
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'time':
        return fecha.toLocaleTimeString('es-CO', {
          ...opciones,
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'medium':
      default:
        return fecha.toLocaleString('es-CO', {
          ...opciones,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    }
  }
}
