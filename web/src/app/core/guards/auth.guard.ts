import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return auth.loadMe().pipe(
    map((res) => {
      if (res) return true;
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    router.navigate(['/install-lists']);
    return false;
  }

  return auth.loadMe().pipe(
    map((res) => {
      if (res) {
        router.navigate(['/install-lists']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true)),
  );
};

export const menuGuard = (menuKey: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.canAccess(menuKey)) {
      router.navigate(['/install-lists']);
      return false;
    }
    return true;
  };
};
