-- CreateEnum
CREATE TYPE "EstadoMembresia" AS ENUM ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_membresia" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "duracionDias" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "planes_membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias_cliente" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "estado" "EstadoMembresia" NOT NULL DEFAULT 'ACTIVA',
    "fechaInicio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMPTZ(3) NOT NULL,
    "creadoPorId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "membresias_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_empresaId_idx" ON "clientes"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresaId_documento_key" ON "clientes"("empresaId", "documento");

-- CreateIndex
CREATE INDEX "planes_membresia_empresaId_idx" ON "planes_membresia"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "planes_membresia_empresaId_nombre_key" ON "planes_membresia"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "membresias_cliente_empresaId_estado_idx" ON "membresias_cliente"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "membresias_cliente_empresaId_clienteId_idx" ON "membresias_cliente"("empresaId", "clienteId");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_membresia" ADD CONSTRAINT "planes_membresia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias_cliente" ADD CONSTRAINT "membresias_cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias_cliente" ADD CONSTRAINT "membresias_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias_cliente" ADD CONSTRAINT "membresias_cliente_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes_membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias_cliente" ADD CONSTRAINT "membresias_cliente_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
