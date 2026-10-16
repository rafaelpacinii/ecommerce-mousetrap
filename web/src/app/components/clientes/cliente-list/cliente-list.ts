import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Cliente } from '../../../models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';
import { mensagemErro } from '../../../services/erro-api';
@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteListComponent implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly registros = signal<Cliente[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly excluindo = signal<number | null>(null);
  readonly colunas = ['nome', 'email', 'municipio', 'acoes'];
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
        next: (dados) => this.registros.set(dados),
        error: (erro: unknown) => this.erro.set(mensagemErro(erro)),
      });
  }
  excluir(cliente: Cliente): void {
    if (
      cliente.id == null ||
      this.excluindo() !== null ||
      !window.confirm(`Excluir cliente "${cliente.nome}"?`)
    )
      return;
    const id = cliente.id;
    this.excluindo.set(id);
    this.service
      .delete(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.excluindo.set(null)),
      )
      .subscribe({
        next: () => {
          this.registros.update((dados) => dados.filter((c) => c.id !== id));
          this.snack.open('Cliente excluído com sucesso.', 'Fechar', { duration: 4000 });
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
