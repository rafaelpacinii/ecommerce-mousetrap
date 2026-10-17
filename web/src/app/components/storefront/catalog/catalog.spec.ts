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
  const clearButtons = (root: HTMLElement) =>
    Array.from(root.querySelectorAll('button')).filter((button) =>
      button.textContent?.includes('Limpar'),
    );

  it.each([
    '/catalogo',
    '/catalogo?ordenar=menor-preco&page=2&pageSize=24',
    '/catalogo?nome=%20%20&sensor=&emEstoque=false',
  ])(
    'hides clear actions during loading, errors and empty results without filters: %s',
    async (url) => {
      const harness = await RouterTestingHarness.create();
      const component = await harness.navigateByUrl(url, CatalogComponent);
      http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
      const root = harness.routeNativeElement!;
      harness.detectChanges();
      expect(clearButtons(root)).toHaveLength(0);

      http
        .expectOne((r) => r.url.endsWith('/catalogo/mouses'))
        .flush({}, { status: 503, statusText: 'Unavailable' });
      harness.detectChanges();
      expect(root.textContent).toContain('Não foi possível carregar o catálogo');
      expect(clearButtons(root)).toHaveLength(0);

      component.repetir();
      http
        .expectOne((r) => r.url.endsWith('/catalogo/mouses'))
        .flush({ ...result(component.filtro().page, 50), totalPages: 5 });
      harness.detectChanges();
      expect(root.textContent).toContain('Nenhum mouse encontrado');
      expect(clearButtons(root)).toHaveLength(0);
    },
  );

  it('recognizes a zero price boundary and clears the URL and form through the rendered action', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/catalogo?precoMin=0', CatalogComponent);
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    expect(clearButtons(root)).toHaveLength(2);
    clearButtons(root)[1].click();
    await harness.fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/catalogo');
    expect(component.form.controls.precoMin.value).toBeNull();
    expect(clearButtons(root)).toHaveLength(0);
  });

  it('submits the search bar with existing facets and clears only its draft text', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(
      '/catalogo?marca=1&pesoMax=59&page=2',
      CatalogComponent,
    );
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    http
      .expectOne((r) => r.url.endsWith('/catalogo/mouses'))
      .flush({ ...result(2, 50), totalPages: 5 });
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    const input = root.querySelector('#catalog-query') as HTMLInputElement;
    input.value = '  Viper  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const shortcut = new KeyboardEvent('keydown', {
      key: '/',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    root.querySelector('.catalog-search')!.dispatchEvent(new Event('submit', { bubbles: true }));
    await harness.fixture.whenStable();
    const search = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    expect(search.request.params.get('nome')).toBe('Viper');
    expect(search.request.params.getAll('marca')).toEqual(['1']);
    expect(search.request.params.get('pesoMax')).toBe('59');
    expect(search.request.params.get('page')).toBe('0');
    search.flush(result());
    harness.detectChanges();
    (root.querySelector('.search-erase') as HTMLButtonElement).click();
    expect(component.form.controls.nome.value).toBe('');
    expect(component.form.controls.marca.value).toEqual([1]);
    http.expectNone((r) => r.url.endsWith('/catalogo/mouses'));
    root.querySelector('.catalog-search')!.dispatchEvent(new Event('submit', { bubbles: true }));
    await harness.fixture.whenStable();
    const cleared = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    expect(cleared.request.params.has('nome')).toBe(false);
    expect(cleared.request.params.getAll('marca')).toEqual(['1']);
    cleared.flush(result());
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
    harness.detectChanges();
    expect(clearButtons(harness.routeNativeElement!)).toHaveLength(2);
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
    harness.detectChanges();
    expect(clearButtons(harness.routeNativeElement!)).toHaveLength(0);
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
    expect(clearButtons(harness.routeNativeElement!)).toHaveLength(2);
    component.repetir();
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    harness.detectChanges();
    expect(component.erro()).toBe(false);
    expect(harness.routeNativeElement?.textContent).toContain('Nenhum mouse encontrado');
  });

  it('combines checkbox and grip selections in the existing URL-backed filters', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/catalogo', CatalogComponent);
    http.expectOne('http://localhost:8080/catalogo/filtros').flush(facets);
    http.expectOne((r) => r.url.endsWith('/catalogo/mouses')).flush(result());
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    (root.querySelector('.facet-group input[type="checkbox"]') as HTMLInputElement).click();
    (root.querySelector('.grip-filter') as HTMLButtonElement).click();
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    await harness.fixture.whenStable();
    const request = http.expectOne((r) => r.url.endsWith('/catalogo/mouses'));
    expect(request.request.params.getAll('marca')).toEqual(['1']);
    expect(request.request.params.getAll('pegada')).toEqual(['2']);
    request.flush(result());
    expect(TestBed.inject(Router).url).toContain('pegada=2');
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
