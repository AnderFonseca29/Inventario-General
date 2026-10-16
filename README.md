# Inventario General

SaaS **multempresa** para la gestión de inventario de una empresa de botellones
(agua/envasados): bodegas, cargues, botellones retornables, producción, mermas y
auditoría, con **aislamiento estricto de datos por empresa**.

El proyecto es un **monorepo** con dos aplicaciones:

| Carpeta     | Descripción                         | Stack                                            |
| ----------- | ----------------------------------- | ------------------------------------------------ |
| `backend/`  | API REST (nunca se accede a la BD desde el cliente) | NestJS 11 · PostgreSQL 18 · Prisma 6 · JWT · argon2 |
| `frontend/` | Aplicación web SPA                  | Angular 22 (standalone + signals) · SCSS         |

---

## Estado del proyecto

- **Fase 1–2** — Esquema de base de datos (~40 modelos + 12 enums), migraciones y
  seed (permisos, planes, superadmin).
- **Fase 3** — *Seguridad y acceso*: autenticación JWT (access + refresh con
  rotación), roles y permisos, usuarios, gestión de empresas, suscripciones y
  auditoría. Incluye la UI completa (login, layout con menú por permisos,
  dashboard y pantallas de administración).
- **Fases siguientes** — Catálogos, inventario, cargues, botellones, producción,
  mermas y reportes (alto nivel en el roadmap del sistema).

---

## Características

- Autenticación con **JWT** (access + refresh con rotación y revocación), contraseñas con **argon2**.
- **Aislamiento por empresa**: el `empresaId` siempre proviene del token; el superadmin no
  accede a los endpoints operativos de las empresas.
- **RBAC**: 32 permisos agrupados por módulo, roles de sistema y roles personalizados.
- Guards globales encadenados (Throttler → JWT → Permisos → SuperAdmin), Helmet, CORS y validación de DTOs.
- **Auditoría** e historial de cambios.
- UI con permisos que ocultan/niegan acciones según el rol del usuario.

---

## Requisitos

- **Node.js** 22 o 24
- **PostgreSQL** 18
- npm 11+

---

## Puesta en marcha (entorno local)

### 1. Backend

```bash
cd backend
npm install

# Configura las variables de entorno
cp .env.example .env      # en Windows: copy .env.example .env
# Edita .env y define DATABASE_URL, JWT_SECRET y JWT_REFRESH_SECRET

npx prisma generate       # genera el cliente Prisma
npx prisma migrate deploy # aplica las migraciones
npm run prisma:seed       # datos iniciales (permisos, planes, superadmin)

npm run start:dev         # http://localhost:3001/api
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                 # http://localhost:4200
```

La URL de la API se configura en `frontend/src/environments/environment.ts`.

> **Credenciales de desarrollo** (creadas por el seed del backend): revisa el
> `subject`/`email` del superadmin en `backend/prisma/seed.ts`. Cámbialas siempre
> antes de desplegar.

---

## Variables de entorno (backend)

Definidas en `backend/.env` (no se versiona — ver `backend/.env.example`):

| Variable                | Descripción                                          |
| ----------------------- | ---------------------------------------------------- |
| `DATABASE_URL`          | Cadena de conexión a PostgreSQL                      |
| `JWT_SECRET`            | Secreto del token de acceso                          |
| `JWT_REFRESH_SECRET`    | Secreto del token de refresco                        |
| `JWT_EXPIRES_IN`        | Vigencia del access token (p. ej. `15m`)             |
| `JWT_REFRESH_EXPIRES_IN`| Vigencia del refresh token (p. ej. `7d`)             |
| `PORT`                  | Puerto del backend (por defecto `3001`)              |
| `CORS_ORIGINS`          | Orígenes permitidos, separados por coma              |

---

## Scripts útiles

### Backend (`backend/`)

| Script                  | Acción                                        |
| ----------------------- | --------------------------------------------- |
| `npm run start:dev`     | Servidor en modo desarrollo (watch)           |
| `npm run build`         | Compila a `dist/`                             |
| `npm run start:prod`    | Ejecuta la build de producción                |
| `npm run lint`          | ESLint                                        |
| `npm test`              | Tests unitarios (Jest)                        |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:deploy` / `prisma:seed` | Prisma |

### Frontend (`frontend/`)

| Script          | Acción                                        |
| --------------- | --------------------------------------------- |
| `npm start`     | Dev server en `http://localhost:4200`         |
| `npm run build` | Build de producción en `dist/frontend`        |
| `npm test`      | Tests (Vitest)                                |

---

## Estructura

```
Inventario-General/
├── backend/
│   ├── prisma/            # schema, migraciones y seed
│   └── src/
│       ├── auth/          # login, refresh, logout, JWT strategy
│       ├── empresas/      # CRUD de empresas (superadmin)
│       ├── usuarios/      # usuarios por empresa
│       ├── roles/         # roles y permisos
│       ├── permisos/      # catálogo de permisos
│       ├── suscripciones/ # planes y suscripciones
│       ├── auditoria/     # trazabilidad
│       └── common/        # guards, decoradores, guards globales, utilidades
└── frontend/
    └── src/
        ├── app/
        │   ├── core/      # modelos, servicios, guards, interceptores
        │   ├── features/  # login, dashboard, usuarios, roles, empresas
        │   ├── layout/    # shell (sidebar + topbar)
        │   └── shared/    # iconos, toasts, componentes reutilizables
        └── styles/        # sistema de diseño (parciales SCSS)
```

---

## Despliegue

El backend y el frontend se despliegan por separado.

### Backend + base de datos

Aloja PostgreSQL en un proveedor gestionado (Render, Railway, Neon, Supabase…) y
el backend NestJS en un servicio Node (Render, Railway, Fly.io…). Configura las
variables de entorno del apartado anterior y aplica migraciones con
`npx prisma migrate deploy` durante el build/release. Ajusta `CORS_ORIGINS` con
la URL pública del frontend.

### Frontend

Genera la build estática y publícala en cualquier hosting (GitHub Pages, Vercel,
Netlify, Cloudflare Pages…):

```bash
cd frontend
npm run build           # salida en dist/frontend/browser
```

Antes de compilar, apunta `frontend/src/environments/environment.ts` a la URL
pública del backend.

---

## CI

Cada push a `main` y cada Pull Request ejecutan **GitHub Actions**
(`.github/workflows/ci.yml`): instalación, `prisma generate`, lint, build y tests
del backend y del frontend.

---

## Licencia

Uso privado. Todos los derechos reservados.
