-- AlterTable
ALTER TABLE "documentos_inventario" ADD COLUMN "bodegaDestinoId" UUID;

-- AddForeignKey
ALTER TABLE "documentos_inventario" ADD CONSTRAINT "documentos_inventario_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_inventario" ADD CONSTRAINT "documentos_inventario_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "bodegas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
