-- CreateEnum
CREATE TYPE "DocumentoLegal" AS ENUM ('TERMINOS', 'PRIVACIDAD', 'USO_ACEPTABLE');

-- CreateEnum
CREATE TYPE "MetodoAceptacion" AS ENUM ('PRIMER_LOGIN', 'CHECKOUT', 'REGISTRO', 'MANUAL');

-- AlterTable
ALTER TABLE "intentos_login" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "aceptaciones_legales" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "documento" "DocumentoLegal" NOT NULL,
    "version" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "metodo" "MetodoAceptacion" NOT NULL DEFAULT 'PRIMER_LOGIN',
    "ip" TEXT,
    "userAgent" TEXT,
    "aceptadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceptaciones_legales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aceptaciones_legales_usuarioId_documento_idx" ON "aceptaciones_legales"("usuarioId", "documento");

-- CreateIndex
CREATE INDEX "aceptaciones_legales_aceptadoEn_idx" ON "aceptaciones_legales"("aceptadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "aceptaciones_legales_usuarioId_documento_version_key" ON "aceptaciones_legales"("usuarioId", "documento", "version");

-- AddForeignKey
ALTER TABLE "aceptaciones_legales" ADD CONSTRAINT "aceptaciones_legales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
