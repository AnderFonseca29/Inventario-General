import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PaginaSeo {
  titulo: string;
  descripcion: string;
  ruta: string;
  imagen?: string;
  tipo?: 'website' | 'article';
}

interface DatosEstructurados {
  '@context': string;
  '@type': string;
  [clave: string]: unknown;
}

/**
 * Metadatos de las páginas públicas. La URL canónica se construye con el
 * origen real de la aplicación: el dominio definitivo todavía no está decidido.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /**
   * Resuelve una ruta contra el `<base href>` de la aplicación. En GitHub Pages
   * la base incluye `/Inventario-General/`, así que no se puede usar el origen
   * a secas para construir canónicas ni imágenes sociales.
   */
  url(ruta: string): string {
    const relativa = ruta.replace(/^\/+/, '');
    return new URL(relativa || './', this.document.baseURI).href;
  }

  setPagina(pagina: PaginaSeo): void {
    const url = this.url(pagina.ruta);
    const imagen = this.url(pagina.imagen ?? 'og-image.png');

    this.title.setTitle(pagina.titulo);
    this.meta.updateTag({ name: 'description', content: pagina.descripcion });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Stockora' });
    this.meta.updateTag({ property: 'og:type', content: pagina.tipo ?? 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CO' });
    this.meta.updateTag({ property: 'og:title', content: pagina.titulo });
    this.meta.updateTag({ property: 'og:description', content: pagina.descripcion });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imagen });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: 'Stockora, inventario y operación en una sola plataforma',
    });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pagina.titulo });
    this.meta.updateTag({ name: 'twitter:description', content: pagina.descripcion });
    this.meta.updateTag({ name: 'twitter:image', content: imagen });

    this.setCanonical(url);
  }

  setDatosEstructurados(datos: DatosEstructurados): void {
    const id = 'stockora-datos-estructurados';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(datos);
  }

  private setCanonical(url: string): void {
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
