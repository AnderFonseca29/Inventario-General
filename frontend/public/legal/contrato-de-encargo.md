# Contrato de Encargo de Tratamiento de Datos Personales (DPA)

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Versión: 0.2-borrador · Fecha: 30 de octubre de 2026 · Idioma: español (Colombia)

Este contrato regula el tratamiento de datos personales que el **Cliente** (Responsable) entrega a **Stockora** (Encargado) para usar la plataforma. No reemplaza la relación contractual principal entre las partes.

## 1. Partes

| Parte | Rol | Datos |
|---|---|---|
| **[DATO PENDIENTE: razón social del Cliente]** | Responsable | NIT: [DATO PENDIENTE] · Domicilio: [DATO PENDIENTE] · Representante: [DATO PENDIENTE] |
| **[DATO PENDIENTE: razón social de Stockora S.A.S.]** | Encargado | NIT: [DATO PENDIENTE] · Domicilio: [DATO PENDIENTE] · Representante: [DATO PENDIENTE] |

## 2. Definiciones

- **Dato personal:** información sobre una persona natural identificada o identificable.
- **Titular:** persona natural cuyos datos se tratan.
- **Responsable:** quien decide sobre el tratamiento; en este contrato, el Cliente.
- **Encargado:** quien trata datos por cuenta del Responsable; en este contrato, Stockora.
- **Subencargado:** tercero que el Encargado vincula para una parte del tratamiento.
- **Incidente:** acceso, uso, divulgación, alteración o pérdida no autorizados de datos personales.
- **Ley aplicable:** Ley 1581 de 2012, Decreto 1074 de 2015 (compilatorio del Decreto 1377 de 2013), y demás normas colombianas aplicables. **[VERIFICAR]**

## 3. Objeto y roles

1. El Cliente es **Responsable** de los datos personales que carga, registra o gestiona en la plataforma, incluidos datos de sus clientes, usuarios, proveedores y personal.
2. Stockora es **Encargada** y solo trata esos datos para prestar el servicio contratado, siguiendo las instrucciones del Cliente.
3. Stockora es **Responsable** de los datos de las cuentas de sus propios usuarios (por ejemplo, nombre, correo y credenciales). Esa relación se rige por la Política de Privacidad y la Política de Tratamiento.
4. El Cliente declara que cuenta con la autorización, base legal o habilitación necesaria para entregar los datos a Stockora y para ordenar su tratamiento.

## 4. Datos y finalidades

### 4.1 Categorías

| Categoría | Ejemplos | ¿Incluye datos sensibles? |
|---|---|---|
| Identificación | Nombre, documento, correo, teléfono | No, salvo carga del Cliente |
| Operación | Inventario, movimientos, bodegas, cargues, reportes | No |
| Comercial | Clientes, proveedores, membresías | No |
| Acceso | Usuario, rol, permisos, IP, agente de usuario | No |
| Facturación | Plan, periodos, pagos | No |

El Cliente **no debe cargar** datos sensibles (salud, biometría, origen étnico, orientación sexual, convicciones, etc.) ni datos de menores de edad. Si lo hace, asume la responsabilidad y Stockora podrá eliminarlos.

### 4.2 Finalidades

- Prestar, mantener y soportar la plataforma.
- Ejecutar las funcionalidades solicitadas por el Cliente.
- Atender soporte y seguridad.
- Cumplir obligaciones legales.
- Generar reportes para el Cliente.
- Realizar copias de seguridad y recuperación.

No se usan los datos del Cliente para marketing propio ni para entrenar modelos sin instrucción escrita.

## 5. Instrucciones del Responsable

1. El Cliente imparte instrucciones por los canales de soporte o por correo a `[DATO PENDIENTE: correo de soporte]`.
2. Stockora informa si una instrucción es incompatible con la ley o con la seguridad del servicio.
3. Si Stockora debe tratar datos por obligación legal, informa al Cliente antes o después, salvo prohibición legal.
4. Las instrucciones deben constar por escrito y quedar registradas.

## 6. Obligaciones de Stockora

1. Tratar los datos solo para las finalidades y según las instrucciones del Cliente.
2. No vender, ceder ni usar los datos para fines propios.
3. Mantener la confidencialidad del personal autorizado.
4. Aplicar medidas técnicas y organizativas razonables.
5. Asistir al Cliente en la atención de derechos de los titulares.
6. Notificar incidentes según la cláusula 12.
7. Colaborar en evaluaciones de impacto y consultas a la autoridad cuando corresponda.
8. Devolver o eliminar los datos al terminar el contrato.
9. Informar sobre subencargados y cambios relevantes.
10. Mantener registros del tratamiento y de las instrucciones recibidas.

## 7. Seguridad

Stockora aplicará, como mínimo:

- Control de acceso por usuario, rol y empresa.
- Autenticación con contraseña y tokens de sesión.
- Hash de contraseñas con algoritmo robusto.
- Cifrado en tránsito (HTTPS/TLS).
- Cifrado en reposo cuando el proveedor lo permita.
- Registro de auditoría de operaciones relevantes.
- Copias de seguridad y plan de recuperación.
- Gestión de vulnerabilidades y actualizaciones.
- Bloqueo de intentos de acceso y cierre de sesión.
- Minimización y retención limitada.
- Procedimiento de respuesta a incidentes.
- Capacitación del personal con acceso.

El detalle está en el Anexo B. Las medidas son revisables y pueden actualizarse sin reducir el nivel de protección.

## 8. Subencargados

El Cliente autoriza los siguientes subencargados para la operación:

| Subencargado | Servicio | País | Datos | Estado |
|---|---|---|---|---|
| Render | Hosting del backend y base de datos | Estados Unidos | Todos los datos de la plataforma | Activo |
| Vercel | Hosting del frontend | Estados Unidos | Datos de navegación y contenido | Activo |
| GitHub | Repositorio y despliegue | Estados Unidos | Código; no datos de producción | Activo |
| Google | Analítica (GA4), solo con consentimiento | Estados Unidos | Datos de uso en páginas públicas | Opcional |
| Meta | Pixel, solo con consentimiento | Estados Unidos | Datos de uso en páginas públicas | Opcional |
| Wompi | Pasarela de pagos | Colombia | Datos de pago | **[VERIFICAR]** / no integrada |
| [DATO PENDIENTE: proveedor de correo] | Correo transaccional | [DATO PENDIENTE] | Correo y nombre | Pendiente |

1. Stockora exige a cada subencargado obligaciones equivalentes.
2. Stockora informa cambios de subencargados con **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** aviso con 15 días y derecho de objeción.
   - **Opción B:** aviso con 30 días y derecho de objeción.
   - **Opción C:** autorización previa específica para cada cambio.
3. Si el Cliente objeta, las partes buscan una alternativa; si no hay acuerdo, el Cliente puede terminar el contrato.

## 9. Transferencias internacionales

1. Los datos pueden alojarse en Estados Unidos a través de Render, Vercel y GitHub.
2. Stockora verificará el mecanismo aplicable ante la SIC y lo documentará. **[VERIFICAR]**
3. La transferencia se limita a lo necesario para el servicio.
4. Stockora informa al Cliente sobre cambios de país o proveedor.
5. Si se requiere autorización del titular, el Cliente la obtendrá.

## 10. Confidencialidad

1. El personal de Stockora con acceso a datos firma compromisos de confidencialidad.
2. La obligación sobrevive a la terminación del contrato.
3. No se divulga información a terceros salvo instrucción, ley o subencargado autorizado.
4. El Cliente mantiene la confidencialidad de sus credenciales.

## 11. Derechos de los titulares

1. El Cliente atiende las solicitudes de sus titulares.
2. Stockora presta asistencia técnica para acceso, rectificación, supresión, revocatoria y reclamos.
3. Stockora puede remitir al Cliente las solicitudes que reciba y que correspondan a datos del Cliente, sin perjuicio de la respuesta inmediata que exija la ley.
4. Los plazos se calculan según la ley y se documentan en la Política de Derechos de los Titulares.

## 12. Incidentes de seguridad

1. Stockora notificará al Cliente sin demora injustificada tras confirmar un incidente que afecte sus datos.
2. La notificación incluye, cuando se conozca: fecha, descripción, datos afectados, causa, medidas adoptadas y recomendaciones.
3. Plazo propuesto **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** 24 horas desde la confirmación.
   - **Opción B:** 48 horas.
   - **Opción C:** 72 horas.
4. Stockora documenta el incidente y las acciones correctivas.
5. La notificación a la SIC y a los titulares corresponde a quien tenga el deber legal; las partes se coordinan.

## 13. Auditoría

1. El Cliente puede solicitar evidencia razonable del cumplimiento (certificaciones, reportes, cuestionarios).
2. Auditoría presencial o remota con aviso de 15 días y sin afectar la seguridad ni la confidencialidad de otros clientes.
3. Frecuencia **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** una vez al año.
   - **Opción B:** cada dos años.
   - **Opción C:** solo por causa justificada o requerimiento de autoridad.
4. Los costos de auditorías no previstas corren por quien las solicita, salvo incumplimiento comprobado.

## 14. Retorno y supresión

1. Al terminar el contrato, Stockora devuelve los datos en un formato utilizable (CSV/JSON) dentro de **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** 15 días.
   - **Opción B:** 30 días.
   - **Opción C:** 60 días.
2. Después de la devolución, Stockora elimina los datos en un plazo máximo de **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** 30 días.
   - **Opción B:** 60 días.
   - **Opción C:** 90 días.
3. Se conservan los datos exigidos por ley o necesarios para defensa de reclamaciones, con acceso restringido.
4. Las copias de seguridad se eliminan según su ciclo de 30 días.
5. Stockora certifica la eliminación cuando el Cliente lo solicite.

## 15. Responsabilidad

1. Cada parte responde por el cumplimiento de sus obligaciones.
2. El Cliente responde por la licitud de los datos que carga y por las instrucciones que imparte.
3. Stockora responde por el tratamiento que realice fuera de las instrucciones o de la ley.
4. Las limitaciones de responsabilidad del contrato principal aplican en la medida permitida por la ley.
5. Nada en este contrato limita derechos irrenunciables de los titulares.

## 16. Vigencia y terminación

1. El contrato rige mientras Stockora trate datos del Cliente.
2. Termina con el contrato principal o por incumplimiento grave.
3. Las obligaciones de confidencialidad, devolución, eliminación y responsabilidad sobreviven.
4. Si el Cliente no retira los datos, se aplica la cláusula 14.

## 17. Ley aplicable y disputas

1. Se rige por las leyes de la República de Colombia.
2. Las partes intentan resolver las diferencias de buena fe.
3. Si no hay acuerdo, acuden a **[REVISAR CON ABOGADO]**:
   - **Opción A (recomendada):** jueces competentes de [DATO PENDIENTE: ciudad].
   - **Opción B:** arbitraje ante el centro [DATO PENDIENTE].
   - **Opción C:** conciliación previa y luego jueces.

## 18. Anexos

### Anexo A — Datos y finalidades

| Dato | Titular | Finalidad | Base legal | Retención |
|---|---|---|---|---|
| Nombre y documento | Clientes del Cliente | Identificación | Autorización del Cliente | Según Política de Retención |
| Correo y teléfono | Clientes del Cliente | Contacto | Autorización del Cliente | Según Política de Retención |
| Movimientos e inventario | Usuarios del Cliente | Operación | Ejecución del contrato | Según Política de Retención |
| IP y agente | Usuarios | Seguridad | Interés legítimo / seguridad | 90 días |

### Anexo B — Medidas de seguridad

- Control de acceso basado en roles y empresa.
- Contraseñas con hash Argon2id.
- Tokens de sesión con expiración y revocación.
- HTTPS/TLS.
- Registro de auditoría.
- Copias de seguridad cifradas.
- Bloqueo por intentos fallidos.
- Revisión de dependencias y parches.
- Monitoreo de errores y disponibilidad.
- Procedimiento de incidentes y continuidad.

### Anexo C — Subencargados

Ver cláusula 8.

### Anexo D — Instrucciones iniciales

1. Alojar y procesar los datos para las funcionalidades contratadas.
2. Generar reportes y respaldos.
3. Atender soporte y seguridad.
4. No usar los datos para fines propios.
5. Aplicar la Política de Retención.

## 19. Firmas

| Cliente (Responsable) | Stockora (Encargado) |
|---|---|
| Nombre: [DATO PENDIENTE] | Nombre: [DATO PENDIENTE] |
| Cargo: [DATO PENDIENTE] | Cargo: [DATO PENDIENTE] |
| NIT: [DATO PENDIENTE] | NIT: [DATO PENDIENTE] |
| Fecha: [DATO PENDIENTE] | Fecha: [DATO PENDIENTE] |
| Firma: ______________________ | Firma: ______________________ |

---

**Fin del documento.**
