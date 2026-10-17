import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, finalize, Subscription, switchMap, tap } from 'rxjs';
import { CheckoutService } from '../../../services/checkout.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { ClienteService } from '../../../services/cliente.service';
import { mensagemErro } from '../../../services/erro-api';
import { Endereco } from '../../../models/cliente.model';
import { Pedido, RevisaoPedido } from '../../../models/pedido.model';
import { criarFormularioCartao } from './cartao.form';
import { CardFieldsComponent } from './card-fields';
import { PixPaymentComponent } from './pix-payment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    CardFieldsComponent,
    PixPaymentComponent,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  readonly checkout = inject(CheckoutService);
  readonly carrinho = inject(CarrinhoService);
  private readonly clientes = inject(ClienteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private revisaoSub?: Subscription;
  readonly carregando = signal(true);
  readonly ocupado = signal(false);
  readonly checkoutDisponivel = signal(false);
  readonly cartao = criarFormularioCartao();
  readonly statusCartao = toSignal(this.cartao.statusChanges, { initialValue: this.cartao.status });
  readonly enderecos = signal<Endereco[]>([]);
  readonly revisao = signal<RevisaoPedido | null>(null);
  readonly pedido = signal<Pedido | null>(null);
  readonly erro = signal('');
  readonly aviso = signal('');
  readonly vencimento = computed(() => {
    const prazo = this.pedido()?.expiraEm;
    return prazo
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date(prazo),
        )
      : '';
  });
  readonly pagamentoPendente = computed(() =>
    this.pedido()?.pagamentos.find((p) => p.status.id === 1),
  );
  readonly form = this.fb.group({
    idEndereco: [null as number | null, Validators.required],
    forma: [1, Validators.required],
  });

  readonly formaPagamento = toSignal(this.form.controls.forma.valueChanges, {
    initialValue: this.form.controls.forma.value,
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.cartao.reset());
    if (this.checkout.tentativa()) {
      this.form.controls.forma.setValue(this.checkout.tentativa()!.forma);
      this.checkout
        .configuracao()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (config) => {
            this.checkoutDisponivel.set(config.simulacaoHabilitada);
            this.recuperar();
          },
          error: (erro) => {
            this.carregando.set(false);
            this.falha(erro);
          },
        });
      return;
    }
    this.preparar();
  }
  preparar(): void {
    this.carregando.set(true);
    this.erro.set('');
    forkJoin({
      config: this.checkout.configuracao(),
      enderecos: this.clientes.listarMeusEnderecos(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: ({ config, enderecos }) => {
          this.checkoutDisponivel.set(config.simulacaoHabilitada);
          this.enderecos.set(enderecos);
          this.form.controls.idEndereco.setValue(
            (enderecos.find((e) => e.principal) ?? enderecos[0])?.id ?? null,
          );
          if (config.simulacaoHabilitada) this.atualizarRevisao();
        },
        error: (erro) => this.falha(erro),
      });
  }
  atualizarRevisao(): void {
    const id = this.form.controls.idEndereco.value;
    this.revisaoSub?.unsubscribe();
    this.revisao.set(null);
    if (!id || !this.carrinho.itens().length) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.revisaoSub = this.checkout
      .revisar(
        id,
        this.carrinho.itens().map((i) => ({ idMouse: i.idMouse, quantidade: i.quantidade })),
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ocupado.set(false)),
      )
      .subscribe({
        next: (revisao) => {
          this.revisao.set(revisao);
          if (
            revisao.itens.some(
              (i) =>
                this.carrinho.itens().find((c) => c.idMouse === i.idMouse)?.precoUnitario !==
                i.precoUnitario,
            )
          )
            this.aviso.set(
              'Os preços foram atualizados. Confira os valores abaixo antes de confirmar.',
            );
        },
        error: (erro) => this.falha(erro),
      });
  }
  confirmar(): void {
    const revisao = this.revisao(),
      id = this.form.controls.idEndereco.value,
      forma = this.form.controls.forma.value!;
    if (!revisao || !id || this.form.invalid || this.ocupado() || !this.validarCartao()) return;
    this.cartao.reset();
    this.executar(() =>
      this.checkout.confirmar(revisao, id, forma).pipe(
        tap((p) => this.pedido.set(p)),
        switchMap((p) => (p.status.id === 1 ? this.checkout.pagar(p, 3, forma) : [p])),
      ),
    );
  }
  recuperar(): void {
    this.carregando.set(false);
    this.executar(() => this.checkout.recuperar());
  }
  pagar(): void {
    const p = this.pedido();
    if (!p || this.ocupado() || !this.validarCartao()) return;
    this.cartao.reset();
    this.executar(() => this.checkout.pagar(p, 3, this.form.controls.forma.value!));
  }
  dadosCartaoInvalidos(): boolean {
    return (
      this.formaPagamento() === 2 &&
      !this.checkout.tentativa()?.pagamento &&
      this.statusCartao() !== 'VALID'
    );
  }
  private validarCartao(): boolean {
    if (!this.dadosCartaoInvalidos()) return true;
    this.cartao.markAllAsTouched();
    return false;
  }
  cancelar(): void {
    const p = this.pedido();
    if (p) this.executar(() => this.checkout.cancelar(p.id));
  }
  novaCompra(): void {
    this.checkout.novaCompra();
    void this.router.navigate(['/catalogo']);
  }
  private executar(request: () => import('rxjs').Observable<Pedido>): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    try {
      request()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.ocupado.set(false)),
        )
        .subscribe({
          next: (p) => {
            this.pedido.set(p);
          },
          error: (erro) => this.falha(erro),
        });
    } catch (erro) {
      this.ocupado.set(false);
      this.falha(erro);
    }
  }
  private falha(erro: unknown): void {
    this.erro.set(
      erro instanceof Error && !(erro instanceof HttpErrorResponse)
        ? erro.message
        : mensagemErro(erro),
    );
  }
}
