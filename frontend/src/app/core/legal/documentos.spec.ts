import {
  DOCUMENTOS_LEGALES,
  IDENTIDAD_STOCKORA,
  datosIdentidadPendientes,
  documentosPorGrupo,
  esDatoPendiente,
  rutaDocumento,
  urlArchivoLegal,
} from './documentos';

describe('documentos legales', () => {
  it('cada documento tiene clave única, archivo y resumen', () => {
    const claves = DOCUMENTOS_LEGALES.map((documento) => documento.clave);
    expect(new Set(claves).size).toBe(claves.length);

    for (const documento of DOCUMENTOS_LEGALES) {
      expect(documento.archivo).toMatch(/^[a-z0-9-]+\.md$/);
      expect(documento.titulo.length).toBeGreaterThan(3);
      expect(documento.resumen.length).toBeGreaterThan(10);
    }
  });

  it('los documentos de aceptación coinciden con la API', () => {
    const exigidos = DOCUMENTOS_LEGALES.filter((documento) => documento.exigidoEnRegistro).map(
      (documento) => documento.aceptacion,
    );

    expect(exigidos.sort()).toEqual(['PRIVACIDAD', 'TERMINOS', 'USO_ACEPTABLE']);
  });

  it('agrupa los nueve documentos sin perder ninguno', () => {
    const agrupados = [
      ...documentosPorGrupo('Contrato'),
      ...documentosPorGrupo('Datos personales'),
      ...documentosPorGrupo('Sitio'),
    ];
    expect(agrupados).toHaveLength(9);
    expect(agrupados).toHaveLength(DOCUMENTOS_LEGALES.length);
  });

  it('construye la ruta interna de cada documento', () => {
    expect(rutaDocumento('terminos')).toBe('/legal/terminos');
  });

  it('resuelve el archivo contra la base de GitHub Pages', () => {
    expect(
      urlArchivoLegal('terminos-y-condiciones.md', 'https://ejemplo.github.io/Inventario-General/'),
    ).toBe('https://ejemplo.github.io/Inventario-General/legal/terminos-y-condiciones.md');
  });

  it('marca la identidad pendiente mientras no existan los datos reales', () => {
    expect(esDatoPendiente('[DATO PENDIENTE: NIT]')).toBe(true);
    expect(esDatoPendiente('900.123.456-7')).toBe(false);
    expect(datosIdentidadPendientes()).toBe(Object.keys(IDENTIDAD_STOCKORA).length);
  });
});
