# Política de Cookies y Tecnologías Similares

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Versión: 0.1-borrador · Fecha: 28 de octubre de 2026 · Idioma: español (Colombia)

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
| `inv_token` / `inv_usuario` | Stockora | Necesaria | Sesión y autenticación | Hasta cerrar sesión |
| `inv_sidebar_collapsed` | Stockora | Preferencia | Recordar estado del menú | Persistente |
| `inv_cookie_consent` | Stockora | Necesaria | Guardar la decisión de consentimiento | 12 meses |
| `_ga`, `_ga_*` | Google | Analítica | Medir visitas (GA4) | [VERIFICAR: duración vigente] |
| `_fbp` | Meta | Publicitaria | Medir campañas | [VERIFICAR: duración vigente] |

Los nombres y duraciones pueden cambiar cuando cambian los proveedores. La tabla se actualizará con la versión del documento.

## 5. Reglas de consentimiento

1. **Consentimiento previo:** las cookies analíticas y publicitarias solo se activan después de una acción afirmativa del usuario.
2. **Rechazo fácil:** el botón “Rechazar” tiene la misma visibilidad que “Aceptar”. No se usan patrones engañosos.
3. **Granularidad:** el usuario puede aceptar solo analíticas, solo publicidad o ambas.
4. **Consent Mode:** se envía el estado de consentimiento a Google antes de cargar etiquetas.
5. **Registro:** se guarda fecha, hora, versión de la política, decisión e identificador anónimo.
6. **Retiro:** el usuario puede cambiar o retirar su decisión desde el enlace “Preferencias de cookies” en el pie del sitio.
7. **Silencio:** no equivale a consentimiento. Si no hay decisión, no se cargan cookies no necesarias.

## 6. Dónde aplica

- **Páginas públicas:** landing, login, registro, legales y ayuda. Aquí puede aparecer el banner y, con consentimiento, GA4 y Meta Pixel.
- **Panel `/app`:** no se ejecutan GA4 ni Meta Pixel. Solo se usan cookies necesarias y almacenamiento estrictamente funcional.

## 7. Terceros y transferencia internacional

Google y Meta están ubicados en Estados Unidos. El consentimiento y los contratos de encargo amparan la transmisión. El nivel adecuado de EE. UU. está **[VERIFICAR]**. Ver la Política de Privacidad.

## 8. Cómo controlar las cookies

- Desde el banner: aceptar, rechazar o configurar.
- Desde el navegador: bloquear o eliminar cookies. Si bloquea las necesarias, algunas funciones no operarán.
- Desde el enlace “Preferencias de cookies” del pie del sitio.

## 9. Cambios

Cualquier cambio en las cookies o proveedores exige nueva versión, fecha y hash en `MANIFEST.md`, y nueva solicitud de consentimiento si cambia la finalidad.

## 10. Contacto

[DATO PENDIENTE: privacidad@dominio] · [DATO PENDIENTE: pqr@dominio]

---

**Fin de la política.**
