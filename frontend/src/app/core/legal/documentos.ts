/**
 * Catálogo único de los documentos legales públicos.
 *
 * El texto de cada documento vive en `public/legal/*.md` y se renderiza en
 * `/legal/:clave`. Este archivo solo aporta metadatos: título, resumen, grupo
 * y el nombre del archivo. La versión y la fecha deben coincidir con
 * `backend/src/legal/documentos-legales.ts` y con `public/legal/MANIFEST.md`.
 */

export type GrupoLegal = 'Contrato' | 'Datos personales' | 'Sitio';

export interface DocumentoLegalPublico {
  /** Clave usada en la URL `/legal/:clave`. */
  clave: string;
  titulo: string;
  /** Archivo dentro de `public/legal/`, sin ruta absoluta. */
  archivo: string;
  resumen: string;
  grupo: GrupoLegal;
  /** Documento que el usuario acepta de forma expresa al registrarse. */
  exigidoEnRegistro: boolean;
  /** Nombre del documento en la API de aceptaciones, si aplica. */
  aceptacion?: 'TERMINOS' | 'PRIVACIDAD' | 'USO_ACEPTABLE';
}

export const VERSION_LEGAL = '0.2-borrador';
export const FECHA_LEGAL = '2026-10-30';
/** Fecha legible en español, para mostrar en pantalla. */
export const FECHA_LEGAL_TEXTO = '30 de octubre de 2026';

export const RUTA_CENTRO_LEGAL = '/legal';

export const DOCUMENTOS_LEGALES: readonly DocumentoLegalPublico[] = [
  {
    clave: 'terminos',
    titulo: 'Términos y Condiciones',
    archivo: 'terminos-y-condiciones.md',
    resumen:
      'Contrato de uso: cuenta, prueba gratuita, planes, pagos, cancelación y responsabilidad.',
    grupo: 'Contrato',
    exigidoEnRegistro: true,
    aceptacion: 'TERMINOS',
  },
  {
    clave: 'uso-aceptable',
    titulo: 'Uso Aceptable',
    archivo: 'uso-aceptable.md',
    resumen: 'Conductas prohibidas, límites de uso, seguridad de la cuenta y comunicaciones.',
    grupo: 'Contrato',
    exigidoEnRegistro: true,
    aceptacion: 'USO_ACEPTABLE',
  },
  {
    clave: 'privacidad',
    titulo: 'Política de Privacidad',
    archivo: 'politica-de-privacidad.md',
    resumen:
      'Cómo tratamos los datos de visitantes, cuentas y usuarios, explicado en lenguaje claro.',
    grupo: 'Datos personales',
    exigidoEnRegistro: true,
    aceptacion: 'PRIVACIDAD',
  },
  {
    clave: 'tratamiento',
    titulo: 'Política de Tratamiento de Datos',
    archivo: 'politica-de-tratamiento-de-datos.md',
    resumen:
      'Política completa de tratamiento conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015.',
    grupo: 'Datos personales',
    exigidoEnRegistro: false,
  },
  {
    clave: 'aviso',
    titulo: 'Aviso de Privacidad',
    archivo: 'aviso-de-privacidad.md',
    resumen: 'Aviso breve que se muestra en los formularios donde recolectamos datos personales.',
    grupo: 'Datos personales',
    exigidoEnRegistro: false,
  },
  {
    clave: 'derechos',
    titulo: 'Derechos de los Titulares',
    archivo: 'derechos-de-los-titulares.md',
    resumen: 'Cómo ejercer acceso, corrección, supresión, revocatoria y reclamos ante Stockora.',
    grupo: 'Datos personales',
    exigidoEnRegistro: false,
  },
  {
    clave: 'retencion',
    titulo: 'Política de Retención',
    archivo: 'politica-de-retencion.md',
    resumen:
      'Cuánto tiempo conservamos cada tipo de dato y cómo se elimina al terminar la relación.',
    grupo: 'Datos personales',
    exigidoEnRegistro: false,
  },
  {
    clave: 'encargo',
    titulo: 'Contrato de Encargo de Datos',
    archivo: 'contrato-de-encargo.md',
    resumen:
      'Acuerdo de tratamiento entre el Cliente, responsable del dato, y Stockora como encargado.',
    grupo: 'Datos personales',
    exigidoEnRegistro: false,
  },
  {
    clave: 'cookies',
    titulo: 'Política de Cookies',
    archivo: 'politica-de-cookies.md',
    resumen:
      'Qué cookies usa el sitio, para qué sirven y cómo cambiar o retirar el consentimiento.',
    grupo: 'Sitio',
    exigidoEnRegistro: false,
  },
];

export const GRUPOS_LEGALES: readonly GrupoLegal[] = ['Contrato', 'Datos personales', 'Sitio'];

export function buscarDocumento(clave: string): DocumentoLegalPublico | undefined {
  return DOCUMENTOS_LEGALES.find((documento) => documento.clave === clave);
}

export function documentosPorGrupo(grupo: GrupoLegal): DocumentoLegalPublico[] {
  return DOCUMENTOS_LEGALES.filter((documento) => documento.grupo === grupo);
}

export function rutaDocumento(clave: string): string {
  return `${RUTA_CENTRO_LEGAL}/${clave}`;
}

/**
 * Resuelve el archivo Markdown contra el `<base href>` real de la aplicación.
 * En GitHub Pages la base incluye `/Inventario-General/`, por lo que una ruta
 * absoluta `/legal/...` apuntaría al dominio sin el repositorio.
 */
export function urlArchivoLegal(archivo: string, base: string): string {
  return new URL(`legal/${archivo}`, base).href;
}

/**
 * Identidad legal del prestador. Mientras no exista el dato real se conserva un
 * marcador explícito en lugar de inventar razón social, NIT o domicilio.
 * El modo borrador (`environment.legalMode`) hace visible ese estado.
 */
export const IDENTIDAD_STOCKORA = {
  razonSocial: '[DATO PENDIENTE: razón social de la S.A.S.]',
  nit: '[DATO PENDIENTE: NIT]',
  domicilio: '[DATO PENDIENTE: ciudad y dirección]',
  telefono: '[DATO PENDIENTE: teléfono]',
  matricula: '[DATO PENDIENTE: matrícula mercantil]',
  representante: '[DATO PENDIENTE: representante legal]',
  sitioWeb: '[DATO PENDIENTE: dominio definitivo]',
  correoContacto: '[DATO PENDIENTE: correo de contacto]',
  correoPrivacidad: '[DATO PENDIENTE: privacidad@dominio]',
  correoPqr: '[DATO PENDIENTE: pqr@dominio]',
  correoSeguridad: '[DATO PENDIENTE: seguridad@dominio]',
  horario: '[DATO PENDIENTE: días y horas de atención]',
} as const;

export type CampoIdentidad = keyof typeof IDENTIDAD_STOCKORA;

const MARCADOR_PENDIENTE = '[DATO PENDIENTE';

/** Detecta los marcadores que deben reemplazarse antes de publicar en modo final. */
export function esDatoPendiente(valor: string): boolean {
  return valor.includes(MARCADOR_PENDIENTE);
}

/** Cantidad de datos de identidad aún sin completar (0 = listo para `final`). */
export function datosIdentidadPendientes(): number {
  return Object.values(IDENTIDAD_STOCKORA).filter((valor) => esDatoPendiente(valor)).length;
}
