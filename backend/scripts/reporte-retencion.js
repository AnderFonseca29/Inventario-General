#!/usr/bin/env node
/**
 * Reporte de retencion. Solo devuelve conteos: no imprime datos personales.
 *
 * Uso:
 *   npm run retencion:reporte
 *
 * La purga NO se ejecuta aqui. El reporte sirve como evidencia para la
 * revision trimestral descrita en la politica de retencion.
 */
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DIA_MS = 24 * 60 * 60 * 1000;

function haceAnios(anios) {
  return new Date(Date.now() - anios * 365.25 * DIA_MS);
}

async function main() {
  const hace5 = haceAnios(5);
  const hace90Dias = new Date(Date.now() - 90 * DIA_MS);

  const [
    derechos,
    auditoria,
    auditoriaSoporte,
    tokens,
    intentos,
    derechosAbiertos,
  ] = await Promise.all([
    prisma.solicitudDerechos.count({
      where: {
        estado: { in: ['RESPONDIDA', 'CERRADA', 'RECHAZADA'] },
        OR: [
          { fechaRespuesta: { lt: hace5 } },
          { fechaRespuesta: null, fechaRecepcion: { lt: hace5 } },
        ],
      },
    }),
    prisma.auditoria.count({ where: { creadoEn: { lt: hace5 } } }),
    prisma.auditoriaSoporte.count({ where: { creadoEn: { lt: hace5 } } }),
    prisma.refreshToken.count(),
    prisma.intentoLogin.count(),
    prisma.solicitudDerechos.count({
      where: { estado: { in: ['RECIBIDA', 'EN_TRAMITE'] } },
    }),
  ]);

  const reporte = {
    generadoEn: new Date().toISOString(),
    criterios: {
      solicitudesDerechos: '5 anos desde el cierre o la recepcion',
      auditoria: '5 anos desde el registro',
      auditoriaSoporte: '5 anos desde el registro',
      logsTecnicos: '90 dias (revisar segun proveedor)',
      tokens: 'purga automatica a los 30 dias',
      intentosLogin: 'purga automatica a los 30 dias',
    },
    pendientesDePurga: {
      solicitudesDerechos: derechos,
      auditoria,
      auditoriaSoporte,
      logsTecnicosMayoresA90Dias: null,
    },
    registrosActuales: {
      refreshTokens: tokens,
      intentosLogin: intentos,
      solicitudesDerechosAbiertas: derechosAbiertos,
    },
    referencia: {
      hace5Anios: hace5.toISOString(),
      hace90Dias: hace90Dias.toISOString(),
    },
    nota:
      'Solo conteos. La purga requiere aprobacion del responsable y ticket de cambio. ' +
      'Los plazos legales deben confirmarse con el abogado.',
  };

  console.log(JSON.stringify(reporte, null, 2));
}

main()
  .catch((error) => {
    console.error(
      `No se pudo generar el reporte de retencion: ${error.message}`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
