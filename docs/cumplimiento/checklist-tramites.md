# Checklist de trámites, cuentas y variables

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Fecha: 28 de octubre de 2026 · Actualizado: 2 de noviembre de 2026 · Mercado: Colombia
> Uso: lista de trabajo para completar lo que depende de la empresa, de terceros o de una decisión legal. No contiene secretos.

## 1. Datos que solo puede aportar la sociedad

Completar antes de publicar los documentos como definitivos. Mientras falten, los documentos conservan `[DATO PENDIENTE]`.

| Dato | Dónde se usa | Estado |
|---|---|---|
| Razón social exacta de la S.A.S. | Términos, Privacidad, Tratamiento, Aviso, DPA, footer | ⛔ Pendiente |
| NIT y dígito de verificación | Términos, facturación, DPA | ⛔ Pendiente |
| Domicilio principal y dirección de notificaciones | Términos, Privacidad, Tratamiento, DPA | ⛔ Pendiente |
| Correo de contacto general | Términos, Aviso, footer | ⛔ Pendiente |
| Correo de privacidad (`privacidad@dominio`) | Derechos, Privacidad, Tratamiento | ⛔ Pendiente |
| Correo de PQR (`pqr@dominio`) | Términos, PQR | ⛔ Pendiente |
| Correo legal (`legal@dominio`) | DPA, notificaciones | ⛔ Pendiente |
| Correo de seguridad (`seguridad@dominio`) | Uso Aceptable, incidentes | ⛔ Pendiente |
| Teléfono de atención | Términos, PQR | ⛔ Pendiente |
| Matrícula mercantil y cámara de comercio | Términos, DPA | ⛔ Pendiente |
| Representante legal (nombre y documento) | Términos, DPA, firmas | ⛔ Pendiente |
| ¿Responsable de IVA? tarifa y cuenta | Precios, Términos, facturación | ⛔ Pendiente |
| ¿Régimen simple de tributación? | Precios, Términos | ⛔ Pendiente |
| Persona designada para datos personales | Política de Tratamiento, canales | ⛔ Pendiente |
| Ciudad para jurisdicción | Términos, DPA | ⛔ Pendiente |
| Dominio propio | Correos, cookies, seguridad | ⛔ Pendiente |
| Logotipo definitivo (1/2/3) | Favicon, íconos, documentos | ⛔ Pendiente |

**Regla:** no inventar ninguno de estos datos. Si no se conoce, dejarlo como `[DATO PENDIENTE: …]`.

## 2. Cuentas y servicios por crear o configurar

No crear cuentas desde este repositorio. Cada paso lo ejecuta la empresa y luego pega las variables en el entorno correspondiente.

| Servicio | Para qué | Estado | Acción del usuario | Variables |
|---|---|---|---|---|
| Google Cloud / GA4 | Analítica solo en páginas públicas, con consentimiento | No creado | Crear propiedad GA4, obtener ID de medición, configurar Consent Mode | `GOOGLE_ANALYTICS_ID` |
| Meta Business / Pixel | Medición opcional en páginas públicas | No creado | Crear pixel, restringirlo a landing, revisar DPA | `META_PIXEL_ID` |
| Wompi | Pagos de suscripción en sandbox | No integrado | Crear cuenta sandbox, llaves de prueba, webhook | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET` |
| Proveedor de correo transaccional | Recuperación de contraseña, comprobantes, PQR | No existe | Elegir proveedor, verificar dominio (SPF/DKIM/DMARC), crear credenciales | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| Dominio y correo corporativo | Canales `privacidad@`, `pqr@`, `legal@`, `seguridad@` | Pendiente | Registrar/verificar dominio y buzones | `PRIVACY_EMAIL`, `PQR_EMAIL`, `LEGAL_EMAIL`, `SECURITY_EMAIL` |
| Render | Backend y PostgreSQL | Activo | Verificar plan, backups, región (Ohio, EE. UU.), DPA | `DATABASE_URL` |
| Vercel | Frontend | Activo | Verificar dominio, headers, DPA | `CORS_ORIGINS` |
| GitHub | Repositorio y despliegue | Activo | Revisar accesos y DPA | — |
| Monitoreo de errores (opcional) | Detección de incidentes | No creado | Elegir proveedor y DPA | `SENTRY_DSN` |
| SIC / RNBD | Registro si supera el umbral | `[VERIFICAR]` | Calcular activos en UVT; registrar si aplica | — |

> **Costos:** no se incluyen precios de terceros; verificarlos en cada proveedor. `[VERIFICAR]`

## 3. Variables de entorno

### 3.1 Ya existen

| Variable | Entorno | Secreto | Estado |
|---|---|---|---|
| `DATABASE_URL` | Backend | Sí | Configurada en Render/local; no commitear |
| `JWT_SECRET` | Backend | Sí | Debe ser largo y distinto por entorno |
| `JWT_REFRESH_SECRET` | Backend | Sí | Debe ser distinto de `JWT_SECRET` |
| `JWT_EXPIRES_IN` | Backend | No | `15m` propuesto |
| `JWT_REFRESH_EXPIRES_IN` | Backend | No | `7d` propuesto |
| `PORT` | Backend | No | `3001` local |
| `NODE_ENV` | Backend | No | `production` en Render |
| `CORS_ORIGINS` | Backend | No | Orígenes propios; los oficiales se aceptan siempre |
| `PERMISOS_CACHE_TTL_SEGUNDOS` | Backend | No | `60` |

### 3.2 Por agregar cuando se integren

| Variable | Entorno | Secreto | Uso |
|---|---|---|---|
| `GOOGLE_ANALYTICS_ID` | Frontend (build) | No | GA4 con consentimiento |
| `META_PIXEL_ID` | Frontend (build) | No | Pixel con consentimiento |
| `WOMPI_PUBLIC_KEY` | Frontend/backend | Público/privado | Checkout sandbox |
| `WOMPI_PRIVATE_KEY` | Backend | Sí | Confirmación de pagos |
| `WOMPI_EVENTS_SECRET` | Backend | Sí | Validar webhooks |
| `SMTP_HOST` | Backend | No | Correo |
| `SMTP_PORT` | Backend | No | Correo |
| `SMTP_USER` | Backend | Sí | Correo |
| `SMTP_PASS` | Backend | Sí | Correo |
| `MAIL_FROM` | Backend | No | Remitente verificado |
| `PRIVACY_EMAIL` | Backend/frontend | No | Canal de privacidad |
| `PQR_EMAIL` | Backend/frontend | No | Canal PQR |
| `LEGAL_EMAIL` | Backend | No | Notificaciones legales |
| `SECURITY_EMAIL` | Backend | No | Incidentes |
| `SENTRY_DSN` | Backend/frontend | Sí | Monitoreo (opcional) |

**Regla:** los secretos van en Render/Vercel o en `.env` local, nunca en Git, logs, capturas ni commits. Mantener `.env.example` sin valores reales.

## 4. Trámites y decisiones legales

### 4.1 Antes de publicar

- [ ] Constituir/verificar la S.A.S. y obtener RUT, matrícula y representación legal.
- [ ] Definir si es responsable de IVA y si aplica régimen simple.
- [ ] Designar la persona y el correo responsable de datos personales/PQR.
- [ ] Registrar el dominio y crear los buzones `privacidad@`, `pqr@`, `legal@`, `seguridad@`.
- [ ] Contratar abogado con licencia en Colombia para revisar todos los documentos.
- [ ] Resolver las opciones marcadas `[REVISAR CON ABOGADO]` en Términos, Privacidad, Tratamiento, Cookies, Retención y DPA.
- [ ] Verificar el mecanismo de transferencia internacional ante la SIC. `[VERIFICAR]`
- [ ] Calcular activos en UVT y decidir RNBD. `[VERIFICAR]`
- [ ] Verificar si Ley 2300/2023 aplica al modelo B2B. `[VERIFICAR]`
- [ ] Verificar el plazo y el instrumento de reporte de incidentes ante la SIC. `[VERIFICAR]`
- [ ] Verificar la lista vigente de países adecuados. `[VERIFICAR]`
- [ ] Aprobar la política de retención y el procedimiento de purga/anonimización.

### 4.2 Contratos y proveedores

- [ ] Firmar el Contrato de Encargo (DPA) con cada empresa-cliente.
- [ ] Revisar y aceptar los DPAs de Render, Vercel, GitHub, Google, Meta y Wompi.
- [ ] Firmar acuerdos de confidencialidad con el equipo.
- [ ] Definir el proveedor de correo y firmar su DPA.
- [ ] Documentar subencargados y cambios con aviso al cliente.
- [ ] Definir si se contrata un seguro de responsabilidad. `[VERIFICAR]`

### 4.3 Producto y operación

- [ ] Integrar correo transaccional y recuperación de contraseña.
- [ ] Integrar Wompi **solo en sandbox** y probar pago, rechazo, reversión y webhook.
- [ ] Implementar aceptación de Términos en el checkout.
- [ ] Aplicar límites de plan (`maxBodegas`, `maxReportes`) y corregir política de contraseñas.
- [ ] Quitar el seed automático del `Dockerfile` de producción.
- [x] Enlazar el Aviso de Privacidad en registro y derechos; repetir en formularios futuros.
- [ ] Probar el modal de aceptación a 320/360 px y con teclado. Geometría y scroll verificados; falta navegación por teclado.
- [ ] Probar los endpoints de superadmin con una sesión real.
- [ ] Probar login, refresh, logout y CSRF con cookies en navegador real; verificar Safari/Firefox y definir dominio same-origin o proxy para evitar cookies de terceros. **Avance 2026-11-02:** Vercel ya sirve `/api` con un rewrite same-origin; Pages mantiene la llamada directa a Render. Login inválido, CSRF, refresh/logout sin sesión, cookies de borrado y CORS verificados en ambos frontends y con `curl`; falta login exitoso y Safari/Firefox.
- [ ] Probar refresh en dos pestañas: la rotación con detección de reuso puede cerrar todas las sesiones si ambas pestañas refrescan al mismo tiempo. **Bloqueado:** requiere una sesión válida de producción.
- [ ] Ejecutar prueba de restauración de backup y documentarla.
- [ ] Crear runbook de incidentes y hacer un simulacro.
- [ ] Programar revisión de accesos y capacitación anual.
- [ ] Revisar accesibilidad y LCP/CLS del panel en móvil.
- [x] Presupuesto SCSS ajustado a 13 kB (el landing usa 12.14 kB; sin warning de build).
- [x] Auditar formularios y modales de 320 a 1440 px; líneas dinámicas, cookies y aceptación sin desbordes (2026-10-28).
- [ ] Corregir el toast “Bodega creado” y el rol `Produccion` sin acento.
- [ ] Recuperar `stash@{0}` (“registro-profesional-pendiente”) en una rama nueva.

## 5. Pruebas que faltan

| Prueba | Criterio de aceptación | Estado |
|---|---|---|
| Usuario nuevo en producción | Modal aparece; aceptar registra 3 filas; recargar no lo muestra | ⚠️ No probado |
| Checkout sandbox | Pago aprobado, rechazado y reversión; sin cobros reales | ❌ No existe |
| Correo transaccional | Recuperación y notificación recibidas | ❌ No existe |
| Backup/restore | Restauración completa en entorno aislado | ❌ No probado |
| Incidente simulado | Detección, contención, notificación y cierre en plazo | ❌ No probado |
| Superadmin derechos | Listar, responder y cerrar con sesión real | ⚠️ No probado |
| Modal 320/360 px | Sin desbordes; foco y teclado correctos | ⚠️ Parcial (geometría y scroll OK; teclado pendiente) |
| Cookies en todas las rutas `/app` | Banner ausente por diseño; registro remoto y enlace interno implementados; falta probar en navegador | ⚠️ Parcial |
| Sesión en cookies httpOnly | Login/refresh/logout sin tokens en JavaScript; CSRF por cabecera; Vercel sirve `/api` same-origin y Pages llama directo a Render | ⚠️ Parcial (2026-11-02: login inválido, CSRF, refresh/logout sin sesión, cookies y CORS verificados en producción; falta login exitoso y Safari/Firefox) |
| Despliegue de seguridad en producción | API y rutas públicas responden; proxy `/api` de Vercel, CSRF, CORS y cookies de borrado verificados | ⚠️ Parcial (2026-11-02; ver `evidencia-despliegue-2026-11-02.md`) |
| RNBD | Cálculo de activos y decisión documentada | ⛔ Pendiente |

## 6. Orden de despliegue sugerido

1. Revisión legal y cierre de datos `[DATO PENDIENTE]`.
2. Actualizar documentos, versión, fecha y hashes en `MANIFEST.md` y `documentos-legales.ts`.
3. Configurar dominio, correos, variables y proveedores.
4. Implementar correo y checkout sandbox.
5. Fusionar ramas legales a `main` **solo con diff aprobado**.
6. Aplicar migraciones en producción y desplegar backend/frontend.
7. Probar usuario nuevo, aceptaciones, cookies, derechos y panel.
8. Ejecutar backup/restore y simulacro de incidente.
9. Archivar evidencia y actualizar esta matriz.

## 7. Ramas y commits de referencia

| Tema | Rama | Commit |
|---|---|---|
| Documentos base | `feat/legal-documentos` | `e93520b` |
| Cookies | `feat/legal-cookies` | `fa8b8d7` |
| Derechos | `feat/legal-derechos-titulares` | `ff293a5` |
| Retención | `feat/legal-retencion` | `37837dd` |
| Aceptaciones | `feat/legal-aceptaciones` | `f97a560` |
| Contrato de encargo | `feat/legal-encargado` | `d3a6cfc` |
| Trial y gracia | `feature/trial-gracia` | `f751359` |
| Volver e ícono de ojo | `ui/auth-volver` | `f94cb34` |
| Cookies httpOnly y CSRF | `feat/registro-directo` | `33688e3`, `7cbf413`, `366c2b1` |
| Lint, purga y CI | `feat/registro-directo` | `ca8f927`, `8fee8fd`, `2204c2a` |
| Proxy same-origin Vercel | `main` | `1954ddc` |
| Cumplimiento | `docs/cumplimiento` | `docs/cumplimiento` (este cambio) |

El contenido legal y de seguridad está integrado en `main`; la verificación de despliegue se hizo sobre `2204c2a` y el proxy se verificó en `1954ddc`. `feature/trial-gracia` sigue fuera de `main`. La evidencia de despliegue está en [`evidencia-despliegue-2026-11-02.md`](./evidencia-despliegue-2026-11-02.md).

## 8. Criterio de cierre

No marcar este checklist como completo hasta que:

- Todos los `[DATO PENDIENTE]` estén completos.
- El abogado haya aprobado y firmado la versión final.
- Los hashes estén actualizados y las aceptaciones se hayan vuelto a pedir.
- Los P0 de la matriz estén cerrados o aceptados por escrito con su riesgo.
- Exista evidencia de las pruebas pendientes.

---

**Fin del checklist.**
