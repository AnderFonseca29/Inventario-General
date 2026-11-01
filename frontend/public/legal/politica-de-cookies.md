# Política de Cookies y Tecnologías Similares

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Versión: 0.2-borrador · Fecha: 30 de octubre de 2026 · Idioma: español (Colombia)
>
> Control de cambios: 1 de noviembre de 2026 — se alinean los nombres reales de las claves y se documenta el registro del consentimiento en el servidor.

## 1. Qué son

Las cookies son pequeños archivos que se almacenan en el navegador. También usamos almacenamiento local (`localStorage`), píxeles y tecnologías similares para recordar preferencias, medir el uso del sitio y, solo con consentimiento, mostrar publicidad.

## 2. Responsable

- **Razón social:** [DATO PENDIENTE: razón social de la S.A.S.]
- **NIT:** [DATO PENDIENTE: NIT]
- **Correo:** [DATO PENDIENTE: privacidad@dominio]

## 3. Categorías

| Categoría | Finalidad | ¿Requiere consentimiento? |
|---|---|---|
| Necesarias | Sesión, seguridad, preferencias de interfaz, idioma | No (son imprescindibles) |
| Preferencias | Recordar opciones del usuario (por ejemplo, menú contraído) | No, si son estrictamente funcionales |
| Analíticas | Medir visitas y comportamiento agregado (GA4) | Sí |
| Publicitarias | Medir campañas y remarketing (Meta Pixel) | Sí |

## 4. Cookies y almacenamiento previstos

| Nombre | Proveedor | Categoría | Finalidad | Duración |
|---|---|---|---|---|
| `inv_access_token` | Stockora | Necesaria | Cookie httpOnly con el token de acceso; autentica las peticiones a la API. No es legible por JavaScript. | 15 minutos o hasta expirar |
| `inv_refresh_token` | Stockora | Necesaria | Cookie httpOnly limitada a `/api/auth`; renueva la sesión sin exponer el token al navegador. | 7 días, hasta cerrar sesión o expirar |
| `inv_user` | Stockora | Necesaria | Almacenamiento local (no cookie) con el espejo del usuario para la interfaz. El servidor vuelve a validar permisos y rol en cada petición. | Hasta cerrar sesión |
| `inv_sidebar_collapsed` | Stockora | Preferencia | Recordar estado del menú | Persistente |
| `inv_cookie_consent_v1` | Stockora | Necesaria | Guardar la decisión y su fecha | 12 meses |
| `inv_cookie_id` | Stockora | Necesaria | Identificador anónimo para el registro de consentimiento | 12 meses |
| `_ga`, `_ga_*` | Google | Analítica | Medir visitas (GA4) | [VERIFICAR: duración vigente] |
| `_fbp` | Meta | Publicitaria | Medir campañas | [VERIFICAR: duración vigente] |

Los nombres y duraciones pueden cambiar cuando cambian los proveedores. La tabla se actualizará con la versión del documento. Mientras GA4 y Meta Pixel no estén habilitados, el sitio no carga sus etiquetas.

Las cookies de sesión son `httpOnly` y, en producción, se marcan `Secure` y `SameSite=None` cuando el panel y la API están en dominios distintos. Algunos navegadores bloquean las cookies de terceros; si eso ocurre, el inicio de sesión no se conserva. La solución definitiva es publicar el panel y la API bajo un mismo dominio o detrás de un proxy del mismo origen **[VERIFICAR: dominio definitivo]**.

## 5. Reglas de consentimiento

1. **Consentimiento previo:** las cookies analíticas y publicitarias solo se activan después de una acción afirmativa del usuario.
2. **Rechazo fácil:** el botón “Rechazar” tiene la misma visibilidad que “Aceptar”. No se usan patrones engañosos.
3. **Granularidad:** el usuario puede aceptar solo analíticas, solo publicidad o ambas.
4. **Consent Mode:** se envía el estado de consentimiento a Google antes de cargar etiquetas.
5. **Registro:** el navegador guarda fecha, hora, decisión e identificador anónimo. Además, el servidor registra en `consentimientos_cookies` el identificador anónimo, la decisión, la fecha, la versión y el hash de esta política, la IP y el agente de usuario. La versión y el hash los fija el servidor; no se aceptan los valores que envíe el navegador.
6. **Retiro:** el usuario puede cambiar o retirar su decisión desde el enlace “Preferencias de cookies” en el pie del sitio.
7. **Silencio:** no equivale a consentimiento. Si no hay decisión, no se cargan cookies no necesarias.

## 6. Dónde aplica

- **Páginas públicas:** landing, login, registro, legales y ayuda. Aquí puede aparecer el banner y, con consentimiento, GA4 y Meta Pixel.
- **Panel `/app`:** no se ejecutan GA4 ni Meta Pixel. Solo se usan cookies necesarias y almacenamiento estrictamente funcional.

## 7. Terceros y transferencia internacional

Google y Meta están ubicados en Estados Unidos. El consentimiento y los contratos de encargo amparan la transmisión. El nivel adecuado de EE. UU. está **[VERIFICAR]**. Ver la Política de Privacidad.

## 8. Cómo controlar las cookies

- Desde el banner: aceptar, rechazar o configurar.
- Desde el navegador: bloquear o eliminar cookies. Si bloquea las cookies necesarias de sesión, no podrá iniciar sesión ni mantener la sesión abierta.
- Desde el enlace “Preferencias de cookies” del pie del sitio.

## 9. Cambios

Cualquier cambio en las cookies o proveedores exige nueva versión, fecha y hash en `MANIFEST.md`, y nueva solicitud de consentimiento si cambia la finalidad.

## 10. Contacto

[DATO PENDIENTE: privacidad@dominio] · [DATO PENDIENTE: pqr@dominio]

---

**Fin de la política.**
