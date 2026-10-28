-- Marca las suscripciones de prueba (3 dias + 1 de gracia). Las suscripciones
-- ya existentes quedan en false: no se les mueve la fecha de vencimiento.
ALTER TABLE "suscripciones" ADD COLUMN "esPrueba" BOOLEAN NOT NULL DEFAULT false;
