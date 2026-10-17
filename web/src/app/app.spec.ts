import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { routes } from './app.routes';

describe('App routing', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('requires authentication before activating administrative resolvers', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/mouses/editar/9');
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fadmin%2Fmouses%2Feditar%2F9');
    http.expectNone((request) => request.url.includes('/mouses/9'));
  });

  it('blocks customer navigation to administration before loading its data', async () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.roles.set(['customer']);
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/admin/clientes');
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/acesso-negado');
    http.expectNone((request) => request.url.includes('/clientes'));
  });

  it('opens the storefront at the root instead of redirecting to administration', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/catalogo/mouses?page=0&pageSize=3')
      .flush({ items: [], page: 0, pageSize: 12, totalItems: 0, totalPages: 0 });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(TestBed.inject(Router).url).toBe('/');
    expect(element.querySelector('h1')?.textContent).toContain(
      'A velocidade que define cada round.',
    );
    expect(element.querySelector('app-storefront-layout')).not.toBeNull();
    expect(element.querySelector('app-admin-layout')).toBeNull();
    expect(element.querySelector('main#conteudo')).not.toBeNull();
  });

  it.each(['/marcas', '/mouses', '/clientes'])(
    'redirects the existing %s route to protected administration',
    async (path) => {
      const auth = TestBed.inject(AuthService);
      auth.authenticated.set(true);
      auth.roles.set(['admin']);
      const fixture = TestBed.createComponent(App);
      await TestBed.inject(Router).navigateByUrl(path);
      fixture.detectChanges();
      http
        .expectOne((request) => request.url.startsWith('http://localhost:8080' + path))
        .flush(
          path === '/clientes'
            ? []
            : { items: [], page: 0, pageSize: 10, totalItems: 0, totalPages: 0 },
        );
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(TestBed.inject(Router).url).toBe('/admin' + path);
      expect(element.querySelector('app-admin-layout')).not.toBeNull();
      expect(element.querySelector('app-storefront-layout')).toBeNull();
      expect(element.querySelector('nav')?.textContent).toContain('Marcas');
      expect(element.querySelector('nav')?.textContent).toContain('Mouses');
      expect(element.querySelector('a[href="/"]')).not.toBeNull();
    },
  );
});
