import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoService } from '../../../services/catalogo.service';
import { Marca } from '../../../models/marca.model';

// The CSS tile never gets narrower than this, including its gutters.
const MIN_TILE_WIDTH = 140;

@Component({
  selector: 'app-home-brands',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './home-brands.html',
  styleUrl: './home-brands.css',
})
export class HomeBrandsComponent implements OnInit {
  private readonly service = inject(CatalogoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly reload = new Subject<void>();
  readonly sectionWidth = signal(0);
  private readonly brands = signal<Marca[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly failedLogos = signal(new Set<string>());
  readonly logos = computed(() =>
    this.brands().filter(
      (brand): brand is Marca & { logomarcaUrl: string } =>
        !!brand.logomarcaUrl?.trim() && !this.failedLogos().has(brand.logomarcaUrl),
    ),
  );
  readonly cycles = [0, 1];
  readonly copies = computed(() => {
    const rowWidth = Math.max(1, this.logos().length) * MIN_TILE_WIDTH;
    const count = Math.max(1, Math.ceil(this.sectionWidth() / rowWidth));
    return Array.from({ length: count }, (_, index) => index);
  });

  constructor() {
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) =>
        this.sectionWidth.set(entry.contentRect.width),
      );
      observer.observe(this.host);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  ngOnInit(): void {
    this.reload
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.error.set(false);
          return this.service.facetas().pipe(
            map((response) => ({ brands: response.marcas, error: false })),
            catchError(() => of({ brands: [] as Marca[], error: true })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.brands.set(result.brands.filter((brand) => !!brand.id));
        this.error.set(result.error);
        this.loading.set(false);
      });
  }
  retry(): void {
    this.reload.next();
  }
  preventCopyFocus(duplicate: boolean, event: MouseEvent): void {
    if (duplicate) event.preventDefault();
  }

  logoFailed(url: string): void {
    if (this.failedLogos().has(url)) return;
    this.failedLogos.update((previous) => new Set([...previous, url]));
  }
}
