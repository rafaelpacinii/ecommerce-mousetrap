import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-account-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: ` <aside>
    <div class="identity">
      <mat-icon aria-hidden="true">account_circle</mat-icon>
      <div>
        <strong>{{ auth.nome() || 'Minha conta' }}</strong
        ><small>{{ auth.email() }}</small>
      </div>
    </div>
    <nav aria-label="Área do cliente">
      <a routerLink="/meus-pedidos" routerLinkActive="active" ariaCurrentWhenActive="page"
        ><mat-icon aria-hidden="true">receipt_long</mat-icon>Meus pedidos</a
      >
      <a
        routerLink="/meus-dados"
        [queryParams]="{ returnUrl: retornoConta() }"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        ><mat-icon aria-hidden="true">person</mat-icon>Meus dados</a
      >
      <a
        routerLink="/enderecos"
        [queryParams]="{ returnUrl: retornoConta() }"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        ><mat-icon aria-hidden="true">location_on</mat-icon>Endereços</a
      >
      <a routerLink="/lista-de-desejos" routerLinkActive="active" ariaCurrentWhenActive="page"
        ><mat-icon aria-hidden="true">favorite_border</mat-icon>Lista de desejos</a
      >
      <button type="button" (click)="auth.logout()">
        <mat-icon aria-hidden="true">logout</mat-icon>Sair da conta
      </button>
    </nav>
  </aside>`,
  styles: `
    aside {
      padding: 24px 16px;
      border: 1px solid var(--neutral-200);
      border-radius: 16px;
      background: var(--surface-pure);
      box-shadow: var(--shadow-card);
    }
    .identity {
      display: flex;
      gap: 12px;
      padding: 0 8px 24px;
      align-items: center;
      border-bottom: 1px solid var(--neutral-200);
    }
    .identity > mat-icon {
      width: 38px;
      height: 38px;
      font-size: 38px;
      color: var(--prussian-blue);
      flex-shrink: 0;
    }
    .identity div {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    strong {
      font-size: 14px;
    }
    small {
      display: block;
      color: var(--neutral-500);
      font-size: 12px;
      margin-top: 6px;
    }
    nav {
      display: grid;
      gap: 4px;
      padding-top: 16px;
    }
    a,
    button {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border: 0;
      border-radius: 10px;
      font: inherit;
      font-size: 13px;
      font-weight: 650;
      background: transparent;
      color: var(--neutral-700);
      text-decoration: none;
      cursor: pointer;
      text-align: left;
    }
    .active {
      color: var(--slate-blue);
      background: var(--accent-soft);
    }
    button {
      color: #b42336;
    }
    mat-icon {
      flex-shrink: 0;
    }
    @media (max-width: 900px) {
      aside {
        padding: 16px;
      }
      .identity {
        padding-bottom: 16px;
      }
      nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 400px) {
      nav {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AccountNavComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url)),
    ),
    { initialValue: this.router.parseUrl(this.router.url) },
  );
  readonly retornoConta = computed(() => this.url().queryParams['returnUrl'] ?? null);
}
