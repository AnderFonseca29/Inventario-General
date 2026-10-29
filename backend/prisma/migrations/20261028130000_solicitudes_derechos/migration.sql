-- Solicitudes de derechos de los titulares (Ley 1581 de 2012).
-- Permite radicar consultas y reclamos, calcular el vencimiento en dias
-- habiles y dejar trazabilidad de la respuesta.

CREATE TYPE "TipoSolicitudDerechos" AS ENUM (
  'ACCESO',
  'CONSULTA',
  'RECTIFICACION',
  'SUPRESION',
  'REVOCATORIA',
  'RECLAMO'
);

CREATE TYPE "EstadoSolicitudDerechos" AS ENUM (
  'RECIBIDA',
  'EN_TRAMITE',
  'RESPONDIDA',
  'CERRADA',
  'RECHAZADA'
);

CREATE TABLE "solicitudes_derechos" (
  "id" UUID NOT NULL,
  "radicado" TEXT NOT NULL,
  "tipo" "TipoSolicitudDerechos" NOT NULL,
  "nombre" TEXT NOT NULL,
  "documento" TEXT NOT NULL,
  "correo" TEXT NOT NULL,
  "telefono" TEXT,
  "empresa" TEXT,
  "mensaje" TEXT NOT NULL,
  "autorizacion" BOOLEAN NOT NULL DEFAULT false,
  "estado" "EstadoSolicitudDerechos" NOT NULL DEFAULT 'RECIBIDA',
  "fechaRecepcion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaLimite" TIMESTAMPTZ(3) NOT NULL,
  "fechaRespuesta" TIMESTAMPTZ(3),
  "respuesta" TEXT,
  "respondidoPorId" UUID,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "solicitudes_derechos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solicitudes_derechos_radicado_key"
  ON "solicitudes_derechos" ("radicado");

CREATE INDEX "solicitudes_derechos_estado_fechaLimite_idx"
  ON "solicitudes_derechos" ("estado", "fechaLimite");

CREATE INDEX "solicitudes_derechos_correo_idx"
  ON "solicitudes_derechos" ("correo");

CREATE INDEX "solicitudes_derechos_fechaRecepcion_idx"
  ON "solicitudes_derechos" ("fechaRecepcion");

ALTER TABLE "solicitudes_derechos"
  ADD CONSTRAINT "solicitudes_derechos_respondidoPorId_fkey"
  FOREIGN KEY ("respondidoPorId") REFERENCES "usuarios" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
