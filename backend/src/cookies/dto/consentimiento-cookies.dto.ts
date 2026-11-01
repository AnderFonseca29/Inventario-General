import { IsBoolean, IsUUID } from 'class-validator';

export class RegistrarConsentimientoCookiesDto {
  @IsUUID('4', {
    message: 'El identificador anónimo del navegador no es válido',
  })
  identificador!: string;

  @IsBoolean()
  analitica!: boolean;

  @IsBoolean()
  publicidad!: boolean;
}
