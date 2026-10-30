#!/usr/bin/env node
/**
 * Verifica que las páginas públicas solo usen los colores de marca declarados
 * en src/styles/_brand.scss. Los colores literales del HTML base, el manifest,
 * el favicon y las imágenes Open Graph son activos y se documentan aparte.
 */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const objetivo = [
  'src/app/features/landing',
  'src/app/features/auth/login.component.ts',
  'src/app/features/auth/registro.component.ts',
  'src/app/features/auth/login.component.scss',
  'src/app/shared/brand-icon.component.ts',
  'src/app/shared/brand-mark.component.ts',
];

const patronColor = /#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/gi;
const archivos = [];

async function recorrer(ruta) {
  let entradas;
  try {
    entradas = await readdir(join(raiz, ruta), { withFileTypes: true });
  } catch {
    archivos.push(ruta);
    return;
  }

  for (const entrada of entradas) {
    const relativa = join(ruta, entrada.name).replaceAll('\\', '/');
    if (entrada.isDirectory()) {
      await recorrer(relativa);
    } else if (['.ts', '.scss', '.html'].includes(extname(entrada.name))) {
      archivos.push(relativa);
    }
  }
}

for (const ruta of objetivo) {
  await recorrer(ruta);
}

const infracciones = [];

for (const archivo of archivos) {
  const contenido = await readFile(join(raiz, archivo), 'utf8');
  const lineas = contenido.split(/\r?\n/);

  lineas.forEach((linea, indice) => {
    patronColor.lastIndex = 0;
    if (patronColor.test(linea)) {
      infracciones.push(`${relative(raiz, join(raiz, archivo))}:${indice + 1}  ${linea.trim()}`);
    }
  });
}

if (infracciones.length > 0) {
  console.error('Colores literales fuera de src/styles/_brand.scss:\n');
  for (const infraccion of infracciones) {
    console.error(`  ${infraccion}`);
  }
  console.error('\nUsa una variable --brand-* en su lugar.');
  process.exit(1);
}

console.log(`Colores de marca verificados en ${archivos.length} archivos públicos.`);
