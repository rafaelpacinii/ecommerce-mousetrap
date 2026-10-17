import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, safeReturnUrl } from '../../services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly mode = this.route.snapshot.data['mode'] as string;
  readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  ngOnInit(): void {
    if (this.auth.authenticated() && this.mode !== 'acesso-negado') {
      void this.router.navigateByUrl(
        this.mode === 'auth/callback'
          ? this.auth.destination()
          : (this.returnUrl ?? (this.auth.admin() ? '/admin/mouses' : '/meus-dados')),
        { replaceUrl: true },
      );
    }
  }
}
