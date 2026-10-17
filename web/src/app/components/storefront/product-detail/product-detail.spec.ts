import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ProductDetailComponent } from './product-detail';
import { ResultadoProduto } from '../../../resolvers/produto.resolver';
import { Produto } from '../../../models/catalogo.model';

describe('Product detail gallery and metadata', () => {
  const produto: Produto = {
    id: 1,
    nome: 'Mouse de teste',
    sku: 'SKU-1',
    descricao: '</script><script>alert(1)</script>',
    cor: 'Preto',
    preco: 199,
    quantidadeEstoque: 0,
    dpiMaximo: 26000,
    quantidadeBotoes: 6,
    pesoGramas: 54,
    marca: { id: 1, nome: 'Marca', ativo: true },
    tiposConexao: [{ id: 1, label: 'USB' }],
    imagens: [
      { id: 1, url: '/lateral.webp', textoAlternativo: 'Lateral', ordem: 1 },
      { id: 2, url: '/capa.webp', textoAlternativo: 'Capa', ordem: 0 },
    ],
  };
  let data: BehaviorSubject<{ produto: ResultadoProduto }>;
  beforeEach(() => {
    data = new BehaviorSubject<{ produto: ResultadoProduto }>({ produto: { produto, status: 200 } });
    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { data } }],
    });
  });
  it('starts with the ordered cover, changes selected image and marks out-of-stock accurately', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.main-image img')?.alt).toBe('Capa');
    (fixture.nativeElement.querySelectorAll('.thumbnails button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.main-image img')?.alt).toBe('Lateral');
    expect(fixture.nativeElement.querySelector('.stock').textContent).toContain('Indisponível');
    const script = document.head.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).not.toContain('<script>');
    expect(JSON.parse(script!.textContent!).offers.availability).toBe(
      'https://schema.org/OutOfStock',
    );
    expect(JSON.parse(script!.textContent!).description).toBe(produto.descricao);
    fixture.destroy();
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
  it('removes stale product data when navigation resolves an unavailable product', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    data.next({ produto: { produto: null, status: 404 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Produto não encontrado');
    expect(fixture.nativeElement.querySelector('.price')).toBeNull();
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
