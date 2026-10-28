import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface RespuestaError {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Filtro global de excepciones (hallazgo L).
 *  - Traduce errores de Prisma a respuestas HTTP seguras:
 *      P2002 (unico)      -> 409
 *      P2025 (no existe)  -> 404
 *      P2003 (FK)         -> 409
 *      P2000/P2001        -> 400
 *  - Nunca devuelve detalles internos ni SQL: solo mensajes en espanol.
 *  - Registra los 5xx con metodo, ruta y stack (sin cuerpos ni datos sensibles).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, mensaje } = this.traducir(exception);

    const cuerpo: RespuestaError = {
      statusCode: status,
      message: mensaje,
      error: this.nombreEstado(status),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(cuerpo);
  }

  /**
   * Convierte una excepcion en la HttpException equivalente (o null si no es
   * traducible). Permite reutilizar la traduccion dentro de transacciones
   * (ver InventarioService.confirmarDocumento), donde el filtro global no
   * alcanza porque la transaccion se aborta antes de responder.
   */
  comoHttpException(exception: unknown): HttpException | null {
    if (exception instanceof HttpException) return exception;
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientInitializationError
    ) {
      const { status, mensaje } = this.traducir(exception);
      return new HttpException(mensaje, status);
    }
    return null;
  }

  private traducir(exception: unknown): {
    status: number;
    mensaje: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const respuesta = exception.getResponse();
      if (typeof respuesta === 'string') {
        return { status, mensaje: respuesta };
      }
      const objeto = respuesta as { message?: string | string[] };
      return {
        status,
        mensaje: objeto.message ?? exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const campos = this.camposUnicos(exception.meta);
          return {
            status: HttpStatus.CONFLICT,
            mensaje: campos
              ? `Ya existe un registro con el mismo valor en: ${campos}`
              : 'Ya existe un registro con esos datos',
          };
        }
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            mensaje: 'El registro solicitado no existe',
          };
        case 'P2003':
          return {
            status: HttpStatus.CONFLICT,
            mensaje:
              'La operacion hace referencia a un registro inexistente o en uso',
          };
        case 'P2000':
        case 'P2001':
        case 'P2011':
        case 'P2012':
          return {
            status: HttpStatus.BAD_REQUEST,
            mensaje: 'Los datos enviados no son validos',
          };
        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            mensaje: 'No fue posible procesar la solicitud',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        mensaje: 'Los datos enviados no son validos',
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        mensaje: 'El servicio no está disponible en este momento',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    };
  }

  private camposUnicos(meta: unknown): string | null {
    if (!meta || typeof meta !== 'object') return null;
    const target = (meta as { target?: unknown }).target;
    if (Array.isArray(target)) return target.join(', ');
    if (typeof target === 'string') return target;
    return null;
  }

  private nombreEstado(status: number): string {
    const nombre = HttpStatus[status];
    return typeof nombre === 'string' ? nombre : 'Error';
  }
}
