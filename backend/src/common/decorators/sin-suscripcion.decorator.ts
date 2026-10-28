import { SetMetadata } from '@nestjs/common';

/**
 * Exime una ruta del control de suscripcion vencida. Se usa en la propia
 * consulta del plan: el frontend necesita leerla justo cuando esta bloqueado
 * para poder explicar el motivo.
 */
export const SIN_SUSCRIPCION_KEY = 'sin_suscripcion';
export const SinSuscripcion = () => SetMetadata(SIN_SUSCRIPCION_KEY, true);
