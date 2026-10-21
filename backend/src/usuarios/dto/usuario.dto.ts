import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

export class ListarUsuariosDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roles!: string[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roles?: string[];
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
