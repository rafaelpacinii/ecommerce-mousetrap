import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AdminOrderComponent } from './admin-order';
import { ConfirmacaoService } from '../shared/confirm-dialog';
import { pedidoAdmin } from '../../../testing/pedido.fixture';

describe('Administrative order operations', () => {
  let http: HttpTestingController;
  let decisao: Subject<boolean>;
  beforeEach(() => {
    decisao = new Subject();
    TestBed.configureTestingModule({
      imports: [AdminOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pedido: { dados: structuredClone(pedidoAdmin), erro: '' } }),
            snapshot: { paramMap: new Map([['id', '51']]) },
          },
        },
        { provide: ConfirmacaoService, useValue: { abrir: () => decisao } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('waits for confirmation and submits the displayed version before showing an approved order', () => {
    const fixture = TestBed.createComponent(AdminOrderComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.decidir(7, 1);
    expect(c.ocupado()).toBe(true);
    http.expectNone('http://localhost:8080/admin/pedidos/51/pagamentos/7/decisao');
    decisao.next(true);
    decisao.complete();
    const request = http.expectOne('http://localhost:8080/admin/pedidos/51/pagamentos/7/decisao');
    expect(request.request.body).toEqual({ versao: 4, resultado: 1 });
    request.flush({
      ...pedidoAdmin,
      pedido: { ...pedidoAdmin.pedido, status: { id: 2, label: 'Pago' }, versao: 5 },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Preparar envio');
    expect(c.ocupado()).toBe(false);
  });
  it('does not mutate an order when confirmation is declined', () => {
    const fixture = TestBed.createComponent(AdminOrderComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    decisao.next(false);
    decisao.complete();
    http.expectNone('http://localhost:8080/admin/pedidos/51/cancelamento');
    expect(fixture.componentInstance.ocupado()).toBe(false);
  });
  it('keeps the current state and exposes a conflict so the administrator can refresh', () => {
    const fixture = TestBed.createComponent(AdminOrderComponent);
    fixture.detectChanges();
    fixture.componentInstance.decidir(7, 2);
    decisao.next(true);
    decisao.complete();
    http
      .expectOne('http://localhost:8080/admin/pedidos/51/pagamentos/7/decisao')
      .flush(
        { detail: 'O pedido foi atualizado. Recarregue os dados.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Recarregue os dados');
    expect(fixture.componentInstance.dados()?.pedido.status.id).toBe(1);
  });
});
