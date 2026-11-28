import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoFiltro, Produto } from '../../../models/catalogo.model';
import { CatalogoService } from '../../../services/catalogo.service';
import { ProductCardComponent } from '../product-card/product-card';

export interface HomeShelf {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  filters: CatalogoFiltro;
  searchable?: boolean;
}

@Component({
  selector: 'app-home-shelf',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, ProductCardComponent],
  templateUrl: './home-shelf.html',
  styleUrls: ['./home-shelf.css', './home-progress.css', './home-shelf-motion.css'],
})
export class HomeShelfComponent implements OnInit {
  private readonly service = inject(CatalogoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = new Subject<string>();
  readonly shelf = input.required<HomeShelf>();
  readonly products = signal<Produto[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly currentTerm = signal('');
  term = '';

  ngOnInit(): void {
    this.queries
      .pipe(
        startWith(''),
        switchMap((term) => {
          this.currentTerm.set(term);
          this.loading.set(true);
          this.error.set(false);
          return this.service.findAll({ ...this.shelf().filters, nome: term, pageSize: 4 }).pipe(
            map((response) => ({ products: response.items, error: false })),
            catchError(() => of({ products: [] as Produto[], error: true })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.products.set(result.products);
        this.error.set(result.error);
        this.loading.set(false);
      });
  }

  search(): void {
    this.queries.next(this.term.trim());
  }
  retry(): void {
    this.queries.next(this.currentTerm());
  }
  clear(): void {
    this.term = '';
    this.search();
  }
}
