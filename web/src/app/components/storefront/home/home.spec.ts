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
  const initialUrl = 'http://localhost:8080/mouses?page=0&pageSize=12';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows real fields, limits the preview and excludes inactive products and brands', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http
      .expectOne(initialUrl)
      .flush(
        page([
          { ...mouse, id: 10, ativo: false, nome: 'Produto inativo' },
          { ...mouse, id: 11, marca: { ...mouse.marca, ativo: false }, nome: 'Marca inativa' },
          mouse,
          { ...mouse, id: 2, nome: 'Sem estoque', quantidadeEstoque: 0 },
          { ...mouse, id: 3 },
          { ...mouse, id: 4 },
        ]),
      );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-product-card')).toHaveLength(3);
    expect(element.textContent).not.toContain('Produto inativo');
    expect(element.textContent).not.toContain('Marca inativa');
    expect(element.textContent).toContain('Indisponível');
    expect(element.textContent).toContain('Imagem ilustrativa');
    expect(element.querySelector('.spec-pills')?.textContent).toContain('16,000 DPI');
  });

  it('continues paging when inactive records would otherwise hide available products', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    http.expectOne(initialUrl).flush(page([{ ...mouse, ativo: false }], 2));
    http.expectOne('http://localhost:8080/mouses?page=1&pageSize=12').flush(page([mouse]));
    fixture.detectChanges();
    expect(fixture.componentInstance.produtos()).toEqual([mouse]);
  });

  it('cancels stale search requests and lets visitors clear an empty search', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const initial = http.expectOne(initialUrl);
    fixture.componentInstance.termo = '  Sem fio  ';
    fixture.componentInstance.buscar();
    expect(initial.cancelled).toBe(true);
    http
      .expectOne('http://localhost:8080/mouses/nome/Sem%20fio?page=0&pageSize=12')
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
