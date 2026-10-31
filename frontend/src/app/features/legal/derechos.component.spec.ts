import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  ConsultaDerechos,
  DerechosService,
  RadicadoDerechos,
} from '../../core/services/derechos.service';
import { DerechosComponent } from './derechos.component';

describe('DerechosComponent', () => {
  const derechos = {
    crear: vi.fn(),
    consultar: vi.fn(),
  };

  beforeEach(async () => {
    derechos.crear.mockReset();
    derechos.consultar.mockReset();

    await TestBed.configureTestingModule({
      imports: [DerechosComponent],
      providers: [
        provideRouter([]),
        { provide: DerechosService, useValue: derechos },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  function crear() {
    const fixture = TestBed.createComponent(DerechosComponent);
    fixture.detectChanges();
    return fixture;
  }

  const radicado: RadicadoDerechos = {
    radicado: 'DER-20261030-ABCDEF12',
    tipo: 'CONSULTA',
    estado: 'RECIBIDA',
    fechaRecepcion: '2026-10-30T15:00:00.000Z',
    fechaLimite: '2026-11-16T04:59:59.999Z',
  };

  const consulta: ConsultaDerechos = {
    radicado: radicado.radicado,
    tipo: 'CONSULTA',
    estado: 'RESPONDIDA',
    fechaRecepcion: radicado.fechaRecepcion,
    fechaLimite: radicado.fechaLimite,
    fechaRespuesta: '2026-11-02T15:00:00.000Z',
    respuesta: 'Remitimos la información solicitada al correo registrado.',
  };

  function llenarFormulario(componente: DerechosComponent): void {
    componente.form.setValue({
      tipo: 'CONSULTA',
      nombre: 'Ana Pérez',
      documento: '1020304050',
      correo: 'ana@example.com',
      telefono: '',
      empresa: '',
      mensaje: 'Solicito conocer los datos personales que la empresa tiene sobre mí.',
      autorizacion: true,
    });
  }

  it('muestra el radicado, el estado y la opción de copiarlo', () => {
    derechos.crear.mockReturnValue(of(radicado));
    const fixture = crear();
    const componente = fixture.componentInstance;

    llenarFormulario(componente);
    componente.enviar();
    fixture.detectChanges();

    expect(derechos.crear).toHaveBeenCalledTimes(1);
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('DER-20261030-ABCDEF12');
    expect(texto).toContain('Recibida');
    expect(
      fixture.nativeElement.querySelector('.der-copiar').textContent,
    ).toContain('Copiar radicado');
  });

  it('muestra la respuesta y el plazo vencido al consultar', () => {
    derechos.consultar.mockReturnValue(of(consulta));
    const fixture = crear();
    const componente = fixture.componentInstance;

    componente.consultaForm.setValue({
      radicado: consulta.radicado,
      correo: 'ana@example.com',
    });
    componente.consultar();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Respondida');
    expect(texto).toContain(consulta.respuesta);
    expect(texto).not.toContain('Plazo vencido');

    derechos.consultar.mockReturnValue(
      of({
        ...consulta,
        estado: 'EN_TRAMITE',
        respuesta: null,
        fechaLimite: '2020-01-01T00:00:00.000Z',
      }),
    );
    componente.consultar();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.der-vencido').textContent,
    ).toContain('Plazo vencido');
  });

  it('usa enlaces internos y no apunta a archivos .md', () => {
    const fixture = crear();
    const enlaces: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    );
    const destinos = enlaces.map((enlace) => enlace.getAttribute('href') ?? '');

    expect(destinos.some((destino) => destino.endsWith('.md'))).toBe(false);
    expect(destinos).toContain('/legal/derechos');
    expect(destinos).toContain('/legal/privacidad');
    expect(destinos).toContain('/legal/aviso');
    expect(destinos).toContain('/contacto');
  });

  it('copia el radicado cuando el navegador lo permite', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const fixture = crear();
    const componente = fixture.componentInstance;
    componente.radicado.set(radicado);

    await componente.copiarRadicado();

    expect(writeText).toHaveBeenCalledWith(radicado.radicado);
    expect(componente.copiado()).toBe(true);
  });
});
