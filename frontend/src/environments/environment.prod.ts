export const environment = {
  production: true,
  apiUrl: 'https://inventario-backend-gsd7.onrender.com/api',
  /**
   * Producción sigue en `draft` hasta completar la identidad legal de Stockora
   * y la revisión por abogado. `scripts/verificar-legal.mjs` impide marcar
   * `final` mientras queden datos pendientes en los documentos.
   */
  legalMode: 'draft' as 'draft' | 'final',
};
