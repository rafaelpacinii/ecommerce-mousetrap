import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { paginacaoPortugues } from '../../../services/paginator-intl';
import { ConfirmacaoService } from '../../shared/confirm-dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, finalize, switchMap, Subscription } from 'rxjs';
import { Cliente } from '../../../models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';
import { mensagemErro } from '../../../services/erro-api';
@Component({
  selector: 'app-cliente-list',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  imports: [
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteListComponent implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  private request?: Subscription;
  readonly ordenar = signal('');
  private readonly service = inject(ClienteService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly registros = signal<Cliente[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly excluindo = signal<number | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly filtro = signal('');
  readonly colunas = ['nome', 'email', 'municipio', 'acoes'];
  ngOnInit(): void {
    this.carregar();
  }
  carregar(): void {
    this.request?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    this.request = this.service
      .pesquisar(this.filtro(), this.ordenar() || 'nome', this.pageIndex(), this.pageSize())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.registros.set(r.items);
          this.totalItems.set(r.totalItems);
        },
        error: (erro: unknown) => this.erro.set(mensagemErro(erro)),
      });
  }
  applyFilter(event: Event) {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    this.carregar();
  }
  onPageChange(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.carregar();
  }
  ordenarPor(e: Sort) {
    const campo = e.active === 'estoque' ? 'quantidadeEstoque' : e.active;
    this.ordenar.set(e.direction ? campo + (e.direction === 'desc' ? '-desc' : '') : '');
    this.pageIndex.set(0);
    this.carregar();
  }
  excluir(cliente: Cliente): void {
    if (cliente.id == null || this.excluindo() !== null) return;
    const id = cliente.id;
    this.excluindo.set(id);
    this.confirmacao
      .abrir(
        'Excluir cliente?',
        `Excluir "${cliente.nome}"? Esta ação não pode ser desfeita.`,
        'Excluir',
      )
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(id)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.excluindo.set(null)),
      )
      .subscribe({
        next: () => {
          this.registros.update((dados) => dados.filter((c) => c.id !== id));
          this.totalItems.update((t) => Math.max(0, t - 1));
          this.snack.open('Cliente excluído com sucesso.', 'Fechar', { duration: 4000 });
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
