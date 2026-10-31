import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IDENTIDAD_STOCKORA, esDatoPendiente } from '../../core/legal/documentos';
import { SeoService } from '../../core/services/seo.service';
import { SiteFooterComponent } from '../landing/sections/site-footer.component';
import { EncabezadoPublicoComponent } from './encabezado-publico.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacto',
  imports: [RouterLink, EncabezadoPublicoComponent, SiteFooterComponent],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.scss',
})
export class ContactoComponent {
  private readonly seo = inject(SeoService);

  readonly identidad = IDENTIDAD_STOCKORA;
  readonly esPendiente = esDatoPendiente;
  readonly borrador = environment.legalMode === 'draft';

  constructor() {
    this.seo.setPagina({
      titulo: 'Contacto | Stockora',
      descripcion:
        'Canales de Stockora para soporte, privacidad, seguridad y ejercicio de derechos sobre datos personales.',
      ruta: '/contacto',
    });
  }
}
