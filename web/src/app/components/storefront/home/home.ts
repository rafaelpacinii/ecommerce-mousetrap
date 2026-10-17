import { MatIconModule } from '@angular/material/icon';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { Observable, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { Mouse } from '../../../models/mouse.model';
import { MouseService } from '../../../services/mouse.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, FormsModule, ProductCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private readonly service = inject(MouseService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly meta = inject(Meta);
  private readonly consultas = new Subject<string>();
  readonly produtos = signal<Mouse[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal(false);
  readonly termoAtual = signal('');
  termo = '';
  readonly pegadas = [
    {
      nome: 'Claw',
      icone: 'touch_app',
      resumo: 'Agilidade na ponta dos dedos.',
      descricao:
        'Dedos arqueados e a base da palma apoiada. Observe o formato da traseira e o espaço para movimentar os dedos.',
    },
    {
      nome: 'Palm',
      icone: 'pan_tool',
      resumo: 'Apoio para a mão inteira.',
      descricao:
        'A palma acompanha o corpo do mouse. Compare o comprimento e a curvatura do modelo com o tamanho da sua mão.',
    },
    {
      nome: 'Fingertip',
      icone: 'gesture',
      resumo: 'Liberdade para cada movimento.',
      descricao:
        'Somente as pontas dos dedos tocam o mouse. Peso e dimensões ajudam a escolher um modelo confortável para esse apoio.',
    },
  ];

  ngOnInit(): void {
    this.meta.updateTag({
      name: 'description',
      content:
        'Encontre seu próximo mouse gamer na MouseTrap. Conheça os produtos do catálogo e descubra a pegada que combina com seu jeito de jogar.',
    });
    this.consultas
      .pipe(
        startWith(''),
        switchMap((termo) => {
          this.termoAtual.set(termo);
          this.carregando.set(true);
          this.erro.set(false);
          return this.buscarDisponiveis(termo).pipe(
            map((produtos) => ({ produtos, erro: false })),
            catchError(() => of({ produtos: [] as Mouse[], erro: true })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.produtos.set(resultado.produtos);
        this.erro.set(resultado.erro);
        this.carregando.set(false);
      });
  }

  buscar(): void {
    this.consultas.next(this.termo.trim());
  }

  limpar(): void {
    this.termo = '';
    this.buscar();
  }

  private buscarDisponiveis(
    termo: string,
    pagina = 0,
    anteriores: Mouse[] = [],
  ): Observable<Mouse[]> {
    const consulta = termo
      ? this.service.findByNome(termo, pagina, 12)
      : this.service.findAll(pagina, 12);
    return consulta.pipe(
      switchMap((resposta) => {
        const produtos = [
          ...anteriores,
          ...resposta.items.filter((mouse) => mouse.ativo && mouse.marca.ativo),
        ];
        // Continue past inactive records instead of showing a false empty catalog.
        return produtos.length >= 3 || pagina + 1 >= resposta.totalPages
          ? of(produtos.slice(0, 3))
          : this.buscarDisponiveis(termo, pagina + 1, produtos);
      }),
    );
  }
}
