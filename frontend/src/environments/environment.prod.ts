export const environment = {
  production: true,
  // Vercel proxya `/api` al backend de Render para que la sesión sea
  // same-origin. GitHub Pages usa `environment.pages.ts` y llama a Render
  // directamente porque Pages no permite proxies de servidor.
  apiUrl: '/api',
  /**
   * Producción sigue en `draft` hasta completar la identidad legal de Stockora
   * y la revisión por abogado. `scripts/verificar-legal.mjs` impide marcar
   * `final` mientras queden datos pendientes en los documentos.
   */
  legalMode: 'draft' as 'draft' | 'final',
};
