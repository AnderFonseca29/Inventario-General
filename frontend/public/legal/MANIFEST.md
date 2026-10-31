# Registro de versiones y hashes

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Fecha de cálculo: 30 de octubre de 2026 · Algoritmo: SHA-256

Cualquier cambio en un documento exige: (1) nueva versión, (2) nueva fecha, (3) nuevo hash y (4) registro en este manifiesto. No se debe publicar un documento sin hash actualizado.

| Documento | Versión | Fecha | SHA-256 | Estado | Rama |
|---|---|---|---|---|---|
| `aviso-de-privacidad.md` | 0.2-borrador | 2026-10-30 | `eeb9e847b6b30e5493a8d328d5621117eb2f8b4b720a539e2af4bd55ca062ea5` | Borrador | `feat/registro-directo` |
| `contrato-de-encargo.md` | 0.2-borrador | 2026-10-30 | `6d65f343f4dddcd24fcd14798a45323a18dd58a8b59216d1cc862568586b3f84` | Borrador | `feat/registro-directo` |
| `derechos-de-los-titulares.md` | 0.2-borrador | 2026-10-30 | `9122a31f572e2b1742448e56fd44c27ad8ca4b36a5e77c1b3fee42d02c8dbd31` | Borrador | `feat/registro-directo` |
| `politica-de-cookies.md` | 0.2-borrador | 2026-10-30 | `1cc7e30c09c254b995f0916ce9267d499ebc9f98310edb8ad2ff8e37c7f295be` | Borrador | `feat/registro-directo` |
| `politica-de-privacidad.md` | 0.2-borrador | 2026-10-30 | `e9caa7a2abff0fc92b769e51c970a7c0d633c73cf922da87202261a51e1d6c0a` | Borrador | `feat/registro-directo` |
| `politica-de-retencion.md` | 0.2-borrador | 2026-10-30 | `0be4b36ec7bd916e358e01b250cf2d782ee19048abf81f42abf1f3a3837f17ea` | Borrador | `feat/registro-directo` |
| `politica-de-tratamiento-de-datos.md` | 0.2-borrador | 2026-10-30 | `b2a9db942c5cb2727c982cd6ee63d5e8bc47622f0b934e2b062c42d1ae0dbf0d` | Borrador | `feat/registro-directo` |
| `terminos-y-condiciones.md` | 0.2-borrador | 2026-10-30 | `8352867ad633d1bb6eaae10120fd3a7ba59c068f88d56c06c1f1c86eebc91965` | Borrador | `feat/registro-directo` |
| `uso-aceptable.md` | 0.2-borrador | 2026-10-30 | `793971d6364e17a67d666479d0a8f9c185e951b8451bd6fa2384c5d6c23db198` | Borrador | `feat/registro-directo` |

## Pendientes de esta rama

- Revisión por abogado con licencia en Colombia.
- Completar la identidad legal del prestador (razón social, NIT, domicilio, correo, teléfono, matrícula y representante legal) en los nueve documentos y en `src/app/core/legal/documentos.ts`.
- Actualizar los documentos del plan cuando exista facturación electrónica y pasarela de pagos habilitada.

## Aceptaciones electrónicas

- Versión vigente: `0.2-borrador` (2026-10-30).
- Documentos exigidos al usuario: Términos y Condiciones, Política de Privacidad y Uso Aceptable.
- Fuente de verdad de versión y hash: `backend/src/legal/documentos-legales.ts`.
- Registro: tabla `aceptaciones_legales` con usuario, documento, versión, hash, método, IP, agente de usuario y fecha.
- El modal de aceptación no se puede cerrar con Escape ni con clic fuera; la única salida es aceptar o cerrar sesión.
- Al cambiar un documento se debe crear una nueva versión, actualizar su hash, desplegar el backend y volver a pedir la aceptación.

## Verificación

`npm run verificar:legal` comprueba que estos hashes coincidan con los archivos, que el catálogo del frontend y el backend registren la misma versión y que no se publique en modo `final` con datos pendientes.

Para recalcular manualmente:

```powershell
Get-ChildItem frontend/public/legal/*.md |
  Where-Object { $_.Name -notin @('MANIFEST.md','README.md') } |
  ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name }
```
