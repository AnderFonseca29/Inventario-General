export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api',
  /**
   * `draft` muestra el aviso de borrador en los documentos legales y permite
   * publicar con datos pendientes. Solo debe pasar a `final` cuando la
   * identidad del prestador y la revisión por abogado estén listas.
   */
  legalMode: 'draft' as 'draft' | 'final',
};
