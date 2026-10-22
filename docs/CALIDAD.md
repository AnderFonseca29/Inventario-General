# Política de calidad del repositorio

Este documento resume las reglas de calidad automática del repositorio de
Stockora, cómo se comprueban y qué queda fuera de la verificación automática.

---

## 1. Codificación de texto: UTF-8 sin BOM

Todo el texto del repositorio (código, plantillas, SQL, JSON, YAML, Markdown)
se guarda en **UTF-8 sin Byte Order Mark** y con saltos de línea **LF**.

Motivo: una codificación rota produce textos ilegibles en la interfaz y en los
correos, y ese tipo de fallo es difícil de detectar a simple vista.

### Reglas

| Regla | Detalle |
|---|---|
| Codificación | UTF-8 (sin BOM) en todos los archivos de texto |
| Saltos de línea | LF (CRLF solo en Windows si la herramienta lo impone) |
| `.gitattributes` | Normaliza y marca los archivos de texto como `text eol=lf` |
| `.editorconfig` | Fija `charset = utf-8`, `end_of_line = lf`, `insert_final_newline` |

### Herramientas

| Archivo | Función |
|---|---|
| `scripts/check-encoding.mjs` | Detecta mojibake, BOM y archivos que no son UTF-8 válido. Devuelve código de salida `1` si encuentra problemas. Acepta `--files <lista>` para revisar solo una lista de archivos. |
| `scripts/fix-encoding.mjs` | Repara lo reparable sin introducir mojibake nuevo: quita el BOM y deshace la doble codificación UTF-8 → Latin-1 → UTF-8. Con `--apply` escribe los cambios; sin él solo informa (simulación). |
| `.githooks/pre-commit` | Bloquea el commit si los archivos en staging tienen la codificación rota. Se puede saltar con `SKIP_ENCODING_CHECK=1 git commit ...` (uso excepcional). |
| `scripts/install-hooks.mjs` | Instala el hook y configura `core.hooksPath = .githooks` en el repositorio local. |
| `.github/workflows/ci.yml` | Job `codificacion`: ejecuta la comprobación y la simulación de reparación en cada `push` a `main`, `fix/**`, `feature/**` y en cada pull request. |

### Uso habitual

```bash
# Revisar todo el repositorio
node scripts/check-encoding.mjs

# Revisar solo lo que se va a commitear
git diff --cached --name-only --diff-filter=ACMR > /tmp/archivos.txt
node scripts/check-encoding.mjs --files /tmp/archivos.txt

# Normalizar (simulación primero)
node scripts/fix-encoding.mjs
node scripts/fix-encoding.mjs --apply
```

### Instalación del hook (una vez por máquina)

```bash
node scripts/install-hooks.mjs
```

---

## 2. Verificaciones de compilación y pruebas

| Componente | Comando | Estado actual |
|---|---|---|
| Backend (NestJS) | `cd backend && npm run build` | Correcto |
| Backend (pruebas) | `cd backend && npm test` | 17 suites / 86 pruebas correctas |
| Frontend (Angular) | `cd frontend && npm run build` | Correcto |

---

## 3. Base de datos y migraciones

Las migraciones de Prisma están en `backend/prisma/migrations/`.

Reglas aplicadas en este repositorio:

- **Idempotencia**: una migración puede ejecutarse más de una vez sin efectos
  secundarios. Se comprueba con la condición `AND "nombre" = '<valor anterior>'`
  en los `UPDATE`, de modo que solo se modifican las filas que conservan el
  valor viejo y nunca se pisa una personalización del administrador.
- **Alcance acotado**: los módulos personalizados no se tocan; solo los de tipo
  `SISTEMA`.
- **Prueba previa**: cada migración debe probarse contra una base de datos
  PostgreSQL real antes de fusionarla.

Comprobación local (PostgreSQL 18):

```bash
cd backend
export DATABASE_URL="postgresql://postgres@localhost:5432/base_de_pruebas?schema=public"
npx prisma migrate deploy
npm run prisma:seed
```

---

## 4. Pendiente de verificación manual

Estos puntos **no** están cubiertos por la verificación automática y requieren
una acción manual:

- [ ] **Base de datos de producción**: comprobar que los textos guardados
      (nombres de módulos, permisos, funcionalidades, mensajes de error
      guardados como datos) no tienen doble codificación. Necesita el
      `DATABASE_URL` de producción.
- [ ] **Correos**: comprobar que las plantillas de correo se leen bien con
      acentos. Hoy el backend **no tiene módulo de correo transaccional**
      (no hay `nodemailer` ni `SendGrid` en `backend/src`); está pendiente de
      implementación.
- [ ] **Correo electrónico en general**: al implementar el envío de correos
      hay que fijarse en el `Content-Type: text/html; charset=utf-8` y en la
      cabecera `MIME-Version`.

---

## 5. Integraciones

El estado de cada integración externa (Wompi, Google, correo, CAPTCHA,
monitoreo) está en `docs/integraciones.md`, con el nivel de verificación de
cada una: **lista en código**, **probada en sandbox** o **pendiente de llaves**.
