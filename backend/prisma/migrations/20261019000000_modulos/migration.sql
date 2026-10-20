-- CreateEnum
CREATE TYPE "TipoModulo" AS ENUM ('SISTEMA', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "modulos" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "ruta" TEXT,
    "tipo" "TipoModulo" NOT NULL DEFAULT 'PERSONALIZADO',
    "implementado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modulos_empresaId_idx" ON "modulos"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "modulos_empresaId_clave_key" ON "modulos"("empresaId", "clave");

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
