import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authorization interceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: { token: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    auth = { token: vi.fn().mockResolvedValue('private-token'), clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });
  afterEach(() => http.verify());

  it('attaches a refreshed token only to the configured API', async () => {
    client.get('http://localhost:8080/clientes/me').subscribe();
    await Promise.resolve();
    const request = http.expectOne('http://localhost:8080/clientes/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer private-token');
    request.flush({});
    client.get('https://viacep.com.br/ws/01001000/json').subscribe();
    const external = http.expectOne('https://viacep.com.br/ws/01001000/json');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });

  it('does not require a session for public catalog and CEP requests', () => {
    for (const path of ['/catalogo/mouses', '/ceps/01001000']) {
      client.get('http://localhost:8080' + path).subscribe();
      const request = http.expectOne('http://localhost:8080' + path);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
    expect(auth.token).not.toHaveBeenCalled();
  });

  it('redirects on expiration without replaying a write', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    client.put('http://localhost:8080/clientes/me', {}).subscribe({ error: () => {} });
    await Promise.resolve();
    http
      .expectOne('http://localhost:8080/clientes/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.clear).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({ queryParams: expect.objectContaining({ expired: '1' }) }),
    );
    http.expectNone('http://localhost:8080/clientes/me');
  });
});
