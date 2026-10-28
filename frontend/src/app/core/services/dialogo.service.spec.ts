import { DialogoService } from './dialogo.service';

describe('DialogoService', () => {
  let servicio: DialogoService;

  beforeEach(() => {
    servicio = new DialogoService();
  });

  it('no tiene ningun dialogo abierto al empezar', () => {
    expect(servicio.dialogo()).toBeNull();
  });

  it('confirmar abre un dialogo con los textos indicados', () => {
    void servicio.confirmar({
      titulo: 'Eliminar producto',
      mensaje: 'La accion no se puede deshacer.',
      textoConfirmar: 'Eliminar',
      peligro: true,
    });

    const d = servicio.dialogo();
    expect(d?.tipo).toBe('confirmar');
    if (d?.tipo === 'confirmar') {
      expect(d.titulo).toBe('Eliminar producto');
      expect(d.mensaje).toBe('La accion no se puede deshacer.');
      expect(d.textoConfirmar).toBe('Eliminar');
      expect(d.textoCancelar).toBe('Cancelar');
      expect(d.peligro).toBe(true);
    }
  });

  it('confirmar resuelve true cuando se acepta', async () => {
    const promesa = servicio.confirmar({ titulo: 'T', mensaje: 'M' });
    servicio.resolver(true);
    await expect(promesa).resolves.toBe(true);
    expect(servicio.dialogo()).toBeNull();
  });

  it('confirmar resuelve false cuando se cancela', async () => {
    const promesa = servicio.confirmar({ titulo: 'T', mensaje: 'M' });
    servicio.resolver(false);
    await expect(promesa).resolves.toBe(false);
    expect(servicio.dialogo()).toBeNull();
  });

  it('preguntar abre un campo de tipo password cuando se pide', () => {
    void servicio.preguntar({
      titulo: 'Nueva contrasena',
      etiqueta: 'Contrasena',
      tipo: 'password',
      minimo: 8,
    });

    const d = servicio.dialogo();
    expect(d?.tipo).toBe('preguntar');
    if (d?.tipo === 'preguntar') {
      expect(d.tipoEntrada).toBe('password');
      expect(d.minimo).toBe(8);
      expect(d.etiqueta).toBe('Contrasena');
    }
  });

  it('preguntar resuelve el valor escrito', async () => {
    const promesa = servicio.preguntar({ titulo: 'T', minimo: 1 });
    servicio.resolver('texto entered');
    await expect(promesa).resolves.toBe('texto entered');
  });

  it('preguntar resuelve null cuando se cancela', async () => {
    const promesa = servicio.preguntar({ titulo: 'T' });
    servicio.resolver(null);
    await expect(promesa).resolves.toBeNull();
  });

  it('preguntar puede pedir repetir el valor', () => {
    void servicio.preguntar({ titulo: 'T', repetir: true, tipo: 'password' });
    const d = servicio.dialogo();
    expect(d?.tipo).toBe('preguntar');
    if (d?.tipo === 'preguntar') {
      expect(d.repetir).toBe(true);
      expect(d.tipoEntrada).toBe('password');
    }
  });

  it('preguntar no pide repetir por defecto', () => {
    void servicio.preguntar({ titulo: 'T' });
    const d = servicio.dialogo();
    if (d?.tipo === 'preguntar') expect(d.repetir).toBe(false);
  });

  it('avisar abre un dialogo sin decision', () => {
    servicio.avisar({ titulo: 'Formula', mensaje: 'linea 1\nlinea 2' });
    const d = servicio.dialogo();
    expect(d?.tipo).toBe('aviso');
    if (d?.tipo === 'aviso') {
      expect(d.mensaje).toBe('linea 1\nlinea 2');
      expect(d.textoCerrar).toBe('Cerrar');
    }
  });

  it('abrir un segundo dialogo cancela el primero sin dejar la promesa sin resolver', async () => {
    const primera = servicio.confirmar({ titulo: 'Primero', mensaje: 'M' });
    const segunda = servicio.confirmar({ titulo: 'Segundo', mensaje: 'M' });
    await expect(primera).resolves.toBe(false);
    expect(servicio.dialogo()?.titulo ?? null).toBe('Segundo');
    servicio.resolver(true);
    await expect(segunda).resolves.toBe(true);
  });

  it('cerrar sin resolver cancela el dialogo', async () => {
    const promesa = servicio.confirmar({ titulo: 'T', mensaje: 'M' });
    servicio.cerrar();
    await expect(promesa).resolves.toBe(false);
    expect(servicio.dialogo()).toBeNull();
  });
});
