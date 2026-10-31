import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistroDto } from './registro.dto';

const valido = {
  razonSocial: 'Distribuidora El Roble S.A.S.',
  nombre: 'El Roble',
  nit: '901.234.567-8',
  direccion: 'Calle 93 No. 15-20',
  ciudad: 'Bogotá D.C.',
  departamento: 'Cundinamarca',
  representante: 'María Fernanda Gómez',
  correoDatos: 'privacidad@elroble.com',
  nombreAdmin: 'Ana Pérez',
  email: 'ana@empresa.com',
  password: 'Roble*2026',
  aceptaTerminos: true,
};

async function errores(datos: Record<string, unknown>) {
  const dto = plainToInstance(RegistroDto, datos);
  const lista = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return lista.flatMap((e) => Object.keys(e.constraints ?? {}));
}

describe('RegistroDto', () => {
  it('acepta un registro completo', async () => {
    expect(await errores(valido)).toEqual([]);
  });

  it('exige los datos de la empresa y del administrador', async () => {
    const faltantes = await errores({ aceptaTerminos: true });
    expect(faltantes).toEqual(expect.arrayContaining(['isString', 'minLength', 'isEmail']));

    const sinAceptar = await errores({ ...valido, aceptaTerminos: undefined });
    expect(sinAceptar).toContain('isBoolean');
  });

  it('rechaza contraseñas débiles aunque tengan 8 caracteres', async () => {
    expect(await errores({ ...valido, password: 'password1' })).toContain('contrasenaSegura');
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    expect(await errores({ ...valido, password: 'Ab1*' })).toEqual(
      expect.arrayContaining(['minLength', 'contrasenaSegura']),
    );
  });

  it('exige aceptar los documentos legales', async () => {
    expect(await errores({ ...valido, aceptaTerminos: false })).toContain('equals');
  });

  it('valida el formato del NIT y del sitio web', async () => {
    expect(await errores({ ...valido, nit: 'abc' })).toContain('matches');
    expect(await errores({ ...valido, sitioWeb: 'elroble.com' })).toContain('isUrl');
  });

  it('rechaza campos que el cliente no debe enviar', async () => {
    expect(await errores({ ...valido, esPropietario: true })).toContain('whitelistValidation');
  });

  it('permite NIT, matrícula, teléfono y sitio web vacíos', async () => {
    expect(await errores({ ...valido, nit: undefined, sitioWeb: undefined })).toEqual([]);
  });
});
