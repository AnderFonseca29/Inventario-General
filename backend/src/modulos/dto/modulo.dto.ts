import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateModuloDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  icono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ruta?: string;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateModuloDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  icono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ruta?: string;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ReordenarModuloItemDto {
  @IsUUID()
  id!: string;

  @IsInt()
  orden!: number;
}

export class ReordenarModulosDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReordenarModuloItemDto)
  items!: ReordenarModuloItemDto[];
}
