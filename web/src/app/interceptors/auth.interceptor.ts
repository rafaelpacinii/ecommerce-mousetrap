import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const settings = inject(APP_SETTINGS);
  const target = new URL(request.url, location.origin);
  const api = new URL(settings.apiUrl, location.origin);
  const base = api.pathname.replace(/\/$/, '');
  if (target.origin !== api.origin || !target.pathname.startsWith(base + '/')) return next(request);
  const path = target.pathname.slice(base.length);
  if (request.method === 'GET' && /^\/(catalogo|ceps)(\/|$)/.test(path)) return next(request);
  const auth = inject(AuthService);
  const router = inject(Router);
  return from(auth.token()).pipe(
    catchError(() => throwError(() => new HttpErrorResponse({ status: 401 }))),
    switchMap((token) =>
      next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request),
    ),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url, expired: '1' } });
      }
      return throwError(() => error);
    }),
  );
};
