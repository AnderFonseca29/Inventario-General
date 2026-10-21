import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verifica los artefactos de la PWA (hallazgo W): manifiesto, configuracion
 * del service worker e iconos. Un error en estos archivos hace que la
 * aplicacion no sea instalable aunque el build termine bien.
 */
describe('artefactos PWA (hallazgo W)', () => {
  const raiz = join(__dirname, '..', '..');

  it('el manifiesto declara nombre, icono y start_url', () => {
    const manifiesto = JSON.parse(
      readFileSync(join(raiz, 'public', 'manifest.webmanifest'), 'utf8'),
    );
    expect(manifiesto.name).toBeTruthy();
    expect(manifiesto.short_name).toBeTruthy();
    expect(manifiesto.start_url).toBeTruthy();
    expect(manifiesto.display).toBe('standalone');
    expect(manifiesto.icons.length).toBeGreaterThanOrEqual(2);
    expect(
      manifiesto.icons.some((i: { sizes: string }) => i.sizes === '512x512'),
    ).toBe(true);
  });

  it('la configuracion del service worker incluye el index y los assets', () => {
    const config = JSON.parse(
      readFileSync(join(raiz, 'ngsw-config.json'), 'utf8'),
    );
    expect(config.index).toBe('/index.html');
    const archivos = config.assetGroups[0].resources.files.join(' ');
    expect(archivos).toContain('/index.html');
    expect(archivos).toContain('/manifest.webmanifest');
  });

  it('el index.html enlaza el manifiesto y los iconos', () => {
    const html = readFileSync(join(raiz, 'src', 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('manifest.webmanifest');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('theme-color');
  });
});
