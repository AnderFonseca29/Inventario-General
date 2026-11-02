# Evidencia de despliegue de seguridad — 2 de noviembre de 2026

> **Evidencia técnica, no certificación legal.**
> Repositorio: `AnderFonseca29/Inventario-General`
> `main`: `2204c2affae021452bac0451a244e4360c52d2ae`
> Fecha de la verificación: 2 de noviembre de 2026 (UTC)
> Alcance: cookies httpOnly, CSRF, CORS, rutas públicas y pruebas de humo no destructivas en producción.

## 1. Versiones desplegadas

| Componente | Referencia / URL | Evidencia |
|---|---|---|
| API | `https://inventario-backend-gsd7.onrender.com/api` | Responde con el comportamiento nuevo de CSRF, cookies y CORS. No se pudo leer el SHA exacto de Render porque no hay `render` CLI ni token de API. |
| Frontend Vercel | `https://inventario-general-delta.vercel.app/` | `GET /` y rutas públicas responden `200`; asset `main-4VDUAB6U.js`. |
| Frontend GitHub Pages | `https://anderfonseca29.github.io/Inventario-General/` | Renderiza las rutas públicas; asset `main-4VDUAB6U.js`. Las rutas profundas devuelven `404` por la limitación de SPA de Pages (ver §5). |
| Integración continua | Run `41278439071` | `2204c2a`; trabajos Codificación, Backend, Frontend y Seguridad en `success`. |
| Deploy Pages | Run `41278147504` | `8fee8fd`; `success`. Entre `8fee8fd` y `2204c2a` solo cambió `.github/workflows/ci.yml`, no el frontend. |

El mismo asset principal (`main-4VDUAB6U.js`) se sirve en Vercel y Pages. El backend de producción ejecuta el código de seguridad: `POST /api/auth/logout` sin CSRF devuelve `403`, y con la cabecera devuelve `200`.

## 2. Pruebas de humo del backend

Todas las pruebas usaron orígenes autorizados, credenciales ficticias o cuerpos vacíos. No se crearon empresas ni cuentas.

| Prueba | Resultado |
|---|---|
| `POST /api/auth/logout` sin `X-Requested-With` | `403 Forbidden` |
| `POST /api/auth/logout` con `X-Requested-With: XMLHttpRequest` | `200 OK`; borra ambas cookies |
| `POST /api/auth/refresh` sin cookie de refresco | `401 Unauthorized`; borra ambas cookies |
| `POST /api/auth/registro` con `{}` y CSRF | `400 Bad Request`; errores de validación, sin alta |
| `POST /api/auth/registro` con `{}` sin CSRF | `403 Forbidden` |
| Preflight desde `https://anderfonseca29.github.io` | `204`; `Access-Control-Allow-Origin` exacto, credenciales y cabeceras `content-type,x-requested-with` |
| Preflight desde `https://inventario-general-delta.vercel.app` | `204`; `Access-Control-Allow-Origin` exacto, credenciales y cabeceras `content-type,x-requested-with` |
| Preflight desde `https://evil.example` | `204` sin `Access-Control-Allow-Origin`; el navegador no puede leer la respuesta |

Cabeceras de borrado observadas:

```http
Set-Cookie: inv_access_token=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None
Set-Cookie: inv_refresh_token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None
```

Los atributos `HttpOnly`, `Secure`, `SameSite=None` y los paths `/api` y `/api/auth` coinciden con el código desplegado.

## 3. Pruebas de humo del frontend

### Rutas renderizadas

| Ruta | Vercel | GitHub Pages |
|---|---|---|
| `/login` | `200`; formulario y enlace de registro | Renderiza; HTTP `404` de Pages |
| `/registro` | `200`; formulario completo y enlaces legales | Renderiza; HTTP `404` de Pages |
| `/legal` | `200`; centro legal | Renderiza; HTTP `301` y luego fallback |
| `/legal/cookies` | `200`; documento y versión `0.2-borrador` | Renderiza; HTTP `404` de Pages |

En las cuatro rutas de Vercel y en las rutas probadas de Pages no aparecieron errores de aplicación en consola. El banner de cookies se rechazó en Vercel y desapareció; las rutas legales quedaron accesibles.

### Login inválido en navegador

Se enviaron credenciales ficticias desde Vercel y desde GitHub Pages:

- Respuesta `401 Unauthorized` con `{"message":"Correo o contraseña incorrectos"}`.
- La interfaz mostró el mismo mensaje.
- La petición llevaba `Content-Type: application/json` y `X-Requested-With: XMLHttpRequest`.
- La consola solo registró el `401` esperado; no hubo error de aplicación.
- La captura del navegador no expone `Origin`, `Access-Control-Allow-Origin` ni `Set-Cookie` en los encabezados de red; esas comprobaciones se hicieron con `curl` (§2).

No se probó un login exitoso: no hay una cuenta de prueba autorizada en producción.

## 4. Datos de prueba y limpieza

- Correo ficticio usado: `prueba-despliegue@example.invalid`.
- Los intentos fallidos pueden dejar filas en `intentos_login`; la retención prevista es de 30 días.
- Las peticiones de registro usaron `{}` y fueron rechazadas por validación; no se creó ninguna empresa ni usuario.
- No se usaron datos reales, NIT, correos ni identidades de terceros.

## 5. Limitaciones y riesgos abiertos

1. **Sin login exitoso en producción:** no se pudo verificar el establecimiento real de cookies, la rotación de refresh, el cierre de sesión con sesión activa, permisos ni refresco simultáneo en dos pestañas.
2. **Cookies de terceros:** frontend y API están en dominios distintos. Safari, Firefox y modos de privacidad pueden bloquear cookies `SameSite=None`; hace falta un dominio same-origin o un proxy `/api`.
3. **GitHub Pages y rutas profundas:** el fallback `404.html` renderiza la aplicación, pero el HTTP sigue siendo `404` (y `/legal` responde `301`). Vercel responde `200` por sus rewrites. Para enlaces públicos definitivos conviene usar Vercel o un dominio propio; no se cambió el routing.
4. **Sin CLI de despliegue:** no hay `render`, `vercel` ni `gh` instalados ni tokens; no se pudieron leer logs, SHA de Render ni ejecutar rollback desde la terminal.
5. **Legal pendiente:** los documentos siguen en `0.2-borrador` / 30 de octubre de 2026 y faltan identidad, NIT, correos y revisión por abogado.
6. **Captura de red del navegador:** el visor no mostró `Origin`, `Access-Control-Allow-Origin` ni `Set-Cookie`; no se interpreta como ausencia de esos encabezados. Las comprobaciones equivalentes con `curl` están en §2.

## 6. Conclusión

El despliegue de la fase de cookies httpOnly, CSRF y CORS responde y las rutas públicas nuevas renderizan en Vercel y Pages. La evidencia permite cerrar la verificación técnica del despliegue, pero **no** el login exitoso, la compatibilidad Safari/Firefox, el dominio same-origin ni el cierre legal.
