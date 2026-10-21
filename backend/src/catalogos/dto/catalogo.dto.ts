import { TipoBodega } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { TransformDecimal } from '../../common/utils/decimal';

// ------------------------------ Categorías ---------------------------------

export class CreateCategoriaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ------------------------------- Unidades ----------------------------------

export class CreateUnidadDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  abreviatura!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateUnidadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  abreviatura?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ----------------------------- Presentaciones ------------------------------

export class CreatePresentacionDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  @IsPositive()
  factor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdatePresentacionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  @IsPositive()
  factor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ------------------------------- Productos ---------------------------------

export class CreateProductoDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  unidadId?: string;

  @IsOptional()
  @IsUUID()
  presentacionId?: string;

  @IsOptional()
  @IsBoolean()
  esBotellon?: boolean;

  @IsOptional()
  @IsBoolean()
  controlaInventario?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  costo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  precioVenta?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  sku?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  unidadId?: string;

  @IsOptional()
  @IsUUID()
  presentacionId?: string;

  @IsOptional()
  @IsBoolean()
  esBotellon?: boolean;

  @IsOptional()
  @IsBoolean()
  controlaInventario?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  costo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @TransformDecimal()
  precioVenta?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ------------------------------ Proveedores --------------------------------

export class CreateProveedorDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// -------------------------------- Bodegas ----------------------------------

export class CreateBodegaDto {
  @IsString()
  @MinLength(1)
  codigo!: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsEnum(TipoBodega)
  tipo?: TipoBodega;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateBodegaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoBodega)
  tipo?: TipoBodega;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ------------------------------ Ubicaciones --------------------------------

export class CreateUbicacionDto {
  @IsUUID()
  bodegaId!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateUbicacionDto {
  @IsOptional()
  @IsUUID()
  bodegaId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
