import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import type Keycloak from 'keycloak-js';
import { APP_SETTINGS, AppSettings } from '../config/app-settings';

export const AUTH_CLIENT = new InjectionToken<(settings: AppSettings) => Promise<Keycloak>>(
  'AUTH_CLIENT',
  {
    providedIn: 'root',
    factory: () => async (settings) => {
      const { default: Adapter } = await import('keycloak-js');
      return new Adapter({
        url: settings.identityUrl,
        realm: settings.realm,
        clientId: settings.clientId,
      });
    },
  },
);

export function safeReturnUrl(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value))
    return undefined;
  const url = new URL(value, location.origin);
  if (url.origin !== location.origin || /^\/(auth|login|cadastro)(\/|$)/.test(url.pathname))
    return undefined;
  return url.pathname + url.search + url.hash;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly settings = inject(APP_SETTINGS);
  private readonly createClient = inject(AUTH_CLIENT);
  private client?: Keycloak;
  private initialization?: Promise<void>;
  readonly authenticated = signal(false);
  readonly roles = signal<string[]>([]);
  readonly admin = computed(() => this.authenticated() && this.roles().includes('admin'));
  readonly subject = signal('');
  readonly nome = signal('');
  readonly email = signal('');
  readonly error = signal('');
  readonly redirecting = signal(false);

  initialize(): Promise<void> {
    return (this.initialization ??= this.start());
  }

  private async start(): Promise<void> {
    try {
      const response = await fetch('/config.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Configuration unavailable');
      const config: AppSettings = await response.json();
      for (const key of ['apiUrl', 'identityUrl'] as const) {
        const url = new URL(config[key]);
        if (
          !['https:', 'http:'].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.search ||
          url.hash
        )
          throw new Error('Invalid URL');
      }
      if (!config.realm || !config.clientId) throw new Error('Missing identity settings');
      Object.assign(this.settings, config, { apiUrl: config.apiUrl.replace(/\/$/, '') });
      this.client = await this.createClient(this.settings);
      this.client.onAuthLogout = () => this.clear();
      this.client.onAuthRefreshError = () => this.clear();
      this.client.onTokenExpired = () => {
        void this.token().catch(() => {});
      };
      await this.client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        flow: 'standard',
        silentCheckSsoRedirectUri: location.origin + '/silent-check-sso.html',
        silentCheckSsoFallback: false,
        checkLoginIframe: true,
        messageReceiveTimeout: 5000,
      });
      this.sync();
    } catch {
      this.clear();
      this.error.set('Não foi possível acessar sua conta. Tente novamente em instantes.');
    }
  }

  private sync(): void {
    this.subject.set(this.client?.tokenParsed?.sub ?? '');
    this.authenticated.set(!!this.client?.authenticated);
    this.roles.set(this.client?.realmAccess?.roles ?? []);
    this.nome.set(
      this.client?.tokenParsed?.['name'] ?? this.client?.tokenParsed?.['preferred_username'] ?? '',
    );
    this.email.set(this.client?.tokenParsed?.['email'] ?? '');
  }

  clear(): void {
    this.client?.clearToken();
    this.authenticated.set(false);
    this.roles.set([]);
    this.subject.set('');
    this.nome.set('');
    this.email.set('');
  }

  async token(): Promise<string | undefined> {
    if (!this.authenticated() || !this.client) return undefined;
    try {
      await this.client.updateToken(30);
      this.sync();
      return this.client.token;
    } catch {
      this.clear();
      throw new Error('Session expired');
    }
  }

  async login(returnUrl?: string, register = false): Promise<void> {
    if (this.redirecting()) return;
    this.redirecting.set(true);
    try {
      await this.initialize();
      if (!this.client || this.error()) {
        // An explicit retry reloads initialization without persisting any token.
        this.initialization = undefined;
        this.error.set('');
        await this.initialize();
      }
      if (!this.client || this.error()) return;
      const target = safeReturnUrl(returnUrl) ?? (register ? '/minha-conta' : '');
      if (target) sessionStorage.setItem('mousetrap.returnUrl', target);
      else sessionStorage.removeItem('mousetrap.returnUrl');
      try {
        const options = { redirectUri: location.origin + '/auth/callback', locale: 'pt-BR' };
        if (register) await this.client.register(options);
        else await this.client.login(options);
      } catch {
        this.error.set('Não foi possível continuar. Tente novamente.');
      }
    } finally {
      this.redirecting.set(false);
    }
  }

  destination(): string {
    const target = safeReturnUrl(sessionStorage.getItem('mousetrap.returnUrl'));
    sessionStorage.removeItem('mousetrap.returnUrl');
    return target ?? (this.admin() ? '/admin/mouses' : '/');
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem('mousetrap.returnUrl');
    try {
      await this.client?.logout({ redirectUri: location.origin + '/' });
    } catch {
      this.error.set('Não foi possível encerrar a sessão. Tente novamente.');
    }
  }

  async manageAccount(): Promise<void> {
    try {
      await this.client?.accountManagement();
    } catch {
      this.error.set('Não foi possível abrir seus dados de acesso. Tente novamente.');
    }
  }
}
