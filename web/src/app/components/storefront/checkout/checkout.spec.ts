import { CheckoutService } from '../../../services/checkout.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CheckoutComponent } from './checkout';
import { CarrinhoService } from '../../../services/carrinho.service';
import { AuthService } from '../../../services/auth.service';
import { Pedido, RevisaoPedido } from '../../../models/pedido.model';

const revisao: RevisaoPedido = {
  endereco: {
    destinatario: 'Cliente',
    cep: '01001000',
    logradouro: 'Praça da Sé',
    bairro: 'Sé',
    numero: '1',
    municipio: 'São Paulo',
    uf: 'SP',
  },
  itens: [
    {
      idMouse: 10,
      sku: 'M-10',
      nome: 'Mouse de teste',
      marca: 'Marca',
      cor: 'Preto',
      quantidade: 1,
      precoUnitario: 100,
      subtotal: 100,
    },
  ],
  subtotal: 100,
  frete: {
    cep: '01001000',
    localidade: 'São Paulo',
    uf: 'SP',
    prazoDiasUteis: 5,
    valorFrete: 29.9,
  },
  total: 129.9,
};
const endereco = {
  ...revisao.endereco,
  id: 7,
  apelido: 'Casa',
  principal: true,
  municipio: { id: 1, nome: 'São Paulo', estado: { id: 1, nome: 'São Paulo', sigla: 'SP' } },
};
const produto = {
  id: 10,
  sku: 'M-10',
  nome: 'Mouse de teste',
  marca: { id: 1, nome: 'Marca', ativo: true },
  descricao: 'Teste',
  cor: 'Preto',
  preco: 99,
  quantidadeEstoque: 5,
  dpiMaximo: 16000,
  quantidadeBotoes: 6,
  pesoGramas: 54,
  tiposConexao: [],
};
describe('Transactional checkout screen', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).subject.set('checkout-ui');
    TestBed.inject(CarrinhoService).adicionar(produto);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });
  function abrir() {
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/pedidos/configuracao')
      .flush({ simulacaoHabilitada: true, prazoPagamentoMinutos: 30 });
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([endereco]);
    http.expectOne('http://localhost:8080/pedidos/revisao').flush(revisao);
    fixture.detectChanges();
    return fixture;
  }
  it('validates card fields locally, submits a pending payment and refreshes the confirmed order', () => {
    const fixture = abrir();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Os preços foram atualizados');
    component.form.controls.forma.setValue(2);
    component.cartao.setValue({
      numero: '1234 5678 9012 3456',
      titular: 'Cliente Teste',
      validade: '12/2099',
      cvv: '123',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toMatch(/simula|demonstra/i);
    component.confirmar();
    const request = http.expectOne('http://localhost:8080/pedidos');
    expect(request.request.body.itens[0].precoEsperado).toBe(100);
    const p: Pedido = {
      id: 50,
      chaveCheckout: request.request.body.chaveCheckout,
      status: { id: 1, label: 'Aguardando pagamento' },
      criadoEm: '2026-10-17T00:00:00Z',
      expiraEm: '2026-10-17T00:30:00Z',
      endereco: revisao.endereco,
      itens: revisao.itens,
      subtotal: 100,
      frete: 29.9,
      total: 129.9,
      prazoDiasUteis: 5,
      pagamentos: [],
    };
    request.flush(p);
    expect(TestBed.inject(CarrinhoService).quantidadeTotal()).toBe(0);
    const pay = http.expectOne('http://localhost:8080/pedidos/50/pagamentos');
    expect(pay.request.body.forma).toBe(2);
    expect(pay.request.body.resultadoSimulado).toBe(3);
    expect(Object.keys(pay.request.body).sort()).toEqual([
      'chaveIdempotencia',
      'forma',
      'resultadoSimulado',
    ]);
    expect(component.cartao.getRawValue()).toEqual({
      numero: '',
      titular: '',
      validade: '',
      cvv: '',
    });
    expect(JSON.stringify(localStorage)).not.toContain('1234 5678');
    const pendente = {
      ...p,
      pagamentos: [
        {
          id: 1,
          chaveIdempotencia: pay.request.body.chaveIdempotencia,
          forma: { id: 2, label: 'Cartão de crédito' },
          status: { id: 1, label: 'Pendente' },
          valor: 129.9,
        },
      ],
    };
    pay.flush(pendente);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pagamento em processamento');
    expect(fixture.nativeElement.textContent).not.toMatch(/simula|demonstra/i);
    component.recuperar();
    http.expectOne('http://localhost:8080/pedidos/50').flush({
      ...pendente,
      status: { id: 2, label: 'Pago' },
      pagamentos: [{ ...pendente.pagamentos[0], status: { id: 2, label: 'Aprovado' } }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pagamento aprovado');
  });
  it('blocks incomplete or malformed card fields before creating an order', () => {
    const fixture = abrir();
    const component = fixture.componentInstance;
    component.form.controls.forma.setValue(2);
    component.confirmar();
    http.expectNone('http://localhost:8080/pedidos');
    component.cartao.setValue({ numero: '123', titular: ' ', validade: '13/99', cvv: '12' });
    component.confirmar();
    http.expectNone('http://localhost:8080/pedidos');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    expect(TestBed.inject(CarrinhoService).quantidadeTotal()).toBe(1);
  });
  it('shows a PIX QR code and copy-and-paste payload with the final server total', () => {
    const fixture = abrir();
    fixture.componentInstance.confirmar();
    const create = http.expectOne('http://localhost:8080/pedidos');
    const p: Pedido = {
      id: 51,
      chaveCheckout: create.request.body.chaveCheckout,
      status: { id: 1, label: 'Aguardando pagamento' },
      criadoEm: '2026-10-17T00:00:00Z',
      expiraEm: '2026-10-17T00:30:00Z',
      endereco: revisao.endereco,
      itens: revisao.itens,
      subtotal: 100,
      frete: 29.9,
      total: 129.9,
      prazoDiasUteis: 5,
      pagamentos: [],
    };
    create.flush(p);
    const pay = http.expectOne('http://localhost:8080/pedidos/51/pagamentos');
    expect(pay.request.body.resultadoSimulado).toBe(3);
    const pending = {
      ...p,
      pagamentos: [
        {
          id: 1,
          chaveIdempotencia: pay.request.body.chaveIdempotencia,
          forma: { id: 1, label: 'PIX' },
          status: { id: 1, label: 'Pendente' },
          valor: 129.9,
        },
      ],
    };
    pay.flush(pending);
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('textarea').value;
    expect(code).toContain('5406129.90');
    expect(code).toContain('MT51');
    expect(
      fixture.nativeElement.querySelector('svg[role="img"] path').getAttribute('d').length,
    ).toBeGreaterThan(100);
    expect(fixture.nativeElement.textContent).not.toMatch(
      /simula|demonstra|aprovar pagamento|recusar pagamento/i,
    );
    fixture.componentInstance.recuperar();
    http.expectOne('http://localhost:8080/pedidos/51').flush(pending);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea').value).toBe(code);
  });
  it('retains the cart and requires a refreshed review after a price conflict', () => {
    const fixture = abrir();
    fixture.componentInstance.confirmar();
    http
      .expectOne('http://localhost:8080/pedidos')
      .flush(
        { detail: 'O preço mudou. Atualize a revisão.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('O preço mudou');
    expect(TestBed.inject(CarrinhoService).quantidadeTotal()).toBe(1);
    fixture.componentInstance.atualizarRevisao();
    http.expectOne('http://localhost:8080/pedidos/revisao').flush({ ...revisao, total: 139.9 });
    expect(fixture.componentInstance.revisao()?.total).toBe(139.9);
  });
  it('opens the current cart as a new checkout instead of reopening the previous order', () => {
    const checkout = TestBed.inject(CheckoutService);
    checkout.confirmar(revisao, 7, 1).subscribe();
    const first = http.expectOne('http://localhost:8080/pedidos');
    const p: Pedido = {
      id: 50,
      chaveCheckout: first.request.body.chaveCheckout,
      status: { id: 2, label: 'Pago' },
      criadoEm: '2026-10-17T00:00:00Z',
      expiraEm: '2026-10-17T00:30:00Z',
      endereco: revisao.endereco,
      itens: revisao.itens,
      subtotal: 100,
      frete: 29.9,
      total: 129.9,
      prazoDiasUteis: 5,
      pagamentos: [],
    };
    first.flush(p);
    TestBed.inject(CarrinhoService).adicionar(produto);
    const fixture = abrir();
    expect(fixture.nativeElement.textContent).toContain('Finalizar compra');
    expect(fixture.nativeElement.textContent).not.toContain('Iniciar outra compra');
    expect(checkout.tentativa()).toBeNull();
    http.expectNone('http://localhost:8080/pedidos/50');
  });
});
