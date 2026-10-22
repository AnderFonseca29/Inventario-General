import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSuperAdmin()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};

export function permisoGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // El usuario operativo (vendedor) solo accede a su resumen (Inicio).
    if (auth.esOperativo()) {
      return router.createUrlTree(['/app/dashboard']);
    }
    if (auth.hasPermiso(codigo)) {
      return true;
    }
    return router.createUrlTree(['/app/dashboard']);
  };
}

// Permite el acceso si el usuario tiene al menos uno de los permisos indicados.
export function permisoAlgunoGuard(codigos: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.esOperativo()) {
      return router.createUrlTree(['/app/dashboard']);
    }
    if (auth.hasAlgunPermiso(codigos)) {
      return true;
    }
    return router.createUrlTree(['/app/dashboard']);
  };
}

// Permite el acceso con el permiso indicado o al propietario de plataforma.
export function permisoOSuperAdminGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.esOperativo()) {
      return router.createUrlTree(['/app/dashboard']);
    }
    if (auth.isSuperAdmin() || auth.hasPermiso(codigo)) {
      return true;
    }
    return router.createUrlTree(['/app/dashboard']);
  };
}

// Rutas exclusivas del dueno de la empresa (modulo de membresias). Los demas
// usuarios de la empresa no acceden: el backend tambien los rechaza con 403.
export const propietarioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.esPropietario() || auth.isSuperAdmin()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};
