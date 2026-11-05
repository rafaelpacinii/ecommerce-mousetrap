import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { Pedido, dataPedido } from '../../../models/pedido.model';
import { PedidoService } from '../../../services/pedido.service';
import { mensagemErro } from '../../../services/erro-api';
import { paginacaoPortugues } from '../../../services/paginator-intl';
import { OrderDetailsComponent } from '../../shared/order-details/order-details';
@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatPaginatorModule, OrderDetailsComponent],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  templateUrl: './order-history.html',
  styleUrl: './customer-portal.css',
})
export class OrderHistoryComponent implements OnInit {
  private readonly service = inject(PedidoService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly pedidos = signal<Pedido[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly pagina = signal(0);
  readonly tamanho = signal(5);
  readonly total = signal(0);
  readonly data = dataPedido;
  readonly ativo = computed(() =>
    this.pagina() === 0 ? this.pedidos().find((p) => p.status.id <= 3) : undefined,
  );
  readonly anteriores = computed(() => this.pedidos().filter((p) => p.id !== this.ativo()?.id));
  ngOnInit() {
    this.carregar();
  }
  carregar() {
    this.request?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    this.request = this.service
      .meus(this.pagina(), this.tamanho())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.pedidos.set(r.items);
          this.total.set(r.totalItems);
        },
        error: (e) => this.erro.set(mensagemErro(e)),
      });
  }
  paginar(e: PageEvent) {
    this.pagina.set(e.pageIndex);
    this.tamanho.set(e.pageSize);
    this.carregar();
  }
}
