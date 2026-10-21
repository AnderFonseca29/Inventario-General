import { SetMetadata } from '@nestjs/common';

export const SIN_EMPRESA_KEY = 'sinEmpresa';

// Marca un endpoint (o controlador) que NO requiere contexto de empresa
// (p. ej. panel de plataforma, resumen personal). Exime del EmpresaContextoGuard.
export const SinEmpresa = () => SetMetadata(SIN_EMPRESA_KEY, true);
