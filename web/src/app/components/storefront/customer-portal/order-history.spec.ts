import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OrderHistoryComponent } from './order-history';
import { pedidoAdmin } from '../../../../testing/pedido.fixture';
describe('Customer order history', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderHistoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('shows a shipped order with its real tracking data and requests subsequent pages', () => {
    const fixture = TestBed.createComponent(OrderHistoryComponent);
    fixture.detectChanges();
    const p = {
      ...pedidoAdmin.pedido,
      status: { id: 3, label: 'Enviado' },
      transportadora: 'Correios',
      codigoRastreio: 'BR123456789BR',
    };
    http
      .expectOne((r) => r.url.endsWith('/pedidos/me') && r.params.get('page') === '0')
      .flush({ items: [p], totalItems: 6, page: 0, pageSize: 5, totalPages: 2 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('BR123456789BR');
    expect(fixture.nativeElement.querySelectorAll('.timeline .complete').length).toBe(3);
    fixture.componentInstance.paginar({ pageIndex: 1, pageSize: 5, length: 6 });
    http
      .expectOne((r) => r.url.endsWith('/pedidos/me') && r.params.get('page') === '1')
      .flush({ items: [], totalItems: 6, page: 1, pageSize: 5, totalPages: 2 });
    expect(fixture.componentInstance.pagina()).toBe(1);
  });
  it('shows an error and supports a successful retry', () => {
    const fixture = TestBed.createComponent(OrderHistoryComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.endsWith('/pedidos/me'))
      .flush({ detail: 'Tente novamente.' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tente novamente');
    fixture.componentInstance.carregar();
    http
      .expectOne((r) => r.url.endsWith('/pedidos/me'))
      .flush({ items: [], totalItems: 0, page: 0, pageSize: 5, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Você ainda não tem pedidos');
  });
});
