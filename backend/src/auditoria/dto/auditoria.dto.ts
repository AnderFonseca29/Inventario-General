import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

export class ListarAuditoriaDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  buscar?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
