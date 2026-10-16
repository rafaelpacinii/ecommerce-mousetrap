import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Mouse } from '../../../models/mouse.model';
import { MouseService } from '../../../services/mouse.service';
import { mensagemErro } from '../../../services/erro-api';

@Component({
  selector: 'app-mouse-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule, CurrencyPipe],
  templateUrl: './mouse-list.html',
  styleUrl: './mouse-list.css',
})
export class MouseListComponent implements OnInit {
  private readonly service = inject(MouseService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly registros = signal<Mouse[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly excluindo = signal<number | null>(null);
  readonly colunas = ['nome', 'marca', 'preco', 'estoque', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service
      .findAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (registros) => this.registros.set(registros),
        error: (erro: unknown) => this.erro.set(mensagemErro(erro)),
      });
  }

  excluir(registro: Mouse): void {
    if (
      registro.id == null ||
      this.excluindo() !== null ||
      !window.confirm(`Excluir mouse "${registro.nome}"? Esta ação não pode ser desfeita.`)
    )
      return;
    const id = registro.id;
    this.excluindo.set(id);
    this.service
      .delete(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.excluindo.set(null)),
      )
      .subscribe({
        next: () => {
          this.registros.update((registros) => registros.filter((item) => item.id !== id));
          this.snack.open('Mouse excluído com sucesso.', 'Fechar', { duration: 4000 });
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
