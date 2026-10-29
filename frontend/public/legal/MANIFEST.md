# Registro de versiones y hashes

> **BORRADOR: REVISIÓN OBLIGATORIA POR ABOGADO**
> Fecha de cálculo: 28 de octubre de 2026 · Algoritmo: SHA-256

Cualquier cambio en un documento exige: (1) nueva versión, (2) nueva fecha, (3) nuevo hash y (4) registro en este manifiesto. No se debe publicar un documento sin hash actualizado.

| Documento | Versión | Fecha | SHA-256 | Estado | Rama |
|---|---|---|---|---|---|
| `aviso-de-privacidad.md` | 0.1-borrador | 2026-10-28 | `52736494699839315c173e5eb50ab1c8c281aa8e136b26282c949c2b55350a83` | Borrador | `feat/legal-documentos` |
| `politica-de-privacidad.md` | 0.1-borrador | 2026-10-28 | `3c9026d9e6fbb70cdd0782248ad34be5d6b6686b03593ae204413bd6f863d398` | Borrador | `feat/legal-documentos` |
| `politica-de-cookies.md` | 0.1-borrador | 2026-10-28 | `92c4751304f36e1719001efa001747215e049521cd689aed1ccd6691d8bfed66` | Borrador | `feat/legal-cookies` |
| `politica-de-tratamiento-de-datos.md` | 0.1-borrador | 2026-10-28 | `2ba5102565594c84f3f0c56f12429bea545b0ddc2074de87a1015b5652ce576b` | Borrador | `feat/legal-documentos` |
| `terminos-y-condiciones.md` | 0.1-borrador | 2026-10-28 | `903582a2104c9470fd8b3c85dd0938b4d787908c4159d0eddc16f62a22cad6a7` | Borrador | `feat/legal-documentos` |
| `uso-aceptable.md` | 0.1-borrador | 2026-10-28 | `9715c4a3e4bd8b5a48fd0abea583699060aeb581be90f763618154eb9d300918` | Borrador | `feat/legal-documentos` |

## Pendientes de esta rama

- `derechos-de-los-titulares.md` → rama `feat/legal-derechos-titulares`.
- `politica-de-retencion.md` → rama `feat/legal-retencion`.
- Contrato de encargo (DPA) → rama `feat/legal-encargado`.
- Revisión por abogado con licencia en Colombia.

## Verificación

Para recalcular:

```powershell
Get-ChildItem frontend/public/legal/*.md |
  Where-Object { $_.Name -notin @('MANIFEST.md','README.md') } |
  ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name }
```
