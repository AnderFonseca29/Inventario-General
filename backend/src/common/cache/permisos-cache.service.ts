import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EntradaPermisos {
  permisos: string[];
  expiraEn: number;
}

/**
 * Cache en memoria de los permisos por usuario (hallazgo R).
 *
 * Sin esta cache cada peticion autenticada consultaba usuario, roles y
 * permisos en la base de datos. La cache reduce esa carga, pero puede
 * desincronizarse, por lo que:
 *
 * - tiene un TTL corto y configurable (por defecto 60 s), que acota el
 *   tiempo maximo de un permiso revocado;
 * - se invalida de forma explicita cuando se reasignan roles a un usuario
 *   o cuando se modifican los permisos de un rol.
 *
 * No se cachea el estado del usuario (activo, empresa, superadmin): esos
 * datos se siguen consultando siempre, de modo que desactivar a un usuario
 * surte efecto de inmediato.
 */
@Injectable()
export class PermisosCacheService {
  private readonly cache = new Map<string, EntradaPermisos>();
  private readonly ttlMs: number;
  private readonly habilitada: boolean;

  constructor(config: ConfigService) {
    const segundos = Number(config.get<string>('PERMISOS_CACHE_TTL_SEGUNDOS') ?? '60');
    this.habilitada = Number.isFinite(segundos) && segundos > 0;
    this.ttlMs = this.habilitada ? segundos * 1000 : 60_000;
  }

  obtener(usuarioId: string): string[] | undefined {
    if (!this.habilitada) return undefined;
    const entrada = this.cache.get(usuarioId);
    if (!entrada) return undefined;
    if (entrada.expiraEn <= Date.now()) {
      this.cache.delete(usuarioId);
      return undefined;
    }
    return entrada.permisos;
  }

  guardar(usuarioId: string, permisos: string[]): void {
    if (!this.habilitada) return;
    this.cache.set(usuarioId, {
      permisos,
      expiraEn: Date.now() + this.ttlMs,
    });
  }

  invalidar(usuarioId: string): void {
    this.cache.delete(usuarioId);
  }

  invalidarVarios(usuarioIds: string[]): void {
    for (const usuarioId of usuarioIds) {
      this.cache.delete(usuarioId);
    }
  }

  limpiar(): void {
    this.cache.clear();
  }

  get tamano(): number {
    return this.cache.size;
  }
}
