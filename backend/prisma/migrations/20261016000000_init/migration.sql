-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoEmpresa" AS ENUM ('ACTIVA', 'SUSPENDIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('PENDIENTE', 'ACTIVA', 'EN_GRACIA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('COP', 'USD');

-- CreateEnum
CREATE TYPE "TipoBodega" AS ENUM ('PRINCIPAL', 'VENDEDOR', 'PRODUCCION', 'MATERIAS_PRIMAS');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'DEVOLUCION', 'REVERSO', 'CARGUE', 'RECEPCION_MP', 'CONSUMO_PRODUCCION', 'PRODUCCION', 'MERMA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'CONFIRMADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoCargue" AS ENUM ('BORRADOR', 'CONFIRMADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoBotellon" AS ENUM ('ENTREGA', 'VENTA', 'DEVOLUCION_VACIO', 'PERDIDA', 'DANO', 'AJUSTE', 'RECEPCION_BODEGA');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('PENDIENTE', 'CONCILIADA', 'CON_DIFERENCIA', 'RESUELTA');

-- CreateEnum
CREATE TYPE "EstadoOrdenProduccion" AS ENUM ('BORRADOR', 'PLANIFICADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoMerma" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'ANULADA');

-- CreateTable
CREATE TABLE "funcionalidades" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funcionalidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioMensual" DECIMAL(18,4) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'COP',
    "maxUsuarios" INTEGER,
    "maxBodegas" INTEGER,
    "maxReportes" INTEGER,
    "diasGracia" INTEGER NOT NULL DEFAULT 15,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_funcionalidades" (
    "planId" UUID NOT NULL,
    "funcionalidadId" UUID NOT NULL,

    CONSTRAINT "plan_funcionalidades_pkey" PRIMARY KEY ("planId","funcionalidadId")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "nit" TEXT,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "estado" "EstadoEmpresa" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaInicio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMPTZ(3),
    "diasGracia" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_suscripcion" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "suscripcionId" UUID,
    "estadoAnterior" "EstadoSuscripcion",
    "estadoNuevo" "EstadoSuscripcion" NOT NULL,
    "planAnteriorId" UUID,
    "planNuevoId" UUID,
    "motivo" TEXT,
    "usuarioId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "suscripcionId" UUID,
    "monto" DECIMAL(18,4) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'COP',
    "metodo" TEXT,
    "referencia" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMPTZ(3),
    "registradoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "empresaId" UUID,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "ultimoLogin" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "esSistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rolId" UUID NOT NULL,
    "permisoId" UUID NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "usuarioId" UUID NOT NULL,
    "rolId" UUID NOT NULL,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentaciones" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "factor" DECIMAL(18,4),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoriaId" UUID,
    "unidadId" UUID,
    "presentacionId" UUID,
    "esBotellon" BOOLEAN NOT NULL DEFAULT false,
    "controlaInventario" BOOLEAN NOT NULL DEFAULT true,
    "costo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "precioVenta" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bodegas" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoBodega" NOT NULL DEFAULT 'PRINCIPAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bodegas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "bodegaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "existencias" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "bodegaId" UUID NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "existencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "bodegaId" UUID NOT NULL,
    "bodegaDestinoId" UUID,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "costoUnitario" DECIMAL(18,4),
    "referencia" TEXT,
    "motivo" TEXT,
    "documentoId" UUID,
    "usuarioId" UUID NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_inventario" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "bodegaId" UUID,
    "observaciones" TEXT,
    "usuarioId" UUID NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoEn" TIMESTAMPTZ(3),

    CONSTRAINT "documentos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_detalle" (
    "id" UUID NOT NULL,
    "documentoId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "costoUnitario" DECIMAL(18,4),
    "nombreSnapshot" TEXT,

    CONSTRAINT "documento_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargues" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "bodegaOrigenId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "estado" "EstadoCargue" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "totalCosto" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoEn" TIMESTAMPTZ(3),

    CONSTRAINT "cargues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargue_detalle" (
    "id" UUID NOT NULL,
    "cargueId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "costoUnitario" DECIMAL(18,4) NOT NULL,
    "subtotal" DECIMAL(18,4) NOT NULL,
    "nombreSnapshot" TEXT,

    CONSTRAINT "cargue_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_botellon" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tipo" "TipoMovimientoBotellon" NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "cargueId" UUID,
    "conciliacionId" UUID,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_botellon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones_botellon" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'PENDIENTE',
    "esperado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "recibido" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "diferencia" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "resueltoPorId" UUID,
    "motivoResolucion" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltoEn" TIMESTAMPTZ(3),

    CONSTRAINT "conciliaciones_botellon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos_diferencia" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "conciliacionId" UUID NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "resueltoPorId" UUID,
    "resolucion" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltoEn" TIMESTAMPTZ(3),

    CONSTRAINT "casos_diferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias_primas" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadId" UUID,
    "costo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "disponible" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "materias_primas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recepciones_materia_prima" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "materiaPrimaId" UUID NOT NULL,
    "proveedorId" UUID,
    "bodegaId" UUID,
    "lote" TEXT,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "costoUnitario" DECIMAL(18,4),
    "responsableId" UUID,
    "observaciones" TEXT,
    "recibidoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recepciones_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_detalle" (
    "id" UUID NOT NULL,
    "formulaId" UUID NOT NULL,
    "materiaPrimaId" UUID NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "formula_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_produccion" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "formulaId" UUID,
    "productoId" UUID NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "estado" "EstadoOrdenProduccion" NOT NULL DEFAULT 'BORRADOR',
    "cantidadPlanificada" DECIMAL(18,4) NOT NULL,
    "cantidadProducida" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "creadoPorId" UUID NOT NULL,
    "observaciones" TEXT,
    "iniciadaEn" TIMESTAMPTZ(3),
    "completadaEn" TIMESTAMPTZ(3),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_produccion_detalle" (
    "id" UUID NOT NULL,
    "ordenId" UUID NOT NULL,
    "materiaPrimaId" UUID NOT NULL,
    "cantidadTeorica" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cantidadConsumida" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "merma" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "orden_produccion_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mermas" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "ordenId" UUID,
    "productoId" UUID,
    "materiaPrimaId" UUID,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoMerma" NOT NULL DEFAULT 'PENDIENTE',
    "creadoPorId" UUID NOT NULL,
    "aprobadoPorId" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobadoEn" TIMESTAMPTZ(3),

    CONSTRAINT "mermas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'BORRADOR',
    "solicitanteId" UUID NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_detalle" (
    "id" UUID NOT NULL,
    "solicitudId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "valorUnitario" DECIMAL(18,4),
    "subtotal" DECIMAL(18,4),

    CONSTRAINT "solicitud_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "empresaId" UUID,
    "usuarioId" UUID,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "ip" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_soporte" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" JSONB,
    "ip" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funcionalidades_codigo_key" ON "funcionalidades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "planes_codigo_key" ON "planes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nit_key" ON "empresas"("nit");

-- CreateIndex
CREATE INDEX "suscripciones_empresaId_estado_idx" ON "suscripciones"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "historial_suscripcion_empresaId_idx" ON "historial_suscripcion"("empresaId");

-- CreateIndex
CREATE INDEX "pagos_empresaId_estado_idx" ON "pagos"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_empresaId_idx" ON "usuarios"("empresaId");

-- CreateIndex
CREATE INDEX "roles_empresaId_idx" ON "roles"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_empresaId_nombre_key" ON "roles"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "categorias_empresaId_idx" ON "categorias"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresaId_nombre_key" ON "categorias"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "unidades_empresaId_idx" ON "unidades"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_empresaId_nombre_key" ON "unidades"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "presentaciones_empresaId_idx" ON "presentaciones"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "presentaciones_empresaId_nombre_key" ON "presentaciones"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "productos_empresaId_idx" ON "productos"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresaId_sku_key" ON "productos"("empresaId", "sku");

-- CreateIndex
CREATE INDEX "proveedores_empresaId_idx" ON "proveedores"("empresaId");

-- CreateIndex
CREATE INDEX "bodegas_empresaId_idx" ON "bodegas"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "bodegas_empresaId_codigo_key" ON "bodegas"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "ubicaciones_empresaId_idx" ON "ubicaciones"("empresaId");

-- CreateIndex
CREATE INDEX "existencias_empresaId_idx" ON "existencias"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "existencias_empresaId_productoId_bodegaId_key" ON "existencias"("empresaId", "productoId", "bodegaId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresaId_productoId_bodegaId_idx" ON "movimientos_inventario"("empresaId", "productoId", "bodegaId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresaId_creadoEn_idx" ON "movimientos_inventario"("empresaId", "creadoEn");

-- CreateIndex
CREATE INDEX "documentos_inventario_empresaId_estado_idx" ON "documentos_inventario"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_inventario_empresaId_tipo_consecutivo_key" ON "documentos_inventario"("empresaId", "tipo", "consecutivo");

-- CreateIndex
CREATE INDEX "documento_detalle_documentoId_idx" ON "documento_detalle"("documentoId");

-- CreateIndex
CREATE INDEX "cargues_empresaId_estado_idx" ON "cargues"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "cargues_empresaId_vendedorId_idx" ON "cargues"("empresaId", "vendedorId");

-- CreateIndex
CREATE UNIQUE INDEX "cargues_empresaId_consecutivo_key" ON "cargues"("empresaId", "consecutivo");

-- CreateIndex
CREATE INDEX "cargue_detalle_cargueId_idx" ON "cargue_detalle"("cargueId");

-- CreateIndex
CREATE INDEX "movimientos_botellon_empresaId_vendedorId_idx" ON "movimientos_botellon"("empresaId", "vendedorId");

-- CreateIndex
CREATE INDEX "conciliaciones_botellon_empresaId_estado_idx" ON "conciliaciones_botellon"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "casos_diferencia_empresaId_estado_idx" ON "casos_diferencia"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "materias_primas_empresaId_idx" ON "materias_primas"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "materias_primas_empresaId_nombre_key" ON "materias_primas"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "recepciones_materia_prima_empresaId_idx" ON "recepciones_materia_prima"("empresaId");

-- CreateIndex
CREATE INDEX "formulas_empresaId_idx" ON "formulas"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_empresaId_productoId_version_key" ON "formulas"("empresaId", "productoId", "version");

-- CreateIndex
CREATE INDEX "formula_detalle_formulaId_idx" ON "formula_detalle"("formulaId");

-- CreateIndex
CREATE INDEX "ordenes_produccion_empresaId_estado_idx" ON "ordenes_produccion"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_produccion_empresaId_consecutivo_key" ON "ordenes_produccion"("empresaId", "consecutivo");

-- CreateIndex
CREATE INDEX "orden_produccion_detalle_ordenId_idx" ON "orden_produccion_detalle"("ordenId");

-- CreateIndex
CREATE INDEX "mermas_empresaId_estado_idx" ON "mermas"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "solicitudes_empresaId_estado_idx" ON "solicitudes"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_empresaId_tipo_consecutivo_key" ON "solicitudes"("empresaId", "tipo", "consecutivo");

-- CreateIndex
CREATE INDEX "solicitud_detalle_solicitudId_idx" ON "solicitud_detalle"("solicitudId");

-- CreateIndex
CREATE INDEX "auditoria_empresaId_creadoEn_idx" ON "auditoria"("empresaId", "creadoEn");

-- CreateIndex
CREATE INDEX "auditoria_soporte_empresaId_creadoEn_idx" ON "auditoria_soporte"("empresaId", "creadoEn");

-- AddForeignKey
ALTER TABLE "plan_funcionalidades" ADD CONSTRAINT "plan_funcionalidades_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_funcionalidades" ADD CONSTRAINT "plan_funcionalidades_funcionalidadId_fkey" FOREIGN KEY ("funcionalidadId") REFERENCES "funcionalidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_suscripcion" ADD CONSTRAINT "historial_suscripcion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentaciones" ADD CONSTRAINT "presentaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "presentaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodegas" ADD CONSTRAINT "bodegas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "existencias" ADD CONSTRAINT "existencias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "existencias" ADD CONSTRAINT "existencias_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "existencias" ADD CONSTRAINT "existencias_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_inventario" ADD CONSTRAINT "documentos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_inventario" ADD CONSTRAINT "documentos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_detalle" ADD CONSTRAINT "documento_detalle_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_detalle" ADD CONSTRAINT "documento_detalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargues" ADD CONSTRAINT "cargues_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargues" ADD CONSTRAINT "cargues_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargues" ADD CONSTRAINT "cargues_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargue_detalle" ADD CONSTRAINT "cargue_detalle_cargueId_fkey" FOREIGN KEY ("cargueId") REFERENCES "cargues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargue_detalle" ADD CONSTRAINT "cargue_detalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_botellon" ADD CONSTRAINT "movimientos_botellon_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_botellon" ADD CONSTRAINT "movimientos_botellon_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_botellon" ADD CONSTRAINT "movimientos_botellon_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_botellon" ADD CONSTRAINT "movimientos_botellon_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_botellon" ADD CONSTRAINT "movimientos_botellon_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "conciliaciones_botellon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_botellon" ADD CONSTRAINT "conciliaciones_botellon_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_botellon" ADD CONSTRAINT "conciliaciones_botellon_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_botellon" ADD CONSTRAINT "conciliaciones_botellon_resueltoPorId_fkey" FOREIGN KEY ("resueltoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_diferencia" ADD CONSTRAINT "casos_diferencia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_diferencia" ADD CONSTRAINT "casos_diferencia_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "conciliaciones_botellon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_primas" ADD CONSTRAINT "materias_primas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_primas" ADD CONSTRAINT "materias_primas_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_materia_prima" ADD CONSTRAINT "recepciones_materia_prima_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_materia_prima" ADD CONSTRAINT "recepciones_materia_prima_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_materia_prima" ADD CONSTRAINT "recepciones_materia_prima_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_materia_prima" ADD CONSTRAINT "recepciones_materia_prima_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_detalle" ADD CONSTRAINT "formula_detalle_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_detalle" ADD CONSTRAINT "formula_detalle_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_produccion_detalle" ADD CONSTRAINT "orden_produccion_detalle_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_produccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_produccion_detalle" ADD CONSTRAINT "orden_produccion_detalle_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_produccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_detalle" ADD CONSTRAINT "solicitud_detalle_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_detalle" ADD CONSTRAINT "solicitud_detalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_soporte" ADD CONSTRAINT "auditoria_soporte_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_soporte" ADD CONSTRAINT "auditoria_soporte_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

