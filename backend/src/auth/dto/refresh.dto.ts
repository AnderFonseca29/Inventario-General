import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  /**
   * Compatibilidad con clientes que aun envian el token en el cuerpo. El
   * navegador normal usa la cookie httpOnly, que no pasa por JavaScript.
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshToken?: string;
}
