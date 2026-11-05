import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { inject, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './storefront-layout.html',
  styleUrls: ['./storefront-layout.css', './storefront-footer.css'],
})
export class StorefrontLayoutComponent {
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly paginaAuth = computed(() =>
    /^\/(login|cadastro|auth\/callback|acesso-negado)([?#]|$)/.test(this.url()),
  );
  readonly busca = signal('');
  readonly auth = inject(AuthService);
  readonly primeiroNome = computed(() => this.auth.nome().trim().split(/\s+/)[0] || 'Sua conta');
  readonly nomeUsuario = computed(() => {
    const primeiroNome = this.primeiroNome();
    const caracteres = Array.from(primeiroNome);
    return caracteres.length > 16 ? caracteres.slice(0, 13).join('') + '...' : primeiroNome;
  });
  readonly carrinho = inject(CarrinhoService);
  readonly menuAberto = signal(false);
  buscar(event: Event): void {
    event.preventDefault();
    this.menuAberto.set(false);
    void this.router.navigate(['/catalogo'], {
      queryParams: { nome: this.busca().trim() || null },
    });
  }
}
