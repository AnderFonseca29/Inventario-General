-- Datos legales que el cliente captura en el registro publico.
ALTER TABLE "empresas" ADD COLUMN "ciudad" TEXT;
ALTER TABLE "empresas" ADD COLUMN "departamento" TEXT;
ALTER TABLE "empresas" ADD COLUMN "representante" TEXT;
ALTER TABLE "empresas" ADD COLUMN "matricula" TEXT;
ALTER TABLE "empresas" ADD COLUMN "correoDatos" TEXT;
ALTER TABLE "empresas" ADD COLUMN "sitioWeb" TEXT;

-- Verificacion de correo. Por defecto las cuentas existentes quedan
-- verificadas: se crearon antes de existir este control.
ALTER TABLE "usuarios" ADD COLUMN "emailVerificado" BOOLEAN NOT NULL DEFAULT true;
