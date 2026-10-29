import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(RegistroComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('se crea correctamente', () => {
    const fixture = crear();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('el formulario inicia invalido y sin enviada', () => {
    const fixture = crear();
    const componente = fixture.componentInstance;
    expect(componente.form.invalid).toBe(true);
    expect(componente.enviado()).toBe(false);
  });

  it('exige nombre de empresa, administrador, correo y contrasena', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    expect(form.controls.nombreEmpresa.hasError('required')).toBe(true);
    expect(form.controls.nombreAdmin.hasError('required')).toBe(true);
    expect(form.controls.email.hasError('required')).toBe(true);
    expect(form.controls.password.hasError('required')).toBe(true);
  });

  it('rechaza correos invalidos', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.email.setValue('correo-invalido');
    expect(form.controls.email.hasError('email')).toBe(true);
  });

  it('exige minimo 8 caracteres en la contrasena', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.password.setValue('corta');
    expect(form.controls.password.hasError('minlength')).toBe(true);
  });

  it('detecta que las contrasenas no coinciden', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.password.setValue('ClaveSegura1');
    form.controls.confirmar.setValue('OtraClave99');
    expect(form.hasError('noCoincide')).toBe(true);
  });

  it('exige aceptar los documentos legales', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.patchValue({
      nombreEmpresa: 'Distribuidora XYZ',
      nombreAdmin: 'Ana Perez',
      email: 'ana@empresa.com',
      password: 'ClaveSegura1',
      confirmar: 'ClaveSegura1',
    });
    expect(form.controls.aceptaTerminos.hasError('required')).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('acepta el formulario cuando todo es valido', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.patchValue({
      nombreEmpresa: 'Distribuidora XYZ',
      nombreAdmin: 'Ana Perez',
      email: 'ana@empresa.com',
      password: 'ClaveSegura1',
      confirmar: 'ClaveSegura1',
      aceptaTerminos: true,
    });
    expect(form.valid).toBe(true);
  });

  it('muestra error y no envia si el formulario es invalido', () => {
    const fixture = crear();
    const componente = fixture.componentInstance;
    componente.enviar();
    expect(componente.error()).toContain('Revisa los campos obligatorios');
    expect(componente.enviado()).toBe(false);
  });
});
