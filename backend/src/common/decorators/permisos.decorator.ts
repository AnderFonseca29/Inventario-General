import { SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisos';
export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISOS_KEY, permisos);

// El usuario necesita al menos uno de los permisos indicados (logica OR),
// util para lecturas que aceptan vision propia o vision general.
export const PERMISOS_ALGUNO_KEY = 'permisos_alguno';
export const PermisosAlguno = (...permisos: string[]) =>
  SetMetadata(PERMISOS_ALGUNO_KEY, permisos);
