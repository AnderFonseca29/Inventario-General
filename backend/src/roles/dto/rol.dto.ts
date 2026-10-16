import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateRolDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permisos!: string[];
}

export class UpdateRolDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permisos?: string[];
}
