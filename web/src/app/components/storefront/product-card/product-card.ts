import { MatIconModule } from '@angular/material/icon';
import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Produto } from '../../../models/catalogo.model';
import { RouterLink } from '@angular/router';
import { CarrinhoService } from '../../../services/carrinho.service';
import { ProductImageComponent } from '../product-image/product-image';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [MatIconModule, CurrencyPipe, DecimalPipe, RouterLink, ProductImageComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  private readonly carrinho = inject(CarrinhoService);
  private readonly snack = inject(MatSnackBar);
  readonly capa = computed(
    () => [...(this.produto().imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0],
  );
  readonly produto = input.required<Produto>();

  adicionarAoCarrinho(): void {
    const p = this.produto();
    if (this.carrinho.adicionar(p, 1)) {
      this.snack.open(`${p.nome} adicionado ao carrinho.`, 'Fechar', { duration: 3000 });
    }
  }
}

