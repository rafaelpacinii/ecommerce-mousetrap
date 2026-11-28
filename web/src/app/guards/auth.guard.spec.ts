import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard, roleGuard } from './auth.guard';

describe('administration and role access guards', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const run = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin/clientes' } as RouterStateSnapshot),
    );
  it('preserves the requested destination when login is required', () => {
    expect(TestBed.inject(Router).serializeUrl(run() as UrlTree)).toBe(
      '/login?returnUrl=%2Fadmin%2Fclientes',
    );
  });
  it('denies customer access to administration and allows administrators', () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.roles.set(['customer']);
    expect(TestBed.inject(Router).serializeUrl(run() as UrlTree)).toBe('/acesso-negado');
    auth.roles.set(['admin']);
    expect(run()).toBe(true);
  });
  it('enforces explicit role lists via roleGuard', () => {
    const auth = TestBed.inject(AuthService);
    const guard = roleGuard(['customer', 'admin']);
    const exec = () =>
      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, { url: '/meus-dados' } as RouterStateSnapshot),
      );
    expect(TestBed.inject(Router).serializeUrl(exec() as UrlTree)).toBe(
      '/login?returnUrl=%2Fmeus-dados',
    );
    auth.authenticated.set(true);
    auth.roles.set(['unrelated']);
    expect(TestBed.inject(Router).serializeUrl(exec() as UrlTree)).toBe('/acesso-negado');
    auth.roles.set(['customer']);
    expect(exec()).toBe(true);
  });
});
