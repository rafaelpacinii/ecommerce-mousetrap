import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ResultadoProduto } from '../../../resolvers/produto.resolver';
import { ProductImageComponent } from '../product-image/product-image';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CepService } from '../../../services/cep.service';
import { mensagemErro } from '../../../services/erro-api';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
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
  private readonly cepService = inject(CepService);
  private readonly snack = inject(MatSnackBar);
  readonly carrinho = inject(CarrinhoService);
  private script: HTMLScriptElement | null = null;
  readonly resultado = signal<ResultadoProduto>({ produto: null, status: 200 });
  readonly produto = computed(() => this.resultado().produto);
  readonly imagens = computed(() =>
    [...(this.produto()?.imagens ?? [])].sort((a, b) => a.ordem - b.ordem),
  );
  readonly selecionada = signal(0);
  readonly cepInput = signal(this.carrinho.frete()?.cep ?? '');
  readonly calculandoFrete = signal(false);
  readonly erroFrete = signal('');

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

  adicionarAoCarrinho(): void {
    const p = this.produto();
    if (!p || p.quantidadeEstoque <= 0) return;
    if (this.carrinho.adicionar(p, 1)) {
      this.snack.open(`${p.nome} adicionado ao carrinho.`, 'Ver carrinho', {
        duration: 4000,
      }).onAction().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        void this.router.navigate(['/carrinho']);
      });
    } else {
      this.snack.open('Você já adicionou a quantidade máxima disponível deste mouse.', 'Fechar', {
        duration: 4000,
      });
    }
  }

  calcularFrete(): void {
    if (this.calculandoFrete()) return;
    const cep = this.cepInput().replace(/\D/g, '');
    if (cep.length !== 8) {
      this.erroFrete.set('Informe um CEP com oito dígitos.');
      return;
    }
    this.erroFrete.set('');
    this.calculandoFrete.set(true);
    this.cepService
      .calcularFrete(cep)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.calculandoFrete.set(false)),
      )
      .subscribe({
        next: (frete) => {
          this.carrinho.definirFrete(frete);
          this.cepInput.set(frete.cep);
        },
        error: (erro: unknown) => this.erroFrete.set(mensagemErro(erro)),
      });
  }

  repetir(): void {
    void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }
}
