import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { Pedido } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { mensagemErro } from '../../../services/erro-api';
import { OrderDetailsComponent } from '../../shared/order-details/order-details';
@Component({
  selector: 'app-customer-order',
  standalone: true,
  imports: [RouterLink, MatIconModule, OrderDetailsComponent],
  template: ` <div class="portal-content">
    <a class="order-link" routerLink="/meus-pedidos"
      ><mat-icon aria-hidden="true">arrow_back</mat-icon>Meus pedidos</a
    >
    @if (erro()) {
      <p class="feedback" role="alert">{{ erro() }}</p>
    }
    @if (pedido(); as p) {
      <app-order-details [pedido]="p" />
      <div class="detail-actions">
        <button class="text-button" (click)="atualizar()" [disabled]="ocupado()">
          <mat-icon aria-hidden="true">refresh</mat-icon>Atualizar pedido
        </button>
        @if (p.status.id === 1) {
          <a
            class="store-button store-button-gold"
            routerLink="/checkout"
            [queryParams]="{ pedido: p.id }"
            >Continuar com o pagamento</a
          >
        }
      </div>
    }
  </div>`,
  styleUrl: './customer-portal.css',
})
export class CustomerOrderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PedidoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pedido = signal<Pedido | null>(null);
  readonly erro = signal('');
  readonly ocupado = signal(false);
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((d) => {
      this.pedido.set(d['pedido'].dados);
      this.erro.set(d['pedido'].erro);
    });
  }
  atualizar() {
    const id = this.pedido()?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.service
      .meu(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ocupado.set(false)),
      )
      .subscribe({ next: (p) => this.pedido.set(p), error: (e) => this.erro.set(mensagemErro(e)) });
  }
}
