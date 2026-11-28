import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, safeReturnUrl } from './auth.service';
import { SessaoAuthResponse } from '../models/auth.model';

describe('authentication session (backend-mediated)', () => {
  const sessaoCliente: SessaoAuthResponse = {
    accessToken: 'jwt-memory-token',
    expiresIn: 300,
    usuario: {
      subject: 'sub-cliente-1',
      nome: 'Rafael Pacini',
      email: 'rafael@example.com',
      roles: ['customer'],
      perfilCompleto: true,
    },
  };

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/config.json') {
        return new Response(JSON.stringify({ apiUrl: 'http://localhost:8080/' }), { status: 200 });
      }
      if (url === 'http://localhost:8080/auth/refresh') {
        return new Response(JSON.stringify(sessaoCliente), { status: 200 });
      }
      if (url === 'http://localhost:8080/auth/logout') {
        return new Response(null, { status: 204 });
      }
      return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('initializes once via /config.json and Quarkus /auth/refresh without browser storage', async () => {
    const auth = TestBed.inject(AuthService);
    await Promise.all([auth.initialize(), auth.initialize()]);

    expect(auth.authenticated()).toBe(true);
    expect(await auth.token()).toBe('jwt-memory-token');
    expect(auth.subject()).toBe('sub-cliente-1');
    expect(auth.email()).toBe('rafael@example.com');
    expect(sessionStorage.length + localStorage.length).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/auth/refresh',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('authenticates credentials through POST /auth/login and resolves role-aware destinations', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/config.json') {
        return new Response(JSON.stringify({ apiUrl: 'http://localhost:8080' }), { status: 200 });
      }
      if (url === 'http://localhost:8080/auth/refresh') {
        return new Response('{}', { status: 401 });
      }
      if (url === 'http://localhost:8080/auth/login') {
        return new Response(
          JSON.stringify({
            accessToken: 'admin-jwt',
            expiresIn: 300,
            usuario: {
              subject: 'sub-admin',
              nome: 'Operador Loja',
              email: 'admin@example.com',
              roles: ['admin', 'customer'],
              perfilCompleto: true,
            },
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });

    const auth = TestBed.inject(AuthService);
    const destPadrao = await auth.entrar({ email: 'ADMIN@EXAMPLE.COM ', senha: 'Secret123' });
    expect(destPadrao).toBe('/admin/pedidos');
    expect(auth.admin()).toBe(true);
    expect(auth.perfilPrincipal()).toBe('Administrador');

    const destRetorno = await auth.entrar(
      { email: 'admin@example.com', senha: 'Secret123' },
      '/catalogo?nome=mouse',
    );
    expect(destRetorno).toBe('/catalogo?nome=mouse');
    expect(auth.destination()).toBe('/admin/pedidos');
  });

  it('registers new customers via POST /auth/cadastro and directs incomplete profiles to /enderecos', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/config.json') {
        return new Response(JSON.stringify({ apiUrl: 'http://localhost:8080' }), { status: 200 });
      }
      if (url === 'http://localhost:8080/auth/refresh') {
        return new Response('{}', { status: 401 });
      }
      if (url === 'http://localhost:8080/auth/cadastro') {
        return new Response(
          JSON.stringify({
            accessToken: 'novo-jwt',
            expiresIn: 300,
            usuario: {
              subject: 'sub-novo',
              nome: 'Novo Cliente',
              email: 'novo@example.com',
              roles: ['customer'],
              perfilCompleto: false,
            },
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 404 });
    });

    const auth = TestBed.inject(AuthService);
    const destino = await auth.cadastrar({
      nome: 'Novo Cliente',
      email: 'novo@example.com',
      senha: 'SenhaForte1',
    });
    expect(destino).toBe('/enderecos');
    expect(auth.authenticated()).toBe(true);
    expect(auth.customer()).toBe(true);
    expect(sessionStorage.length + localStorage.length).toBe(0);
  });

  it('clears session when token refresh fails on expiry', async () => {
    const auth = TestBed.inject(AuthService);
    fetchMock.mockImplementationOnce(async () =>
      new Response(JSON.stringify({ apiUrl: 'http://localhost:8080' }), { status: 200 }),
    );
    fetchMock.mockImplementationOnce(async () =>
      new Response(
        JSON.stringify({
          ...sessaoCliente,
          expiresIn: 5,
        }),
        { status: 200 },
      ),
    );
    await auth.initialize();
    fetchMock.mockImplementationOnce(async () => new Response('{}', { status: 401 }));

    await expect(auth.token()).rejects.toThrow('Session expired');
    expect(auth.authenticated()).toBe(false);
    expect(auth.roles()).toEqual([]);
  });

  it('logs out via POST /auth/logout, wipes memory state, and navigates to home', async () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    await auth.initialize();

    await auth.logout();
    expect(auth.authenticated()).toBe(false);
    expect(await auth.token()).toBeUndefined();
    expect(navSpy).toHaveBeenCalledWith('/');
  });

  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/auth/callback',
    '/login',
    '/cadastro',
    '/acesso-negado',
    '/a\nb',
  ])('rejects unsafe or looping return path %s', (value) => {
    expect(safeReturnUrl(value)).toBeUndefined();
  });

  it('leaves public browsing available when /config.json fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Offline'));
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.authenticated()).toBe(false);
    expect(auth.error()).not.toBe('');
  });

  it('computes user initials, principal role label, and role membership via Angular Signals', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.iniciaisUsuario()).toBe('RP');
    expect(auth.perfilPrincipal()).toBe('Cliente');
    expect(auth.hasAnyRole(['customer'])).toBe(true);
    expect(auth.hasAnyRole(['admin'])).toBe(false);
    auth.roles.set(['admin', 'customer']);
    expect(auth.perfilPrincipal()).toBe('Administrador');
    expect(auth.hasAnyRole(['admin'])).toBe(true);
    auth.clear();
    expect(auth.iniciaisUsuario()).toBe('');
    expect(auth.perfilPrincipal()).toBe('');
    expect(auth.hasAnyRole(['customer'])).toBe(false);
  });
});
