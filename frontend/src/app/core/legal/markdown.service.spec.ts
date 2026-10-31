import { TestBed } from '@angular/core/testing';
import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  let servicio: MarkdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(MarkdownService);
  });

  it('convierte títulos, listas y tablas', () => {
    const html = servicio.aHtml('## Sección\n\n- uno\n- dos\n\n| A | B |\n|---|---|\n| 1 | 2 |');

    expect(html).toContain('<h2');
    expect(html).toContain('<li>uno</li>');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('elimina scripts y manejadores de eventos', () => {
    const html = servicio.aHtml('<script>alert("xss")</script><p onclick="alert(1)">texto</p>');

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).toContain('texto');
  });
});
