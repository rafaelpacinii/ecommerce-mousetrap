import { TestBed } from '@angular/core/testing';
import { AUTH_CLIENT, AuthService, safeReturnUrl } from './auth.service';

describe('authentication session', () => {
  const settings = {
    apiUrl: 'http://localhost:8080',
    identityUrl: 'http://localhost:8180',
    realm: 'mousetrap',
    clientId: 'mousetrap-web',
  };
  let adapter: any;
  beforeEach(() => {
    adapter = {
      authenticated: true,
      realmAccess: { roles: ['customer'] },
      token: 'memory-token',
      tokenParsed: { name: 'Cliente', email: 'cliente@example.com' },
      init: vi.fn().mockResolvedValue(true),
      updateToken: vi.fn().mockResolvedValue(false),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      clearToken: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => settings }));
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CLIENT, useValue: async () => adapter }],
    });
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('initializes once with PKCE and keeps tokens out of browser storage', async () => {
    const auth = TestBed.inject(AuthService);
    await Promise.all([auth.initialize(), auth.initialize()]);
    expect(adapter.init).toHaveBeenCalledTimes(1);
    expect(adapter.init).toHaveBeenCalledWith(
      expect.objectContaining({ pkceMethod: 'S256', flow: 'standard' }),
    );
    expect(auth.authenticated()).toBe(true);
    expect(await auth.token()).toBe('memory-token');
    expect(adapter.updateToken).toHaveBeenCalledWith(30);
    expect(sessionStorage.length + localStorage.length).toBe(0);
  });

  it('clears session when token refresh fails', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    adapter.updateToken.mockRejectedValue(new Error('Expired'));
    await expect(auth.token()).rejects.toThrow('Session expired');
    expect(auth.authenticated()).toBe(false);
    expect(auth.roles()).toEqual([]);
  });

  it('prevents concurrent clicks from starting multiple sign-in transactions', async () => {
    const auth = TestBed.inject(AuthService);
    await Promise.all([auth.login('/minha-conta'), auth.login('/minha-conta')]);
    expect(adapter.login).toHaveBeenCalledTimes(1);
    expect(auth.redirecting()).toBe(false);
  });

  it('uses role-aware destinations and consumes a safe return path once', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    auth.roles.set(['admin']);
    expect(auth.destination()).toBe('/admin/pedidos');
    await auth.login('/catalogo?nome=mouse');
    expect(auth.destination()).toBe('/catalogo?nome=mouse');
    expect(auth.destination()).toBe('/admin/pedidos');
    expect(adapter.login).toHaveBeenCalledWith({
      redirectUri: location.origin + '/auth/callback',
      locale: 'pt-BR',
    });
  });

  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/auth/callback',
    '/login',
    '/cadastro',
    '/a\nb',
  ])('rejects unsafe or looping return path %s', (value) => {
    expect(safeReturnUrl(value)).toBeUndefined();
  });

  it('leaves public browsing available when identity initialization fails', async () => {
    adapter.init.mockRejectedValue(new Error('Unavailable'));
    const auth = TestBed.inject(AuthService);
    await auth.initialize();
    expect(auth.authenticated()).toBe(false);
    expect(auth.error()).not.toBe('');
  });
});
