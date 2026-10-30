# Pendientes de la landing pública

Actualizado: 29 de octubre de 2026.

Este documento separa lo que ya está implementado de lo que todavía requiere una
decisión, un activo o una revisión externa. La landing no publica testimonios,
clientes, logos, cifras, premios ni certificaciones que no existan.

## Contenido y marca

- [ ] **Logo definitivo.** La marca provisional es el monograma «ST» en
      terracota. El componente `BrandMarkComponent` y el favicon conservan un
      `TODO(marca)` para sustituirlo por el logotipo vectorial aprobado.
- [ ] **Fotografías o ilustraciones propias.** No se usan fotos de stock. La
      vista previa y la imagen Open Graph son composiciones propias con datos de
      ejemplo. Si se aprueban fotografías, deben ser 6–8 candidatas con licencia
      verificada y consentimiento de uso.
- [ ] **Testimonios, clientes y resultados.** No hay autorizaciones ni datos
      verificables; no se publican hasta contar con evidencia y aprobación.
- [ ] **Datos de contacto y de la empresa.** No hay correo comercial, teléfono,
      dirección, NIT ni razón social confirmados para la página pública. No se
      inventan ni se publican como si estuvieran verificados.
- [ ] **Página de contacto.** El pie enlaza solo a páginas existentes. Cuando se
      apruebe el canal de contacto, crear la página y añadir el enlace.
- [ ] **Dominio definitivo.** La canónica, `og:url`, las imágenes sociales y el
      JSON-LD usan el `baseURI` de la aplicación en tiempo de ejecución. Al
      definir el dominio hay que fijar las URLs absolutas y actualizar
      `robots.txt`, el sitemap y la configuración de CORS si cambia el origen.

## Producto y planes

- [ ] **Endpoint público de planes.** La landing usa `landing.data.ts`, validado
      contra `backend/prisma/seed.ts` por `npm run verificar:planes`. Si se crea
      un endpoint público, la landing debe consumirlo sin duplicar reglas.
- [ ] **Alta real de empresas desde el registro.** El formulario valida los datos
      y muestra el estado de solicitud, pero el alta la gestiona actualmente el
      superadministrador. No se debe presentar como un alta automática.
- [ ] **Revisión de precios e impuestos.** Los valores publicados son los del
      seed (Básico $60.000, Medio $90.000 y Premium $120.000 COP). No se declara
      IVA ni periodicidad distinta hasta que exista una decisión comercial.

## Verificación ejecutada

Última revisión: 29 de octubre de 2026.

- [x] **Build de producción.** `npm run build -- --configuration production
      --base-href /Inventario-General/` completó sin errores. Los verificadores
      `verificar:colores` (33 archivos públicos) y `verificar:planes`
      (Básico $60.000, Medio $90.000, Premium $120.000 COP) pasan.
- [x] **Pruebas.** Frontend: 9 archivos y 44 pruebas aprobadas. Backend: 20
      suites y 97 pruebas aprobadas. Las pruebas e2e locales que requieren
      PostgreSQL se omiten si no hay base disponible; el CI las ejecuta contra
      PostgreSQL.
- [x] **Codificación.** `node scripts/check-encoding.mjs` revisó 353 archivos:
      UTF-8 válido y sin mojibake.
- [x] **axe-core 4.10.3.** Landing, login y registro en 360, 768 y 1280 px:
      0 violaciones WCAG 2.1 A/AA, 0 controles interactivos menores de 44 px,
      sin scroll horizontal, 10 secciones de landing cargadas y sin reveals
      pendientes.
- [x] **Lighthouse 12.8.2 móvil contra GitHub Pages.** Rendimiento 98,
      Accesibilidad 100, Buenas prácticas 100 y SEO 100. FCP 1,3 s, LCP 2,1 s,
      TBT 90 ms, CLS 0. La corrida se repitió sin procesos de Chrome en segundo
      plano; una medición anterior con contención de CPU se descartó.
- [x] **SEO y redes sociales en Pages.** `canonical`, `og:url`, `og:image`,
      JSON-LD `SoftwareApplication`, `lang="es"`, `theme-color` y manifest
      verificados en el sitio desplegado.
- [x] **Activos y backend.** La landing responde 200; fuentes, iconos,
      manifest, imagen OG y documentos legales responden 200. La API de
      producción responde 200 en `/api/health` y 204 en el preflight CORS para
      `https://anderfonseca29.github.io`.
- [x] **Interacción y movimiento.** Menú móvil probado con teclado (foco y
      Escape), checkbox de registro con área táctil de 44 × 44 px (caja visual
      de 20 px) y `prefers-reduced-motion` respetado.
- [x] **CI de GitHub Actions.** Codificación, frontend, backend y seguridad
      (gitleaks con `gitleaks.toml` para los falsos positivos de pruebas) en
      verde para el commit `af5aecd`.
- [ ] **Lector de pantalla.** Falta una revisión manual con NVDA o VoiceOver del
      menú móvil, el acordeón de preguntas y las pestañas de la vista previa.
- [ ] **Dominio definitivo.** Confirmar canónica, imágenes sociales, `robots.txt`
      y sitemap con el dominio final, no solo con el origen de GitHub Pages.

## Limitación conocida de GitHub Pages

La landing raíz responde HTTP 200. Las rutas SPA profundas, como `/login`,
`/registro` o las rutas internas, se sirven mediante `404.html`: la aplicación
carga y funciona, pero GitHub Pages mantiene el estado HTTP 404. Para obtener
200 reales en esas rutas hace falta un host con rewrites o publicar una carpeta
con `index.html` por ruta.

## Activos y licencias

| Activo | Origen | Licencia / nota |
| --- | --- | --- |
| `public/fonts/lora-latin-var.woff2` | Google Fonts, Lora variable (subset latino) | SIL Open Font License 1.1; ver `OFL-Lora.txt` |
| `public/fonts/inter-latin-var.woff2` | Google Fonts, Inter variable (subset latino) | SIL Open Font License 1.1; ver `OFL-Inter.txt` |
| `public/favicon.svg` | Composición propia | Monograma provisional; reemplazar por el logo definitivo |
| `public/icons/icon-64.png`, `icon-192.png`, `icon-512.png` | Composición propia | Generados desde el favicon provisional |
| `public/og-image.png` | Composición propia | 1200 × 630 px; datos de ejemplo, sin fotos de stock |
| `public/legal/*.md` | Documentos del proyecto | Sujetos a revisión legal antes de publicación definitiva |

Peso total de las dos fuentes: 86.044 bytes. La suma queda por debajo de los
100 KB acordados; no se carga una tercera familia.

## Excepciones al verificador de colores

`frontend/scripts/verificar-colores.mjs` revisa landing, navegación, pie, login y
registro. Los siguientes archivos declaran colores literalmente porque son
activos estáticos o metadatos que no pueden consumir variables CSS:

- `frontend/src/index.html` (`theme-color` y metadatos base).
- `frontend/public/manifest.webmanifest` (`theme_color`, `background_color`).
- `frontend/public/favicon.svg` y los PNG de iconos.
- `frontend/public/og-image.png`.

El archivo `frontend/src/styles/_brand.scss` es el único autorizado para declarar
los colores de la marca pública. Cualquier nuevo color de página debe añadirse
allí como variable `--brand-*`.

## Verificaciones automatizadas disponibles

```bash
cd frontend
npm run verificar:colores
npm run verificar:planes
npm test
npm run build
```

El despliegue de GitHub Pages compila con
`--base-href /Inventario-General/` y copia `index.html` a `404.html`. Las rutas
de fuentes, iconos, documentos legales y canónicas deben seguir siendo relativas
al `base href` para no romperse en ese subdirectorio.
