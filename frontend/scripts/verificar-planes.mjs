#!/usr/bin/env node
/**
 * Comprueba que los planes visibles de la landing coincidan con el seed de
 * Prisma y que los precios no estén duplicados en las secciones públicas.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const rutaDatos = join(raiz, 'src/app/features/landing/landing.data.ts');
const rutaSeed = join(raiz, '..', 'backend/prisma/seed.ts');
const rutaSecciones = join(raiz, 'src/app/features/landing/sections');

const errores = [];

function extraerPlanes(contenido, etiqueta) {
  const bloques = [...contenido.matchAll(/\{\s*codigo:\s*'(basico|pro|empresa)',([\s\S]*?)\n\s*\}/g)];
  if (bloques.length !== 3) {
    errores.push(`${etiqueta}: se esperaban 3 planes y se encontraron ${bloques.length}.`);
    return new Map();
  }

  return new Map(
    bloques.map(([, codigo, cuerpo]) => {
      const valor = (nombre) => {
        const coincidencia = cuerpo.match(new RegExp(`${nombre}:\\s*('([^']*)'|null|\\d+)`));
        if (!coincidencia) return undefined;
        const crudo = coincidencia[1];
        if (crudo === 'null') return null;
        if (crudo.startsWith("'")) return coincidencia[2];
        return Number(crudo);
      };

      return [
        codigo,
        {
          nombre: valor('nombre'),
          precioMensual: valor('precioMensual'),
          maxUsuarios: valor('maxUsuarios'),
          maxBodegas: valor('maxBodegas'),
          maxReportes: valor('maxReportes'),
        },
      ];
    }),
  );
}

const [datos, seed] = await Promise.all([readFile(rutaDatos, 'utf8'), readFile(rutaSeed, 'utf8')]);
const planesLanding = extraerPlanes(datos, 'landing.data.ts');
const planesSeed = extraerPlanes(seed, 'backend/prisma/seed.ts');

for (const codigo of ['basico', 'pro', 'empresa']) {
  const landing = planesLanding.get(codigo);
  const base = planesSeed.get(codigo);
  if (!landing || !base) {
    errores.push(`Falta el plan ${codigo} en landing.data.ts o en el seed.`);
    continue;
  }

  for (const campo of ['nombre', 'precioMensual', 'maxUsuarios', 'maxBodegas', 'maxReportes']) {
    if (landing[campo] !== base[campo]) {
      errores.push(
        `${codigo}.${campo}: landing=${JSON.stringify(landing[campo])} seed=${JSON.stringify(base[campo])}`,
      );
    }
  }
}

const preciosEsperados = { basico: 60000, pro: 90000, empresa: 120000 };
const bloquePrecios = datos.match(/export const PRECIOS_PLANES = \{([\s\S]*?)\} as const;/);
if (!bloquePrecios) {
  errores.push('No se encontró PRECIOS_PLANES en landing.data.ts.');
} else {
  for (const [codigo, precio] of Object.entries(preciosEsperados)) {
    const encontrado = bloquePrecios[1].match(new RegExp(`${codigo}:\\s*(\\d+)`));
    if (!encontrado || Number(encontrado[1]) !== precio) {
      errores.push(`PRECIOS_PLANES.${codigo} debe ser ${precio}.`);
    }
  }
}

if (!datos.includes("export const NOTA_PRECIOS = 'Precios mensuales en pesos colombianos (COP).';")) {
  errores.push('La nota de precios debe ser exactamente «Precios mensuales en pesos colombianos (COP).».');
}

const archivosSeccion = await readdir(rutaSecciones);
for (const archivo of archivosSeccion.filter((nombre) => nombre.endsWith('.ts'))) {
  const contenido = await readFile(join(rutaSecciones, archivo), 'utf8');
  if (/\b(?:60\.000|90\.000|120\.000|60000|90000|120000)\b/.test(contenido)) {
    errores.push(`${archivo}: contiene un precio literal; debe venir de landing.data.ts.`);
  }
}

if (errores.length > 0) {
  console.error('Los planes públicos no coinciden con el seed:\n');
  for (const error of errores) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('Planes verificados: Básico $60.000, Medio $90.000 y Premium $120.000 COP.');
console.log('Nombres y límites coinciden con backend/prisma/seed.ts.');
