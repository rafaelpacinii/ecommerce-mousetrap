import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CarrinhoService } from './carrinho.service';
import { ProdutoCatalogo } from '../models/catalogo.model';

const criarProduto = (parcial: Partial<ProdutoCatalogo> = {}): ProdutoCatalogo => ({
  id: 10,
  nome: 'Razer Viper V3 Pro',
  sku: 'RZR-VV3',
  descricao: 'Mouse gamer sem fio ultraleve',
  cor: 'Preto',
  preco: 1199.9,
  quantidadeEstoque: 5,
  dpiMaximo: 35000,
  quantidadeBotoes: 6,
  pesoGramas: 54,
  marca: { id: 1, nome: 'Razer', ativo: true },
  tiposConexao: [{ id: 1, label: 'Sem Fio' }],
  imagens: [{ id: 1, url: '/viper.webp', textoAlternativo: 'Viper', ordem: 0 }],
  ...parcial,
});

describe('CarrinhoService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('adds items, respects stock limits, updates quantities, and persists to localStorage', () => {
    const service = TestBed.inject(CarrinhoService);
    const produto = criarProduto({ quantidadeEstoque: 3, preco: 500 });

    expect(service.adicionar(produto, 2)).toBe(true);
    expect(service.quantidadeTotal()).toBe(2);
    expect(service.subtotal()).toBe(1000);

    service.adicionar(produto, 5);
    expect(service.quantidadeTotal()).toBe(3);

    service.definirFrete({
      cep: '77001000',
      localidade: 'Palmas',
      uf: 'TO',
      valorFrete: 29.9,
      prazoDiasUteis: 5,
    });
    expect(service.totalEstimado()).toBeCloseTo(1529.9, 2);

    const salvo = JSON.parse(localStorage.getItem('mousetrap.carrinho') ?? '[]');
    expect(salvo.length).toBe(1);
    expect(salvo[0].quantidade).toBe(3);

    service.atualizarQuantidade(produto.id!, 1);
    expect(service.quantidadeTotal()).toBe(1);

    service.remover(produto.id!);
    expect(service.itens().length).toBe(0);
    expect(localStorage.getItem('mousetrap.carrinho')).toBeNull();
  });

  it('sanitizes malformed or corrupt localStorage entries on startup', () => {
    localStorage.setItem(
      'mousetrap.carrinho',
      JSON.stringify([
        { idMouse: -1, nome: 'Invalido', quantidade: 2, precoUnitario: 10 },
        {
          idMouse: 7,
          nome: 'Logitech Superlight 2',
          marca: 'Logitech G',
          cor: 'Branco',
          precoUnitario: 949.9,
          quantidade: 2,
          quantidadeEstoque: 4,
        },
      ]),
    );

    const service = TestBed.inject(CarrinhoService);
    expect(service.itens().length).toBe(1);
    expect(service.itens()[0].idMouse).toBe(7);
    expect(service.avisos().length).toBeGreaterThan(0);
  });

  it('revalidates prices, stock adjustments, and removed products against the catalog API', () => {
    const service = TestBed.inject(CarrinhoService);
    service.adicionar(criarProduto({ id: 1, nome: 'Mouse A', preco: 500, quantidadeEstoque: 5 }), 4);
    service.adicionar(criarProduto({ id: 2, nome: 'Mouse B', preco: 300, quantidadeEstoque: 2 }), 1);

    service.revalidar().subscribe();

    http.expectOne('http://localhost:8080/catalogo/mouses/1').flush(
      criarProduto({ id: 1, nome: 'Mouse A', preco: 550, quantidadeEstoque: 2 }),
    );
    http
      .expectOne('http://localhost:8080/catalogo/mouses/2')
      .flush({}, { status: 404, statusText: 'Not Found' });

    expect(service.itens()[0].precoUnitario).toBe(550);
    expect(service.itens()[0].quantidade).toBe(2);
    expect(service.itens()[1].indisponivel).toBe(true);
    expect(service.possuiIndisponiveis()).toBe(true);
    expect(service.avisos().length).toBe(3);

    service.removerIndisponiveis();
    expect(service.itens().length).toBe(1);
    expect(service.possuiIndisponiveis()).toBe(false);
  });
});

