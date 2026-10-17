import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogComponent } from './catalog';

describe('Public catalog navigation', () => {
  let http: HttpTestingController;
  const facets = {
    marcas: [{ id: 1, nome: 'Marca', ativo: true }],
    sensores: ['PAW3395'],
    pollingRates: [8000],
    conexoes: [{ id: 1, label: 'USB' }],
    pegadas: [{ id: 2, label: 'Claw' }],
    tiposSwitch: [{ id: 1, label: 'Óptico' }],
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'catalogo', component: CatalogComponent }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const result = (page = 0, total = 0) => ({
    items: [],
    page,
    pageSize: 12,
    totalItems: total,
    totalPages: total ? 1 : 0,
  });

  it('restores shared URL filters, sends combined parameters and resets pagination on apply', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(
      '/catalogo?marca=1&conexao=1&pegada=2&pesoMax=60&precoMin=100&precoMax=500&page=2&ordenar=menor-preco',
      CatalogComponent,
    );
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    const initial = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    expect(initial.request.params.getAll('marca')).toEqual(['1']);
    expect(initial.request.params.get('pesoMax')).toBe('60');
    expect(initial.request.params.get('page')).toBe('2');
    initial.flush({ ...result(2, 50), totalPages: 5 });
    expect(component.form.controls.pegada.value).toEqual([2]);
    component.form.controls.nome.setValue('  Mouse  ');
    component.aplicar();
    await harness.fixture.whenStable();
    const next = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    expect(next.request.params.get('nome')).toBe('Mouse');
    expect(next.request.params.get('page')).toBe('0');
    next.flush(result());
    expect(TestBed.inject(Router).url).toContain('nome=Mouse');
    component.limpar();
    await harness.fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    expect(TestBed.inject(Router).url).toBe('/catalogo');
  });

  it('cancels stale requests and retries errors without changing the URL', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/catalogo', CatalogComponent);
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    const stale = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    await harness.navigateByUrl('/catalogo?nome=Novo');
    expect(stale.cancelled).toBe(true);
    http
      .expectOne((r) => r.url.endsWith('/catalogo/mouses'))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain(
      'Não foi possível carregar o catálogo',
    );
    component.repetir();
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    harness.detectChanges();
    expect(component.erro()).toBe(false);
    expect(harness.routeNativeElement?.textContent).toContain('Nenhum mouse encontrado');
  });

  it('rejects inverted prices and recovers a URL page beyond the available results', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/catalogo?page=99', CatalogComponent);
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result(99));
    await harness.fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    expect(component.filtro().page).toBe(0);
    component.form.patchValue({ precoMin: 500, precoMax: 100 });
    component.aplicar();
    expect(component.form.hasError('faixaPreco')).toBe(true);
    http.expectNone((r) => r.url.endsWith('/catalogo/mouses'));
  });
});
