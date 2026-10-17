import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CheckoutService } from './checkout.service';
import { AuthService } from './auth.service';
import { CarrinhoService } from './carrinho.service';
import { Pedido, RevisaoPedido } from '../models/pedido.model';
import { Produto } from '../models/catalogo.model';

const produto: Produto = {
  id: 10,
  nome: 'Mouse',
  sku: 'M-10',
  descricao: 'Mouse',
  marca: { id: 1, nome: 'Marca', ativo: true },
  cor: 'Preto',
  preco: 100,
  quantidadeEstoque: 10,
  dpiMaximo: 16000,
  quantidadeBotoes: 6,
  pesoGramas: 54,
  tiposConexao: [],
};
const revisao: RevisaoPedido = {
  endereco: {
    destinatario: 'Cliente',
    cep: '01001000',
    logradouro: 'Praça',
    bairro: 'Sé',
    numero: '1',
    municipio: 'São Paulo',
    uf: 'SP',
  },
  itens: [
    {
      idMouse: 10,
      nome: 'Mouse',
      sku: 'M-10',
      marca: 'Marca',
      cor: 'Preto',
      quantidade: 2,
      precoUnitario: 100,
      subtotal: 200,
    },
  ],
  subtotal: 200,
  frete: {
    cep: '01001000',
    localidade: 'São Paulo',
    uf: 'SP',
    prazoDiasUteis: 5,
    valorFrete: 29.9,
  },
  total: 229.9,
};
function pedido(chave: string): Pedido {
  return {
    id: 50,
    chaveCheckout: chave,
    status: { id: 1, label: 'Aguardando pagamento' },
    criadoEm: '2026-10-17T00:00:00Z',
    expiraEm: '2026-10-17T00:30:00Z',
    endereco: revisao.endereco,
    itens: revisao.itens,
    subtotal: 200,
    frete: 29.9,
    prazoDiasUteis: 5,
    total: 229.9,
    pagamentos: [],
  };
}

describe('Checkout recovery and confirmed-cart behavior', () => {
  let service: CheckoutService, http: HttpTestingController, carrinho: CarrinhoService;
  const subject = signal('checkout-a');
  beforeEach(() => {
    localStorage.clear();
    subject.set('checkout-a');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { subject } },
      ],
    });
    service = TestBed.inject(CheckoutService);
    http = TestBed.inject(HttpTestingController);
    carrinho = TestBed.inject(CarrinhoService);
    carrinho.adicionar(produto, 2);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('keeps the original payload after an ambiguous failure and removes purchased quantities only once', () => {
    service.confirmar(revisao, 7, 1).subscribe({ error: () => {} });
    const first = http.expectOne('http://localhost:8080/pedidos');
    const original = first.request.body;
    first.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(carrinho.quantidadeTotal()).toBe(2);
    carrinho.adicionar(produto, 1);
    service.confirmar({ ...revisao, total: 999 }, 9, 2).subscribe();
    const retry = http.expectOne('http://localhost:8080/pedidos');
    expect(retry.request.body).toEqual(original);
    const confirmed = pedido(original.chaveCheckout);
    retry.flush(confirmed);
    expect(carrinho.quantidadeTotal()).toBe(1);
    service.recuperar().subscribe();
    http.expectOne('http://localhost:8080/pedidos/50').flush(confirmed);
    expect(carrinho.quantidadeTotal()).toBe(1);
    carrinho.confirmarCompra(confirmed.chaveCheckout, confirmed.itens);
    expect(carrinho.quantidadeTotal()).toBe(1);
  });
  it('releases a definitively rejected draft without clearing the cart', () => {
    service.confirmar(revisao, 7, 1).subscribe({ error: () => {} });
    http
      .expectOne('http://localhost:8080/pedidos')
      .flush({}, { status: 409, statusText: 'Conflict' });
    expect(service.tentativa()).toBeNull();
    expect(carrinho.quantidadeTotal()).toBe(2);
  });
  it('reuses a payment key on network failure and creates a fresh attempt after a refusal', () => {
    service.confirmar(revisao, 7, 2).subscribe();
    const create = http.expectOne('http://localhost:8080/pedidos');
    const p = pedido(create.request.body.chaveCheckout);
    create.flush(p);
    service.pagar(p, 2).subscribe({ error: () => {} });
    const first = http.expectOne('http://localhost:8080/pedidos/50/pagamentos');
    const original = first.request.body;
    first.error(new ProgressEvent('error'));
    service.pagar(p, 1).subscribe();
    const retry = http.expectOne('http://localhost:8080/pedidos/50/pagamentos');
    expect(retry.request.body).toEqual(original);
    const refused = {
      ...p,
      pagamentos: [
        {
          id: 1,
          chaveIdempotencia: original.chaveIdempotencia,
          forma: { id: 2, label: 'Cartão' },
          status: { id: 3, label: 'Recusado' },
          valor: p.total,
        },
      ],
    };
    retry.flush(refused);
    service.pagar(refused, 1).subscribe();
    const next = http.expectOne('http://localhost:8080/pedidos/50/pagamentos');
    expect(next.request.body.chaveIdempotencia).not.toBe(original.chaveIdempotencia);
    expect(next.request.body.forma).toBe(2);
    next.flush({ ...refused, status: { id: 2, label: 'Pago' } });
  });
  it('isolates persisted attempts by authenticated subject and restores them after reload', () => {
    service.confirmar(revisao, 7, 1).subscribe({ error: () => {} });
    http.expectOne('http://localhost:8080/pedidos').error(new ProgressEvent('error'));
    const original = service.tentativa();
    subject.set('checkout-b');
    expect(service.tentativa()).toBeNull();
    subject.set('checkout-a');
    expect(service.tentativa()).toEqual(original);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { subject } },
      ],
    });
    service = TestBed.inject(CheckoutService);
    http = TestBed.inject(HttpTestingController);
    expect(service.tentativa()).toEqual(original);
  });
  it('does not send checkout if the attempt cannot be saved safely', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('Blocked');
    });
    expect(() => service.confirmar(revisao, 7, 1)).toThrow('armazenamento');
    http.expectNone('http://localhost:8080/pedidos');
    spy.mockRestore();
    expect(carrinho.quantidadeTotal()).toBe(2);
  });
  it('persists cart receipts across reload so a confirmed empty cart cannot be cleared twice', () => {
    service.confirmar(revisao, 7, 1).subscribe();
    const create = http.expectOne('http://localhost:8080/pedidos');
    const p = pedido(create.request.body.chaveCheckout);
    create.flush(p);
    expect(carrinho.quantidadeTotal()).toBe(0);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { subject } },
      ],
    });
    service = TestBed.inject(CheckoutService);
    http = TestBed.inject(HttpTestingController);
    carrinho = TestBed.inject(CarrinhoService);
    carrinho.adicionar(produto, 1);
    service.recuperar().subscribe();
    http.expectOne('http://localhost:8080/pedidos/50').flush(p);
    expect(carrinho.quantidadeTotal()).toBe(1);
  });
  it('ignores a late response from the previous account without changing the new account cart or draft', () => {
    let failure = '';
    service.confirmar(revisao, 7, 1).subscribe({ error: (e) => (failure = e.message) });
    const request = http.expectOne('http://localhost:8080/pedidos');
    const response = pedido(request.request.body.chaveCheckout);
    subject.set('checkout-b');
    request.flush(response);
    expect(failure).toContain('conta mudou');
    expect(service.tentativa()).toBeNull();
    expect(localStorage.getItem('mousetrap.checkout.checkout-b')).toBeNull();
    expect(carrinho.quantidadeTotal()).toBe(2);
    subject.set('checkout-a');
    expect(service.tentativa()?.criacao.chaveCheckout).toBe(response.chaveCheckout);
  });
});
