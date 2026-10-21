# Informe de auditoría — Inventario General / Stockora
Fecha: 2026-10-21
Alcance: repositorio completo, backend NestJS 11, frontend Angular 22, Prisma/PostgreSQL, despliegues Render/Vercel/GitHub Pages
Estado: Fase 1–3 ejecutadas con pruebas vivas. P0 aplicados y mergeados.

## 1) Resumen ejecutivo (≤10 líneas)
- **Arquitectura**: monorepo multiempresa con aislamiento por empresaId. Backend NestJS + Prisma, frontend Angular standalone + signals.
- **Riesgo global**: **Alto**. Se corrigieron P0 críticos (A,K,B,C,D,E). Quedan P1–P3 por aplicar.
- **Críticos encontrados/corregidos**: K (superadmin sin tenant → 500), B (CORS Vercel), A (inventario read-modify-write), E (escalada), C/D (proxy/throttling).
- **Funcional**: auth, RBAC, módulos, inventario, producción, membresía, reportes, auditoría operativos.
- **Pendiente inmediato**: aplicar CORS_ORIGINS en panel Render; completar P1–P3 y documentación AC.

## 2) Mapa rápido
- **Endpoints**: 109 endpoints, prefijo /api. Guards globales: Throttler → JwtAuth → Permisos → SuperAdmin.
- **Controladores**: 15. Módulos con implementado:true: catalogo, inventario, produccion, membresia, reportes, auditorias.
- **Frontend**: /, /login, /registro, /app/* con guards por permiso.

## 3) Hallazgos A–AC

| ID | Severidad | Capa | Hallazgo | Evidencia (archivo:línea o prueba) | Impacto | Reproducción | Corrección propuesta | Esfuerzo | Estado |
|---|---|---|---|---|---|---|---|---|---|
| A | Alta | Backend/Inventario | Read-modify-write no atómico en justarExistencia/confirmarDocumento/anularDocumento | ackend/src/inventario/inventario.service.ts:198-218,356-426,427-487 + prueba concurrente 6 docs → corregido con updateMany+increment | Pérdida de actualización/stock incorrecto | 2+ documentos confirmados simultáneos mismo producto/bodega | updateMany con condición + increment + manejo P2002; pruebas e2e concurrencia | M | **CORREGIDO** (fix/inventario, mergeado) |
| B | Alta | Infra/CORS | CORS no incluye dominio real Vercel inventario-general-delta.vercel.app | Preflight OPTIONS sin ACAO desde delta; github.io sí. ender.yaml:29 corregido | Frontend Vercel no puede llamar API | OPTIONS /api/auth/login con Origin delta → ACAO vacío | Añadir dominio a CORS_ORIGINS; aplicar en panel Render | S | **CORREGIDO** (código). **PENDIENTE** aplicar en Render |
| C | Media | Infra/Proxy | Sin 	rust proxy detrás de Render | ackend/src/main.ts (añadido) | IP errónea en logs/auditoría/throttling | Detrás de proxy, eq.ip incorrecto | pp.set('trust proxy',1) o servidor HTTP | S | **CORREGIDO** |
| D | Media | Backend/Auth | Throttling genérico; login/refresh sin límite específico | ackend/src/auth/auth.controller.ts (añadido @Throttle) | Brute force limitado pero sin ajuste por auth | Múltiples POST /auth/login | Throttling por ruta (10/min login) + considerar bloqueo progresivo | S | **CORREGIDO** |
| E | Alta | Backend/RBAC | Escalada intra-empresa: roles/usuarios con permisos superiores; reset password sin control | oles.service.ts, usuarios.service.ts, pruebas vivas → 403 | Toma de control cuentas del mismo tenant | Usuario con roles.administrar crea rol con permisos no poseídos / resetea admin | Validar permisos del actor vs objetivo/roles | M | **CORREGIDO** |
| F | Baja | Backend/Config | Configuración env dispersa | ackend/src/config/env.validation.ts | Config frágil | — | Centralizar validación (ya existe) | S | OK |
| G | Media | Frontend/Auth | Tokens en localStorage | rontend/src/app/core/services/auth.service.ts | XSS puede robar tokens | — | HttpOnly cookies (cambio grande) o hardening CSP | L | **ACEPTADO/HARDENING** |
| H | Media | Backend/Auth | Consecutivos count+1, refresh reuse/purga | inventario.service.ts (consecutivo), uth.service.ts (refresh rotation), purga añadida | Colisiones, reutilización token | — | Usar secuencia/transacción o UUID; detectar reuse; purgar expirados | M | **MEJORADO** (merge remoto) |
| I | Media | Deps | npm audit (backend/frontend) | package.json | Dependencias vulnerables | 
pm audit | Actualizar/mitigar | M | **PENDIENTE** revisión |
| J | Baja | CI/Deploy | deploy-pages.yml activo | .github/workflows/deploy-pages.yml | Despliegue dual | — | Documentar o limpiar | S | OK |
| K | Alta | Backend/Tenant | Superadmin sin tenant → 500 en endpoints operativos | EmpresaContextoGuard, pruebas vivas 400/200 | Errores 500, info leakage | SA GET /catalogos/categorias sin empresaId | Guard de contexto + validación | M | **CORREGIDO** |
| L | Media | Backend/Errores | Sin filtro global de excepciones unificado | Añadido en merge remoto | Respuestas inconsistentes | Errores 500 genéricos | HttpExceptionFilter + mapeo Prisma/P2002 | M | **MEJORADO** |
| M | Media | Backend/Health | Sin /api/health/ready | Añadido en merge remoto | Healthchecks Render/monitoreo | — | Endpoints health/ready | S | **AÑADIDO** |
| N | Media | Observabilidad | Logs/auditoría insuficiente | Parcial | Difícil diagnóstico | — | Estructurar logs, correlación | M | **PENDIENTE** |
| O | Baja | Infra/Docker | Dockerfile single-stage/devDeps | ackend/Dockerfile | Imagen mayor | — | Multi-stage optimizado | M | **PENDIENTE** |
| P | Media | Infra/Render | healthCheckPath ausente, respaldo BD | ender.yaml | Deploys menos fiables | — | Añadir healthCheckPath /api/health | S | **PENDIENTE** |
| Q | Media | Backend/Perf | Paginación parcial (take fijo) | Varios servicios | Listados grandes | — | Paginación consistente + totales | M | **PENDIENTE** |
| R | Media | Backend/Guard/Perf | Guard encadenado OK; sin caché de permisos | Global guards | Queries por request | — | Cache corto o mantener (revocación actual OK) | M | **REVISAR** |
| S | Media | Datos/Numéricos | Decimal usado; revisar parseFloat/Number | 32 usos detectados | Errores redondeo | — | Estandarizar Decimal/transform | M | **PENDIENTE** |
| T | Media | Fechas/Zonas | Sin normalización explícita | Revisar | Errores timezone | — | UTC + formateo es-CO consistente | M | **PENDIENTE** |
| U | Media | Frontend/Errores | Manejo global 0/429/5xx limitado | Interceptor auth | UX degradada | 429/500 | Interceptor errores + toasts | M | **PENDIENTE** |
| V | Media | Frontend/Auth | Refresh con timeout/variable módulo | uth.interceptor.ts | Edge cases refresh | Expira token | Revisar flujo refresh | M | **PENDIENTE** |
| W | Media | Frontend/Móvil | PWA ausente; mejoras UX móvil | Parcial corregido | Sin instalable | — | Manifest/service worker opcional | L | **PENDIENTE** |
| X | Media | Accesibilidad | Falta aria/labels | Corregido parcialmente | WCAG gaps | — | Seguir revisando formularios/tablas | M | **MEJORADO** |
| Y | Baja | i18n/Formato | es-CO/COP OK parcial | Revisar | Consistencia | — | Unificar formateadores | S | **PENDIENTE** |
| Z | Media | Frontend/Tamaño | Componentes grandes | produccion/membresia/catalogos grandes | Mantenibilidad | — | Split components | L | **PENDIENTE** |
| AA | Alta | Tests | Cobertura casi nula | Añadidos tests backend (unit/e2e concurrencia) en merge | Regresiones | — | Aumentar cobertura crítico | L | **INICIADO** |
| AB | Alta | CI | Sin PostgreSQL/e2e/audit | .github/workflows/ci.yml | CI débil | — | Servicio postgres, e2e, audit, gitleaks opcional | M | **PENDIENTE** |
| AC | Media | Docs | README/.env.example/SECURITY/runbook | Desactualizado parcialmente | Onboarding | — | Actualizar todo | M | **PENDIENTE** |

## 4) Lo que está bien hecho
- RBAC con guards encadenados + recarga permisos por request
- Refresh con rotación + hash SHA-256
- rgon2, helmet, ValidationPipe whitelist/forbidNonWhitelisted
- Uso de Decimal en montos/cantidades
- Auditoría con IP/usuario/acción
- Aislamiento por empresa en la mayoría de consultas
- Landing profesional + rutas reestructuradas
