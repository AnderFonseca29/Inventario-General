import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class DocumentoDetalleDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  costoUnitario?: number;
}

export class CreateDocumentoDto {
  @IsEnum(TipoMovimiento)
  tipo!: TipoMovimiento;

  @IsUUID()
  bodegaId!: string;

  @IsOptional()
  @IsUUID()
  bodegaDestinoId?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DocumentoDetalleDto)
  detalles!: DocumentoDetalleDto[];
}

export class ListarMovimientosDto {
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsUUID()
  bodegaId?: string;

  @IsOptional()
  @IsUUID()
  documentoId?: string;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;
}

export class ListarExistenciasDto {
  @IsOptional()
  @IsUUID()
  bodegaId?: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsString()
  buscar?: string;

  @IsOptional()
  @IsString()
  soloConStock?: string;
}
