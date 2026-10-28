import { SetMetadata } from '@nestjs/common';

// Marca un controlador (o una ruta) como exclusivo del dueno de la empresa.
// El superadministrador de plataforma tambien pasa: administra la plataforma,
// no la suscripcion de una empresa concreta.
export const PROPIETARIO_KEY = 'soloPropietario';
export const SoloPropietario = () => SetMetadata(PROPIETARIO_KEY, true);
