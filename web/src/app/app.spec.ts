import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
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

  it('opens the storefront at the root instead of redirecting to administration', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/mouses?page=0&pageSize=12')
      .flush({ items: [], page: 0, pageSize: 12, totalItems: 0, totalPages: 0 });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(TestBed.inject(Router).url).toBe('/');
    expect(element.querySelector('h1')?.textContent).toContain('Precisão absoluta');
    expect(element.querySelector('app-storefront-layout')).not.toBeNull();
    expect(element.querySelector('app-admin-layout')).toBeNull();
    expect(element.querySelector('main#conteudo')).not.toBeNull();
  });

  it.each(['/marcas', '/mouses', '/clientes'])(
    'preserves the existing %s administration route',
    async (path) => {
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
      expect(TestBed.inject(Router).url).toBe(path);
      expect(element.querySelector('app-admin-layout')).not.toBeNull();
      expect(element.querySelector('app-storefront-layout')).toBeNull();
      expect(element.querySelector('nav')?.textContent).toContain('Marcas');
      expect(element.querySelector('nav')?.textContent).toContain('Mouses');
      expect(element.querySelector('a[href="/"]')).not.toBeNull();
    },
  );
});
