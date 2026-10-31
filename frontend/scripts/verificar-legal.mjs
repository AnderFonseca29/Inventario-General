#!/usr/bin/env node
/**
 * Verifica la coherencia de los documentos legales:
 *
 *  1. Cada .md publicado tiene hash vigente en MANIFEST.md.
 *  2. El catálogo del frontend lista todos los documentos y ninguno inventado.
 *  3. La versión y la fecha coinciden entre catálogo, backend y manifiesto.
 *  4. Los hashes que registra el backend son los de los archivos actuales.
 *  5. No se marca `legalMode: 'final'` mientras queden datos pendientes.
 *
 * Uso: npm run verificar:legal
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dirLegal = join(raiz, 'public', 'legal');
const rutaCatalogo = join(raiz, 'src', 'app', 'core', 'legal', 'documentos.ts');
const rutaBackend = join(raiz, '..', 'backend', 'src', 'legal', 'documentos-legales.ts');
const rutaManifiesto = join(dirLegal, 'MANIFEST.md');
const rutaEntornoProd = join(raiz, 'src', 'environments', 'environment.prod.ts');

const errores = [];
const avisos = [];

const leer = (ruta) => readFile(ruta, 'utf8');

const archivos = (await readdir(dirLegal))
  .filter((nombre) => nombre.endsWith('.md'))
  .filter((nombre) => !['MANIFEST.md', 'README.md'].includes(nombre))
  .sort();

const hashes = new Map();
const contenidos = new Map();

for (const archivo of archivos) {
  const contenido = await leer(join(dirLegal, archivo));
  contenidos.set(archivo, contenido);
  hashes.set(archivo, createHash('sha256').update(contenido).digest('hex'));
}

const catalogo = await leer(rutaCatalogo);
const backend = await leer(rutaBackend);
const manifiesto = await leer(rutaManifiesto);
const entornoProd = await leer(rutaEntornoProd);

// 2. Catálogo del frontend.
const declarados = [...catalogo.matchAll(/archivo:\s*'([^']+\.md)'/g)].map(
  (coincidencia) => coincidencia[1],
);

for (const archivo of archivos) {
  if (!declarados.includes(archivo)) {
    errores.push(`El catálogo no incluye ${archivo}.`);
  }
}

for (const archivo of declarados) {
  if (!archivos.includes(archivo)) {
    errores.push(`El catálogo declara ${archivo}, pero el archivo no existe.`);
  }
}

// 3. Versión y fecha.
const versionCatalogo = catalogo.match(/VERSION_LEGAL = '([^']+)'/)?.[1];
const fechaCatalogo = catalogo.match(/FECHA_LEGAL = '([^']+)'/)?.[1];
const versionBackend = backend.match(/VERSION_DOCUMENTOS_LEGALES = '([^']+)'/)?.[1];
const fechaBackend = backend.match(/FECHA_DOCUMENTOS_LEGALES = '([^']+)'/)?.[1];

if (!versionCatalogo || !fechaCatalogo) {
  errores.push('El catálogo no declara VERSION_LEGAL y FECHA_LEGAL.');
}

if (versionCatalogo !== versionBackend) {
  errores.push(`Versión distinta: catálogo ${versionCatalogo} y backend ${versionBackend}.`);
}

if (fechaCatalogo !== fechaBackend) {
  errores.push(`Fecha distinta: catálogo ${fechaCatalogo} y backend ${fechaBackend}.`);
}

if (versionCatalogo && !manifiesto.includes(`Versión vigente: \`${versionCatalogo}\``)) {
  errores.push(`MANIFEST.md no registra la versión vigente ${versionCatalogo}.`);
}

// 1 y 4. Hashes del manifiesto y del backend.
const filasManifiesto = [
  ...manifiesto.matchAll(/^\| `([^`]+\.md)` \| ([^|]+) \| ([^|]+) \| `([a-f0-9]{64})`/gm),
];

for (const [, archivo, version, fecha, hash] of filasManifiesto) {
  const real = hashes.get(archivo);
  if (!real) {
    errores.push(`MANIFEST.md menciona ${archivo}, que no existe.`);
    continue;
  }
  if (real !== hash) {
    errores.push(`Hash desactualizado en MANIFEST.md para ${archivo}.`);
  }
  if (version.trim() !== versionCatalogo) {
    errores.push(`MANIFEST.md registra ${archivo} con versión ${version.trim()}.`);
  }
  if (fecha.trim() !== fechaCatalogo) {
    errores.push(`MANIFEST.md registra ${archivo} con fecha ${fecha.trim()}.`);
  }
}

for (const archivo of archivos) {
  if (!filasManifiesto.some(([, nombre]) => nombre === archivo)) {
    errores.push(`MANIFEST.md no tiene fila para ${archivo}.`);
  }
}

const entradasBackend = [
  ...backend.matchAll(
    /documento:\s*DocumentoLegal\.(\w+),[\s\S]*?ruta:\s*'\/legal\/([^']+)'[\s\S]*?hash:\s*'([a-f0-9]{64})'/g,
  ),
];

if (entradasBackend.length === 0) {
  errores.push('No se pudieron leer los hashes de documentos-legales.ts.');
}

for (const [, tipo, archivo, hash] of entradasBackend) {
  const real = hashes.get(archivo);
  if (!real) {
    errores.push(`El backend registra ${archivo}, que no existe.`);
    continue;
  }
  if (real !== hash) {
    errores.push(`Hash desactualizado en el backend para ${archivo} (${tipo}).`);
  }
}

// 5. Modo final sin datos pendientes.
const modoFinal = /legalMode:\s*'final'/.test(entornoProd);
const documentosConPendientes = [...contenidos.entries()]
  .filter(([, contenido]) => contenido.includes('[DATO PENDIENTE'))
  .map(([archivo]) => archivo);

if (modoFinal && documentosConPendientes.length > 0) {
  errores.push(
    `environment.prod.ts está en modo 'final' con datos pendientes en: ${documentosConPendientes.join(', ')}.`,
  );
}

if (!modoFinal && documentosConPendientes.length > 0) {
  avisos.push(
    `${documentosConPendientes.length} documentos conservan marcadores [DATO PENDIENTE] (modo borrador).`,
  );
}

// Resultado.
console.log(`Documentos revisados: ${archivos.length}`);
for (const archivo of archivos) {
  console.log(`  · ${archivo}  ${hashes.get(archivo)}`);
}

for (const aviso of avisos) {
  console.log(`Aviso: ${aviso}`);
}

if (errores.length > 0) {
  console.error('\nErrores legales:');
  for (const error of errores) {
    console.error(`  ✗ ${error}`);
  }
  process.exit(1);
}

console.log('\nLegal OK: hashes, versión y catálogo coinciden.');
