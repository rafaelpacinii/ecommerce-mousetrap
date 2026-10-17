import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, finalize, Subscription } from 'rxjs';
import { PedidoService } from '../../services/pedido.service';
import {
  IndicadoresPedido,
  ResumoPedido,
  STATUS_PEDIDO,
  dataPedido,
} from '../../models/pedido.model';
import { mensagemErro } from '../../services/erro-api';
import { paginacaoPortugues } from '../../services/paginator-intl';
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrdersComponent implements OnInit {
  private readonly service = inject(PedidoService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly registros = signal<ResumoPedido[]>([]);
  readonly indicadores = signal<IndicadoresPedido | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly status = signal<number | null>(null);
  readonly ordenar = signal('recentes');
  readonly pagina = signal(0);
  readonly tamanho = signal(10);
  readonly total = signal(0);
  readonly busca = new FormControl('', { nonNullable: true });
  readonly estados = STATUS_PEDIDO;
  readonly data = dataPedido;
  readonly colunas = ['id', 'cliente', 'criadoEm', 'total', 'status', 'acoes'];
  ngOnInit() {
    this.carregar();
  }
  carregar() {
    this.request?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    this.request = forkJoin({
      lista: this.service.listar(
        this.busca.value.trim(),
        this.status(),
        this.ordenar(),
        this.pagina(),
        this.tamanho(),
      ),
      indicadores: this.service.indicadores(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.registros.set(r.lista.items);
          this.total.set(r.lista.totalItems);
          this.indicadores.set(r.indicadores);
        },
        error: (e) => this.erro.set(mensagemErro(e)),
      });
  }
  filtrar(status: number | null) {
    this.status.set(status);
    this.pagina.set(0);
    this.carregar();
  }
  pesquisar() {
    this.pagina.set(0);
    this.carregar();
  }
  paginar(e: PageEvent) {
    this.pagina.set(e.pageIndex);
    this.tamanho.set(e.pageSize);
    this.carregar();
  }
  ordenarPor(s: Sort) {
    this.ordenar.set(
      !s.direction
        ? 'recentes'
        : s.active === 'criadoEm' || s.active === 'id'
          ? s.direction === 'asc'
            ? 'antigos'
            : 'recentes'
          : s.active + (s.direction === 'desc' ? '-desc' : ''),
    );
    this.pagina.set(0);
    this.carregar();
  }
}
