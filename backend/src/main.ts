import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Render/Proxies: confiar en X-Forwarded-For, proto, etc.
  const server = app.getHttpServer();
  if (server && typeof (server as any).set === 'function') {
    (server as any).set('trust proxy', 1);
  }

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = app.get(ConfigService);
  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
}
void bootstrap();
