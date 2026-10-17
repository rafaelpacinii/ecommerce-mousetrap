import { MatIconModule } from '@angular/material/icon';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterOutlet],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.css',
})
export class StorefrontLayoutComponent {
  readonly menuAberto = signal(false);
}
