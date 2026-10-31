import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  DerechosService,
  PaginaDerechos,
  SolicitudDerechosAdmin,
} from '../../core/services/derechos.service';
import { ToastService } from '../../core/services/toast.service';
import { DerechosAdminComponent } from './derechos-admin.component';

describe('DerechosAdminComponent', () => {
  const derechos = {
    listar: vi.fn(),
    obtener: vi.fn(),
    responder: vi.fn(),
  };
  const toast = {
    exito: vi.fn(),
    error: vi.fn(),
  };

  const solicitud: SolicitudDerechosAdmin = {
    id: '11111111-1111-1111-1111-111111111111',
    radicado: 'DER-20261030-ABCDEF12',
    tipo: 'CONSULTA',
    nombre: 'Ana Pérez',
    documento: '1020304050',
    correo: 'ana@example.com',
    telefono: '+57 300 555 0000',
    empresa: 'El Roble',
    mensaje: 'Solicito conocer los datos personales que tienen sobre mí.',
    autorizacion: true,
    estado: 'RECIBIDA',
    fechaRecepcion: '2026-10-30T15:00:00.000Z',
    fechaLimite: '2026-11-16T04:59:59.999Z',
    fechaRespuesta: null,
    respuesta: null,
    respondidoPorId: null,
    respondidoPor: null,
    ip: '127.0.0.1',
    userAgent: 'vitest',
    createdAt: '2026-10-30T15:00:00.000Z',
    updatedAt: '2026-10-30T15:00:00.000Z',
  };

  const pagina: PaginaDerechos = {
    items: [solicitud],
    total: 1,
    pagina: 1,
    limite: 20,
    resumen: { abiertas: 1, respondidas: 0, vencidas: 0 },
  };

  beforeEach(async () => {
    derechos.listar.mockReset();
    derechos.obtener.mockReset();
    derechos.responder.mockReset();
    toast.exito.mockReset();
    toast.error.mockReset();
    derechos.listar.mockReturnValue(of(pagina));

    await TestBed.configureTestingModule({
      imports: [DerechosAdminComponent],
      providers: [
        { provide: DerechosService, useValue: derechos },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(DerechosAdminComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga la bandeja y muestra el solicitante y su radicado', () => {
    const fixture = crear();
    const texto = fixture.nativeElement.textContent as string;

    expect(derechos.listar).toHaveBeenCalledWith({
      pagina: 1,
      limite: 20,
    });
    expect(texto).toContain('Ana Pérez');
    expect(texto).toContain('DER-20261030-ABCDEF12');
    expect(texto).toContain('Recibida');
  });

  it('marca las solicitudes abiertas cuyo plazo ya venció', () => {
    derechos.listar.mockReturnValue(
      of({
        ...pagina,
        items: [{ ...solicitud, fechaLimite: '2020-01-01T00:00:00.000Z' }],
        resumen: { abiertas: 1, respondidas: 0, vencidas: 1 },
      }),
    );
    const fixture = crear();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Vencida');
    expect(fixture.nativeElement.querySelector('.pqr-vencida')).not.toBeNull();
  });

  it('filtra por estado y vuelve a la primera página', () => {
    const fixture = crear();
    const componente = fixture.componentInstance;

    componente.cambiarEstado('RESPONDIDA');

    expect(derechos.listar).toHaveBeenLastCalledWith({
      pagina: 1,
      limite: 20,
      estado: 'RESPONDIDA',
    });
  });

  it('abre el detalle y registra la respuesta', () => {
    derechos.obtener.mockReturnValue(of(solicitud));
    derechos.responder.mockReturnValue(
      of({
        ...solicitud,
        estado: 'RESPONDIDA',
        respuesta: 'Se remitió la información al correo registrado.',
        fechaRespuesta: '2026-10-31T15:00:00.000Z',
      }),
    );
    const fixture = crear();
    const componente = fixture.componentInstance;

    componente.abrirDetalle(solicitud);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Solicito conocer los datos personales');

    componente.form.setValue({
      respuesta: 'Se remitió la información al correo registrado.',
      estado: 'RESPONDIDA',
    });
    componente.guardarRespuesta();

    expect(derechos.responder).toHaveBeenCalledWith(solicitud.id, {
      respuesta: 'Se remitió la información al correo registrado.',
      estado: 'RESPONDIDA',
    });
    expect(toast.exito).toHaveBeenCalled();
    expect(componente.detalleAbierto()).toBe(false);
    expect(derechos.listar).toHaveBeenCalledTimes(2);
  });

  it('no envía una respuesta demasiado corta', () => {
    derechos.obtener.mockReturnValue(of(solicitud));
    const fixture = crear();
    const componente = fixture.componentInstance;

    componente.abrirDetalle(solicitud);
    componente.form.setValue({ respuesta: 'Corto', estado: 'RESPONDIDA' });
    componente.guardarRespuesta();
    fixture.detectChanges();

    expect(derechos.responder).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.form-error')).not.toBeNull();
  });
});
