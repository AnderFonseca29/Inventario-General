import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CargueDetalleDto } from '../../cargues/dto/cargues.dto';

const PRODUCTO_ID = '11111111-1111-4111-8111-111111111111';

describe('CargueDetalleDto con transformacion decimal (hallazgo S)', () => {
  it('acepta el formato es-CO del frontend', async () => {
    const dto = plainToInstance(
      CargueDetalleDto,
      { productoId: PRODUCTO_ID, cantidad: '12,5', costoUnitario: '1.234,56' },
      { enableImplicitConversion: true },
    );
    expect(dto.cantidad).toBe(12.5);
    expect(dto.costoUnitario).toBe(1234.56);
    const errores = await validate(dto);
    expect(errores).toHaveLength(0);
  });

  it('acepta numeros con decimales', async () => {
    const dto = plainToInstance(
      CargueDetalleDto,
      { productoId: PRODUCTO_ID, cantidad: 3, costoUnitario: 1000.5 },
      { enableImplicitConversion: true },
    );
    expect(dto.cantidad).toBe(3);
    expect(dto.costoUnitario).toBe(1000.5);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza un texto no numerico', async () => {
    const dto = plainToInstance(
      CargueDetalleDto,
      { productoId: PRODUCTO_ID, cantidad: 'mucho' },
      { enableImplicitConversion: true },
    );
    const errores = await validate(dto);
    expect(errores.length).toBeGreaterThan(0);
  });
});
