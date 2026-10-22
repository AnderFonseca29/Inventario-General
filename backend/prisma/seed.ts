import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CATALOGO_PERMISOS,
  ROLES_SISTEMA,
} from '../src/common/constants/permisos';
import { MODULOS_SISTEMA } from '../src/common/constants/modulos';

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

// Los precios son los de la decisión P1, en pesos colombianos (COP):
// Básico 60.000, Medio 90.000 y Premium 120.000.
//
// El campo `codigo` no se cambia: es la clave con la que el seed hace el
// upsert y la referencia que usa `Suscripcion.planId`. Cambiarlo crearía
// planes nuevos y dejaría huérfanas las suscripciones ya creadas.
// El `nombre` sí es el texto visible y sí se actualiza.
const PLANES = [
  {
    codigo: 'basico',
    nombre: 'Básico',
    descripcion: 'Para empresas pequeñas',
    precioMensual: 60000,
    maxUsuarios: 3,
    maxBodegas: 1,
    maxReportes: 5,
    funcionalidades: ['usuarios', 'roles', 'catalogos', 'inventario', 'reportes'],
  },
  {
    codigo: 'pro',
    nombre: 'Medio',
    descripcion: 'Para empresas en crecimiento',
    precioMensual: 90000,
    maxUsuarios: 10,
    maxBodegas: 3,
    maxReportes: null,
    funcionalidades: ['usuarios', 'roles', 'catalogos', 'inventario', 'cargues', 'botellones', 'reportes'],
  },
  {
    codigo: 'empresa',
    nombre: 'Premium',
    descripcion: 'Sin límites operativos ni de usuarios',
    precioMensual: 120000,
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

  const empresas = await prisma.empresa.findMany({ select: { id: true } });
  for (const empresa of empresas) {
    for (const modulo of MODULOS_SISTEMA) {
      await prisma.modulo.upsert({
        where: {
          empresaId_clave: { empresaId: empresa.id, clave: modulo.clave },
        },
        update: {
          nombre: modulo.nombre,
          descripcion: modulo.descripcion,
          icono: modulo.icono,
          orden: modulo.orden,
          ruta: modulo.ruta,
          implementado: modulo.implementado,
        },
        create: {
          empresaId: empresa.id,
          clave: modulo.clave,
          nombre: modulo.nombre,
          descripcion: modulo.descripcion,
          icono: modulo.icono,
          orden: modulo.orden,
          ruta: modulo.ruta,
          tipo: 'SISTEMA',
          implementado: modulo.implementado,
        },
      });
    }
  }
  console.log(
    `Modulos de sistema sincronizados: ${empresas.length * MODULOS_SISTEMA.length}`,
  );

  // Mantiene el rol de sistema "Administrador" con todos los permisos vigentes.
  const todosPermisos = await prisma.permiso.findMany({ select: { id: true } });
  for (const empresa of empresas) {
    const rolAdmin = await prisma.rol.findFirst({
      where: {
        empresaId: empresa.id,
        nombre: ROLES_SISTEMA.ADMINISTRADOR,
        esSistema: true,
      },
      select: { id: true },
    });
    if (!rolAdmin) continue;

    const asignados = await prisma.rolPermiso.findMany({
      where: { rolId: rolAdmin.id },
      select: { permisoId: true },
    });
    const set = new Set(asignados.map((a) => a.permisoId));
    const faltantes = todosPermisos
      .filter((p) => !set.has(p.id))
      .map((p) => ({ rolId: rolAdmin.id, permisoId: p.id }));
    if (faltantes.length > 0) {
      await prisma.rolPermiso.createMany({
        data: faltantes,
        skipDuplicates: true,
      });
    }
  }
  console.log('Permisos del rol Administrador sincronizados.');

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
