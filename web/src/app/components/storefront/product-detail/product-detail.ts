import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ResultadoProduto } from '../../../resolvers/produto.resolver';
import { ProductImageComponent } from '../product-image/product-image';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    ProductImageComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private script: HTMLScriptElement | null = null;
  readonly resultado = signal<ResultadoProduto>({ produto: null, status: 200 });
  readonly produto = computed(() => this.resultado().produto);
  readonly imagens = computed(() =>
    [...(this.produto()?.imagens ?? [])].sort((a, b) => a.ordem - b.ordem),
  );
  readonly selecionada = signal(0);

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resultado = data['produto'] as ResultadoProduto;
      this.resultado.set(resultado);
      this.selecionada.set(0);
      this.script?.remove();
      const p = resultado.produto;
      this.title.setTitle(p ? `${p.nome} | MouseTrap` : 'Produto indisponível | MouseTrap');
      this.meta.updateTag({
        name: 'description',
        content: p?.descricao.slice(0, 160) ?? 'Encontre outros mouses no catálogo MouseTrap.',
      });
      if (p) {
        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.nome,
          description: p.descricao,
          sku: p.sku,
          brand: { '@type': 'Brand', name: p.marca.nome },
          image: this.imagens().map((i) => new URL(i.url, this.document.baseURI).href),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'BRL',
            price: p.preco,
            availability:
              p.quantidadeEstoque > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: new URL(`catalogo/${p.id}`, this.document.baseURI).href,
          },
        }).replace(/</g, '\\u003c');
        this.document.head.appendChild(script);
        this.script = script;
      }
    });
    this.destroyRef.onDestroy(() => this.script?.remove());
  }
  repetir(): void {
    void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }
}
