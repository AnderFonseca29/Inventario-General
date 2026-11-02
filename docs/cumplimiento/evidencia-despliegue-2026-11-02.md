# Evidencia de despliegue de seguridad — 2 de noviembre de 2026

> **Evidencia técnica, no certificación legal.**
> Repositorio: `AnderFonseca29/Inventario-General`
> Commit base verificado: `2204c2affae021452bac0451a244e4360c52d2ae` (seguridad, cookies y CSRF)
> Commit del proxy same-origin: `1954ddc61e86b329f898c224903fe6f4792c0100`
> Fecha de la verificación: 2 de noviembre de 2026 (UTC)
> Alcance: cookies httpOnly, CSRF, CORS, proxy `/api`, rutas públicas y pruebas de humo no destructivas en producción.

## 1. Versiones desplegadas

| Componente | Referencia / URL | Evidencia |
|---|---|---|
| API directa | `https://inventario-backend-gsd7.onrender.com/api` | Responde con el comportamiento de CSRF, cookies y CORS. No se pudo leer el SHA exacto de Render porque no hay `render` CLI ni token de API. |
| API vía Vercel | `https://inventario-general-delta.vercel.app/api` | Rewrite same-origin al backend; responde `403`, `200` y `401` en las pruebas de §2. |
| Frontend Vercel | `https://inventario-general-delta.vercel.app/` | `GET /` y rutas públicas responden `200`; asset `main-AO4DVPTW.js`; el bundle no contiene la URL de Render y usa `apiUrl: '/api'`. |
| Frontend GitHub Pages | `https://anderfonseca29.github.io/Inventario-General/` | Renderiza las rutas públicas; asset `main-ZBSLMV5F.js`; el bundle conserva la URL directa de Render. Las rutas profundas devuelven `404` por la limitación de SPA de Pages (ver §5). |
| Integración continua | Run `41493492660` | `1954ddc`; trabajos Codificación, Backend, Frontend y Seguridad en `success`. |
| Deploy Pages | Run `41493492599` | `1954ddc`; `success`; build con `--configuration pages`. |
| CI de la fase de seguridad | Run `41278439071` | `2204c2a`; `success`. |

El proxy de Vercel conserva el destino de Render en la respuesta (`X-Render-Origin-Server: Render`) y no cae en el fallback SPA. El backend sigue ejecutando el código de seguridad: `POST /api/auth/logout` sin CSRF devuelve `403`, y con la cabecera devuelve `200`.

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
- No se usaron datos reales, NIT, correos ni identidades de terceros.

## 5. Limitaciones y riesgos abiertos

1. **Sin login exitoso en producción:** no se pudo verificar el establecimiento real de cookies, la rotación de refresh, el cierre de sesión con sesión activa, permisos ni refresco simultáneo en dos pestañas.
2. **Pages sigue siendo cross-origin:** el proxy `/api` solo existe en Vercel. El frontend de Pages llama directamente a Render y puede sufrir bloqueo de cookies de terceros en Safari, Firefox o modos de privacidad. Vercel ya es same-origin, pero falta probarlo con una sesión real y en esos navegadores.
3. **IP detrás del proxy:** `backend/src/main.ts` usa `express.set('trust proxy', 1)`. Vercel añade un salto de proxy; no se verificó si `req.ip` sigue siendo la IP del cliente o pasa a ser la del edge de Vercel. Esto puede afectar el límite de peticiones y la auditoría. No se cambió `trust proxy` sin evidencia.
4. **GitHub Pages y rutas profundas:** el fallback `404.html` renderiza la aplicación, pero el HTTP sigue siendo `404` (y `/legal` responde `301`). Vercel responde `200` por sus rewrites. Para enlaces públicos definitivos conviene usar Vercel o un dominio propio; no se cambió el routing.
5. **Sin CLI de despliegue:** no hay `render`, `vercel` ni `gh` instalados ni tokens; no se pudieron leer logs, SHA de Render ni ejecutar rollback desde la terminal.
6. **Legal pendiente:** los documentos siguen en `0.2-borrador` / 30 de octubre de 2026 y faltan identidad, NIT, correos y revisión por abogado.

## 6. Conclusión

El proxy same-origin `/api` de Vercel está desplegado y responde para CSRF, cookies de borrado, refresh sin sesión y login inválido; las rutas públicas siguen funcionando en Vercel y Pages. La evidencia permite cerrar la verificación técnica del proxy y del despliegue, pero **no** el login exitoso, la compatibilidad Safari/Firefox, el comportamiento de Pages como frontend cross-origin, la IP real detrás de Vercel ni el cierre legal.
