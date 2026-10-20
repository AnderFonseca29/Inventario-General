# Imagen del backend NestJS + Prisma para despliegue en la nube.
# Al iniciar aplica las migraciones, ejecuta el seed (idempotente) y arranca la API.
FROM node:24-slim

# Prisma necesita OpenSSL en imagenes basadas en Debian.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
ARG DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || true) && node dist/main"]
