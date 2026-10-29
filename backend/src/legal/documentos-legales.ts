import { DocumentoLegal } from '@prisma/client';

/**
 * Version vigente de los documentos que el usuario debe aceptar.
 *
 * Al cambiar un documento hay que actualizar su hash y esta version. El
 * backend no confia en la version que envia el navegador: siempre registra la
 * que esta definida aqui.
 */
export const VERSION_DOCUMENTOS_LEGALES = '0.1-borrador';
export const FECHA_DOCUMENTOS_LEGALES = '2026-10-28';

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
      '903582a2104c9470fd8b3c85dd0938b4d787908c4159d0eddc16f62a22cad6a7',
  },
  {
    documento: DocumentoLegal.PRIVACIDAD,
    titulo: 'Política de Privacidad',
    ruta: '/legal/politica-de-privacidad.md',
    hash:
      '3c9026d9e6fbb70cdd0782248ad34be5d6b6686b03593ae204413bd6f863d398',
  },
  {
    documento: DocumentoLegal.USO_ACEPTABLE,
    titulo: 'Uso Aceptable',
    ruta: '/legal/uso-aceptable.md',
    hash:
      '9715c4a3e4bd8b5a48fd0abea583699060aeb581be90f763618154eb9d300918',
  },
];
