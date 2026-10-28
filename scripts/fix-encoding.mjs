#!/usr/bin/env node
/**
 * Stockora - Normalizador de codificacion.
 *
 * Acciones:
 *  1. Quita el BOM UTF-8 de los archivos de texto (solo el BOM, no el contenido).
 *  2. Repara la doble codificacion SOLO cuando la ronda Latin-1 -> UTF-8 no
 *     introduce mojibake nuevo. Si el archivo mezcla texto correcto y roto,
 *     NO se modifica: se avisa para revision manual.
 *  3. Avisa (sin tocar) de archivos que no son UTF-8 valido.
 *
 * Uso:
 *   node scripts/fix-encoding.mjs            # modo simulacion (solo informa)
 *   node scripts/fix-encoding.mjs --apply    # aplica los cambios
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const argv = process.argv.slice(2);
const raizArg = argv.find((a) => !a.startsWith('--'));
const ROOT = resolve(raizArg ?? process.cwd());
const APPLY = argv.includes('--apply');

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

const AUTOEXCLUIDOS = new Set([
  'scripts/check-encoding.mjs',
  'scripts/fix-encoding.mjs',
]);

const MOJIBAKE_RE =
  /\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2[\u0080-\u00bf]|\u00e2\u20ac|\ufffd/;

function esTexto(nombre) {
  const ext = nombre.slice(nombre.lastIndexOf('.')).toLowerCase();
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
      if (IGNORED_DIRS.has(e.name)) continue;
      salida.push(...listar(p));
    } else if (e.isFile() && esTexto(e.name)) {
      salida.push(p);
    }
  }
  return salida;
}

const cambios = [];
const avisos = [];

for (const abs of listar(ROOT)) {
  const rel = relative(ROOT, abs).replace(/\\/g, '/');
  if (AUTOEXCLUIDOS.has(rel)) continue;

  const bytes = readFileSync(abs);
  if (bytes.length === 0) continue;

  let buf = bytes;
  let motivo = null;

  const tieneBom =
    buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  if (tieneBom) {
    buf = buf.subarray(3);
    motivo = 'BOM UTF-8 eliminado';
  }

  // Deteccion de doble codificacion:
  //  - El archivo se decodifica como UTF-8 ESTRICTO. Si no decodifica, los bytes
  //    crudos son Latin-1 (no UTF-8): eso ya es un problema a corregir aparte.
  //  - Si decodifica bien pero el TEXTO contiene el patron tipico de mojibake,
  //    cada caracter de ese texto representa un byte Latin-1 que en realidad era
  //    UTF-8. La reparacion es codificar el texto como Latin-1 (byte a byte) y
  //    decodificarlo de nuevo como UTF-8.
  //
  //  IMPORTANTE: leer los bytes como Latin-1 para "buscar el patron" daria falsos
  //  positivos en cualquier archivo UTF-8 correcto con tildes. Por eso el analisis
  //  se hace sobre el TEXTO ya decodificado en UTF-8.
  const dec = new TextDecoder('utf-8', { fatal: true });
  let textoUtf8 = null;
  try {
    textoUtf8 = dec.decode(buf);
  } catch {
    textoUtf8 = null;
  }

  if (textoUtf8 === null) {
    avisos.push({
      rel,
      motivo: 'no era UTF-8 valido (reinterpretado como Latin-1) - revisar manualmente',
    });
    continue;
  }

  if (MOJIBAKE_RE.test(textoUtf8)) {
    const reparado = Buffer.from(textoUtf8, 'latin1').toString('utf8');
    if (!MOJIBAKE_RE.test(reparado)) {
      buf = Buffer.from(reparado, 'utf8');
      motivo = (motivo ? motivo + ' + ' : '') + 'doble codificacion reparada';
    } else {
      avisos.push({
        rel,
        motivo: 'mojibake mixto (parte del texto correcto, parte roto) - revisar a mano',
      });
      continue;
    }
  }

  if (motivo) {
    cambios.push({ rel, motivo });
    if (APPLY) writeFileSync(abs, buf);
  }
}

if (!cambios.length && !avisos.length) {
  console.log('[encoding-fix] No hay nada que normalizar.');
  process.exit(0);
}

if (cambios.length) {
  console.log(
    `[encoding-fix] ${APPLY ? 'Aplicando' : 'Simulacion'} ${cambios.length} cambio(s):`,
  );
  for (const c of cambios) console.log(`  - ${c.rel}  (${c.motivo})`);
  if (!APPLY) {
    console.log('\n[encoding-fix] Ejecuta con --apply para escribir los cambios.');
  }
}

if (avisos.length) {
  console.warn(`\n[encoding-fix] AVISOS (${avisos.length}) - revisar manualmente:`);
  for (const a of avisos) console.warn(`  - ${a.rel}  (${a.motivo})`);
}
