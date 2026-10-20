import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CatalogosService } from './catalogos.service';
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
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  // ------------------------------ Categorias -------------------------------
  @Get('categorias')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarCategorias(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarCategorias(user.empresaId!);
  }

  @Post('categorias')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearCategoria(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoriaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearCategoria(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('categorias/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarCategoria(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoriaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarCategoria(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('categorias/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarCategoria(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarCategoria(user.empresaId!, id);
  }

  // -------------------------------- Unidades -------------------------------
  @Get('unidades')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarUnidades(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarUnidades(user.empresaId!);
  }

  @Post('unidades')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearUnidad(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUnidadDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearUnidad(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('unidades/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarUnidad(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUnidadDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarUnidad(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('unidades/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarUnidad(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarUnidad(user.empresaId!, id);
  }

  // ----------------------------- Presentaciones ----------------------------
  @Get('presentaciones')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarPresentaciones(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarPresentaciones(user.empresaId!);
  }

  @Post('presentaciones')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearPresentacion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePresentacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearPresentacion(
      user.empresaId!,
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch('presentaciones/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarPresentacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePresentacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarPresentacion(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('presentaciones/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarPresentacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarPresentacion(user.empresaId!, id);
  }

  // ------------------------------- Productos -------------------------------
  @Get('productos')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarProductos(
    @CurrentUser() user: AuthenticatedUser,
    @Query('buscar') buscar?: string,
  ) {
    return this.catalogos.listarProductos(user.empresaId!, buscar);
  }

  @Get('productos/:id')
  @Permisos(PERMISOS.CATALOGOS_VER)
  obtenerProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.obtenerProducto(user.empresaId!, id);
  }

  @Post('productos')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductoDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearProducto(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('productos/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductoDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarProducto(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('productos/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarProducto(user.empresaId!, id);
  }

  // ------------------------------ Proveedores ------------------------------
  @Get('proveedores')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarProveedores(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarProveedores(user.empresaId!);
  }

  @Post('proveedores')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearProveedor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProveedorDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearProveedor(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('proveedores/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarProveedor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProveedorDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarProveedor(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('proveedores/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarProveedor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarProveedor(user.empresaId!, id);
  }

  // -------------------------------- Bodegas --------------------------------
  @Get('bodegas')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarBodegas(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarBodegas(user.empresaId!);
  }

  @Post('bodegas')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearBodega(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBodegaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearBodega(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('bodegas/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarBodega(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBodegaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarBodega(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('bodegas/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarBodega(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarBodega(user.empresaId!, id);
  }

  // ------------------------------ Ubicaciones ------------------------------
  @Get('ubicaciones')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarUbicaciones(
    @CurrentUser() user: AuthenticatedUser,
    @Query('bodegaId') bodegaId?: string,
  ) {
    return this.catalogos.listarUbicaciones(user.empresaId!, bodegaId);
  }

  @Post('ubicaciones')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearUbicacion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUbicacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearUbicacion(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('ubicaciones/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  actualizarUbicacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUbicacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.actualizarUbicacion(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('ubicaciones/:id')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  eliminarUbicacion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.eliminarUbicacion(user.empresaId!, id);
  }
}
