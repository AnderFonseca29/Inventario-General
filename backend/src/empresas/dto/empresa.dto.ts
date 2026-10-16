import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoEmpresa } from '@prisma/client';

export class AdminEmpresaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateEmpresaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @ValidateNested()
  @Type(() => AdminEmpresaDto)
  admin!: AdminEmpresaDto;
}

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}

export class UpdateEstadoEmpresaDto {
  @IsEnum(EstadoEmpresa)
  estado!: EstadoEmpresa;
}
