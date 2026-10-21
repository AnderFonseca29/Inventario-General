# Multi-stage Dockerfile para backend NestJS + Prisma (hallazgo O)
# Objetivo: imagen mas ligera, sin devDependencies, con solo lo necesario para runtime

# --- Etapa 1: Dependencias ---
FROM node:24-slim AS deps
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# --- Etapa 2: Build ---
FROM node:24-slim AS build
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ARG DATABASE_URL="postgresql://user:password@localhost:5432/db"
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate && npm run build

# --- Etapa 3: Runtime ---
FROM node:24-slim AS runtime
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
# Solo dependencias de produccion
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || true) && node dist/main"]
