import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PERMISOS_POR_ROL_SISTEMA, ROLES_SISTEMA } from '../common/constants/permisos';
import { MODULOS_SISTEMA } from '../common/constants/modulos';

/** Plan y duración de la prueba gratuita acordada (7 días, plan Medio). */
export const PLAN_PRUEBA = 'pro';
export const DIAS_PRUEBA = 7;

export interface DatosEmpresaNueva {
  nombre: string;
  razonSocial: string;
  nit?: string | null;
  matricula?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  representante?: string | null;
  telefono?: string | null;
  correoDatos?: string | null;
  sitioWeb?: string | null;
  email?: string | null;
}

export interface DatosAdministradorNuevo {
  nombre: string;
  email: string;
  passwordHash: string;
  emailVerificado?: boolean;
}

export interface ResultadoAprovisionamiento {
  empresa: { id: string; nombre: string; nit: string | null };
  administrador: { id: string; email: string };
  suscripcion: { id: string; fechaFin: Date | null };
  plan: { id: string; codigo: string; nombre: string };
}

/**
 * Alta completa de una empresa en una sola transacción: empresa ACTIVA,
 * roles y módulos del sistema, usuario propietario con rol Administrador,
 * suscripción de prueba e historial.
 *
 * Lo usan tanto el registro público como el alta manual del superadministrador,
 * para que ambos caminos produzcan exactamente la misma estructura.
 */
@Injectable()
export class AprovisionamientoService {
  async crear(
    tx: Prisma.TransactionClient,
    empresa: DatosEmpresaNueva,
    administrador: DatosAdministradorNuevo,
  ): Promise<ResultadoAprovisionamiento> {
    const nueva = await tx.empresa.create({
      data: {
        nombre: empresa.nombre,
        razonSocial: empresa.razonSocial,
        nit: empresa.nit ?? null,
        matricula: empresa.matricula ?? null,
        direccion: empresa.direccion ?? null,
        ciudad: empresa.ciudad ?? null,
        departamento: empresa.departamento ?? null,
        representante: empresa.representante ?? null,
        telefono: empresa.telefono ?? null,
        correoDatos: empresa.correoDatos ?? null,
        sitioWeb: empresa.sitioWeb ?? null,
        email: empresa.email ?? null,
        estado: 'ACTIVA',
      },
    });

    await this.crearRolesSistema(tx, nueva.id);
    await this.crearModulosSistema(tx, nueva.id);

    const rolAdmin = await tx.rol.findFirst({
      where: { empresaId: nueva.id, nombre: ROLES_SISTEMA.ADMINISTRADOR },
      select: { id: true },
    });

    const admin = await tx.usuario.create({
      data: {
        empresaId: nueva.id,
        nombre: administrador.nombre,
        email: administrador.email,
        passwordHash: administrador.passwordHash,
        esSuperAdmin: false,
        // Quien registra la empresa es su dueño: única cuenta autorizada
        // para el módulo de membresías (pago).
        esPropietario: true,
        emailVerificado: administrador.emailVerificado ?? false,
      },
      select: { id: true, email: true },
    });

    if (rolAdmin) {
      await tx.usuarioRol.create({
        data: { usuarioId: admin.id, rolId: rolAdmin.id },
      });
    }

    const plan = await tx.plan.findUnique({
      where: { codigo: PLAN_PRUEBA },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        diasGracia: true,
      },
    });
    if (!plan) {
      throw new ServiceUnavailableException(
        'El plan de prueba no está configurado. Contacta al administrador.',
      );
    }

    const inicio = new Date();
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + DIAS_PRUEBA);

    const suscripcion = await tx.suscripcion.create({
      data: {
        empresaId: nueva.id,
        planId: plan.id,
        estado: 'ACTIVA',
        fechaInicio: inicio,
        fechaFin: fin,
        diasGracia: plan.diasGracia,
      },
      select: { id: true, fechaFin: true },
    });

    await tx.historialSuscripcion.create({
      data: {
        empresaId: nueva.id,
        suscripcionId: suscripcion.id,
        estadoNuevo: 'ACTIVA',
        planNuevoId: plan.id,
        motivo: `Prueba gratuita de ${DIAS_PRUEBA} días`,
        usuarioId: admin.id,
      },
    });

    return {
      empresa: { id: nueva.id, nombre: nueva.nombre, nit: nueva.nit },
      administrador: admin,
      suscripcion,
      plan: { id: plan.id, codigo: plan.codigo, nombre: plan.nombre },
    };
  }

  private async crearRolesSistema(tx: Prisma.TransactionClient, empresaId: string) {
    const permisos = await tx.permiso.findMany({
      select: { id: true, codigo: true },
    });
    const porCodigo = new Map(permisos.map((p) => [p.codigo, p.id]));

    for (const [nombreRol, codigos] of Object.entries(PERMISOS_POR_ROL_SISTEMA)) {
      const permisoIds = codigos
        .map((codigo) => porCodigo.get(codigo))
        .filter((id): id is string => Boolean(id));

      await tx.rol.create({
        data: {
          empresaId,
          nombre: nombreRol,
          esSistema: true,
          permisos: { create: permisoIds.map((permisoId) => ({ permisoId })) },
        },
      });
    }
  }

  private async crearModulosSistema(tx: Prisma.TransactionClient, empresaId: string) {
    await tx.modulo.createMany({
      data: MODULOS_SISTEMA.map((modulo) => ({
        empresaId,
        clave: modulo.clave,
        nombre: modulo.nombre,
        descripcion: modulo.descripcion,
        icono: modulo.icono,
        orden: modulo.orden,
        ruta: modulo.ruta,
        tipo: 'SISTEMA' as const,
        implementado: modulo.implementado,
      })),
      skipDuplicates: true,
    });
  }
}
