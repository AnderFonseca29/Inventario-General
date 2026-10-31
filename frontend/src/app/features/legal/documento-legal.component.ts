import { DOCUMENT } from '@angular/common';
import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DocumentoLegalPublico,
  FECHA_LEGAL_TEXTO,
  VERSION_LEGAL,
  buscarDocumento,
  urlArchivoLegal,
} from '../../core/legal/documentos';
import { MarkdownService } from '../../core/legal/markdown.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteFooterComponent } from '../landing/sections/site-footer.component';
import { EncabezadoPublicoComponent } from './encabezado-publico.component';
import { environment } from '../../../environments/environment';

type EstadoDocumento = 'cargando' | 'listo' | 'error' | 'no-encontrado';

@Component({
  selector: 'app-documento-legal',
  imports: [RouterLink, EncabezadoPublicoComponent, SiteFooterComponent],
  templateUrl: './documento-legal.component.html',
  styleUrl: './documento-legal.component.scss',
  // Los estilos deben alcanzar el HTML que llega del Markdown.
  encapsulation: ViewEncapsulation.None,
})
export class DocumentoLegalComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly markdown = inject(MarkdownService);
  private readonly seo = inject(SeoService);
  private readonly documentoBase = inject(DOCUMENT);

  readonly estado = signal<EstadoDocumento>('cargando');
  readonly documento = signal<DocumentoLegalPublico | null>(null);
  readonly html = signal('');
  readonly version = VERSION_LEGAL;
  readonly fecha = FECHA_LEGAL_TEXTO;
  readonly borrador = environment.legalMode === 'draft';

  constructor() {
    this.ruta.paramMap.subscribe((parametros) => {
      this.cargar(parametros.get('clave') ?? '');
    });
  }

  reintentar(): void {
    const documento = this.documento();
    if (documento) {
      this.cargar(documento.clave);
    }
  }

  imprimir(): void {
    window.print();
  }

  private cargar(clave: string): void {
    const documento = buscarDocumento(clave);

    if (!documento) {
      this.documento.set(null);
      this.html.set('');
      this.estado.set('no-encontrado');
      return;
    }

    this.documento.set(documento);
    this.estado.set('cargando');
    this.html.set('');

    this.seo.setPagina({
      titulo: `${documento.titulo} | Stockora`,
      descripcion: documento.resumen,
      ruta: `/legal/${documento.clave}`,
      tipo: 'article',
    });

    const url = urlArchivoLegal(documento.archivo, this.documentoBase.baseURI);

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (markdown) => {
        // El título ya se muestra en la cabecera de la página.
        const sinTitulo = markdown.replace(/^#\s+.*\r?\n+/, '');
        this.html.set(this.markdown.aHtml(sinTitulo));
        this.estado.set('listo');
      },
      error: () => this.estado.set('error'),
    });
  }
}
