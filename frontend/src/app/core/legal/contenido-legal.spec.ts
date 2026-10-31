import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DOCUMENTOS_LEGALES,
  FECHA_LEGAL_TEXTO,
  VERSION_LEGAL,
} from './documentos';

function leer(archivo: string): string {
  return readFileSync(join(process.cwd(), 'public', 'legal', archivo), 'utf8');
}

describe('contenido legal publicado', () => {
  it('la prueba gratuita anunciada es de 7 días con el plan Medio', () => {
    const terminos = leer('terminos-y-condiciones.md');
    expect(terminos).toContain('7 días calendario');
    expect(terminos).toContain('plan **Medio**');
    expect(terminos).not.toContain('3 días calendario');
    expect(terminos).not.toContain('1 día de gracia');
  });

  it('no anuncia un formulario de contacto que no existe', () => {
    for (const documento of DOCUMENTOS_LEGALES) {
      expect(leer(documento.archivo)).not.toContain('formulario de contacto');
    }
  });

  it('no enlaza archivos .md que el router no puede resolver', () => {
    for (const documento of DOCUMENTOS_LEGALES) {
      expect(leer(documento.archivo)).not.toMatch(/`\/legal\/[a-z-]+\.md`/);
    }
  });

  it('todos los documentos declaran la versión y fecha vigentes', () => {
    for (const documento of DOCUMENTOS_LEGALES) {
      const texto = leer(documento.archivo);
      expect(texto).toContain(`Versión: ${VERSION_LEGAL}`);
      expect(texto).toContain(`Fecha: ${FECHA_LEGAL_TEXTO}`);
    }
  });
});
