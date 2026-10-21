/**
 * Prueba de concurrencia del hallazgo A/H en membresias.
 *
 * Requiere una base PostgreSQL REAL con las migraciones aplicadas. Se ejecuta
 * solo si E2E_DATABASE_URL esta definida.
 *
 *   $env:E2E_DATABASE_URL="postgresql://postgres@127.0.0.1:5432/inventario_test"
 *   npx jest --config ./test/jest-e2e.json --runInBand test/membresia-concurrencia.e2e-spec.ts
 *
 * Comprueba:
 *  1. Renovar DOS veces en paralelo crea UNA sola membresia activa nueva
 *     (antes: dos activas y doble cobro).
 *  2. Cancelar DOS veces en paralelo cancela UNA sola vez (la segunda 400).
 */
import { PrismaClient } from '@prisma/client';
import { MembresiaService } from '../src/membresia/membresia.service';
import { PrismaService } from '../src/prisma/prisma.service';

const databaseUrl = process.env.E2E_DATABASE_URL;
const describeSiHayBase = databaseUrl ? describe : describe.skip;

describeSiHayBase('Concurrencia de membresia (hallazgo A/H)', () => {
  const prisma = new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );

  let servicio: MembresiaService;
  let empresaId: string;
  let usuarioId: string;
  let clienteId: string;
  let planId: string;

  jest.setTimeout(120_000);

  beforeAll(async () => {
    await prisma.$connect();
    const sufijo = Date.now();

    const empresa = await prisma.empresa.create({
      data: { nombre: `TEST membresia ${sufijo}` },
    });
    empresaId = empresa.id;

    const usuario = await prisma.usuario.create({
      data: {
        empresaId,
        nombre: 'Usuario prueba',
        email: `membresia-${sufijo}@test.local`,
        passwordHash: 'no-usado',
      },
    });
    usuarioId = usuario.id;

    const cliente = await prisma.cliente.create({
      data: { empresaId, nombre: 'Cliente prueba' },
    });
    clienteId = cliente.id;

    const plan = await prisma.planMembresia.create({
      data: { empresaId, nombre: 'Plan mensual', duracionDias: 30 },
    });
    planId = plan.id;

    // MembresiaService solo necesita PrismaService; la auditoria se simula.
    const prismaService = prisma as unknown as PrismaService;
    const auditoria = { registrar: () => Promise.resolve() };
    servicio = new MembresiaService(prismaService, auditoria as never);
  });

  afterAll(async () => {
    await prisma.membresiaCliente.deleteMany({ where: { empresaId } });
    await prisma.planMembresia.deleteMany({ where: { empresaId } });
    await prisma.cliente.deleteMany({ where: { empresaId } });
    await prisma.usuario.deleteMany({ where: { empresaId } });
    await prisma.empresa.delete({ where: { id: empresaId } });
    await prisma.$disconnect();
  });

  it('renovar en paralelo crea UNA sola membresia activa nueva', async () => {
    const base = await prisma.membresiaCliente.create({
      data: {
        empresaId,
        clienteId,
        planId,
        estado: 'ACTIVA',
        fechaFin: new Date(Date.now() + 30 * 86400000),
        creadoPorId: usuarioId,
      },
    });

    const intentos = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        servicio.renovarMembresia(empresaId, base.id, {}, usuarioId),
      ),
    );
    const exitos = intentos.filter((r) => r.status === 'fulfilled').length;

    const activas = await prisma.membresiaCliente.count({
      where: { empresaId, clienteId, estado: 'ACTIVA' },
    });

    // Solo una renovacion gana; el resto recibe 409.
    expect(exitos).toBe(1);
    expect(activas).toBe(1);
  });

  it('cancelar en paralelo cancela UNA sola vez', async () => {
    const base = await prisma.membresiaCliente.create({
      data: {
        empresaId,
        clienteId,
        planId,
        estado: 'ACTIVA',
        fechaFin: new Date(Date.now() + 30 * 86400000),
        creadoPorId: usuarioId,
      },
    });

    const intentos = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        servicio.cancelarMembresia(empresaId, base.id, usuarioId),
      ),
    );
    const exitos = intentos.filter((r) => r.status === 'fulfilled').length;

    expect(exitos).toBe(1);
    const final = await prisma.membresiaCliente.findUniqueOrThrow({
      where: { id: base.id },
    });
    expect(final.estado).toBe('CANCELADA');
  });
});
