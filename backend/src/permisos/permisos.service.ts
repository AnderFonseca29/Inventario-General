import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }],
    });
  }
}
