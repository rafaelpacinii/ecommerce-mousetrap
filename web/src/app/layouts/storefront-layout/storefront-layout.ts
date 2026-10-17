import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { inject, Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterOutlet],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.css',
})
export class StorefrontLayoutComponent {
  readonly auth = inject(AuthService);
  readonly carrinho = inject(CarrinhoService);
  readonly menuAberto = signal(false);
}

