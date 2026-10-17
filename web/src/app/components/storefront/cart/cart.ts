import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CepService } from '../../../services/cep.service';
import { ClienteService } from '../../../services/cliente.service';
import { AuthService } from '../../../services/auth.service';
import { Endereco } from '../../../models/cliente.model';
import { ItemCarrinho } from '../../../models/carrinho.model';
import { ProductImageComponent } from '../product-image/product-image';
import { mensagemErro } from '../../../services/erro-api';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    ProductImageComponent,
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css', './cart-addresses.css'],
})
export class CartComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cepService = inject(CepService);
  private readonly clienteService = inject(ClienteService);
  private readonly snack = inject(MatSnackBar);
  readonly carrinho = inject(CarrinhoService);
  readonly auth = inject(AuthService);

  readonly checkoutMode = computed(() => !!this.route.snapshot.data['checkoutMode']);
  readonly cepInput = signal(this.carrinho.frete()?.cep ?? '');
  readonly calculandoFrete = signal(false);
  readonly erroFrete = signal('');
  readonly enderecos = signal<Endereco[]>([]);
  readonly carregandoEnderecos = signal(false);
  readonly enderecoSelecionadoId = signal<number | null>(null);

  readonly enderecoSelecionado = computed(() => {
    const id = this.enderecoSelecionadoId();
    return this.enderecos().find((e) => e.id === id) ?? null;
  });

  ngOnInit(): void {
    this.revalidarItens();
    if (this.auth.authenticated()) {
      this.carregarEnderecos();
    }
  }

  revalidarItens(): void {
    this.carrinho
      .revalidar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  carregarEnderecos(): void {
    this.carregandoEnderecos.set(true);
    this.clienteService
      .listarMeusEnderecos()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregandoEnderecos.set(false)),
      )
      .subscribe({
        next: (lista) => {
          this.enderecos.set(lista);
          const principal = lista.find((e) => e.principal) ?? lista[0] ?? null;
          if (principal) {
            this.selecionarEndereco(principal);
          }
        },
        error: () => {
          this.enderecos.set([]);
        },
      });
  }

  selecionarEndereco(endereco: Endereco): void {
    this.enderecoSelecionadoId.set(endereco.id);
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    this.cepInput.set(cepLimpo);
    if (this.carrinho.frete()?.cep !== cepLimpo) {
      this.calcularFretePorCep(cepLimpo);
    }
  }

  alterarQuantidade(item: ItemCarrinho, delta: number): void {
    const nova = item.quantidade + delta;
    if (nova < 1) {
      this.removerItem(item.idMouse);
      return;
    }
    if (item.quantidadeEstoque > 0 && nova > item.quantidadeEstoque) {
      this.snack.open(
        `Estoque máximo disponível para ${item.nome}: ${item.quantidadeEstoque}.`,
        'Fechar',
        { duration: 3500 },
      );
      return;
    }
    this.carrinho.atualizarQuantidade(item.idMouse, nova);
  }

  removerItem(idMouse: number): void {
    this.carrinho.remover(idMouse);
  }

  calcularFrete(): void {
    this.calcularFretePorCep(this.cepInput());
  }

  private calcularFretePorCep(valorCep: string): void {
    if (this.calculandoFrete()) return;
    const cep = valorCep.replace(/\D/g, '');
    if (cep.length !== 8) {
      this.erroFrete.set('Informe um CEP com oito dígitos.');
      return;
    }
    this.erroFrete.set('');
    this.calculandoFrete.set(true);
    this.cepService
      .calcularFrete(cep)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.calculandoFrete.set(false)),
      )
      .subscribe({
        next: (frete) => {
          this.carrinho.definirFrete(frete);
          this.cepInput.set(frete.cep);
        },
        error: (erro: unknown) => this.erroFrete.set(mensagemErro(erro)),
      });
  }

  continuarParaCheckout(): void {
    if (this.carrinho.itensDisponiveis().length === 0 || this.carrinho.revalidando()) {
      return;
    }
    this.carrinho
      .revalidar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (
            this.carrinho.possuiIndisponiveis() ||
            this.carrinho.itensDisponiveis().length === 0
          ) {
            this.snack.open(
              'Revise os itens atualizados no seu carrinho antes de continuar.',
              'Fechar',
              { duration: 4500 },
            );
            return;
          }
          if (!this.auth.authenticated()) {
            void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
            return;
          }
          if (this.enderecos().length === 0) {
            this.snack.open('Cadastre um endereço de entrega para concluir sua compra.', 'Fechar', {
              duration: 4500,
            });
            void this.router.navigate(['/minha-conta'], {
              queryParams: { returnUrl: '/checkout' },
            });
            return;
          }
          if (!this.checkoutMode()) {
            void this.router.navigate(['/checkout']);
          }
        },
        error: () => {
          this.snack.open(
            'Não foi possível validar o estoque agora. Tente novamente em instantes.',
            'Fechar',
            { duration: 4500 },
          );
        },
      });
  }
}
