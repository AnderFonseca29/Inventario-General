import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const metodo = request.method;
    const url = request.originalUrl ?? request.url;
    const inicio = Date.now();

    const usuario = (request as Request & { user?: { id?: string; correo?: string } })
      .user;
    const empresaId = (request as Request & { empresaId?: string | null })
      .empresaId;
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      request.ip ??
      request.socket?.remoteAddress;

    return next.handle().pipe(
      tap({
        next: () => {
          const duracion = Date.now() - inicio;
          const estado = response.statusCode;
          if (url.includes('/health')) {
            return;
          }
          this.logger.log(
            `${metodo} ${url} ${estado} ${duracion}ms ip=${ip} userId=${usuario?.id ?? '-'} empresaId=${empresaId ?? '-'} correo=${usuario?.correo ?? '-'}`,
          );
        },
        error: (err: unknown) => {
          const duracion = Date.now() - inicio;
          const estado =
            typeof (err as { status?: number }).status === 'number'
              ? (err as { status?: number }).status
              : 500;
          if (url.includes('/health')) {
            return;
          }
          this.logger.warn(
            `${metodo} ${url} ${estado} ${duracion}ms ip=${ip} userId=${usuario?.id ?? '-'} empresaId=${empresaId ?? '-'} err=${err instanceof Error ? err.message : String(err)}`,
          );
        },
      }),
    );
  }
}
