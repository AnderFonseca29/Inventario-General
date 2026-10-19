export interface AppEnv {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGINS: string;
}

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const isProd = config.NODE_ENV === 'production';
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. Revisa .env.example`,
    );
  }

  if (isProd) {
    const weak = required.filter(
      (key) => typeof config[key] === 'string' && config[key].length < 32,
    );
    if (weak.length > 0) {
      throw new Error(
        `En produccion estas variables deben tener al menos 32 caracteres: ${weak.join(', ')}`,
      );
    }
  }

  return {
    NODE_ENV: (config.NODE_ENV as string) ?? 'development',
    PORT: Number(config.PORT ?? 3001),
    DATABASE_URL: config.DATABASE_URL as string,
    JWT_SECRET: config.JWT_SECRET as string,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET as string,
    JWT_EXPIRES_IN: (config.JWT_EXPIRES_IN as string) ?? '15m',
    JWT_REFRESH_EXPIRES_IN: (config.JWT_REFRESH_EXPIRES_IN as string) ?? '7d',
    CORS_ORIGINS:
      (config.CORS_ORIGINS as string) ??
      'http://localhost:4200,https://anderfonseca29.github.io',
  };
}
