import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountNavComponent } from '../../components/storefront/customer-portal/account-nav';

@Component({
  selector: 'app-customer-portal-layout',
  standalone: true,
  imports: [RouterOutlet, AccountNavComponent],
  template: `
    <div class="store-container portal-grid">
      <app-account-nav />
      <div class="portal-content"><router-outlet /></div>
    </div>
  `,
  styleUrl: './customer-portal-layout.css',
})
export class CustomerPortalLayoutComponent {}
