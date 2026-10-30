/**
 * Reglas de contraseña para el registro.
 *
 * La longitud mínima se mantiene en 8, pero se rechazan las claves
 * evidentes (comunes, repetitivas o secuenciales) y se exige variedad
 * de caracteres. Las mismas reglas deben replicarse en el backend.
 */

export const LONGITUD_MINIMA = 8;
export const LONGITUD_MAXIMA = 128;

export type FuerzaContrasena = 'debil' | 'media' | 'fuerte';

export interface RequisitoContrasena {
  id: 'longitud' | 'comun' | 'variedad' | 'patron';
  texto: string;
  cumple: boolean;
}

export interface ResultadoContrasena {
  valida: boolean;
  errores: string[];
  requisitos: RequisitoContrasena[];
  fuerza: FuerzaContrasena;
}

/** Claves frecuentes en filtraciones; se comparan sin distinguir mayúsculas ni tildes. */
const COMUNES = new Set<string>([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  'password',
  'password1',
  'password123',
  'contrasena',
  'contrasena1',
  'qwerty123',
  'qwertyui',
  'asdfghjk',
  'zxcvbnm1',
  'abc12345',
  '1234abcd',
  '1q2w3e4r',
  '11111111',
  '00000000',
  'iloveyou',
  'admin123',
  'admin2024',
  'administrador',
  'bienvenido',
  'bienvenidos',
  'bienvenido1',
  'colombia',
  'colombia123',
  'medellin',
  'bogota2024',
  'stockora',
  'stockora123',
  'inventario',
  'inventario1',
  'inventario123',
  'empresa123',
  'usuario123',
  'prueba123',
  'temporal1',
  'changeme',
  'letmein1',
  'holamundo',
  'futbol123',
  'teamo123',
]);

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function clasesUsadas(valor: string): number {
  let clases = 0;
  if (/[a-z]/.test(valor)) clases++;
  if (/[A-Z]/.test(valor)) clases++;
  if (/[0-9]/.test(valor)) clases++;
  if (/[^A-Za-z0-9]/.test(valor)) clases++;
  return clases;
}

/** Detecta cuatro caracteres consecutivos en orden (1234, abcd, 9876, dcba). */
function tieneSecuencia(valor: string): boolean {
  const texto = valor.toLowerCase();
  for (let i = 0; i + 3 < texto.length; i++) {
    const a = texto.charCodeAt(i);
    const b = texto.charCodeAt(i + 1);
    const c = texto.charCodeAt(i + 2);
    const d = texto.charCodeAt(i + 3);
    if (b - a === 1 && c - b === 1 && d - c === 1) return true;
    if (a - b === 1 && b - c === 1 && c - d === 1) return true;
  }
  return false;
}

function calcularFuerza(valor: string): FuerzaContrasena {
  let puntos = 0;
  if (valor.length >= 12) puntos++;
  if (valor.length >= 16) puntos++;
  if (clasesUsadas(valor) >= 3) puntos++;
  if (clasesUsadas(valor) === 4) puntos++;
  if (puntos <= 1) return 'debil';
  if (puntos <= 2) return 'media';
  return 'fuerte';
}

export function evaluarContrasena(valor: string): ResultadoContrasena {
  const limpio = valor ?? '';
  const largo = limpio.length >= LONGITUD_MINIMA && limpio.length <= LONGITUD_MAXIMA;
  const clases = clasesUsadas(limpio);

  const requisitos: RequisitoContrasena[] = [
    {
      id: 'longitud',
      texto: `Entre ${LONGITUD_MINIMA} y ${LONGITUD_MAXIMA} caracteres`,
      cumple: largo,
    },
    {
      id: 'comun',
      texto: 'No es una contraseña común o filtrada',
      cumple: limpio.length >= LONGITUD_MINIMA && !COMUNES.has(normalizar(limpio)),
    },
    {
      id: 'variedad',
      texto: 'Combina mayúsculas, minúsculas, números o símbolos',
      cumple: clases >= 3 || (clases >= 2 && limpio.length >= 12),
    },
    {
      id: 'patron',
      texto: 'Sin repeticiones (aaa) ni secuencias (1234, abcd)',
      cumple: !/(.)\1{2,}/.test(limpio) && !tieneSecuencia(limpio),
    },
  ];

  const errores: string[] = [];
  if (limpio.length < LONGITUD_MINIMA) {
    errores.push(`Usa al menos ${LONGITUD_MINIMA} caracteres.`);
  }
  if (limpio.length > LONGITUD_MAXIMA) {
    errores.push(`Usa máximo ${LONGITUD_MAXIMA} caracteres.`);
  }
  if (!requisitos[1].cumple) {
    errores.push('Esta contraseña es demasiado común. Elige otra.');
  }
  if (!requisitos[3].cumple) {
    errores.push('Evita repeticiones y secuencias como 111 o 1234.');
  }
  if (!requisitos[2].cumple) {
    errores.push('Combina mayúsculas, minúsculas, números o símbolos.');
  }

  return {
    valida: errores.length === 0,
    errores,
    requisitos,
    fuerza: calcularFuerza(limpio),
  };
}
