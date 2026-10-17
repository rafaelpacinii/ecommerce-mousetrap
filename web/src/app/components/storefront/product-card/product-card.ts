import { MatIconModule } from '@angular/material/icon';
import { Component, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Mouse } from '../../../models/mouse.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [MatIconModule, CurrencyPipe, DecimalPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  readonly produto = input.required<Mouse>();
}
