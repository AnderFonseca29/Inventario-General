#!/usr/bin/env node
/**
 * Stockora - Comprobacion de codificacion UTF-8 y mojibake.
 *
 * Detecta:
 *  - Secuencias tipicas de doble codificacion (mojibake).
 *  - Caracteres de reemplazo Unicode (U+FFFD).
 *  - Archivos de texto que NO son UTF-8 valido.
 *  - Byte Order Mark (BOM) UTF-8 residual.
 *
 * Uso:
 *   node scripts/check-encoding.mjs                  # escanea el repositorio
 *   node scripts/check-encoding.mjs <raiz>           # escanea una ruta concreta
 *   node scripts/check-encoding.mjs --files <lista>  # revisa solo una lista de rutas
 *
 * Codigo de salida: 0 = sin errores, 1 = se detectaron problemas.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.angular',
  'coverage',
  'out-tsc',
  '.vercel',
  '.next',
]);

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css',
  '.scss', '.sass', '.less', '.md', '.txt', '.yml', '.yaml', '.env', '.example',
  '.prisma', '.sql', '.csv', '.svg', '.xml', '.webmanifest', '.sh', '.ps1',
]);

/**
 * Archivos que contienen, por naturaleza, los patrones que buscan (los propios
 * correctores). Se autoexcluyen del analisis para evitar auto-detecciones.
 */
const AUTOEXCLUIDOS = new Set([
  'scripts/check-encoding.mjs',
  'scripts/fix-encoding.mjs',
]);

/**
 * Patrones de mojibake (doble codificacion UTF-8 -> Latin-1 -> UTF-8).
 * Se expresan con escapes Unicode para no depender de la codificacion de la
 * consola donde se ejecuta el script.
 */
const MOJIBAKE_PATTERNS = [
  { name: 'A-tilde-doble', re: /\u00c3[\u0080-\u00bf]/ },
  { name: 'A-circunflejo', re: /\u00c2[\u0080-\u00bf]/ },
  { name: 'a-simbolos-doble', re: /\u00e2\u20ac|\u00e2\u201c|\u00e2\u201d|\u00e2\u2018|\u00e2\u2019/ },
  { name: 'a-simbolos-simples', re: /\u00e2[\u0080-\u00bf]/ },
  { name: 'guion-medio-fraccion', re: /\u00c2[\u00a0-\u00bf]/ },
  { name: 'reemplazo-unicode', re: /\ufffd/ },
];

/**
 * Parseo de argumentos:
 *   node scripts/check-encoding.mjs [raiz] [--files <lista.txt>]
 *
 * Se separa primero el par "--files <valor>" para que el valor no se confunda
 * con la raiz del repositorio.
 */
const argv = process.argv.slice(2);
const idxFiles = argv.indexOf('--files');
let listaRutas = null;
if (idxFiles !== -1) {
  listaRutas = argv[idxFiles + 1];
  argv.splice(idxFiles, 2);
}
const raizArg = argv.find((a) => !a.startsWith('--'));
const ROOT = resolve(raizArg ?? process.cwd());

function esDirectorio(nombre) {
  return IGNORED_DIRS.has(nombre);
}

function esTexto(nombre) {
  const ext = extname(nombre).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  return ['Dockerfile', 'Makefile', 'LICENSE', 'README', '.env'].includes(nombre);
}

function listar(dir) {
  const salida = [];
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return salida;
  }
  for (const e of entradas) {
    // Se ignoran los ARCHIVOS ocultos (excepto los relevantes del proyecto),
    // pero NO los directorios ocultos: .github contiene workflows que deben
    // revisarse.
    if (
      !e.isDirectory() &&
      e.name.startsWith('.') &&
      !['.env.example', '.editorconfig', '.gitattributes'].includes(e.name)
    ) {
      continue;
    }
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (esDirectorio(e.name)) continue;
      salida.push(...listar(p));
    } else if (e.isFile() && esTexto(e.name)) {
      salida.push(p);
    }
  }
  return salida;
}

/** Valida UTF-8 estricto y detecta BOM. */
function validarUtf8(bytes) {
  const tieneBom =
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf;
  const dec = new TextDecoder('utf-8', { fatal: true });
  try {
    return { ok: true, texto: dec.decode(bytes), tieneBom };
  } catch {
    return { ok: false, texto: null, tieneBom };
  }
}

const problemas = [];
let revisados = 0;

let archivos;
if (listaRutas) {
  const rutas = readFileSync(listaRutas, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  archivos = rutas.map((r) => resolve(ROOT, r));
} else {
  archivos = listar(ROOT);
}

for (const abs of archivos) {
  const rel = relative(ROOT, abs).replace(/\\/g, '/');
  if (AUTOEXCLUIDOS.has(rel)) continue;

  let bytes;
  try {
    bytes = readFileSync(abs);
  } catch {
    continue;
  }
  if (bytes.length === 0) continue;

  const { ok, texto, tieneBom } = validarUtf8(bytes);
  if (!ok) {
    // Algunos .ico legitimos no son UTF-8: no reportar si la cabecera indica ICO o PNG.
    const esIco = bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01;
    const esPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    if (!esIco && !esPng) {
      problemas.push({
        tipo: 'NO-UTF8',
        archivo: rel,
        linea: 0,
        detalle: 'El archivo no decodifica como UTF-8 valido.',
      });
    }
    continue;
  }
  revisados++;

  if (tieneBom && !rel.endsWith('.gitattributes')) {
    problemas.push({
      tipo: 'BOM',
      archivo: rel,
      linea: 0,
      detalle: 'El archivo tiene BOM UTF-8. Se recomienda quitarlo.',
    });
  }

  const lineas = texto.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    for (const p of MOJIBAKE_PATTERNS) {
      if (p.re.test(linea)) {
        problemas.push({
          tipo: p.name,
          archivo: rel,
          linea: i + 1,
          detalle: 'Posible doble codificacion (mojibake).',
          muestra: linea.trim().slice(0, 160),
        });
        break;
      }
    }
  }
}

console.log(
  `[encoding] Revisados ${revisados} archivos de texto en ${ROOT}`,
);

if (problemas.length) {
  console.error(`\n[encoding] ERRORES (${problemas.length}):`);
  for (const p of problemas.slice(0, 200)) {
    console.error(`  - ${p.archivo}:${p.linea}  ${p.tipo}  ${p.detalle}`);
    if (p.muestra) console.error(`      ${p.muestra}`);
  }
  console.error(
    `\n[encoding] Se detectaron ${problemas.length} problema(s) de codificacion. ` +
      'Corrige el texto (no lo reescribas a ciegas) y vuelve a ejecutar el chequeo.',
  );
  process.exit(1);
}

console.log('[encoding] OK - sin mojibake y todos los archivos son UTF-8 valido.');
process.exit(0);
