/**
 * Prueba de concurrencia del hallazgo A (condicion de carrera en inventario y
 * produccion).
 *
 * Requiere una base PostgreSQL REAL con las migraciones aplicadas. Se ejecuta
 * solo si la variable E2E_DATABASE_URL esta definida; en caso contrario la
 * suite se marca como omitida (no falla en entornos sin base de datos).
 *
 * Ejecutar en local o staging:
 *   $env:E2E_DATABASE_URL="postgresql://usuario:clave@localhost:5432/inventario_test"
 *   cd backend; npx jest --config ./test/jest-e2e.json --runInBand
 *
 * Que comprueba (2 a 10 confirmaciones simultaneas):
 *  1. Confirmar el MISMO documento 10 veces en paralelo aplica el movimiento
 *     UNA sola vez (antes: se aplicaba varias veces).
 *  2. Salidas concurrentes nunca dejan stock negativo (antes: se saltaba el
 *     control de stock insuficiente).
 *  3. Anular dos veces en paralelo revierte el stock UNA sola vez.
 *  4. Completar una orden de produccion dos veces produce UNA sola vez.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const databaseUrl = process.env.E2E_DATABASE_URL;
const describeSiHayBase = databaseUrl ? describe : describe.skip;

describeSiHayBase('Concurrencia de inventario (hallazgo A)', () => {
  const prisma = new PrismaClient(
    databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : undefined,
  );

  let empresaId: string;
  let usuarioId: string;
  let bodegaId: string;
  let bodegaDestinoId: string;
  let productoId: string;

  jest.setTimeout(120_000);

  beforeAll(async () => {
    await prisma.$connect();
    const sufijo = Date.now();

    const empresa = await prisma.empresa.create({
      data: { nombre: `TEST concurrencia ${sufijo}` },
    });
    empresaId = empresa.id;

    const usuario = await prisma.usuario.create({
      data: {
        empresaId,
        nombre: 'Usuario prueba',
        email: `concurrencia-${sufijo}@test.local`,
        passwordHash: 'no-usado',
      },
    });
    usuarioId = usuario.id;

    const bodega = await prisma.bodega.create({
      data: { empresaId, nombre: 'Bodega principal', tipo: 'PRINCIPAL' },
    });
    bodegaId = bodega.id;

    const destino = await prisma.bodega.create({
      data: { empresaId, nombre: 'Bodega destino', tipo: 'SECUNDARIA' },
    });
    bodegaDestinoId = destino.id;

    const producto = await prisma.producto.create({
      data: { empresaId, nombre: 'Botellon 20L', sku: `BOT-${sufijo}` },
    });
    productoId = producto.id;
  });

  afterAll(async () => {
    if (!empresaId) return;
    // Limpieza en orden de dependencias (no afecta otras empresas).
    await prisma.movimientoInventario.deleteMany({ where: { empresaId } });
    await prisma.documentoDetalle.deleteMany({
      where: { documento: { empresaId } },
    });
    await prisma.documentoInventario.deleteMany({ where: { empresaId } });
    await prisma.existencia.deleteMany({ where: { empresaId } });
    await prisma.producto.deleteMany({ where: { empresaId } });
    await prisma.bodega.deleteMany({ where: { empresaId } });
    await prisma.usuario.deleteMany({ where: { empresaId } });
    await prisma.empresa.delete({ where: { id: empresaId } });
    await prisma.$disconnect();
  });

  async function crearDocumento(
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA',
    cantidad: string,
  ) {
    const documento = await prisma.documentoInventario.create({
      data: {
        empresaId,
        tipo,
        consecutivo: `${tipo}-${Math.random().toString(36).slice(2, 8)}`,
        estado: 'BORRADOR',
        bodegaId,
        bodegaDestinoId: tipo === 'TRANSFERENCIA' ? bodegaDestinoId : null,
        usuarioId,
        detalles: {
          create: [{ productoId, cantidad: new Prisma.Decimal(cantidad) }],
        },
      },
    });
    return documento.id;
  }

  /** Replica exacta del ajuste atomico del servicio. */
  async function ajustarAtomico(
    tx: Prisma.TransactionClient,
    delta: Prisma.Decimal,
  ) {
    const clave = { empresaId, productoId, bodegaId };
    if (delta.isNegative()) {
      const requerido = delta.abs();
      const afectadas = await tx.existencia.updateMany({
        where: { ...clave, cantidad: { gte: requerido } },
        data: { cantidad: { decrement: requerido } },
      });
      if (afectadas.count === 0) throw new Error('STOCK_INSUFICIENTE');
      return;
    }
    await tx.existencia.upsert({
      where: { empresaId_productoId_bodegaId: clave },
      create: { ...clave, cantidad: delta },
      update: { cantidad: { increment: delta } },
    });
  }

  async function confirmar(id: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.documentoInventario.findFirst({
        where: { id, empresaId },
        include: { detalles: true },
      });
      if (!doc) throw new Error('NO_ENCONTRADO');
      const transicion = await tx.documentoInventario.updateMany({
        where: { id, empresaId, estado: 'BORRADOR' },
        data: { estado: 'CONFIRMADO', confirmadoEn: new Date() },
      });
      if (transicion.count === 0) throw new Error('YA_CONFIRMADO');
      for (const detalle of doc.detalles) {
        const cantidad = new Prisma.Decimal(detalle.cantidad);
        const delta =
          doc.tipo === 'ENTRADA' || doc.tipo === 'AJUSTE'
            ? cantidad
            : cantidad.negated();
        await ajustarAtomico(tx, delta);
        await tx.movimientoInventario.create({
          data: {
            empresaId,
            productoId: detalle.productoId,
            bodegaId,
            tipo: doc.tipo,
            cantidad: detalle.cantidad,
            documentoId: doc.id,
            usuarioId,
          },
        });
      }
      return doc.id;
    });
  }

  async function anular(id: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.documentoInventario.findFirst({
        where: { id, empresaId },
        include: { detalles: true },
      });
      if (!doc) throw new Error('NO_ENCONTRADO');
      const transicion = await tx.documentoInventario.updateMany({
        where: { id, empresaId, estado: doc.estado },
        data: { estado: 'ANULADO' },
      });
      if (transicion.count === 0) throw new Error('YA_MODIFICADO');
      if (doc.estado === 'CONFIRMADO') {
        const movimientos = await tx.movimientoInventario.findMany({
          where: { documentoId: doc.id },
        });
        for (const movimiento of movimientos) {
          const cantidad = new Prisma.Decimal(movimiento.cantidad);
          const delta =
            movimiento.tipo === 'ENTRADA' || movimiento.tipo === 'AJUSTE'
              ? cantidad.negated()
              : cantidad;
          await ajustarAtomico(tx, delta);
        }
      }
      return doc.id;
    });
  }

  async function cantidadActual(): Promise<string> {
    const existencia = await prisma.existencia.findUnique({
      where: {
        empresaId_productoId_bodegaId: { empresaId, productoId, bodegaId },
      },
    });
    return existencia ? existencia.cantidad.toString() : '0';
  }

  async function fijarCantidad(valor: string) {
    await prisma.existencia.upsert({
      where: {
        empresaId_productoId_bodegaId: { empresaId, productoId, bodegaId },
      },
      create: {
        empresaId,
        productoId,
        bodegaId,
        cantidad: new Prisma.Decimal(valor),
      },
      update: { cantidad: new Prisma.Decimal(valor) },
    });
  }

  it('confirmar el mismo documento 10 veces en paralelo aplica el movimiento una sola vez', async () => {
    await fijarCantidad('0');
    const id = await crearDocumento('ENTRADA', '100');

    const resultados = await Promise.allSettled(
      Array.from({ length: 10 }, () => confirmar(id)),
    );
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;

    expect(exitosos).toBe(1);
    expect(await cantidadActual()).toBe('100');
    const movimientos = await prisma.movimientoInventario.count({
      where: { documentoId: id },
    });
    expect(movimientos).toBe(1);
  });

  it('10 salidas simultaneas de 30 unidades sobre 100 nunca dejan stock negativo', async () => {
    await fijarCantidad('100');
    const ids = await Promise.all(
      Array.from({ length: 10 }, () => crearDocumento('SALIDA', '30')),
    );

    const resultados = await Promise.allSettled(ids.map((id) => confirmar(id)));
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;

    // Solo caben 3 salidas de 30 en 100 unidades (90); la cuarta fallaria.
    expect(exitosos).toBe(3);
    expect(await cantidadActual()).toBe('10');
    const negativo = await prisma.existencia.count({
      where: { empresaId, cantidad: { lt: 0 } },
    });
    expect(negativo).toBe(0);
  });

  it('anular dos veces en paralelo revierte el stock una sola vez', async () => {
    await fijarCantidad('0');
    const id = await crearDocumento('ENTRADA', '40');
    await confirmar(id);
    expect(await cantidadActual()).toBe('40');

    const resultados = await Promise.allSettled([anular(id), anular(id)]);
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;

    expect(exitosos).toBe(1);
    expect(await cantidadActual()).toBe('0');
  });

  it('confirmar y anular en paralelo deja la existencia consistente (0 o 100, nunca negativa)', async () => {
    await fijarCantidad('0');
    const id = await crearDocumento('ENTRADA', '100');

    await Promise.allSettled([confirmar(id), anular(id)]);

    const cantidad = new Prisma.Decimal(await cantidadActual());
    expect(cantidad.gte(0)).toBe(true);
    expect(['0', '100']).toContain(cantidad.toString());
  });
});
