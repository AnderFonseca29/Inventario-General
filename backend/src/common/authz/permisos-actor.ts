import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user';

// Un usuario (no superadministrador) solo puede conceder permisos que el mismo
// posee. Evita la escalada de privilegios intra-empresa: alguien con
// roles.administrar no puede crear/editar roles con permisos superiores a los
// suyos, ni asignarlos a otros usuarios.
export function assertPermisosNoSuperiores(
  actor: Pick<AuthenticatedUser, 'esSuperAdmin' | 'permisos'>,
  permisosSolicitados: string[],
): void {
  if (actor.esSuperAdmin) {
    return;
  }
  const propios = new Set(actor.permisos);
  const excedidos = permisosSolicitados.filter((p) => !propios.has(p));
  if (excedidos.length > 0) {
    throw new ForbiddenException(
      `No puede conceder permisos que no posee: ${excedidos.join(', ')}`,
    );
  }
}
