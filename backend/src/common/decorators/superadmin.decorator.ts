import { SetMetadata } from '@nestjs/common';

export const SUPERADMIN_KEY = 'esSuperAdmin';
export const SoloSuperAdmin = () => SetMetadata(SUPERADMIN_KEY, true);
