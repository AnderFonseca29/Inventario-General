import { SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisos';
export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISOS_KEY, permisos);

// El usuario necesita al menos uno de los permisos indicados (lógica OR),
// util para lecturas que aceptan vision propia o vision general.
export const PERMISOS_ALGUNO_KEY = 'permisos_alguno';
export const PermisosAlguno = (...permisos: string[]) =>
  SetMetadata(PERMISOS_ALGUNO_KEY, permisos);

// Marca un controlador (o una ruta) como operativo de empresa: exige que el
// usuario tenga una empresa asignada. El superadministrador de plataforma NO
// pasa salvo que indique empresaId explicitamente (hallazgo K).
// @RequiereEmpresa(false) desactiva la exigencia en rutas de plataforma dentro
// de un controlador que si la requiere a nivel de clase (por ejemplo auth).
export const TENANT_KEY = 'tenant_requerido';
export const RequiereEmpresa = (requerido = true) =>
  SetMetadata(TENANT_KEY, requerido);
