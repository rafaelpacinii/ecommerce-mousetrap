import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './auth.guard';

describe('administration access guard', () => {
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
  it('denies customer access and allows administrators', () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.roles.set(['customer']);
    expect(TestBed.inject(Router).serializeUrl(run() as UrlTree)).toBe('/acesso-negado');
    auth.roles.set(['admin']);
    expect(run()).toBe(true);
  });
});
