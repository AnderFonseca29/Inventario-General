# Evidencia de despliegue de seguridad — 2 a 4 de noviembre de 2026

> **Evidencia técnica, no certificación legal.**
> Repositorio: `AnderFonseca29/Inventario-General`
> Commit base verificado: `2204c2affae021452bac0451a244e4360c52d2ae` (seguridad, cookies y CSRF)
> Commit del proxy same-origin: `1954ddc61e86b329f898c224903fe6f4792c0100`
> Commit funcional del fix de refresco concurrente: `594e55a336bfffc7379dc119ec10bdf35e46b47d`
> Commit de corrección de lint de la prueba: `d3c9fd4c9b9dba468436724b23c05a47b2cbe1d5`
> Fecha de la verificación: 2, 3 y 4 de noviembre de 2026 (UTC)
> Alcance: cookies httpOnly, CSRF, CORS, proxy `/api`, rutas públicas, pruebas de humo no destructivas en producción y E2E local con base desechable.

## 1. Versiones desplegadas

| Componente | Referencia / URL | Evidencia |
|---|---|---|
| API directa | `https://inventario-backend-gsd7.onrender.com/api` | Responde con el comportamiento de CSRF, cookies y CORS. La API no expone un endpoint de versión; el SHA y el estado del deploy se confirmaron con la API de Deployments de GitHub. |
| API vía Vercel | `https://inventario-general-delta.vercel.app/api` | Rewrite same-origin al backend; responde `403`, `200` y `401` en las pruebas de §2. |
| Frontend Vercel | `https://inventario-general-delta.vercel.app/` | `GET /` y rutas públicas responden `200`; asset `main-AO4DVPTW.js`; el bundle no contiene la URL de Render y usa `apiUrl: '/api'`. |
| Frontend GitHub Pages | `https://anderfonseca29.github.io/Inventario-General/` | Renderiza las rutas públicas; asset `main-ZBSLMV5F.js`; el bundle conserva la URL directa de Render. Las rutas profundas devuelven `404` por la limitación de SPA de Pages (ver §6). |
| Fix de refresco concurrente | Deploy Render `7500503092`; Vercel `Ef6sefygWrvdLwmiRbDmwcwtMLaN` | Render: SHA `594e55a`, estado `success` (2026-11-02T18:50:25Z); Vercel: estado `success` (18:47:54Z). La API no expone un endpoint de versión; el SHA se confirmó con la API de Deployments de GitHub. |
| Corrección de lint de la prueba | Deploy Render `7534292529`; Vercel `Asm3hpNZrpduv8A8akzJJqWmmBcP` | SHA `d3c9fd4`, Render `success` (2026-11-04T00:23:02Z) y Vercel `success` (00:21:56Z); solo cambia la prueba. |
| Integración continua | Run `41493492660` | `1954ddc`; trabajos Codificación, Backend, Frontend y Seguridad en `success`. |
| Deploy Pages | Run `41493492599` | `1954ddc`; `success`; build con `--configuration pages`. |
| CI de la fase de seguridad | Run `41278439071` | `2204c2a`; `success`. |
| CI del fix `594e55a` | Run `41503888737` | `failure`: el trabajo Backend falló en Lint por `no-unsafe-assignment` en `auth.service.refresh.spec.ts`; Build y pruebas quedaron omitidos. Los demás trabajos pasaron. |
| CI de la corrección `d3c9fd4` | Run `41746207100` | `success`; trabajos Codificación, Backend, Frontend y Seguridad en verde. Solo cambia la tipificación del mock de la prueba. |

El proxy de Vercel conserva el destino de Render en la respuesta (`X-Render-Origin-Server: Render`) y no cae en el fallback SPA. El backend sigue ejecutando el código de seguridad: `POST /api/auth/logout` sin CSRF devuelve `403`, y con la cabecera devuelve `200`.

### Verificación posterior al redeploy del fix (4 de noviembre de 2026)

Con el deploy de Render en `success` y el de Vercel en `success`, se repitieron las pruebas de humo no destructivas:

| Prueba | Resultado |
|---|---|
| `GET /api/health/ready` directo y por Vercel | `200`; `{"status":"ok","baseDatos":"ok"}` |
| `POST /api/auth/logout` sin CSRF / con CSRF por Vercel | `403` / `200` |
| `POST /api/auth/refresh` con CSRF y sin cookie por Vercel | `401`; borra ambas cookies |
| `POST /api/auth/refresh` sin CSRF por Vercel | `403` |
| `POST /api/auth/refresh` con CSRF y sin cookie directo a Render | `401`; borra ambas cookies |
| `GET /api/auth/me` sin cookie por Vercel | `401` |
| `POST /api/auth/login` con credenciales ficticias por Vercel | `401`; no crea cuenta |
| Cookies de borrado | `HttpOnly; Secure; SameSite=None`; paths `/api` y `/api/auth`; sin `Domain` |
| `GET /` en Vercel y Pages | `200` |

La verificación final se repitió a las 00:25Z sobre el deploy `d3c9fd4` (`7534292529`, Render `success`; Vercel `success`): health `200` por Vercel, logout `403/200`, refresh sin cookie `401` por Vercel y directo a Render, `/me` `401` y cookies de borrado con los mismos atributos. El resultado fue igual al del deploy funcional `594e55a`.

No se pudo verificar la migración `20261102190000_refresh_token_revocado_en` con una consulta directa a la base de producción: no hay acceso a esa base ni cuenta temporal. El deploy de Render ejecuta `prisma migrate deploy` antes de arrancar; el estado `success` y el health check `200` indican que el arranque terminó, pero la columna no se inspeccionó directamente. Esa comprobación queda pendiente para cuando exista una cuenta temporal borrable.

## 2. Pruebas de humo del backend

Todas las pruebas usaron orígenes autorizados, credenciales ficticias o cuerpos vacíos. No se crearon empresas ni cuentas.

| Prueba | Resultado |
|---|---|
| `POST /api/auth/logout` sin `X-Requested-With` | `403 Forbidden` (directo y por Vercel) |
| `POST /api/auth/logout` con `X-Requested-With: XMLHttpRequest` | `200 OK`; borra ambas cookies |
| `POST /api/auth/refresh` sin cookie de refresco | `401 Unauthorized`; borra ambas cookies |
| `POST /api/auth/login` con credenciales ficticias por Vercel | `401 Unauthorized`; `{"message":"Correo o contraseña incorrectos"}` |
| `POST /api/auth/registro` con `{}` y CSRF | `400 Bad Request`; errores de validación, sin alta |
| `POST /api/auth/registro` con `{}` sin CSRF | `403 Forbidden` |
| Preflight directo desde `https://anderfonseca29.github.io` | `204`; `Access-Control-Allow-Origin` exacto, credenciales y cabeceras `content-type,x-requested-with` |
| Preflight directo desde `https://inventario-general-delta.vercel.app` | `204`; `Access-Control-Allow-Origin` exacto, credenciales y cabeceras `content-type,x-requested-with` |
| Preflight directo desde `https://evil.example` | `204` sin `Access-Control-Allow-Origin`; el navegador no puede leer la respuesta |

El proxy de Vercel devolvió `X-Vercel-Cache: MISS` y `X-Render-Origin-Server: Render`. La respuesta de login inválido incluyó `Access-Control-Allow-Origin: https://inventario-general-delta.vercel.app`, por lo que el backend sigue viendo y validando el origen.

Cabeceras de borrado observadas a través del proxy:

```http
Set-Cookie: inv_access_token=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None
Set-Cookie: inv_refresh_token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None
```

Los atributos `HttpOnly`, `Secure`, `SameSite=None` y los paths `/api` y `/api/auth` coinciden con el código desplegado. El proxy no añade `Domain`, así que el navegador almacenaría las cookies en el origen de Vercel.

## 3. Pruebas de humo del frontend

### Rutas renderizadas

| Ruta | Vercel | GitHub Pages |
|---|---|---|
| `/login` | `200`; formulario, login same-origin | Renderiza; HTTP `404` de Pages |
| `/registro` | `200`; formulario completo y enlaces legales | Renderiza; HTTP `404` de Pages |
| `/legal` | `200`; centro legal | Renderiza; HTTP `301` y luego fallback |
| `/legal/cookies` | `200`; documento y versión `0.2-borrador` | Renderiza; HTTP `404` de Pages |

En las cuatro rutas de Vercel y en las rutas probadas de Pages no aparecieron errores de aplicación no esperados. El banner de cookies se rechazó en Vercel en la primera prueba y desapareció; las rutas legales quedaron accesibles.

### Login inválido en navegador

Se enviaron credenciales ficticias desde Vercel y desde GitHub Pages:

- **Vercel:** la petición fue a `https://inventario-general-delta.vercel.app/api/auth/login`, es decir, same-origin a través del proxy. Respondió `401` y la interfaz mostró “Correo o contraseña incorrectos”.
- **Pages:** la petición fue a `https://inventario-backend-gsd7.onrender.com/api/auth/login`. El preflight respondió `204` con `Access-Control-Allow-Origin: https://anderfonseca29.github.io`; el `POST` respondió `401` con el mismo mensaje.
- Ambas peticiones llevaban `Content-Type: application/json` y `X-Requested-With: XMLHttpRequest`.
- La consola registró el `401` esperado. En Pages también apareció el `404` del documento por la limitación de rutas profundas.
- La captura del navegador no muestra `Set-Cookie` en el login inválido porque no hay sesión; las cabeceras de borrado se verificaron con `curl` (§2).

No se probó un login exitoso: no hay una cuenta de prueba autorizada en producción.

## 4. Datos de prueba y limpieza

- Correo ficticio usado: `prueba-despliegue@example.invalid`.
- Los intentos fallidos pueden dejar filas en `intentos_login`; la retención prevista es de 30 días.
- Las peticiones de registro usaron `{}` y fueron rechazadas por validación; no se creó ninguna empresa ni usuario.
- La verificación posterior al redeploy repitió un login inválido con el mismo correo ficticio; no se creó cuenta.
- No se usaron datos reales, NIT, correos ni identidades de terceros.

## 5. Prueba local de sesión y refresco concurrente

El 2 y 3 de noviembre de 2026 se ejecutó un E2E local con una base PostgreSQL desechable (`inventario_e2e_<marca>`), las 12 migraciones del repositorio y el seed. No se usó la base local del usuario ni la base de producción. La empresa, el usuario y los tokens fueron ficticios; al terminar se ejecutó `DROP DATABASE ... WITH (FORCE)`. El backend se levantó en `localhost:3101` con `NODE_ENV=development`, `COOKIE_SECURE=false`, `EMAIL_ENABLED=false` y `TURNSTILE_ENABLED=false`.

| Prueba | Resultado |
|---|---|
| `POST /api/auth/registro` con datos ficticios | `201`; crea empresa y usuario, fija dos cookies |
| Atributos de cookies en local | `HttpOnly`; paths `/api` y `/api/auth`; `SameSite=Lax`; `Secure=false`; sin `Domain`; `Max-Age` de 899 s y 604799 s |
| `GET /api/auth/me` con cookie de acceso | `200`; devuelve el usuario autenticado |
| `POST /api/auth/refresh` con cookie | `200`; rota el refresh token y deja un acceso utilizable |
| `POST /api/auth/logout` sin CSRF / con CSRF | `403` / `200` |
| Cookies tras logout | `Expires=Thu, 01 Jan 1970 00:00:00 GMT`; el jar queda vacío |
| `GET /api/auth/me` y `POST /api/auth/refresh` tras logout | `401` / `401`; el refresh queda revocado |
| `POST /api/auth/refresh` sin cookie | `401` |
| `POST /api/auth/login` sin CSRF / con credenciales válidas | `403` / `200` |
| Dos pestañas con la misma cookie: dos `POST /api/auth/refresh` concurrentes | `200` / `200`; las cookies resultantes de ambas siguen renovando (`200` / `200`) |
| Reuso secuencial del token anterior dentro de 10 s | `200`; auditoría `auth.refresh_concurrente` |
| Reuso del token anterior después de 11 s | `401`; auditoría `auth.refresh_reuso_detectado`; revoca la sesión rotada (`401`) |

La prueba de dos pestañas se hizo clonando la cookie jar compartida y lanzando dos peticiones concurrentes; no sustituye una prueba con navegador real. Antes del fix, la misma prueba devolvía `A=401, B=200` y la detección de reuso revocaba el token recién emitido. El fix está en `594e55a`: agrega `revocadoEn` a `RefreshToken`, migración `20261102190000_refresh_token_revocado_en` y una ventana de gracia de 10 s limitada por IP y `User-Agent`. Fuera de esa ventana el reuso sigue revocando todas las sesiones.

Verificación automática del mismo cambio:

- `npm run build`: verde.
- `npm test -- --runInBand`: 32 suites / 157 pruebas en verde.
- `npm run test:e2e -- --runInBand` con la base desechable: 3 suites, 11 pruebas (1 suite / 5 pruebas ejecutadas; 2 suites / 6 pruebas omitidas por la configuración existente).
- `npm run lint`: verde después de `d3c9fd4`. El primer run de CI de `594e55a` (`41503888737`) falló solo en Lint porque la prueba nueva asignaba un `expect.any(Date)` a un campo tipado; `d3c9fd4` tipa el mock y no cambia código de producción. El run `41746207100` de `d3c9fd4` terminó en `success`.

## 6. Limitaciones y riesgos abiertos

1. **Sin login exitoso ni dos pestañas en producción:** el E2E local cubrió registro, login, cookies, refresh, logout, CSRF, dos pestañas y la ventana de gracia, pero no sustituye una cuenta productiva. No se creó ninguna cuenta en producción porque no existe un mecanismo verificable para borrar la empresa y sus relaciones.
2. **Pages sigue siendo cross-origin:** el proxy `/api` solo existe en Vercel. El frontend de Pages llama directamente a Render y puede sufrir bloqueo de cookies de terceros en Safari, Firefox o modos de privacidad. Vercel ya es same-origin, pero falta probarlo con una sesión real y en esos navegadores.
3. **IP detrás del proxy:** `backend/src/main.ts` usa `express.set('trust proxy', 1)`. Vercel añade un salto de proxy; no se verificó si `req.ip` sigue siendo la IP del cliente o pasa a ser la del edge de Vercel. Esto puede afectar el límite de peticiones, la auditoría y la ventana de gracia del refresh. No se cambió `trust proxy` sin evidencia.
4. **GitHub Pages y rutas profundas:** el fallback `404.html` renderiza la aplicación, pero el HTTP sigue siendo `404` (y `/legal` responde `301`). Vercel responde `200` por sus rewrites. Para enlaces públicos definitivos conviene usar Vercel o un dominio propio; no se cambió el routing.
5. **Sin CLI de despliegue:** no hay `render`, `vercel` ni `gh` instalados ni tokens. La API pública de Deployments de GitHub permitió confirmar el SHA y el estado de los deploys de Render y Vercel, pero no se pudieron leer logs de aplicación ni ejecutar rollback desde la terminal.
6. **Legal pendiente:** los documentos siguen en `0.2-borrador` / 30 de octubre de 2026 y faltan identidad, NIT, correos y revisión por abogado.
7. **Ventana de gracia de 10 s:** un refresh robado reutilizado dentro de esos 10 s y desde la misma IP/`User-Agent` puede obtener una sesión nueva sin disparar la revocación total. Es el costo de no cerrar las dos pestañas; el reuso fuera de la ventana sí revoca todas las sesiones. Se debe monitorear `auth.refresh_concurrente` y reducir o eliminar la ventana si aparece abuso.
8. **Base local no migrada:** la base `inventario_saas_f5` del equipo sigue con un esquema anterior (le faltan columnas/tablas). La prueba usó una base desechable para no alterar esos datos; para desarrollo local hay que aplicar las migraciones pendientes en una copia o en una base nueva.
9. **Migración de producción no inspeccionada:** el deploy ejecuta `prisma migrate deploy`, pero no se consultó el esquema de producción ni se hizo un refresh con una cuenta válida. La existencia de `revocadoEn` se infiere del arranque exitoso y del health check, no de una consulta directa.

## 7. Conclusión

El proxy same-origin `/api` de Vercel está desplegado y responde para CSRF, cookies de borrado, refresh sin sesión y login inválido; las rutas públicas siguen funcionando en Vercel y Pages. El E2E local con base desechable verificó el ciclo completo de sesión, la rotación, el logout, la limpieza de cookies y el refresh concurrente de dos pestañas; el fix `594e55a` evita que la detección de reuso cierre una sesión legítima. Render desplegó `594e55a` con estado `success` y Vercel quedó en `success`; las pruebas posteriores al redeploy repitieron health, CSRF, cookies de borrado, refresh sin cookie y login inválido. El primer CI de `594e55a` falló solo por una asignación `any` en la prueba nueva, corregida en `d3c9fd4`; el CI `41746207100` de esa corrección y su deploy final quedaron en `success`, y la verificación de las 00:25Z repitió los mismos resultados. La evidencia permite cerrar la verificación técnica del proxy, del despliegue y del flujo local, pero **no** el login exitoso en producción, la inspección directa de la migración, la compatibilidad Safari/Firefox, el comportamiento de Pages como frontend cross-origin, la IP real detrás de Vercel ni el cierre legal.
