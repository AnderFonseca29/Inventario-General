# Matriz de implementación y brechas legales

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Fecha de corte: 28 de octubre de 2026 · Mercado: Colombia · Moneda: COP
> Esta matriz separa **implementación técnica verificada** de **cumplimiento legal definitivo**. No declara que Stockora cumpla al 100 %: enumera evidencias, fallas y pendientes.

## 1. Cómo leer esta matriz

| Símbolo | Significado |
|---|---|
| ✅ | Verificado con evidencia reproducible (código, prueba, base de datos o navegador) |
| ⚠️ | Parcial o no probado; existe implementación, pero falta evidencia o un requisito |
| ❌ | Ausente o falló en una prueba |
| ⛔ | Bloqueado por un dato, cuenta o decisión que solo puede aportar la empresa |

Estados: **Aprobado** = evidencia revisada; **Falló** = prueba en rojo o requisito ausente; **No probado** = no hay evidencia suficiente.

## 2. Alcance y roles

- **Stockora S.A.S.** es **Responsable** de los datos de sus propios usuarios (cuenta, acceso, facturación) y **Encargada** de los datos que cada empresa-cliente carga en la plataforma.
- La **empresa-cliente** es **Responsable** de los datos de sus clientes, proveedores, usuarios y operación.
- El tratamiento se documenta en la Política de Tratamiento, la Política de Privacidad, el Aviso de Privacidad, el Uso Aceptable y el Contrato de Encargo (DPA).
- Los documentos son **borradores** versionados; cualquier cambio exige nueva versión, fecha, hash y aceptación.

## 3. Fuentes oficiales consultadas

Consulta: 28 de octubre de 2026. Las fuentes se usan para identificar obligaciones; la interpretación definitiva corresponde al abogado.

| Fuente | Uso | Enlace |
|---|---|---|
| Ley 1581 de 2012 | Protección de datos personales | `https://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html` |
| Decreto 1074 de 2015 | Decreto Único Reglamentario (compila el Decreto 1377 de 2013) | `https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608` |
| Decreto 90 de 2018 | Registro Nacional de Bases de Datos (RNBD) | `https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=85540` |
| Ley 1480 de 2011 | Estatuto del Consumidor | `https://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html` |
| Decreto 587 de 2016 | Información mínima, precio y condiciones | `https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608` |
| Ley 2439 de 2024 | Medidas de protección al consumidor | `[VERIFICAR texto oficial en Senado]` |
| Ley 2300 de 2023 | Canales de atención y PQR | `[VERIFICAR texto oficial en Senado]` |
| Ley 527 de 1999 | Mensajes de datos y firma electrónica | `https://www.secretariasenado.gov.co/senado/basedoc/ley_0527_1999.html` |
| Ley 1273 de 2009 | Delitos informáticos | `https://www.secretariasenado.gov.co/senado/basedoc/ley_1273_2009.html` |
| Ley 1618 de 2013 | Accesibilidad | `https://www.secretariasenado.gov.co/senado/basedoc/ley_1618_2013.html` |
| SIC | Autoridad de protección de datos y consumidor | `https://www.sic.gov.co` |

**Límites de verificación:** SIC intermitente; no se pudo obtener la circular de incidentes, la Circular 005/008 de 2017 ni la lista vigente de países adecuados. Presidencia/SIUIN inaccesibles. Todo lo no verificado queda como `[VERIFICAR]`.

## 4. Matriz de controles

### 4.1 Documentos y transparencia

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| D-01 | Política de Tratamiento publicada y descargable | Ley 1581/2012; Decreto 1074/2015 | ✅ Aprobado (técnico) | `frontend/public/legal/politica-de-tratamiento-de-datos.md`; hash en `MANIFEST.md`; enlace en landing | Revisión por abogado; datos de la sociedad |
| D-02 | Política de Privacidad publicada | Ley 1581/2012 | ✅ Aprobado (técnico) | `politica-de-privacidad.md`; hash `3c9026d9…` | Revisión legal |
| D-03 | Términos y Condiciones publicados | Ley 1480/2011; Ley 527/1999 | ✅ Aprobado (técnico) | `terminos-y-condiciones.md`; hash `903582a2…` | Revisión legal; IVA y régimen |
| D-04 | Aviso de Privacidad disponible | Decreto 1074/2015 | ✅ Aprobado (técnico) | `aviso-de-privacidad.md`; hash `52736494…`; enlazado en registro y derechos; 0 desbordes a 360 px | Formularios internos de usuarios/clientes corresponden a la empresa-cliente como responsable |
| D-05 | Uso Aceptable publicado | Ley 1581/2012; Ley 1273/2009 | ✅ Aprobado (técnico) | `uso-aceptable.md`; hash `9715c4a3…` | Revisión legal |
| D-06 | Política de Cookies publicada | Ley 1581/2012; guías SIC | ✅ Aprobado (técnico) | `politica-de-cookies.md`; hash `92c47513…` | Revisión legal |
| D-07 | Política de Derechos de los Titulares | Ley 1581/2012 | ✅ Aprobado (técnico) | `derechos-de-los-titulares.md`; hash `54fed2e1…` | Revisión legal |
| D-08 | Política de Retención | Ley 1581/2012; obligaciones contables | ✅ Aprobado (técnico) | `politica-de-retencion.md`; hash `b5954a29…` | Plazos sujetos a abogado; purga no aprobada |
| D-09 | Contrato de Encargo (DPA) | Ley 1581/2012 (encargado) | ⚠️ Parcial | `contrato-de-encargo.md`; hash `9eb6e790…` | Borrador **no firmado**; DPAs de proveedores sin verificar |
| D-10 | Versión, fecha y hash por documento | Ley 527/1999 (integridad) | ✅ Aprobado | `MANIFEST.md`; `backend/src/legal/documentos-legales.ts` | Actualización manual; falta automatizar verificación |
| D-11 | Documentos imprimibles y descargables | Transparencia | ✅ Aprobado | Archivos Markdown servidos en `/legal/*.md` | Sin versión PDF firmada |
| D-12 | Marca visible de borrador | Regla interna | ✅ Aprobado | Encabezado en todos los documentos | Retirar solo tras revisión legal |

### 4.2 Aceptaciones y consentimiento

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| A-01 | Aceptación de documentos en primer login | Ley 527/1999; Ley 1581/2012 | ✅ Aprobado | Modal `aceptacion-legal.component.*`; `POST /api/legal/aceptaciones`; 3 registros en `aceptaciones_legales` | Probar con usuario nuevo real en producción |
| A-02 | Registro de evidencia de aceptación | Ley 527/1999 | ✅ Aprobado | Tabla con usuario, documento, versión, hash, método, IP, agente y fecha; auditoría | Retención y acceso a la evidencia |
| A-03 | Versión definida por el servidor | Integridad | ✅ Aprobado | `documentos-legales.ts`; prueba unitaria | Actualizar hash/version en cada cambio |
| A-04 | Modal no dismissible | Regla interna | ✅ Aprobado | Sin Escape ni clic fuera; solo aceptar o cerrar sesión | Prueba de teclado en navegador real |
| A-05 | Checkbox en registro | Ley 1581/2012 | ⚠️ Parcial | `registro.component.ts` con `requiredTrue`; prueba 44/44 | El alta es **simulada**: no persiste aceptación |
| A-06 | Aceptación en checkout | Ley 1480/2011 | ⚠️ No probado | No existe checkout ni pasarela | Implementar al integrar Wompi |
| A-07 | Consentimiento de cookies previo | Guías SIC; Ley 1581/2012 | ✅ Aprobado | Banner; `ConsentimientoService`; Consent Mode `denied`; prueba en navegador | GA4/Meta aún no cargados |
| A-08 | Rechazo de cookies tan fácil como aceptar | Guías SIC | ✅ Aprobado | Botón “Rechazar” visible; guarda decisión y oculta banner | Revisar contraste y foco |
| A-09 | Cookies solo en páginas públicas | Decisión L5 | ✅ Aprobado | Banner ausente en `/app/dashboard` (verificado en navegador) | Probar en todas las rutas privadas |
| A-10 | Caducidad del consentimiento | Regla interna | ✅ Aprobado | 12 meses; prueba de servicio | Revalidar tras cambios de política |
| A-11 | Registro de consentimiento | Ley 527/1999 | ⚠️ Parcial | `localStorage['inv_cookie_consent_v1']` con fecha y decisión | No hay registro del lado servidor |

### 4.3 Derechos de los titulares

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| R-01 | Radicación pública de consultas y reclamos | Ley 1581/2012 | ✅ Aprobado | `/derechos`; `POST /api/derechos`; radicado `DER-AAAAMMDD-XXXXXXXX` | Correo de notificación ausente |
| R-02 | Consulta por radicado y correo | Ley 1581/2012 | ✅ Aprobado | `GET /api/derechos/consulta/:radicado?correo=…`; E2E 200/404 | Verificación de identidad solo por correo |
| R-03 | Plazo de 10 días hábiles para consultas | Ley 1581/2012 | ✅ Aprobado (técnico) | `sumarDiasHabiles`; prueba unitaria | **No excluye festivos**; `[VERIFICAR]` |
| R-04 | Plazo de 15 días hábiles para reclamos | Ley 1581/2012 | ✅ Aprobado (técnico) | Mismo cálculo | Festivos pendientes |
| R-05 | Administración por superadmin | Ley 1581/2012 | ⚠️ No probado | Endpoints con `@SoloSuperAdmin` | No se probó con sesión superadmin real |
| R-06 | Trazabilidad de la respuesta | Ley 1581/2012 | ✅ Aprobado | Estado, fecha límite, respuesta, auditoría | Retención y anonimización |
| R-07 | Canales `privacidad@`, `pqr@`, `legal@`, `seguridad@` | Ley 1581/2012; Ley 2300/2023 | ⛔ Bloqueado | Nombres definidos | Dominio y correo `[DATO PENDIENTE]`; sin módulo de correo |

### 4.4 Seguridad y acceso

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| S-01 | Autenticación y sesión | Ley 1581/2012 | ✅ Aprobado | JWT, refresh tokens, guard global, expiración | Probar login real en producción |
| S-02 | Hash de contraseñas | Seguridad | ✅ Aprobado | Argon2id | — |
| S-03 | Aislamiento multiempresa | Seguridad | ✅ Aprobado | Guards, filtros por `empresaId`, pruebas backend 97/97 | Sin pentest |
| S-04 | Roles y permisos | Seguridad | ✅ Aprobado | `@SoloPropietario`, `PropietarioGuard`, permisos | Revisar rol `Produccion` sin acento |
| S-05 | Bloqueo por intentos fallidos | Seguridad | ✅ Aprobado | `intentos_login`; throttle | — |
| S-06 | Auditoría de operaciones | Ley 1581/2012 | ✅ Aprobado | `AuditoriaService`; registros de aceptación | Retención manual |
| S-07 | Política de contraseñas consistente | Seguridad | ❌ Falló | `PATCH /usuarios/:id/password` exige 8; `change-password` exige 10 + complejidad | Unificar |
| S-08 | Límites de plan aplicados | Contrato | ❌ Falló | Solo `maxUsuarios`; `maxBodegas` y `maxReportes` sin efecto | Implementar |
| S-09 | Seed seguro en producción | Seguridad | ❌ Falló | `Dockerfile`: `npx prisma db seed \|\| true` con dependencias de desarrollo | Quitar seed automático |
| S-10 | Correo transaccional | Operación | ❌ Ausente | No hay módulo de correo | Bloquea recuperación de contraseña y comprobantes |
| S-11 | Cifrado en tránsito | Seguridad | ✅ Aprobado | HTTPS en Vercel/Render | Verificar HSTS |
| S-12 | Cifrado en reposo | Seguridad | ⚠️ No probado | Depende de Render/PostgreSQL | Verificar proveedor |
| S-13 | Copias de seguridad y restauración | Continuidad | ❌ No probado | Sin prueba de restauración | Ejecutar y documentar |
| S-14 | Gestión de vulnerabilidades | Seguridad | ⚠️ No probado | Sin evidencia de análisis de dependencias | Programar auditoría |

### 4.5 Tratamiento, retención y terceros

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| T-01 | Minimización de datos | Ley 1581/2012 | ✅ Aprobado | Mapa de 20 tipos; formularios acotados | Advertencia en campos libres |
| T-02 | Prohibición de datos sensibles y de menores | Ley 1581/2012 | ⚠️ Parcial | Prohibición en Términos y Uso Aceptable | Sin filtro técnico; solo detección manual |
| T-03 | Transferencia internacional documentada | Ley 1581/2012; SIC | ⚠️ No probado | Proveedores en EE. UU. y DPA | Mecanismo SIC `[VERIFICAR]` |
| T-04 | Subencargados identificados | Ley 1581/2012 | ⚠️ Parcial | Tabla en DPA | DPAs de Render/Vercel/GitHub sin verificar |
| T-05 | Retención y purga | Ley 1581/2012 | ✅ Aprobado (técnico) | Política; caducidad de cookies; `retencion:reporte` | Purga automática solo tokens/intentos; resto manual |
| T-06 | Reporte trimestral sin datos personales | Regla interna | ✅ Aprobado | `backend/scripts/reporte-retencion.js`; ejecutado | Automatizar y archivar |
| T-07 | RNBD | Decreto 90/2018 | ⛔ Bloqueado / `[VERIFICAR]` | Evaluación: activos ≤100.000 UVT → no obligado | Falta cálculo con activos reales y revisión anual |
| T-08 | Incidentes de seguridad | Ley 1581/2012; SIC | ❌ Ausente | Documento menciona procedimiento | Sin runbook ni simulacro; plazo `[VERIFICAR]` |
| T-09 | Designado de protección de datos | Ley 1581/2012 | ⛔ Bloqueado | — | Persona y correo `[DATO PENDIENTE]` |
| T-10 | Capacitación y confidencialidad | Ley 1581/2012 | ❌ No probado | — | Sin evidencia de capacitación |

### 4.6 Producto, pagos y consumidor

| ID | Control | Fuente | Estado | Evidencia | Brecha / pendiente |
|---|---|---|---|---|---|
| P-01 | Información previa de precio y plan | Ley 1480/2011; Decreto 587/2016 | ✅ Aprobado (técnico) | Landing y Términos: Básico $60.000, Medio $90.000, Premium $120.000 COP | IVA `[DATO PENDIENTE]` |
| P-02 | Prueba de 3 días + 1 de gracia | Ley 1480/2011 | ✅ Aprobado | Rama `feature/trial-gracia` (`f751359`); 402 verificado | No fusionada ni desplegada |
| P-03 | Pasarela de pagos en sandbox | Ley 1480/2011 | ⛔ No probado | Wompi no integrada | Sin checkout; no hay cobros |
| P-04 | Retracto y reversión | Ley 1480/2011 | ✅ Aprobado (texto) | Términos | Revisión legal; flujo operativo |
| P-05 | Cancelación y suspensión | Ley 1480/2011 | ✅ Aprobado (texto) | Términos; decisión L9 | Probar en producto |
| P-06 | PQR y canales de atención | Ley 2300/2023 | ⚠️ Parcial | Canales definidos; formulario de derechos | Dominio/correo y aplicabilidad B2B `[VERIFICAR]` |
| P-07 | Accesibilidad | Ley 1618/2013 | ⚠️ Parcial | Lighthouse landing: accesibilidad 100 | Modal y panel sin auditoría formal |
| P-08 | Rendimiento móvil | Regla interna | ⚠️ No probado | Lighthouse landing: SEO 80; sin LCP/CLS con throttling | Medir y corregir |

## 5. Evidencia de pruebas

| Prueba | Resultado | Fecha | Evidencia |
|---|---|---|---|
| Backend unitario | 97/97 | 2026-10-28 | `jest --runInBand` |
| Frontend unitario | 44/44 | 2026-10-28 | `ng test --no-watch` |
| Build backend | Verde | 2026-10-28 | `nest build` |
| Build frontend | Verde (warning SCSS 12.14 kB vs 12 kB) | 2026-10-28 | `ng build` |
| Responsive 14 rutas × 8 anchos | 0 desbordes | 2026-10-27/28 | Navegador automatizado |
| Banner de cookies | Aceptar/Rechazar/Consent Mode | 2026-10-28 | Navegador |
| Radicación de derechos | Radicado `DER-20261028-C048CA87` | 2026-10-28 | API + navegador |
| Consulta de derechos | 200 correcto / 404 correo erróneo | 2026-10-28 | API |
| Aceptación legal | 3 filas `PRIMER_LOGIN`; modal desaparece al recargar | 2026-10-28 | PostgreSQL + navegador |
| Cookie banner en `/app` | Ausente | 2026-10-28 | Navegador |
| Aviso de privacidad en registro y derechos | 1 enlace visible; 0 desbordes a 360 px | 2026-10-28 | Navegador (iframe 360 px) |

## 6. Brechas priorizadas

### P0 — antes de producción con clientes

1. Revisión y firma de todos los documentos por abogado colombiano.
2. Completar identidad de la S.A.S. y designar responsable de datos/PQR.
3. Enlazar el Aviso de Privacidad en cada formulario de recolección. **Hecho en registro y derechos**; repetir en formularios futuros.
4. Resolver transferencia internacional y RNBD con concepto legal.
5. Implementar correo transaccional y recuperación de contraseña.
6. Probar login y aceptaciones con una cuenta real en producción.
7. Corregir límites de plan y política de contraseñas.
8. Quitar seed automático de producción.
9. Ejecutar prueba de restauración de backups.
10. Aprobar y programar la purga/anonimización.

### P1 — primeras semanas

1. Firmar DPAs con proveedores y clientes.
2. Runbook de incidentes + simulacro.
3. Integrar Wompi en sandbox y aceptación en checkout.
4. Medir LCP/CLS y auditar accesibilidad del panel.
5. Automatizar verificación de hashes legales.
6. Probar endpoints de superadmin con sesión real.

## 7. Conclusión

La implementación técnica cubre los controles esenciales de transparencia, derechos, cookies, aceptaciones y seguridad. **No puede declararse cumplimiento legal definitivo** mientras existan los P0, los datos `[DATO PENDIENTE]` y la revisión del abogado. Esta matriz debe actualizarse en cada cambio de documento, proveedor o flujo.

---

**Fin de la matriz.**
