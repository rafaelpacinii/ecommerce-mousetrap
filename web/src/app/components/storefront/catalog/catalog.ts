import { paginacaoPortugues } from '../../../services/paginator-intl';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, combineLatest, startWith, catchError, of, switchMap } from 'rxjs';
import { CatalogoService } from '../../../services/catalogo.service';
import {
  CatalogoFacetas,
  CatalogoFiltro,
  ORDENACOES,
  POLLING_RATES,
  Produto,
} from '../../../models/catalogo.model';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-catalog',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    ProductCardComponent,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class CatalogComponent implements OnInit {
  private readonly service = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly meta = inject(Meta);
  private readonly tentativas = new Subject<void>();
  readonly produtos = signal<Produto[]>([]);
  readonly facetas = signal<CatalogoFacetas | null>(null);
  readonly erroFacetas = signal(false);
  readonly carregando = signal(true);
  readonly erro = signal(false);
  readonly filtrosAbertos = signal(false);
  readonly total = signal(0);
  readonly filtro = signal<CatalogoFiltro>({});
  readonly ordenacoes = ORDENACOES;
  readonly pollingRates = POLLING_RATES;
  readonly form = this.fb.nonNullable.group(
    {
      nome: ['', Validators.maxLength(150)],
      marca: this.fb.nonNullable.control<number[]>([]),
      sensor: [''],
      conexao: this.fb.nonNullable.control<number[]>([]),
      pegada: this.fb.nonNullable.control<number[]>([]),
      pollingRateMin: this.fb.control<number | null>(null),
      tipoSwitch: this.fb.control<number | null>(null),
      pesoMax: this.fb.control<number | null>(null, Validators.min(0.01)),
      precoMin: this.fb.control<number | null>(null, Validators.min(0)),
      precoMax: this.fb.control<number | null>(null, Validators.min(0)),
      emEstoque: [false],
    },
    {
      validators: (control) => {
        const min = control.get('precoMin')?.value,
          max = control.get('precoMax')?.value;
        return min != null && max != null && min > max ? { faixaPreco: true } : null;
      },
    },
  );

  ngOnInit(): void {
    this.meta.updateTag({
      name: 'description',
      content: 'Explore os mouses MouseTrap por marca, sensor, pegada, conexão, peso e preço.',
    });
    this.carregarFacetas();
    combineLatest([this.route.queryParamMap, this.tentativas.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          const f = this.lerFiltros(params);
          this.filtro.set(f);
          this.form.reset(
            {
              nome: f.nome ?? '',
              marca: f.marca ?? [],
              sensor: f.sensor ?? '',
              conexao: f.conexao ?? [],
              pegada: f.pegada ?? [],
              pollingRateMin: f.pollingRateMin ?? null,
              tipoSwitch: f.tipoSwitch ?? null,
              pesoMax: f.pesoMax ?? null,
              precoMin: f.precoMin ?? null,
              precoMax: f.precoMax ?? null,
              emEstoque: f.emEstoque ?? false,
            },
            { emitEvent: false },
          );
          this.carregando.set(true);
          this.erro.set(false);
          return this.service.findAll(f).pipe(
            catchError(() => {
              this.erro.set(true);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resposta) => {
        this.carregando.set(false);
        if (!resposta) {
          this.produtos.set([]);
          return;
        }
        if (resposta.page >= resposta.totalPages && resposta.page > 0) {
          this.navegar({ page: 0 }, true);
          return;
        }
        this.produtos.set(resposta.items);
        this.total.set(resposta.totalItems);
      });
  }

  carregarFacetas(): void {
    this.erroFacetas.set(false);
    this.service
      .facetas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (valor) => this.facetas.set(valor),
        error: () => this.erroFacetas.set(true),
      });
  }

  aplicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.navegar({
      ...v,
      nome: v.nome.trim(),
      pollingRateMin: v.pollingRateMin ?? undefined,
      tipoSwitch: v.tipoSwitch ?? undefined,
      pesoMax: v.pesoMax ?? undefined,
      precoMin: v.precoMin ?? undefined,
      precoMax: v.precoMax ?? undefined,
      page: 0,
    });
    this.filtrosAbertos.set(false);
  }
  limpar(): void {
    void this.router.navigate(['/catalogo']);
  }
  ordenar(valor: string): void {
    this.navegar({ ordenar: valor, page: 0 });
  }
  paginar(event: PageEvent): void {
    this.navegar({ page: event.pageIndex, pageSize: event.pageSize });
  }
  repetir(): void {
    this.tentativas.next();
  }

  private navegar(atualizar: CatalogoFiltro, replaceUrl = false): void {
    const params = { ...this.filtro(), ...atualizar };
    void this.router.navigate(['/catalogo'], { queryParams: params, replaceUrl });
  }
  private lerFiltros(p: ParamMap): CatalogoFiltro {
    const numero = (chave: string) => (p.has(chave) ? Number(p.get(chave)) : undefined);
    return {
      nome: p.get('nome') ?? '',
      marca: p.getAll('marca').map(Number),
      sensor: p.get('sensor') ?? '',
      conexao: p.getAll('conexao').map(Number),
      pegada: p.getAll('pegada').map(Number),
      pollingRateMin: numero('pollingRateMin'),
      tipoSwitch: numero('tipoSwitch'),
      pesoMax: numero('pesoMax'),
      precoMin: numero('precoMin'),
      precoMax: numero('precoMax'),
      emEstoque: p.get('emEstoque') === 'true',
      ordenar: p.get('ordenar') ?? 'nome',
      page: numero('page') ?? 0,
      pageSize: numero('pageSize') ?? 12,
    };
  }
}
