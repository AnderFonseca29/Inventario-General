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
  return router.createUrlTree(['/dashboard']);
};

export function permisoGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // El usuario operativo (vendedor) solo accede a su resumen (Inicio).
    if (auth.esOperativo()) {
      return router.createUrlTree(['/dashboard']);
    }
    if (auth.hasPermiso(codigo)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}

// Permite el acceso con el permiso indicado o al propietario de plataforma.
export function permisoOSuperAdminGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.esOperativo()) {
      return router.createUrlTree(['/dashboard']);
    }
    if (auth.isSuperAdmin() || auth.hasPermiso(codigo)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}
