import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { evaluarContrasena } from '../utils/contrasena';

@ValidatorConstraint({ name: 'contrasenaSegura', async: false })
export class ContrasenaSeguraConstraint implements ValidatorConstraintInterface {
  validate(valor: unknown): boolean {
    return typeof valor === 'string' && evaluarContrasena(valor).valida;
  }

  defaultMessage(args: ValidationArguments): string {
    const valor = typeof args.value === 'string' ? args.value : '';
    const errores = evaluarContrasena(valor).errores;
    return errores.length > 0
      ? `La contraseña no es segura: ${errores.join(' ')}`
      : 'La contraseña no es segura.';
  }
}

/** Aplica en el backend las mismas reglas que muestra el registro. */
export function EsContrasenaSegura(opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string) {
    registerDecorator({
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      constraints: [],
      validator: ContrasenaSeguraConstraint,
    });
  };
}
