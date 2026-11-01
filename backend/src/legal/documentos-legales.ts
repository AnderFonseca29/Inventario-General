import { DocumentoLegal } from '@prisma/client';

/**
 * Version vigente de los documentos que el usuario debe aceptar.
 *
 * Al cambiar un documento hay que actualizar su hash y esta version. El
 * backend no confia en la version que envia el navegador: siempre registra la
 * que esta definida aqui.
 */
export const VERSION_DOCUMENTOS_LEGALES = '0.2-borrador';
export const FECHA_DOCUMENTOS_LEGALES = '2026-10-30';

/**
 * La politica de cookies no se acepta en el registro, pero cada decision de
 * consentimiento se registra con la version y el hash vigentes. El backend
 * fija estos valores: el navegador no puede alterarlos.
 */
export const VERSION_POLITICA_COOKIES = '0.2-borrador';
export const HASH_POLITICA_COOKIES =
  '406b0594ba44cf46efde33581dad1c5902c26d27d9736bf85b3cae116d0c963a';

export interface DocumentoLegalVigente {
  documento: DocumentoLegal;
  titulo: string;
  ruta: string;
  hash: string;
}

export const DOCUMENTOS_LEGALES_VIGENTES: DocumentoLegalVigente[] = [
  {
    documento: DocumentoLegal.TERMINOS,
    titulo: 'Términos y Condiciones',
    ruta: '/legal/terminos-y-condiciones.md',
    hash:
      '8352867ad633d1bb6eaae10120fd3a7ba59c068f88d56c06c1f1c86eebc91965',
  },
  {
    documento: DocumentoLegal.PRIVACIDAD,
    titulo: 'Política de Privacidad',
    ruta: '/legal/politica-de-privacidad.md',
    hash:
      'e9caa7a2abff0fc92b769e51c970a7c0d633c73cf922da87202261a51e1d6c0a',
  },
  {
    documento: DocumentoLegal.USO_ACEPTABLE,
    titulo: 'Uso Aceptable',
    ruta: '/legal/uso-aceptable.md',
    hash:
      '793971d6364e17a67d666479d0a8f9c185e951b8451bd6fa2384c5d6c23db198',
  },
];
