import { EstadoMembresia } from '@prisma/client';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import {
  IsInt,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { TransformDecimal } from '../../common/utils/decimal';

// -------------------------------- Clientes ---------------------------------

export class CreateClienteDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ListarClientesDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

// ----------------------------- Planes de membresía -------------------------

export class CreatePlanMembresiaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  @Min(0)
  precio?: number;

  @IsInt()
  @Min(1)
  duracionDias!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdatePlanMembresiaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionDias?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ListarPlanesMembresiaDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

// ------------------------------ Afiliaciones -------------------------------

export class CreateMembresiaDto {
  @IsUUID()
  clienteId!: string;

  @IsUUID()
  planId!: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}

export class RenovarMembresiaDto {
  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}

export class ListarMembresiasDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(EstadoMembresia)
  estado?: EstadoMembresia;

  @IsOptional()
  @IsUUID()
  clienteId?: string;
}
