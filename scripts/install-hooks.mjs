#!/usr/bin/env node
/**
 * Instala el hook pre-commit de Stockora en el repositorio local.
 *
 * Uso: node scripts/install-hooks.mjs
 *
 * Equivale a:  git config core.hooksPath .githooks
 *
 * Se ejecuta una sola vez por maquina. Cada desarrollador debe ejecutarlo
 * tras clonar el repositorio.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

if (!existsSync(join(ROOT, '.githooks', 'pre-commit'))) {
  console.error('[hooks] No se encontro .githooks/pre-commit');
  process.exit(1);
}

try {
  chmodSync(join(ROOT, '.githooks', 'pre-commit'), 0o755);
} catch {
  /* sin permisos: no es critico */
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.log('[hooks] Hook pre-commit instalado (core.hooksPath = .githooks).');
