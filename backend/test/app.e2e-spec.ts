/**
 * Pruebas e2e de arranque de la aplicacion (hallazgo AB).
 *
 * Comprueba que la API arranca con los guards globales, que el prefijo /api
 * se aplica, que los health checks responden y que los endpoints protegidos
 * rechazan peticiones sin token.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Aplicacion (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('responde 200 en /api/health sin token (liveness)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: unknown; uptimeSegundos?: unknown };
        expect(body.status).toBe('ok');
        expect(typeof body.uptimeSegundos).toBe('number');
      });
  });

  it('responde 200 en /api/health/ready si la base de datos esta disponible', () => {
    return request(app.getHttpServer())
      .get('/api/health/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: unknown; baseDatos?: unknown };
        expect(body.status).toBe('ok');
        expect(body.baseDatos).toBe('ok');
      });
  });

  it('devuelve el identificador de correlacion en las cabeceras', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('X-Correlation-Id', /.+/)
      .then((res) => {
        expect(res.headers['x-correlation-id']).toBeTruthy();
      });
  });

  it('rechaza con 401 los endpoints protegidos sin token', () => {
    return request(app.getHttpServer()).get('/api/catalogos/categorias').expect(401);
  });

  it('expone la cabecera X-Correlation-Id tambien en errores', () => {
    return request(app.getHttpServer())
      .get('/api/catalogos/categorias')
      .expect(401)
      .expect('X-Correlation-Id', /.+/);
  });
});
