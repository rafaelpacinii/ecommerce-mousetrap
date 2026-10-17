import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { produtoResolver, ResultadoProduto } from './produto.resolver';

describe('Public product resolver', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function resolve(id: string) {
    const route = { paramMap: { get: () => id } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      produtoResolver(route, {} as RouterStateSnapshot),
    ) as Observable<ResultadoProduto>;
  }
  it('shows not-found for invalid identifiers without requesting the API', () => {
    resolve('invalido').subscribe((result) => expect(result.status).toBe(404));
    http.expectNone((r) => r.url.includes('/catalogo/'));
  });
  it('preserves unavailable and missing product states for the page', () => {
    resolve('1').subscribe((result) => {
      expect(result.produto).toBeNull();
      expect(result.status).toBe(404);
    });
    http
      .expectOne('http://localhost:8080/catalogo/mouses/1')
      .flush({}, { status: 404, statusText: 'Not Found' });
    resolve('2').subscribe((result) => expect(result.status).toBe(503));
    http
      .expectOne('http://localhost:8080/catalogo/mouses/2')
      .flush({}, { status: 503, statusText: 'Unavailable' });
  });
});
