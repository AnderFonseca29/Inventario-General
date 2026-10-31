import { SecurityContext } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

/**
 * Convierte los documentos legales de Markdown a HTML seguro.
 *
 * Los archivos son propios, pero el resultado se sanitiza igual: si un
 * documento llegara a incluir HTML con scripts o eventos, Angular lo elimina
 * antes de insertarlo en la página.
 */
@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly sanitizer = inject(DomSanitizer);

  aHtml(markdown: string): string {
    const html = marked.parse(markdown, { async: false, gfm: true });
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
