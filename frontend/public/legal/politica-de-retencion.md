# Política de Retención y Eliminación de Datos Personales

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Versión: 0.1-borrador · Fecha: 28 de octubre de 2026 · Idioma: español (Colombia)

Esta política define cuánto tiempo conserva Stockora los datos personales, cómo los elimina o anonimiza y qué evidencia queda de cada purga. Aplica a Stockora como **Responsable** de los datos de sus usuarios y como **Encargada** de los datos que las empresas-cliente cargan en la plataforma.

## 1. Principios

1. **Minimización:** solo se conserva lo necesario para la finalidad informada.
2. **Finalidad:** no se reutilizan datos para fines incompatibles.
3. **Plazo definido:** cada categoría tiene un plazo máximo y un evento de inicio.
4. **Trazabilidad:** toda purga deja registro de fecha, responsable, alcance y resultado.
5. **Excepciones:** si existe una reclamación, investigación, requerimiento de autoridad o deber legal, se suspende la purga (legal hold).

## 2. Plazos por categoría

Los plazos de la columna “Plazo propuesto” son una propuesta operativa. Los plazos legales aplicables deben confirmarse con el abogado y con la normativa vigente. **[REVISAR CON ABOGADO]**

| Categoría | Datos | Finalidad | Plazo propuesto | Inicio | Destino |
|---|---|---|---|---|---|
| Cuenta y acceso | Nombre, correo, usuario, rol, hash de contraseña, IP y agente de usuario | Autenticación y seguridad | Vigencia de la cuenta + 6 meses | Cierre de la cuenta | Eliminación o anonimización |
| Datos de la empresa-cliente | Inventario, movimientos, bodegas, cargues, reportes | Prestación del servicio | Vigencia del contrato | Terminación | Devolución y eliminación en 30 días, salvo deber legal |
| Facturación y pagos | Plan, periodos, montos, estado, referencias de pago | Cobro y contabilidad | 5 años **[VERIFICAR]** | Cierre del periodo | Conservación legal |
| Solicitudes de derechos | Nombre, documento, correo, mensaje, respuesta | Atender derechos y defensa | 5 años **[VERIFICAR]** | Cierre de la solicitud | Anonimización |
| Auditoría | Acción, entidad, usuario, IP, cambios | Seguridad y trazabilidad | 5 años **[VERIFICAR]** | Registro | Eliminación |
| Logs técnicos | Errores, peticiones, latencia | Operación y seguridad | 90 días | Registro | Eliminación |
| Intentos de login | Correo, IP, resultado | Bloqueo y seguridad | 30 días | Registro | Eliminación automática |
| Tokens de sesión | Hash, expiración, revocación | Sesión segura | 30 días después de expirar o revocar | Expiración/revocación | Eliminación automática |
| Consentimiento de cookies | Decisión, fecha, categorías | Probar el consentimiento | 12 meses | Decisión | Renovación del consentimiento |
| Backups | Copia cifrada de la base | Recuperación | 30 días | Copia | Destrucción segura |
| Comunicaciones comerciales | Correo, teléfono, preferencias | Marketing | 2 años desde la última interacción o hasta la revocatoria | Última interacción | Eliminación |
| Soporte | Tickets, adjuntos | Atención | 2 años | Cierre | Eliminación |
| Incidentes | Registro, afectados, acciones | Seguridad y defensa | 5 años **[VERIFICAR]** | Cierre del incidente | Conservación restringida |

## 3. Reglas de cálculo

1. El plazo se cuenta desde el evento indicado en la columna “Inicio”.
2. Si el último día es inhábil, se entiende prorrogado al siguiente día hábil.
3. Una solicitud de derechos **abierta** no se purga hasta su cierre.
4. Si hay una reclamación o requerimiento, el registro se marca como `LEGAL_HOLD` y se excluye de la purga.
5. Los datos de menores o sensibles recibidos por error se eliminan de inmediato y se documenta el hecho.

## 4. Purga técnica

### 4.1 Automática

Ya implementada:

- `refresh_tokens`: se eliminan los expirados y los revocados con más de 30 días.
- `intentos_login`: se eliminan los registros con más de 30 días.
- Consentimiento de cookies: el navegador descarta la decisión después de 12 meses y vuelve a pedir el consentimiento.

Esta purga corre al iniciar el backend y cada hora. No requiere intervención manual.

### 4.2 Asistida

Los registros con valor probatorio (solicitudes de derechos, auditoría, facturación) **no se borran automáticamente**. Se revisan con el siguiente reporte:

```bash
cd backend
npm run retencion:reporte
```

El reporte muestra conteos por antigüedad, sin datos personales. La purga se ejecuta después de la aprobación del responsable de datos y con un ticket de cambio.

### 4.3 Anonimización de solicitudes de derechos

Cuando se cumpla el plazo y no exista legal hold, se reemplazan los datos identificables por marcadores:

```sql
-- Plantilla. No ejecutar sin aprobación y copia de seguridad.
UPDATE solicitudes_derechos
SET nombre = 'ANONIMIZADO',
    documento = 'ANONIMIZADO',
    correo = 'anonimizado@example.invalid',
    telefono = NULL,
    empresa = NULL,
    mensaje = '[ANONIMIZADO]',
    respuesta = NULL,
    ip = NULL,
    "userAgent" = NULL
WHERE estado IN ('RESPONDIDA', 'CERRADA', 'RECHAZADA')
  AND COALESCE(fechaRespuesta, fechaRecepcion) < NOW() - INTERVAL '5 years';
```

Se conservan `radicado`, `tipo`, `estado`, `fechaRecepcion`, `fechaLimite` y `fechaRespuesta` para estadísticas y defensa.

## 5. Procedimiento de purga

1. **Programación:** revisión trimestral (enero, abril, julio y octubre).
2. **Reporte:** ejecutar `npm run retencion:reporte` y guardar la salida.
3. **Revisión:** confirmar que no hay `LEGAL_HOLD`, solicitudes abiertas ni requerimientos.
4. **Aprobación:** [DATO PENDIENTE: responsable de datos] autoriza por escrito.
5. **Respaldo:** verificar que existe una copia reciente y que el borrado no afecta la recuperación.
6. **Ejecución:** aplicar la anonimización o eliminación con el script aprobado.
7. **Verificación:** contar registros restantes y comprobar que no quedan datos identificables.
8. **Evidencia:** archivar fecha, operador, alcance, conteos, ticket y hash del reporte.
9. **Excepción:** si algo falla, detener, restaurar desde respaldo y documentar el incidente.

## 6. Evidencia y auditoría

Por cada purga se conserva:

- Fecha y hora (zona Colombia).
- Categoría y rango de fechas.
- Número de registros afectados.
- Método (eliminación o anonimización).
- Identificador del operador y del ticket.
- Hash SHA-256 del reporte.
- Confirmación del responsable.

La evidencia se guarda en el repositorio documental de cumplimiento, con acceso restringido.

## 7. Datos de empresas-cliente

1. La empresa-cliente es la **Responsable** de los datos que carga.
2. Stockora solo los trata siguiendo sus instrucciones.
3. Al terminar el contrato, Stockora devuelve los datos en un formato utilizable y los elimina en un plazo máximo de 30 días, salvo que la ley exija conservarlos.
4. Si la empresa-cliente no retira los datos, se aplica el procedimiento de terminación del contrato y se deja constancia.
5. La eliminación de backups sigue el ciclo de 30 días.

## 8. Excepciones y legal hold

Se suspende la purga cuando:

- Existe una solicitud de derechos en trámite.
- Existe una reclamación, demanda o investigación.
- Una autoridad competente lo requiere.
- La ley exige conservar el dato (por ejemplo, obligaciones contables o tributarias).
- El dato es necesario para prevenir fraude o incidentes de seguridad.

El legal hold se revisa cada trimestre y se libera cuando desaparece la causa.

## 9. Roles

| Rol | Responsabilidad |
|---|---|
| Responsable de datos | Aprobar plazos y purgas |
| Seguridad | Ejecutar y verificar la purga técnica |
| Abogado | Validar plazos legales y legal holds |
| Soporte | Reportar datos que deban eliminarse |
| Empresa-cliente | Instruir el destino de sus datos |

## 10. Revisión

Esta política se revisa al menos una vez al año, cuando cambie la ley o cuando se agregue una nueva categoría de datos.

## Anexo A — Opciones para revisión del abogado

### A.1 Plazo de solicitudes de derechos

- **Opción A (recomendada):** 5 años desde el cierre. Impacto: defensa ante reclamaciones.
- **Opción B:** 3 años. Impacto: menor retención, menor evidencia.
- **Opción C:** 1 año. Impacto: riesgo de perder prueba.

### A.2 Plazo de auditoría

- **Opción A (recomendada):** 5 años. Impacto: trazabilidad amplia.
- **Opción B:** 2 años. Impacto: menor costo de almacenamiento.
- **Opción C:** 1 año. Impacto: difícil investigar incidentes antiguos.

### A.3 Datos de empresas-cliente al terminar

- **Opción A (recomendada):** devolver y eliminar en 30 días. Impacto: cumple el rol de Encargada.
- **Opción B:** conservar 90 días por si hay disputas. Impacto: mayor retención.
- **Opción C:** conservar indefinidamente. Impacto: riesgo alto de incumplimiento.

---

**Fin del documento.**
