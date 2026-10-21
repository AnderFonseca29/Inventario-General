import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Numero maximo de registros que un listado puede devolver en una pagina.
 * Es el limite superior aceptado por la API; el valor por defecto mantiene el
 * comportamiento actual de los listados (evita regresiones en el frontend).
 */
export const LIMITE_MAXIMO = 500;

/**
 * Paginacion estandar (hallazgo Q).
 *
 * Se aplica por composicion en los DTO de listado:
 *   export class ListarCarguesDto extends PaginacionDto { ... }
 *
 * Reglas:
 *  - `pagina` es 1-based (la primera pagina es 1).
 *  - `limite` acota el numero de registros devueltos (maximo 500).
 *  - El total de registros se expone en la cabecera `X-Total-Count` para no
 *    romper la forma de la respuesta (que sigue siendo un arreglo).
 */
export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(LIMITE_MAXIMO, {
    message: `El límite no puede superar ${LIMITE_MAXIMO} registros`,
  })
  limite?: number = LIMITE_MAXIMO;

  /** Offset calculado a partir de pagina/limite. */
  get skip(): number {
    return ((this.pagina ?? 1) - 1) * (this.limite ?? LIMITE_MAXIMO);
  }

  /** Numero de registros a devolver (take). */
  get take(): number {
    return this.limite ?? LIMITE_MAXIMO;
  }
}
