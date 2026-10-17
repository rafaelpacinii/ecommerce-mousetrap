import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HomeComponent } from './home';
import { Mouse } from '../../../models/mouse.model';

describe('HomeComponent catalog preview', () => {
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
    pesoGramas: 60,
    ativo: true,
    marca: { id: 1, nome: 'Marca de teste', ativo: true },
    tiposConexao: [{ id: 1, label: 'USB' }],
  };
  const page = (items: Mouse[], totalPages = 1) => ({
    items,
    page: 0,
    pageSize: 12,
    totalItems: items.length,
    totalPages,
  });
  const initialUrl = 'http://localhost:8080/catalogo/mouses?page=0&pageSize=3';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows the public preview with real fields and unavailable stock', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http
      .expectOne(initialUrl)
      .flush(
        page([
          mouse,
          { ...mouse, id: 2, nome: 'Sem estoque', quantidadeEstoque: 0 },
          { ...mouse, id: 3 },
        ]),
      );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-product-card')).toHaveLength(3);
    expect(element.textContent).toContain('Indisponível');
    expect(element.textContent).toContain('Imagem indisponível');
    expect(element.querySelector('.spec-pills')?.textContent).toContain('16,000 DPI');
  });

  it('uses the public contract rather than querying administrative records', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http.expectOne(initialUrl).flush(page([mouse]));
    http.expectNone((request) => request.url === 'http://localhost:8080/mouses');
    fixture.detectChanges();
    expect(fixture.componentInstance.produtos()).toEqual([mouse]);
    expect(fixture.nativeElement.querySelector('a[href="/catalogo/1"]')).not.toBeNull();
  });

  it('cancels stale search requests and lets visitors clear an empty search', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const initial = http.expectOne(initialUrl);
    fixture.componentInstance.termo = '  Sem fio  ';
    fixture.componentInstance.buscar();
    expect(initial.cancelled).toBe(true);
    http
      .expectOne('http://localhost:8080/catalogo/mouses?page=0&pageSize=3&nome=Sem%20fio')
      .flush(page([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum mouse encontrado');
    (fixture.nativeElement.querySelector('.catalog-state button') as HTMLButtonElement).click();
    http.expectOne(initialUrl).flush(page([mouse]));
    fixture.detectChanges();
    expect(fixture.componentInstance.termo).toBe('');
    expect(fixture.nativeElement.querySelectorAll('app-product-card')).toHaveLength(1);
  });

  it('recovers from unavailable catalog requests without exposing server details', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http
      .expectOne(initialUrl)
      .flush({ detail: 'internal database details' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar');
    expect(fixture.nativeElement.textContent).not.toContain('internal database');
    (fixture.nativeElement.querySelector('.catalog-state button') as HTMLButtonElement).click();
    http.expectOne(initialUrl).flush(page([mouse]));
    fixture.detectChanges();
    expect(fixture.componentInstance.erro()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('app-product-card')).toHaveLength(1);
  });
});
