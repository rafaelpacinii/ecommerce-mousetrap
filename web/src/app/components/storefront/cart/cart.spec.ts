import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { CartComponent } from './cart';
import { CarrinhoService } from '../../../services/carrinho.service';
import { AuthService } from '../../../services/auth.service';
import { ProdutoCatalogo } from '../../../models/catalogo.model';

const produtoMock: ProdutoCatalogo = {
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
};

describe('CartComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('revalidates cart items on init, calculates freight via CEP, and preserves checkout destination through login', () => {
    const carrinho = TestBed.inject(CarrinhoService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    carrinho.adicionar(produtoMock, 1);

    const fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    http.expectOne('http://localhost:8080/catalogo/mouses/10').flush(produtoMock);

    const comp = fixture.componentInstance;
    comp.cepInput.set('77001-000');
    comp.calcularFrete();

    http.expectOne('http://localhost:8080/ceps/77001000/frete').flush({
      cep: '77001000',
      localidade: 'Palmas',
      uf: 'TO',
      valorFrete: 29.9,
      prazoDiasUteis: 5,
    });

    expect(carrinho.valorFrete()).toBe(29.9);
    expect(carrinho.totalEstimado()).toBeCloseTo(1229.8, 2);

    comp.continuarParaCheckout();
    http.expectOne('http://localhost:8080/catalogo/mouses/10').flush(produtoMock);

    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('loads customer saved addresses when authenticated and calculates freight for principal address', () => {
    const auth = TestBed.inject(AuthService);
    const carrinho = TestBed.inject(CarrinhoService);
    auth.authenticated.set(true);
    carrinho.adicionar(produtoMock, 1);

    const fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    http.expectOne('http://localhost:8080/catalogo/mouses/10').flush(produtoMock);
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([
      {
        id: 3,
        apelido: 'Casa',
        destinatario: 'Cliente Teste',
        cep: '77001000',
        logradouro: 'Quadra 104 Sul',
        bairro: 'Plano Diretor Sul',
        numero: '12',
        complemento: '',
        principal: true,
        municipio: {
          id: 1,
          nome: 'Palmas',
          codigoIbge: '1721000',
          estado: { id: 1, nome: 'Tocantins', sigla: 'TO' },
        },
      },
    ]);

    http.expectOne('http://localhost:8080/ceps/77001000/frete').flush({
      cep: '77001000',
      localidade: 'Palmas',
      uf: 'TO',
      valorFrete: 29.9,
      prazoDiasUteis: 5,
    });

    expect(fixture.componentInstance.enderecoSelecionadoId()).toBe(3);
    expect(carrinho.frete()?.localidade).toBe('Palmas');
  });
});

