import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EsContrasenaSegura } from '../../common/validators/contrasena.validator';
import { LONGITUD_MAXIMA, LONGITUD_MINIMA } from '../../common/utils/contrasena';

/**
 * Registro público de una empresa nueva.
 *
 * Es estricto a propósito: `forbidNonWhitelisted` rechaza campos que no estén
 * aquí, y ningún dato sensible (rol, plan, empresaId, esPropietario) viaja
 * desde el cliente; los fija el servidor.
 */
export class RegistroDto {
  // ------------------------------ Empresa --------------------------------
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  razonSocial!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsOptional()
  @Matches(/^[0-9.\-\s]{6,20}$/, {
    message: 'El NIT debe tener entre 6 y 20 caracteres numéricos',
  })
  nit?: string;

  @IsOptional()
  @Matches(/^[0-9.\-\s]{4,20}$/, {
    message: 'La matrícula mercantil debe ser numérica',
  })
  matricula?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  ciudad!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  departamento!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  representante!: string;

  @IsOptional()
  @Matches(/^[+0-9()\-\s]{7,20}$/, { message: 'El teléfono no es válido' })
  telefono?: string;

  @IsEmail({}, { message: 'El correo para temas de datos no es válido' })
  correoDatos!: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'El sitio web debe iniciar con http:// o https://' },
  )
  sitioWeb?: string;

  // -------------------------- Persona administradora ---------------------
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombreAdmin!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @IsString()
  @MinLength(LONGITUD_MINIMA)
  @MaxLength(LONGITUD_MAXIMA)
  @EsContrasenaSegura()
  password!: string;

  // -------------------------------- Legal --------------------------------
  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar los documentos legales' })
  aceptaTerminos!: boolean;

  /** Versión que muestra el navegador; el servidor registra la suya. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionLegal?: string;

  /** Token de Cloudflare Turnstile; solo se exige si TURNSTILE_ENABLED=true. */
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  captchaToken?: string;
}
