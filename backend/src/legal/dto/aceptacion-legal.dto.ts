import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DocumentoLegal, MetodoAceptacion } from '@prisma/client';

export class AceptarDocumentosDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Debe indicar al menos un documento' })
  @ArrayUnique()
  @IsEnum(DocumentoLegal, {
    each: true,
    message: 'El documento legal no es valido',
  })
  documentos!: DocumentoLegal[];

  @IsOptional()
  @IsEnum(MetodoAceptacion, { message: 'El metodo de aceptacion no es valido' })
  metodo?: MetodoAceptacion;
}
