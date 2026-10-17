import { MatIconModule } from '@angular/material/icon';
import { Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Produto } from '../../../models/catalogo.model';
import { RouterLink } from '@angular/router';
import { ProductImageComponent } from '../product-image/product-image';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [MatIconModule, CurrencyPipe, DecimalPipe, RouterLink, ProductImageComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  readonly capa = computed(
    () => [...(this.produto().imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0],
  );
  readonly produto = input.required<Produto>();
}
