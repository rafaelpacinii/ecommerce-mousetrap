import { ConfirmacaoService } from '../../shared/confirm-dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { paginacaoPortugues } from '../../../services/paginator-intl';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { filter, finalize, switchMap, Subscription } from 'rxjs';
import { Marca } from '../../../models/marca.model';
import { MarcaService } from '../../../services/marca.service';
import { mensagemErro } from '../../../services/erro-api';

@Component({
  selector: 'app-marca-list',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  imports: [
    MatSortModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
  ],
  templateUrl: './marca-list.html',
  styleUrl: './marca-list.css',
})
export class MarcaListComponent implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  private request?: Subscription;
  readonly ordenar = signal('');
  private readonly service = inject(MarcaService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly registros = signal<Marca[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly excluindo = signal<number | null>(null);
  readonly colunas = ['nome', 'ativo', 'acoes'];
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly filtro = signal('');

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.request?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    const termo = this.filtro().trim();
    const requisicao = this.ordenar()
      ? this.service.pesquisar(termo, this.ordenar(), this.pageIndex(), this.pageSize())
      : termo
        ? this.service.findByNome(termo, this.pageIndex(), this.pageSize())
        : this.service.findAll(this.pageIndex(), this.pageSize());
    this.request = requisicao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.registros.set(response.items);
          this.totalItems.set(response.totalItems);
        },
        error: (erro: unknown) => this.erro.set(mensagemErro(erro)),
      });
  }

  applyFilter(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    this.carregar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }

  ordenarPor(e: Sort) {
    const campo = e.active === 'estoque' ? 'quantidadeEstoque' : e.active;
    this.ordenar.set(e.direction ? campo + (e.direction === 'desc' ? '-desc' : '') : '');
    this.pageIndex.set(0);
    this.carregar();
  }
  excluir(registro: Marca): void {
    if (registro.id == null || this.excluindo() !== null) return;
    const id = registro.id;
    this.excluindo.set(id);
    this.confirmacao
      .abrir(
        'Excluir marca?',
        `Excluir "${registro.nome}"? Esta ação não pode ser desfeita.`,
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
          this.registros.update((registros) => registros.filter((item) => item.id !== id));
          this.totalItems.update((total) => Math.max(0, total - 1));
          this.snack.open('Marca excluída com sucesso.', 'Fechar', { duration: 4000 });
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
