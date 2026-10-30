import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { evaluarContrasena } from '../utils/contrasena';

/**
 * Valida la contraseña con las reglas de `evaluarContrasena`.
 * Devuelve `contrasenaDebil` con la lista de errores para mostrarlos en pantalla.
 */
export const contrasenaSeguraValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = typeof control.value === 'string' ? control.value : '';
  if (!valor) return null;

  const resultado = evaluarContrasena(valor);
  return resultado.valida ? null : { contrasenaDebil: resultado.errores };
};
