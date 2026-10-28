import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { resolverOrigenes } from './common/utils/origenes-cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Detras de Render hay un proxy inverso: sin esto req.ip es la IP del proxy,
  // el límite de peticiones se comparte entre TODOS los usuarios y la auditoría
  // guarda una IP incorrecta (hallazgo C).
  const express = app.getHttpAdapter().getInstance() as {
    set: (clave: string, valor: unknown) => void;
  };
  express.set('trust proxy', 1);

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

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = app.get(ConfigService);

  // Los origenes del propio producto van siempre; `CORS_ORIGINS` solo suma.
  const origins = resolverOrigenes(config.get<string>('CORS_ORIGINS'));

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
}
void bootstrap();
