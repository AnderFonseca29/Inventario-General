import { environment as produccion } from './environment.prod';

/**
 * Build específico de GitHub Pages.
 *
 * Pages no puede actuar como proxy de `/api`; por eso este despliegue mantiene
 * la llamada directa a Render. Vercel usa `environment.prod.ts` y su rewrite
 * `/api` para servir la API bajo el mismo origen.
 */
export const environment = {
  ...produccion,
  apiUrl: 'https://inventario-backend-gsd7.onrender.com/api',
};
