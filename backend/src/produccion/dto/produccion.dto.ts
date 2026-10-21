import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EstadoMerma } from '@prisma/client';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

// ----------------------------- Materias primas -----------------------------

export class CreateMateriaPrimaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsUUID()
  unidadId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateMateriaPrimaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsUUID()
  unidadId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ListarMateriasPrimasDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

// ------------------------------- Recepciones -------------------------------

export class CreateRecepcionDto {
  @IsUUID()
  materiaPrimaId!: string;

  @IsNumber()
  @Min(0.0001)
  cantidad!: number;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsUUID()
  bodegaId?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoUnitario?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ListarRecepcionesDto extends PaginacionDto {
  @IsOptional()
  @IsUUID()
  materiaPrimaId?: string;
}

// -------------------------------- Formulas ---------------------------------

export class FormulaDetalleDto {
  @IsUUID()
  materiaPrimaId!: string;

  @IsNumber()
  @Min(0.0001)
  cantidad!: number;
}

export class CreateFormulaDto {
  @IsUUID()
  productoId!: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  version?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FormulaDetalleDto)
  detalles!: FormulaDetalleDto[];
}

export class UpdateFormulaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FormulaDetalleDto)
  detalles?: FormulaDetalleDto[];
}

// --------------------------- Ordenes de produccion -------------------------

export class CreateOrdenDto {
  @IsUUID()
  productoId!: string;

  @IsOptional()
  @IsUUID()
  formulaId?: string;

  @IsNumber()
  @Min(0.0001)
  cantidadPlanificada!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ConsumoOrdenDto {
  @IsUUID()
  materiaPrimaId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidadConsumida?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  merma?: number;
}

export class CompletarOrdenDto {
  @IsUUID()
  bodegaId!: string;

  @IsNumber()
  @Min(0.0001)
  cantidadProducida!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumoOrdenDto)
  consumos?: ConsumoOrdenDto[];
}

export class ListarOrdenesDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  estado?: string;
}

// --------------------------------- Mermas ----------------------------------

export class CreateMermaDto {
  @IsOptional()
  @IsUUID()
  ordenId?: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsUUID()
  materiaPrimaId?: string;

  @IsNumber()
  @Min(0.0001)
  cantidad!: number;

  @IsString()
  @MinLength(3)
  motivo!: string;
}

export class ListarMermasDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(EstadoMerma)
  estado?: EstadoMerma;
}

