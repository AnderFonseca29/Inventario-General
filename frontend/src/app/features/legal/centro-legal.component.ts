import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DOCUMENTOS_LEGALES,
  FECHA_LEGAL_TEXTO,
  GRUPOS_LEGALES,
  VERSION_LEGAL,
  documentosPorGrupo,
} from '../../core/legal/documentos';
import { SeoService } from '../../core/services/seo.service';
import { SiteFooterComponent } from '../landing/sections/site-footer.component';
import { EncabezadoPublicoComponent } from './encabezado-publico.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-centro-legal',
  imports: [RouterLink, EncabezadoPublicoComponent, SiteFooterComponent],
  templateUrl: './centro-legal.component.html',
  styleUrl: './centro-legal.component.scss',
})
export class CentroLegalComponent {
  private readonly seo = inject(SeoService);

  readonly grupos = GRUPOS_LEGALES;
  readonly documentos = DOCUMENTOS_LEGALES;
  readonly documentosPorGrupo = documentosPorGrupo;
  readonly version = VERSION_LEGAL;
  readonly fecha = FECHA_LEGAL_TEXTO;
  readonly borrador = environment.legalMode === 'draft';

  constructor() {
    this.seo.setPagina({
      titulo: 'Centro legal | Stockora',
      descripcion:
        'Términos, privacidad, tratamiento de datos, cookies y derechos de los titulares de Stockora.',
      ruta: '/legal',
    });
  }
}
