import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EstadoSolicitudDerechos,
  TipoSolicitudDerechos,
} from '@prisma/client';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

const limpiar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CrearSolicitudDerechosDto {
  @IsEnum(TipoSolicitudDerechos, {
    message: 'El tipo de solicitud no es válido',
  })
  tipo!: TipoSolicitudDerechos;

  @Transform(limpiar)
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(120)
  nombre!: string;

  @Transform(limpiar)
  @IsString()
  @MinLength(5, { message: 'El documento debe tener al menos 5 caracteres' })
  @MaxLength(30)
  documento!: string;

  @Transform(limpiar)
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(200)
  correo!: string;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @MaxLength(160)
  empresa?: string;

  @Transform(limpiar)
  @IsString()
  @MinLength(20, { message: 'Describa la solicitud con al menos 20 caracteres' })
  @MaxLength(4000)
  mensaje!: string;

  @IsBoolean()
  @Equals(true, {
    message: 'Debe autorizar el tratamiento de sus datos para atender la solicitud',
  })
  autorizacion!: boolean;
}

export class ConsultarDerechosDto {
  @Transform(limpiar)
  @IsEmail({}, { message: 'El correo no es válido' })
  correo!: string;
}

export class ListarDerechosDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(TipoSolicitudDerechos)
  tipo?: TipoSolicitudDerechos;

  @IsOptional()
  @IsEnum(EstadoSolicitudDerechos)
  estado?: EstadoSolicitudDerechos;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @MaxLength(120)
  buscar?: string;
}

export class ResponderDerechosDto {
  @Transform(limpiar)
  @IsString()
  @MinLength(20, { message: 'La respuesta debe tener al menos 20 caracteres' })
  @MaxLength(4000)
  respuesta!: string;

  @IsOptional()
  @IsIn([
    EstadoSolicitudDerechos.RESPONDIDA,
    EstadoSolicitudDerechos.CERRADA,
    EstadoSolicitudDerechos.RECHAZADA,
  ])
  estado?: EstadoSolicitudDerechos;
}
