import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_SETTINGS, AppSettings } from '../config/app-settings';
import {
  CadastroPayload,
  LoginPayload,
  SessaoAuthResponse,
  UsuarioAutenticado,
} from '../models/auth.model';

export function safeReturnUrl(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value))
    return undefined;
  const url = new URL(value, location.origin);
  if (
    url.origin !== location.origin ||
    /^\/(auth|login|cadastro|acesso-negado)(\/|$)/.test(url.pathname)
  )
    return undefined;
  return url.pathname + url.search + url.hash;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly settings = inject(APP_SETTINGS);
  private readonly router = inject(Router);
  private initialization?: Promise<void>;
  private refreshInFlight?: Promise<string>;
  private accessToken = '';
  private expiresAtMs = 0;

  readonly authenticated = signal(false);
  readonly roles = signal<string[]>([]);
  readonly admin = computed(() => this.authenticated() && this.roles().includes('admin'));
  readonly customer = computed(() => this.authenticated() && this.roles().includes('customer'));
  readonly subject = signal('');
  readonly nome = signal('');
  readonly email = signal('');
  readonly perfilCompleto = signal(false);
  readonly iniciaisUsuario = computed(() => {
    const base = (this.nome() || this.email()).trim();
    if (!base) return '';
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  });
  readonly perfilPrincipal = computed(() => {
    if (!this.authenticated()) return '';
    return this.admin() ? 'Administrador' : 'Cliente';
  });
  readonly error = signal('');
  readonly redirecting = signal(false);

  hasAnyRole(rolesPermitidas: readonly string[]): boolean {
    if (!rolesPermitidas.length) return this.authenticated();
    return this.authenticated() && rolesPermitidas.some((role) => this.roles().includes(role));
  }

  initialize(): Promise<void> {
    return (this.initialization ??= this.start());
  }

  private async start(): Promise<void> {
    try {
      const response = await fetch('/config.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Configuration unavailable');
      const config = (await response.json()) as Partial<AppSettings>;
      if (!config.apiUrl) throw new Error('Missing API URL');
      const parsed = new URL(config.apiUrl);
      if (
        !['https:', 'http:'].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash
      ) {
        throw new Error('Invalid API URL');
      }
      this.settings.apiUrl = config.apiUrl.replace(/\/$/, '');
    } catch {
      this.clear();
      this.error.set('Não foi possível carregar a configuração da loja. Tente novamente.');
      return;
    }

    try {
      const refreshResp = await fetch(`${this.settings.apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (refreshResp.ok) {
        const sessao = (await refreshResp.json()) as SessaoAuthResponse;
        this.aplicarSessao(sessao);
      } else {
        this.clear();
      }
    } catch {
      // Offline or unauthenticated initial check leaves public storefront navigation available.
      this.clear();
    }
  }

  private aplicarSessao(sessao: SessaoAuthResponse): void {
    this.accessToken = sessao.accessToken;
    this.expiresAtMs = Date.now() + Math.max(30, sessao.expiresIn) * 1000;
    this.aplicarUsuario(sessao.usuario);
    this.authenticated.set(true);
    this.error.set('');
  }

  private aplicarUsuario(usuario: UsuarioAutenticado): void {
    this.subject.set(usuario.subject ?? '');
    this.roles.set(usuario.roles ?? []);
    this.nome.set(usuario.nome ?? '');
    this.email.set(usuario.email ?? '');
    this.perfilCompleto.set(!!usuario.perfilCompleto);
  }

  clear(): void {
    this.accessToken = '';
    this.expiresAtMs = 0;
    this.authenticated.set(false);
    this.roles.set([]);
    this.subject.set('');
    this.nome.set('');
    this.email.set('');
    this.perfilCompleto.set(false);
  }

  async token(): Promise<string | undefined> {
    if (!this.authenticated()) return undefined;
    if (this.accessToken && Date.now() + 30_000 < this.expiresAtMs) {
      return this.accessToken;
    }
    if (!this.accessToken && this.expiresAtMs === 0) {
      // Allows unit tests that set authenticated=true without an in-memory token to proceed cleanly.
      return undefined;
    }
    return this.renovarSessao();
  }

  private renovarSessao(): Promise<string> {
    return (this.refreshInFlight ??= (async () => {
      try {
        const response = await fetch(`${this.settings.apiUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          this.clear();
          throw new Error('Session expired');
        }
        const sessao = (await response.json()) as SessaoAuthResponse;
        this.aplicarSessao(sessao);
        return this.accessToken;
      } catch (erro) {
        this.clear();
        throw erro instanceof Error ? erro : new Error('Session expired');
      } finally {
        this.refreshInFlight = undefined;
      }
    })());
  }

  async entrar(credenciais: LoginPayload, returnUrl?: string): Promise<string> {
    if (this.redirecting()) return '';
    this.redirecting.set(true);
    this.error.set('');
    try {
      await this.garantirConfiguracao();
      this.salvarDestinoRetorno(returnUrl);
      const response = await fetch(`${this.settings.apiUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: credenciais.email.trim().toLowerCase(),
          senha: credenciais.senha,
        }),
      });
      if (!response.ok) {
        const mensagem = await this.extrairMensagemErro(
          response,
          'Não foi possível entrar na sua conta. Confira seu e-mail e senha.',
        );
        this.error.set(mensagem);
        throw new Error(mensagem);
      }
      const sessao = (await response.json()) as SessaoAuthResponse;
      this.aplicarSessao(sessao);
      return this.destination();
    } catch (erro) {
      if (!this.error()) {
        this.error.set(
          'Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.',
        );
      }
      throw erro;
    } finally {
      this.redirecting.set(false);
    }
  }

  async cadastrar(dados: CadastroPayload, returnUrl?: string): Promise<string> {
    if (this.redirecting()) return '';
    this.redirecting.set(true);
    this.error.set('');
    try {
      await this.garantirConfiguracao();
      this.salvarDestinoRetorno(returnUrl);
      const response = await fetch(`${this.settings.apiUrl}/auth/cadastro`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(dados),
      });
      if (!response.ok) {
        const mensagem = await this.extrairMensagemErro(
          response,
          'Não foi possível concluir seu cadastro. Revise os dados informados.',
        );
        this.error.set(mensagem);
        throw new Error(mensagem);
      }
      const sessao = (await response.json()) as SessaoAuthResponse;
      this.aplicarSessao(sessao);
      const retorno = safeReturnUrl(sessionStorage.getItem('mousetrap.returnUrl'));
      sessionStorage.removeItem('mousetrap.returnUrl');
      if (retorno) return retorno;
      return sessao.usuario.perfilCompleto ? '/' : '/enderecos';
    } catch (erro) {
      if (!this.error()) {
        this.error.set(
          'Não foi possível conectar ao servidor para criar sua conta. Tente novamente em instantes.',
        );
      }
      throw erro;
    } finally {
      this.redirecting.set(false);
    }
  }

  async consultarUsuarioAtual(): Promise<UsuarioAutenticado | undefined> {
    const bearer = await this.token();
    if (!bearer) return undefined;
    const response = await fetch(`${this.settings.apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearer}`,
        Accept: 'application/json',
      },
    });
    if (response.status === 401) {
      this.clear();
      return undefined;
    }
    if (!response.ok) return undefined;
    const usuario = (await response.json()) as UsuarioAutenticado;
    this.aplicarUsuario(usuario);
    return usuario;
  }

  destination(): string {
    const target = safeReturnUrl(sessionStorage.getItem('mousetrap.returnUrl'));
    sessionStorage.removeItem('mousetrap.returnUrl');
    return target ?? (this.admin() ? '/admin/pedidos' : '/');
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem('mousetrap.returnUrl');
    try {
      await fetch(`${this.settings.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Local state must still be wiped even if the network request fails.
    } finally {
      this.clear();
      this.error.set('');
      await this.router.navigateByUrl('/');
    }
  }

  private async garantirConfiguracao(): Promise<void> {
    await this.initialize();
    if (this.error()) {
      this.initialization = undefined;
      this.error.set('');
      await this.initialize();
    }
  }

  private salvarDestinoRetorno(returnUrl?: string): void {
    const target = safeReturnUrl(returnUrl);
    if (target) sessionStorage.setItem('mousetrap.returnUrl', target);
    else sessionStorage.removeItem('mousetrap.returnUrl');
  }

  private async extrairMensagemErro(response: Response, padrao: string): Promise<string> {
    try {
      const body = (await response.json()) as {
        detail?: string;
        errors?: Array<{ message?: string }>;
      };
      const erroCampo = body.errors?.find((item) => item?.message)?.message;
      if (erroCampo) return erroCampo;
      if (body.detail && body.detail.trim()) return body.detail;
    } catch {
      // Non-JSON upstream error falls back to safe localized message.
    }
    return padrao;
  }
}
