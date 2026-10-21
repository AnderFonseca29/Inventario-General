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
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  // ------------------------------ Categorías -------------------------------
  @Get('categorias')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarCategorias(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarCategorias(exigirEmpresa(user));
  }

  @Post('categorias')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearCategoria(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoriaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearCategoria(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarCategoria(exigirEmpresa(user), id);
  }

  // -------------------------------- Unidades -------------------------------
  @Get('unidades')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarUnidades(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarUnidades(exigirEmpresa(user));
  }

  @Post('unidades')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearUnidad(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUnidadDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearUnidad(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarUnidad(exigirEmpresa(user), id);
  }

  // ----------------------------- Presentaciones ----------------------------
  @Get('presentaciones')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarPresentaciones(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarPresentaciones(exigirEmpresa(user));
  }

  @Post('presentaciones')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearPresentacion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePresentacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearPresentacion(
      exigirEmpresa(user),
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarPresentacion(exigirEmpresa(user), id);
  }

  // ------------------------------- Productos -------------------------------
  @Get('productos')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarProductos(
    @CurrentUser() user: AuthenticatedUser,
    @Query('buscar') buscar?: string,
  ) {
    return this.catalogos.listarProductos(exigirEmpresa(user), buscar);
  }

  @Get('productos/:id')
  @Permisos(PERMISOS.CATALOGOS_VER)
  obtenerProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalogos.obtenerProducto(exigirEmpresa(user), id);
  }

  @Post('productos')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearProducto(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductoDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearProducto(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarProducto(exigirEmpresa(user), id);
  }

  // ------------------------------ Proveedores ------------------------------
  @Get('proveedores')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarProveedores(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarProveedores(exigirEmpresa(user));
  }

  @Post('proveedores')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearProveedor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProveedorDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearProveedor(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarProveedor(exigirEmpresa(user), id);
  }

  // -------------------------------- Bodegas --------------------------------
  @Get('bodegas')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarBodegas(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogos.listarBodegas(exigirEmpresa(user));
  }

  @Post('bodegas')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearBodega(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBodegaDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearBodega(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarBodega(exigirEmpresa(user), id);
  }

  // ------------------------------ Ubicaciones ------------------------------
  @Get('ubicaciones')
  @Permisos(PERMISOS.CATALOGOS_VER)
  listarUbicaciones(
    @CurrentUser() user: AuthenticatedUser,
    @Query('bodegaId') bodegaId?: string,
  ) {
    return this.catalogos.listarUbicaciones(exigirEmpresa(user), bodegaId);
  }

  @Post('ubicaciones')
  @Permisos(PERMISOS.CATALOGOS_ADMINISTRAR)
  crearUbicacion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUbicacionDto,
    @Req() req: Request,
  ) {
    return this.catalogos.crearUbicacion(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.catalogos.eliminarUbicacion(exigirEmpresa(user), id);
  }
}
