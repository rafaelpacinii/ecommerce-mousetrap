import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { Desejo, DesejoService } from '../../../services/desejo.service';
import { mensagemErro } from '../../../services/erro-api';
import { paginacaoPortugues } from '../../../services/paginator-intl';
import { ProductCardComponent } from '../product-card/product-card';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button';
import { AccountNavComponent } from './account-nav';
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatPaginatorModule,
    ProductCardComponent,
    FavoriteButtonComponent,
    AccountNavComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginacaoPortugues }],
  template: ` <div class="store-container portal-grid">
    <app-account-nav />
    <div class="portal-content">
      <div class="page-heading">
        <div>
          <h1>Lista de desejos</h1>
          <p>Seus favoritos, prontos para a próxima escolha.</p>
        </div>
        <button class="text-button" (click)="carregar()" [disabled]="carregando()">
          <mat-icon aria-hidden="true">refresh</mat-icon>Atualizar
        </button>
      </div>
      @if (erro()) {
        <p class="feedback" role="alert">{{ erro() }}</p>
      }
      @if (carregando()) {
        <p role="status">Carregando seus favoritos…</p>
      }
      <div class="wishlist-grid">
        @for (d of visiveis(); track d.produto.id) {
          @if (d.disponivel) {
            <app-product-card [produto]="d.produto" />
          } @else {
            <article class="unavailable">
              <app-favorite-button [id]="d.produto.id" />
              <h2>{{ d.produto.nome }}</h2>
              <p>Este produto está indisponível no momento.</p>
            </article>
          }
        }
      </div>
      @if (!carregando() && !erro() && !visiveis().length) {
        <section class="empty">
          <mat-icon aria-hidden="true">favorite_border</mat-icon>
          <h2>Guarde seus favoritos aqui</h2>
          <p>Toque no coração de um mouse para adicioná-lo à sua lista.</p>
          <a class="store-button store-button-gold" routerLink="/catalogo">Explorar mouses</a>
        </section>
      }
      @if (total()) {
        <mat-paginator
          [length]="total()"
          [pageIndex]="pagina()"
          [pageSize]="12"
          (page)="paginar($event)"
          aria-label="Páginas da lista de desejos"
        />
      }
    </div>
  </div>`,
  styleUrls: ['./customer-portal.css', './wishlist.css'],
})
export class WishlistComponent implements OnInit {
  readonly desejos = inject(DesejoService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly registros = signal<Desejo[]>([]);
  readonly erro = signal('');
  readonly carregando = signal(false);
  readonly pagina = signal(0);
  readonly total = signal(0);
  readonly visiveis = computed(() =>
    this.registros().filter((d) => this.desejos.ids().includes(d.produto.id)),
  );
  ngOnInit() {
    this.carregar();
  }
  carregar() {
    this.request?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    this.request = this.desejos
      .listar(this.pagina())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.registros.set(r.items);
          this.total.set(r.totalItems);
        },
        error: (e) => this.erro.set(mensagemErro(e)),
      });
  }
  paginar(e: PageEvent) {
    this.pagina.set(e.pageIndex);
    this.carregar();
  }
}
