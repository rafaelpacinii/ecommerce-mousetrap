import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';
import { DesejoService } from './desejo.service';
describe('Account-scoped wishlist', () => {
  let http: HttpTestingController;
  let service: DesejoService;
  const subject = signal('wishlist-a');
  beforeEach(() => {
    subject.set('wishlist-a');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { subject } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DesejoService);
    TestBed.tick();
    http.expectOne('http://localhost:8080/desejos/ids').flush([10]);
  });
  afterEach(() => http.verify());
  it('updates favorites only after persistence succeeds and blocks repeated clicks in flight', () => {
    service.alternar(20);
    service.alternar(20);
    expect(service.ids()).toEqual([10]);
    const req = http.expectOne('http://localhost:8080/desejos/20');
    expect(req.request.method).toBe('PUT');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.ids()).toEqual([10, 20]);
    service.alternar(10);
    http
      .expectOne('http://localhost:8080/desejos/10')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(service.ids()).toEqual([20]);
  });
  it('does not apply an old account response to the new account', () => {
    service.alternar(20);
    const old = http.expectOne('http://localhost:8080/desejos/20');
    subject.set('wishlist-b');
    expect(service.ids()).toEqual([]);
    TestBed.tick();
    http.expectOne('http://localhost:8080/desejos/ids').flush([30]);
    old.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.ids()).toEqual([30]);
  });
  it('preserves the saved state after a rejected mutation', () => {
    service.alternar(10);
    http
      .expectOne('http://localhost:8080/desejos/10')
      .flush({ detail: 'Indisponível' }, { status: 503, statusText: 'Unavailable' });
    expect(service.ids()).toEqual([10]);
    expect(service.pendentes()).toEqual([]);
  });
});
