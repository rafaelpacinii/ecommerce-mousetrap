import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HomeComponent } from './home';
import { HomeShelfComponent } from './home-shelf';
import { Mouse } from '../../../models/mouse.model';

describe('Home chapters and independent catalog shelves', () => {
  let http: HttpTestingController;
  const mouse: Mouse = {
    id: 1,
    sku: 'M-1',
    nome: 'Mouse de teste',
    descricao: 'Modelo para teste',
    cor: 'Preto',
    preco: 150,
    quantidadeEstoque: 4,
    dpiMaximo: 16000,
    quantidadeBotoes: 6,
    pesoGramas: 55,
    ativo: true,
    marca: { id: 1, nome: 'Marca de teste', ativo: true },
    tiposConexao: [{ id: 1, label: 'USB' }],
  };
  const page = (items: Mouse[]) => ({
    items,
    page: 0,
    pageSize: 4,
    totalItems: items.length,
    totalPages: 1,
  });
  const recent = 'http://localhost:8080/catalogo/mouses?page=0&pageSize=4&ordenar=recentes';
  const dpi = 'http://localhost:8080/catalogo/mouses?page=0&pageSize=4&ordenar=maior-dpi';
  const light =
    'http://localhost:8080/catalogo/mouses?page=0&pageSize=4&pesoMax=59.99&ordenar=menor-peso';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function create() {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/catalogo/filtros').flush({ marcas: [] });
    return fixture;
  }
  function otherShelves() {
    http.expectOne(dpi).flush(page([mouse]));
    http.expectOne(light).flush(page([mouse]));
  }

  it('offers category discovery links when catalog loading fails', () => {
    const fixture = create();
    for (const url of [recent, dpi, light]) {
      http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    }
    fixture.detectChanges();
    const panels = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        '.explore-panel',
      ),
    ];
    expect(panels.map((panel) => panel.getAttribute('href'))).toEqual([
      '/#catalogo',
      '/#por-dpi',
      '/#menos-de-60g',
    ]);
    expect(panels.every((panel) => !!panel.getAttribute('aria-label'))).toBe(true);
    expect(panels.every((panel) => !panel.style.clipPath && !panel.style.transform)).toBe(true);
  });

  it('renders four chapters with one h1, selected transparent mouse assets and existing catalog links', () => {
    const fixture = create();
    http.expectOne(recent).flush(page([]));
    otherShelves();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-home-chapter')).toHaveLength(4);
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    const images = [...element.querySelectorAll<HTMLImageElement>('app-home-chapter img')];
    expect(images.map((img) => img.getAttribute('loading'))).toEqual([
      'eager',
      'lazy',
      'lazy',
      'lazy',
    ]);
    expect(images[0].getAttribute('fetchpriority')).toBe('high');
    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      'images/home-scenes/g-pro-superlight-speed.webp',
      'images/home-scenes/g-pro-superlight-precision.webp',
      'images/home-scenes/g-pro-superlight-light.webp',
      'images/home-scenes/g-pro-superlight-glide.webp',
    ]);
    expect(images.every((img) => img.width > 0 && img.height > 0)).toBe(true);
    expect(element.querySelectorAll('app-mouse-scene .telemetry-card')).toHaveLength(8);
    expect(element.querySelectorAll('app-home-chapter .highlight-pill')).toHaveLength(12);
    expect(element.querySelector('canvas, .playback-toggle')).toBeNull();
    const chapters = [
      ...element.querySelectorAll<HTMLElement>('app-home-chapter > section.chapter'),
    ];
    expect(chapters.every((chapter) => !chapter.classList.contains('store-container'))).toBe(true);
    const links = [
      ...element.querySelectorAll<HTMLAnchorElement>('app-home-chapter .store-button'),
    ];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/catalogo?pollingRateMin=4000&tipoSwitch=1',
      '/catalogo?ordenar=maior-dpi',
      '/catalogo?pesoMax=59.99&ordenar=menor-peso',
      '/catalogo',
    ]);
    expect(element.querySelector('#catalogo')).not.toBeNull();
    expect(element.querySelector('#busca')).not.toBeNull();
    expect(element.querySelector('#pegadas')).not.toBeNull();
    expect(element.querySelector('.grip-body a')?.getAttribute('href')).toBe('/catalogo?pegada=2');
    const credits = element.querySelector<HTMLDetailsElement>('.media-credits')!;
    expect(credits.open).toBe(false);
    credits.querySelector('summary')!.click();
    expect(credits.open).toBe(true);
    expect(credits.textContent).toContain('zhe_kan');
    expect(credits.querySelector('a')!.href).toBe(
      'https://sketchfab.com/3d-models/computer-mouse-6e7940d9e2144efeae3468a906f27e07',
    );
    expect(credits.querySelectorAll('a')[1].href).toBe(
      'https://creativecommons.org/licenses/by/4.0/',
    );
  });

  it('shows four real products, unavailable stock and image fallbacks using public requests', () => {
    const fixture = create();
    http
      .expectOne(recent)
      .flush(
        page([
          mouse,
          { ...mouse, id: 2, nome: 'Sem estoque', quantidadeEstoque: 0 },
          { ...mouse, id: 3 },
          { ...mouse, id: 4 },
        ]),
      );
    otherShelves();
    fixture.detectChanges();
    http.expectNone((request) => request.url === 'http://localhost:8080/mouses');
    const shelf = fixture.nativeElement.querySelector('#catalogo') as HTMLElement;
    expect(shelf.querySelectorAll('app-product-card')).toHaveLength(4);
    expect(shelf.textContent).toContain('Indisponível');
    expect(shelf.textContent).toContain('Imagem indisponível');
    expect(shelf.querySelector('.spec-pills')?.textContent).toContain('16,000 DPI');
    expect(shelf.querySelector('a[href="/catalogo/1"]')).not.toBeNull();
    expect(shelf.querySelectorAll('button.add-cart-btn')).toHaveLength(3);
  });

  it('cancels stale searches, preserves recent ordering and leaves other shelves unchanged', () => {
    const fixture = create();
    const initial = http.expectOne(recent);
    otherShelves();
    const shelf = fixture.debugElement.query(By.directive(HomeShelfComponent))
      .componentInstance as HomeShelfComponent;
    shelf.term = '  Sem fio  ';
    shelf.search();
    expect(initial.cancelled).toBe(true);
    http.expectOne(recent + '&nome=Sem%20fio').flush(page([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#catalogo').textContent).toContain(
      'Nenhum mouse encontrado',
    );
    expect(fixture.nativeElement.querySelectorAll('#por-dpi app-product-card')).toHaveLength(1);
    (
      fixture.nativeElement.querySelector('#catalogo .catalog-state button') as HTMLButtonElement
    ).click();
    http.expectOne(recent).flush(page([mouse]));
    fixture.detectChanges();
    expect(shelf.term).toBe('');
    expect(fixture.nativeElement.querySelectorAll('#catalogo app-product-card')).toHaveLength(1);
  });

  it('isolates a failed shelf and retries the submitted term without exposing server details', () => {
    const fixture = create();
    http.expectOne(recent).flush(page([mouse]));
    http.expectOne(light).flush(page([]));
    http
      .expectOne(dpi)
      .flush({ detail: 'internal database details' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#por-dpi')?.textContent).toContain('Não foi possível carregar');
    expect(element.textContent).not.toContain('internal database');
    expect(element.querySelectorAll('#catalogo app-product-card')).toHaveLength(1);
    (element.querySelector('#por-dpi .catalog-state button') as HTMLButtonElement).click();
    http.expectOne(dpi).flush(page([mouse]));
    fixture.detectChanges();
    expect(element.querySelectorAll('#por-dpi app-product-card')).toHaveLength(1);
    expect(element.querySelector('#menos-de-60g')?.textContent).toContain(
      'Nenhum mouse nesta seleção',
    );
  });

  it('retries the last submitted search instead of an unsent edit and cancels requests on teardown', () => {
    const fixture = create();
    otherShelves();
    http.expectOne(recent).flush(page([]));
    const shelf = fixture.debugElement.query(By.directive(HomeShelfComponent))
      .componentInstance as HomeShelfComponent;
    shelf.term = 'Mouse';
    shelf.search();
    http.expectOne(recent + '&nome=Mouse').flush({}, { status: 503, statusText: 'Unavailable' });
    shelf.term = 'Unsubmitted';
    shelf.retry();
    const pending = http.expectOne(recent + '&nome=Mouse');
    fixture.destroy();
    expect(pending.cancelled).toBe(true);
  });
});
