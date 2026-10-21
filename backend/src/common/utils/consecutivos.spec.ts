import { Prisma } from '@prisma/client';
import {
  conReintentoConsecutivo,
  esConflictoUnico,
  generarConsecutivo,
} from './consecutivos';

function p2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('duplicado', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('consecutivos (hallazgo H)', () => {
  it('genera un consecutivo correlativo cuando no hay colisiones', async () => {
    const c = await generarConsecutivo(
      'OP',
      () => Promise.resolve(4),
      () => Promise.resolve(false),
    );
    expect(c).toBe('OP-000005');
  });

  it('salta los consecutivos ya existentes', async () => {
    const existentes = new Set(['OP-000005', 'OP-000006']);
    const c = await generarConsecutivo(
      'OP',
      () => Promise.resolve(4),
      (x) => Promise.resolve(existentes.has(x)),
    );
    expect(c).toBe('OP-000007');
  });

  it('reintenta la operacion ante un conflicto de unicidad (P2002)', async () => {
    let intentos = 0;
    const resultado = await conReintentoConsecutivo(() => {
      intentos += 1;
      if (intentos < 3) return Promise.reject(p2002());
      return Promise.resolve('ok');
    });
    expect(resultado).toBe('ok');
    expect(intentos).toBe(3);
  });

  it('propaga errores que no son de unicidad', async () => {
    await expect(
      conReintentoConsecutivo(() => Promise.reject(new Error('otro error'))),
    ).rejects.toThrow('otro error');
  });

  it('se rinde tras agotar los intentos', async () => {
    await expect(
      conReintentoConsecutivo(() => Promise.reject(p2002())),
    ).rejects.toThrow();
  });

  it('esConflictoUnico distingue P2002', () => {
    expect(esConflictoUnico(p2002())).toBe(true);
    expect(esConflictoUnico(new Error('x'))).toBe(false);
  });
});
