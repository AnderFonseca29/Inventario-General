import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  CreateBodegaDto,
  CreateCategoriaDto,
  CreatePresentacionDto,
  CreateProductoDto,
  CreateProveedorDto,
  CreateUbicacionDto,
  CreateUnidadDto,
  UpdateBodegaDto,
  UpdateCategoriaDto,
  UpdatePresentacionDto,
  UpdateProductoDto,
  UpdateProveedorDto,
  UpdateUbicacionDto,
  UpdateUnidadDto,
} from './dto/catalogo.dto';

@Injectable()
export class CatalogosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async ejecutar<T>(fn: () => Promise<T>, mensaje: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(mensaje);
      }
      throw error;
    }
  }

  private auditar(
    empresaId: string,
    actorId: string,
    accion: string,
    entidad: string,
    entidadId: string,
    datosNuevos: Prisma.InputJsonValue,
    ip?: string,
  ) {
    return this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion,
      entidad,
      entidadId,
      datosNuevos,
      ip,
    });
  }

  private async exigirCategoria(empresaId: string, id: string) {
    if (!(await this.prisma.categoria.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Categoría inválida');
    }
  }

  private async exigirUnidad(empresaId: string, id: string) {
    if (!(await this.prisma.unidad.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Unidad inválida');
    }
  }

  private async exigirPresentacion(empresaId: string, id: string) {
    if (!(await this.prisma.presentacion.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Presentacion inválida');
    }
  }

  private async exigirBodega(empresaId: string, id: string) {
    if (!(await this.prisma.bodega.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Bodega inválida');
    }
  }

  // ------------------------------- Categorías ------------------------------

  listarCategorias(empresaId: string) {
    return this.prisma.categoria.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { productos: true } } },
    });
  }

  async crearCategoria(
    empresaId: string,
    dto: CreateCategoriaDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.categoria.create({
          data: { empresaId, nombre: dto.nombre, activo: dto.activo ?? true },
        }),
      'Ya existe una categoria con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'categoria.creada',
      'Categoria',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarCategoria(
    empresaId: string,
    id: string,
    dto: UpdateCategoriaDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.categoria.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Categoría no encontrada');
    const creado = await this.ejecutar(
      () => this.prisma.categoria.update({ where: { id }, data: dto }),
      'Ya existe una categoria con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'categoria.actualizada',
      'Categoria',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarCategoria(empresaId: string, id: string) {
    const actual = await this.prisma.categoria.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Categoría no encontrada');
    const usados = await this.prisma.producto.count({
      where: { categoriaId: id },
    });
    if (usados > 0) {
      throw new ConflictException('La categoría tiene productos asociados');
    }
    await this.prisma.categoria.delete({ where: { id } });
    return { ok: true };
  }

  // -------------------------------- Unidades -------------------------------

  listarUnidades(empresaId: string) {
    return this.prisma.unidad.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { productos: true, materiasPrimas: true } },
      },
    });
  }

  async crearUnidad(
    empresaId: string,
    dto: CreateUnidadDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.unidad.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            abreviatura: dto.abreviatura,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe una unidad con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'unidad.creada',
      'Unidad',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarUnidad(
    empresaId: string,
    id: string,
    dto: UpdateUnidadDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.unidad.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Unidad no encontrada');
    const creado = await this.ejecutar(
      () => this.prisma.unidad.update({ where: { id }, data: dto }),
      'Ya existe una unidad con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'unidad.actualizada',
      'Unidad',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarUnidad(empresaId: string, id: string) {
    const actual = await this.prisma.unidad.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Unidad no encontrada');
    const usados =
      (await this.prisma.producto.count({ where: { unidadId: id } })) +
      (await this.prisma.materiaPrima.count({ where: { unidadId: id } }));
    if (usados > 0) {
      throw new ConflictException('La unidad esta en uso');
    }
    await this.prisma.unidad.delete({ where: { id } });
    return { ok: true };
  }

  // ----------------------------- Presentaciones ----------------------------

  listarPresentaciones(empresaId: string) {
    return this.prisma.presentacion.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { productos: true } } },
    });
  }

  async crearPresentacion(
    empresaId: string,
    dto: CreatePresentacionDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.presentacion.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            factor: dto.factor,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe una presentacion con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'presentacion.creada',
      'Presentacion',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarPresentacion(
    empresaId: string,
    id: string,
    dto: UpdatePresentacionDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.presentacion.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Presentacion no encontrada');
    const creado = await this.ejecutar(
      () => this.prisma.presentacion.update({ where: { id }, data: dto }),
      'Ya existe una presentacion con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'presentacion.actualizada',
      'Presentacion',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarPresentacion(empresaId: string, id: string) {
    const actual = await this.prisma.presentacion.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Presentacion no encontrada');
    const usados = await this.prisma.producto.count({
      where: { presentacionId: id },
    });
    if (usados > 0) {
      throw new ConflictException('La presentacion tiene productos asociados');
    }
    await this.prisma.presentacion.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------- Productos -------------------------------

  listarProductos(empresaId: string, buscar?: string) {
    const filtro = buscar?.trim()
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' as const } },
            { sku: { contains: buscar, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.producto.findMany({
      where: { empresaId, ...filtro },
      orderBy: { nombre: 'asc' },
      include: {
        categoria: { select: { id: true, nombre: true } },
        unidad: { select: { id: true, nombre: true, abreviatura: true } },
        presentacion: { select: { id: true, nombre: true } },
      },
    });
  }

  async obtenerProducto(empresaId: string, id: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
      include: {
        categoria: true,
        unidad: true,
        presentacion: true,
      },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  private async validarRefsProducto(
    empresaId: string,
    dto: CreateProductoDto | UpdateProductoDto,
  ) {
    if (dto.categoriaId) await this.exigirCategoria(empresaId, dto.categoriaId);
    if (dto.unidadId) await this.exigirUnidad(empresaId, dto.unidadId);
    if (dto.presentacionId) {
      await this.exigirPresentacion(empresaId, dto.presentacionId);
    }
  }

  async crearProducto(
    empresaId: string,
    dto: CreateProductoDto,
    actorId: string,
    ip?: string,
  ) {
    await this.validarRefsProducto(empresaId, dto);
    const creado = await this.ejecutar(
      () =>
        this.prisma.producto.create({
          data: {
            empresaId,
            sku: dto.sku,
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            categoriaId: dto.categoriaId,
            unidadId: dto.unidadId,
            presentacionId: dto.presentacionId,
            esBotellon: dto.esBotellon ?? false,
            controlaInventario: dto.controlaInventario ?? true,
            costo: dto.costo ?? 0,
            precioVenta: dto.precioVenta ?? 0,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe un producto con ese SKU',
    );
    await this.auditar(
      empresaId,
      actorId,
      'producto.creado',
      'Producto',
      creado.id,
      { nombre: creado.nombre, sku: creado.sku },
      ip,
    );
    return creado;
  }

  async actualizarProducto(
    empresaId: string,
    id: string,
    dto: UpdateProductoDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtenerProducto(empresaId, id);
    await this.validarRefsProducto(empresaId, dto);
    const creado = await this.ejecutar(
      () => this.prisma.producto.update({ where: { id }, data: dto }),
      'Ya existe un producto con ese SKU',
    );
    await this.auditar(
      empresaId,
      actorId,
      'producto.actualizado',
      'Producto',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarProducto(empresaId: string, id: string) {
    await this.obtenerProducto(empresaId, id);
    const referencias =
      (await this.prisma.existencia.count({ where: { productoId: id } })) +
      (await this.prisma.movimientoInventario.count({
        where: { productoId: id },
      })) +
      (await this.prisma.documentoDetalle.count({
        where: { productoId: id },
      })) +
      (await this.prisma.cargueDetalle.count({ where: { productoId: id } }));
    if (referencias > 0) {
      throw new ConflictException(
        'El producto tiene movimientos o existencias asociadas',
      );
    }
    await this.prisma.producto.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------ Proveedores ------------------------------

  listarProveedores(empresaId: string) {
    return this.prisma.proveedor.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { recepciones: true } } },
    });
  }

  async crearProveedor(
    empresaId: string,
    dto: CreateProveedorDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.prisma.proveedor.create({
      data: { empresaId, ...dto, activo: dto.activo ?? true },
    });
    await this.auditar(
      empresaId,
      actorId,
      'proveedor.creado',
      'Proveedor',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarProveedor(
    empresaId: string,
    id: string,
    dto: UpdateProveedorDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Proveedor no encontrado');
    const creado = await this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
    await this.auditar(
      empresaId,
      actorId,
      'proveedor.actualizado',
      'Proveedor',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarProveedor(empresaId: string, id: string) {
    const actual = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Proveedor no encontrado');
    const usados = await this.prisma.recepcionMateriaPrima.count({
      where: { proveedorId: id },
    });
    if (usados > 0) {
      throw new ConflictException('El proveedor tiene recepciones asociadas');
    }
    await this.prisma.proveedor.delete({ where: { id } });
    return { ok: true };
  }

  // -------------------------------- Bodegas --------------------------------

  listarBodegas(empresaId: string) {
    return this.prisma.bodega.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { ubicaciones: true, existencias: true } } },
    });
  }

  async crearBodega(
    empresaId: string,
    dto: CreateBodegaDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.bodega.create({
          data: {
            empresaId,
            codigo: dto.codigo,
            nombre: dto.nombre,
            tipo: dto.tipo ?? 'PRINCIPAL',
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe una bodega con ese codigo',
    );
    await this.auditar(
      empresaId,
      actorId,
      'bodega.creada',
      'Bodega',
      creado.id,
      { nombre: creado.nombre, codigo: creado.codigo },
      ip,
    );
    return creado;
  }

  async actualizarBodega(
    empresaId: string,
    id: string,
    dto: UpdateBodegaDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.bodega.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Bodega no encontrada');
    const creado = await this.ejecutar(
      () => this.prisma.bodega.update({ where: { id }, data: dto }),
      'Ya existe una bodega con ese codigo',
    );
    await this.auditar(
      empresaId,
      actorId,
      'bodega.actualizada',
      'Bodega',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarBodega(empresaId: string, id: string) {
    const actual = await this.prisma.bodega.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Bodega no encontrada');
    const referencias =
      (await this.prisma.existencia.count({ where: { bodegaId: id } })) +
      (await this.prisma.movimientoInventario.count({
        where: { bodegaId: id },
      })) +
      (await this.prisma.ubicacion.count({ where: { bodegaId: id } }));
    if (referencias > 0) {
      throw new ConflictException(
        'La bodega tiene existencias, movimientos o ubicaciones asociadas',
      );
    }
    await this.prisma.bodega.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------ Ubicaciones ------------------------------

  listarUbicaciones(empresaId: string, bodegaId?: string) {
    return this.prisma.ubicacion.findMany({
      where: { empresaId, ...(bodegaId ? { bodegaId } : {}) },
      orderBy: { nombre: 'asc' },
      include: { bodega: { select: { id: true, nombre: true } } },
    });
  }

  async crearUbicacion(
    empresaId: string,
    dto: CreateUbicacionDto,
    actorId: string,
    ip?: string,
  ) {
    await this.exigirBodega(empresaId, dto.bodegaId);
    const creado = await this.prisma.ubicacion.create({
      data: {
        empresaId,
        bodegaId: dto.bodegaId,
        nombre: dto.nombre,
        activo: dto.activo ?? true,
      },
    });
    await this.auditar(
      empresaId,
      actorId,
      'ubicacion.creada',
      'Ubicacion',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarUbicacion(
    empresaId: string,
    id: string,
    dto: UpdateUbicacionDto,
    actorId: string,
    ip?: string,
  ) {
    const actual = await this.prisma.ubicacion.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Ubicacion no encontrada');
    if (dto.bodegaId) await this.exigirBodega(empresaId, dto.bodegaId);
    const creado = await this.prisma.ubicacion.update({
      where: { id },
      data: dto,
    });
    await this.auditar(
      empresaId,
      actorId,
      'ubicacion.actualizada',
      'Ubicacion',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarUbicacion(empresaId: string, id: string) {
    const actual = await this.prisma.ubicacion.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Ubicacion no encontrada');
    await this.prisma.ubicacion.delete({ where: { id } });
    return { ok: true };
  }
}
