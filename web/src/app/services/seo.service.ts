import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Produto } from '../models/catalogo.model';

const DEFAULT_DESCRIPTION =
  'Encontre seu próximo mouse gamer na MouseTrap. Compare sensores, peso, conexão e desempenho para a sua pegada.';

@Injectable({ providedIn: 'root' })
export class SeoService extends TitleStrategy {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const path = snapshot.url.split(/[?#]/)[0];
    if (route.data['produto']) {
      this.product(route.data['produto'].produto);
      return;
    }
    const publicPage = path === '/' || path === '/catalogo';
    this.page(
      this.buildTitle(snapshot) ?? 'MouseTrap',
      [...route.pathFromRoot].reverse().find((node) => node.data['description'])?.data[
        'description'
      ] ?? DEFAULT_DESCRIPTION,
      publicPage ? path : null,
    );
  }

  private absolute(path: string): string {
    return new URL(path, this.document.baseURI).href;
  }

  private page(title: string, description: string, path: string | null, image?: string): void {
    this.clearProduct();
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: path ? 'index, follow' : 'noindex, nofollow' });
    for (const [property, content] of Object.entries({
      'og:title': title,
      'og:description': description,
      'og:site_name': 'MouseTrap',
      'og:locale': 'pt_BR',
      'og:type': 'website',
      'og:image': image ?? this.absolute('/images/hero-1440.webp'),
      'og:image:alt': image ? title : 'MouseTrap — Precisão absoluta em cada clique',
    }))
      this.meta.updateTag({ property, content });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
    this.meta.removeTag('property="og:url"');
    if (path) {
      const url = this.absolute(path);
      const canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url;
      this.document.head.appendChild(canonical);
      this.meta.updateTag({ property: 'og:url', content: url });
    }
  }

  product(product: Produto | null): void {
    if (!product) {
      this.page(
        'Produto indisponível | MouseTrap',
        'Encontre outros mouses no catálogo MouseTrap.',
        null,
      );
      return;
    }
    const path = `/catalogo/${product.id}`;
    const images = [...(product.imagens ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((image) => this.absolute(image.url))
      .filter((url) => /^https?:\/\//.test(url));
    this.page(`${product.nome} | MouseTrap`, product.descricao.slice(0, 160), path, images[0]);
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    const script = this.document.createElement('script');
    script.id = 'product-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.nome,
      description: product.descricao,
      sku: product.sku,
      brand: { '@type': 'Brand', name: product.marca.nome },
      ...(images.length ? { image: images } : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: product.preco,
        availability: `https://schema.org/${product.quantidadeEstoque > 0 ? 'InStock' : 'OutOfStock'}`,
        url: this.absolute(path),
      },
    }).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  clearProduct(): void {
    this.document.getElementById('product-structured-data')?.remove();
  }
}
