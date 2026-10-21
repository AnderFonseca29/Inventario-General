-- Intentos de inicio de sesion para el bloqueo temporal progresivo (hallazgo D).
CREATE TABLE "intentos_login" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "exito" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_login_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "intentos_login_email_creadoEn_idx" ON "intentos_login"("email", "creadoEn");
CREATE INDEX "intentos_login_ip_creadoEn_idx" ON "intentos_login"("ip", "creadoEn");
