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
import { EstadoCargue } from '@prisma/client';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

export class CargueDetalleDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  costoUnitario?: number;
}

export class CrearCargueDto {
  @IsUUID()
  bodegaOrigenId!: string;

  @IsUUID()
  vendedorId!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CargueDetalleDto)
  detalles!: CargueDetalleDto[];
}

export class ListarCarguesDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(EstadoCargue)
  estado?: EstadoCargue;

  @IsOptional()
  @IsString()
  buscar?: string;
}
