import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { CATALOGO_PERMISOS } from '../src/common/constants/permisos';

const prisma = new PrismaClient();

const FUNCIONALIDADES = [
  { codigo: 'usuarios', nombre: 'Gestion de usuarios', modulo: 'usuarios' },
  { codigo: 'roles', nombre: 'Roles y permisos', modulo: 'roles' },
  { codigo: 'catalogos', nombre: 'Catalogos de productos', modulo: 'catalogos' },
  { codigo: 'inventario', nombre: 'Inventario y movimientos', modulo: 'inventario' },
  { codigo: 'cargues', nombre: 'Cargues a vendedores', modulo: 'cargues' },
  { codigo: 'botellones', nombre: 'Control de botellones', modulo: 'botellones' },
  { codigo: 'produccion', nombre: 'Materias primas y produccion', modulo: 'produccion' },
  { codigo: 'documentos', nombre: 'Solicitudes y comprobantes internos', modulo: 'documentos' },
  { codigo: 'reportes', nombre: 'Reportes y alertas', modulo: 'reportes' },
  { codigo: 'auditoria', nombre: 'Auditoria', modulo: 'auditoria' },
];

const PLANES = [
  {
    codigo: 'basico',
    nombre: 'Basico',
    descripcion: 'Para empresas pequenas',
    precioMensual: 99000,
    maxUsuarios: 3,
    maxBodegas: 1,
    maxReportes: 5,
    funcionalidades: ['usuarios', 'roles', 'catalogos', 'inventario', 'reportes'],
  },
  {
    codigo: 'pro',
    nombre: 'Pro',
    descripcion: 'Para empresas en crecimiento',
    precioMensual: 249000,
    maxUsuarios: 10,
    maxBodegas: 3,
    maxReportes: null,
    funcionalidades: ['usuarios', 'roles', 'catalogos', 'inventario', 'cargues', 'botellones', 'reportes'],
  },
  {
    codigo: 'empresa',
    nombre: 'Empresa',
    descripcion: 'Sin limites operativos ni de usuarios',
    precioMensual: 499000,
    maxUsuarios: null,
    maxBodegas: null,
    maxReportes: null,
    funcionalidades: FUNCIONALIDADES.map((f) => f.codigo),
  },
];

async function main() {
  for (const permiso of CATALOGO_PERMISOS) {
    await prisma.permiso.upsert({
      where: { codigo: permiso.codigo },
      update: { nombre: permiso.nombre, modulo: permiso.modulo },
      create: permiso,
    });
  }
  console.log(`Permisos sincronizados: ${CATALOGO_PERMISOS.length}`);

  for (const funcionalidad of FUNCIONALIDADES) {
    await prisma.funcionalidad.upsert({
      where: { codigo: funcionalidad.codigo },
      update: { nombre: funcionalidad.nombre, modulo: funcionalidad.modulo },
      create: funcionalidad,
    });
  }
  console.log(`Funcionalidades sincronizadas: ${FUNCIONALIDADES.length}`);

  for (const plan of PLANES) {
    const creado = await prisma.plan.upsert({
      where: { codigo: plan.codigo },
      update: {
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        maxUsuarios: plan.maxUsuarios,
        maxBodegas: plan.maxBodegas,
        maxReportes: plan.maxReportes,
      },
      create: {
        codigo: plan.codigo,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        maxUsuarios: plan.maxUsuarios,
        maxBodegas: plan.maxBodegas,
        maxReportes: plan.maxReportes,
      },
    });

    const funcionalidades = await prisma.funcionalidad.findMany({
      where: { codigo: { in: plan.funcionalidades } },
      select: { id: true },
    });

    await prisma.planFuncionalidad.deleteMany({ where: { planId: creado.id } });
    await prisma.planFuncionalidad.createMany({
      data: funcionalidades.map((f) => ({ planId: creado.id, funcionalidadId: f.id })),
    });
  }
  console.log(`Planes sincronizados: ${PLANES.length}`);

  const superEmail = process.env.SEED_SUPERADMIN_EMAIL?.toLowerCase();
  const superPassword = process.env.SEED_SUPERADMIN_PASSWORD;

  if (superEmail && superPassword) {
    const existe = await prisma.usuario.findUnique({ where: { email: superEmail } });
    if (!existe) {
      await prisma.usuario.create({
        data: {
          nombre: 'Propietario Plataforma',
          email: superEmail,
          passwordHash: await argon2.hash(superPassword),
          esSuperAdmin: true,
          empresaId: null,
        },
      });
      console.log(`Superadmin creado: ${superEmail}`);
    } else {
      console.log('Superadmin ya existe, no se modifica.');
    }
  } else {
    console.warn(
      'SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD no definidos: no se creo superadmin.',
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
