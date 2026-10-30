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

  const empresaValida = {
    razonSocial: 'Distribuidora El Roble S.A.S.',
    nombreEmpresa: 'El Roble',
    nit: '901.234.567-8',
    matricula: '00123456-12',
    direccion: 'Calle 93 No. 15-20, oficina 302',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    representante: 'María Fernanda Gómez',
    telefono: '+57 601 555 0123',
    correoDatos: 'privacidad@elroble.com',
    sitioWeb: 'https://elroble.com',
  };

  const adminValido = {
    nombreAdmin: 'Ana Pérez',
    email: 'ana@empresa.com',
    password: 'Roble*2026',
    confirmar: 'Roble*2026',
  };

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

  it('exige razon social, nombre comercial, domicilio y administrador', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    expect(form.controls.razonSocial.hasError('required')).toBe(true);
    expect(form.controls.nombreEmpresa.hasError('required')).toBe(true);
    expect(form.controls.direccion.hasError('required')).toBe(true);
    expect(form.controls.nombreAdmin.hasError('required')).toBe(true);
    expect(form.controls.email.hasError('required')).toBe(true);
    expect(form.controls.password.hasError('required')).toBe(true);
  });

  it('el NIT es opcional pero valida el formato cuando se escribe', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.nit.setValue('');
    expect(form.controls.nit.valid).toBe(true);
    form.controls.nit.setValue('abc');
    expect(form.controls.nit.hasError('pattern')).toBe(true);
    form.controls.nit.setValue('901.234.567-8');
    expect(form.controls.nit.valid).toBe(true);
  });

  it('valida el correo para temas de datos', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.correoDatos.setValue('correo-invalido');
    expect(form.controls.correoDatos.hasError('email')).toBe(true);
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

  it('rechaza contrasenas comunes aunque tengan 8 caracteres', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.password.setValue('password1');
    expect(form.controls.password.hasError('contrasenaDebil')).toBe(true);
  });

  it('detecta que las contrasenas no coinciden', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.controls.password.setValue('Roble*2026');
    form.controls.confirmar.setValue('OtraClave99');
    expect(form.hasError('noCoincide')).toBe(true);
  });

  it('exige aceptar los documentos legales', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.patchValue({ ...empresaValida, ...adminValido });
    expect(form.controls.aceptaTerminos.hasError('required')).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('acepta el formulario cuando todo es valido', () => {
    const fixture = crear();
    const { form } = fixture.componentInstance;
    form.patchValue({ ...empresaValida, ...adminValido, aceptaTerminos: true });
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
