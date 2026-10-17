import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap, finalize, Observable } from 'rxjs';
import { PedidoAdmin } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido.service';
import { ConfirmacaoService } from '../shared/confirm-dialog';
import { mensagemErro } from '../../services/erro-api';
import { OrderDetailsComponent } from '../shared/order-details/order-details';
@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    OrderDetailsComponent,
  ],
  templateUrl: './admin-order.html',
  styleUrl: './admin-order.css',
})
export class AdminOrderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PedidoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly dados = signal<PedidoAdmin | null>(null);
  readonly erro = signal('');
  readonly ocupado = signal(false);
  readonly envio = this.fb.nonNullable.group({
    transportadora: [
      '',
      [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)],
    ],
    codigoRastreio: [
      '',
      [
        Validators.required,
        Validators.maxLength(80),
        Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/),
      ],
    ],
  });
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((d) => {
      this.dados.set(d['pedido'].dados);
      this.erro.set(d['pedido'].erro);
    });
  }
  atualizar() {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.service
      .admin(Number(this.route.snapshot.paramMap.get('id')))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ocupado.set(false)),
      )
      .subscribe({ next: (r) => this.dados.set(r), error: (e) => this.erro.set(mensagemErro(e)) });
  }
  decidir(pagamentoId: number, resultado: number) {
    const p = this.dados()?.pedido;
    if (p)
      this.executar(
        resultado === 1 ? 'Confirmar pagamento?' : 'Recusar pagamento?',
        resultado === 1
          ? 'O pedido ficará pago e poderá ser enviado.'
          : 'O cliente poderá fazer uma nova tentativa antes do vencimento.',
        () => this.service.decidir(p.id, pagamentoId, p.versao!, resultado),
      );
  }
  enviar() {
    const p = this.dados()?.pedido;
    this.envio.markAllAsTouched();
    if (!p || this.envio.invalid) return;
    const v = this.envio.getRawValue();
    this.executar(
      'Confirmar envio?',
      'Confira a transportadora e o código de rastreio. Estes dados serão exibidos ao cliente.',
      () => this.service.enviar(p.id, p.versao!, v.transportadora.trim(), v.codigoRastreio.trim()),
    );
  }
  entregar() {
    const p = this.dados()?.pedido;
    if (p)
      this.executar(
        'Confirmar entrega?',
        'Confirme esta operação somente após a entrega ao destinatário.',
        () => this.service.entregar(p.id, p.versao!),
      );
  }
  cancelar() {
    const p = this.dados()?.pedido;
    if (p)
      this.executar(
        'Cancelar pedido?',
        'O pagamento pendente será encerrado e os produtos voltarão ao estoque.',
        () => this.service.cancelar(p.id, p.versao!),
      );
  }
  private executar(titulo: string, mensagem: string, request: () => Observable<PedidoAdmin>) {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.confirmacao
      .abrir(titulo, mensagem)
      .pipe(
        filter(Boolean),
        switchMap(() => request()),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ocupado.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.dados.set(r);
          this.snack.open('Pedido atualizado.', 'Fechar', { duration: 4000 });
        },
        error: (e) => this.erro.set(mensagemErro(e)),
      });
  }
}
