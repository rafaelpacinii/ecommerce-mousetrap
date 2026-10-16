import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MarcaListComponent } from './marca-list';

describe('MarcaListComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MarcaListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('solicita confirmação e só remove a linha depois do DELETE bem-sucedido', () => {
    const fixture = TestBed.createComponent(MarcaListComponent);
    fixture.detectChanges();
    const marca = { id: 5, nome: 'Marca de teste', ativo: true };
    http
      .expectOne('http://localhost:8080/marcas?page=0&pageSize=10')
      .flush({ items: [marca], page: 0, pageSize: 10, totalItems: 1, totalPages: 1 });
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.excluir(marca);
    http.expectNone('http://localhost:8080/marcas/5');
    confirmar.mockReturnValue(true);
    fixture.componentInstance.excluir(marca);
    expect(fixture.componentInstance.registros()).toEqual([marca]);
    const req = http.expectOne('http://localhost:8080/marcas/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(fixture.componentInstance.registros()).toEqual([]);
  });

  it('preserva a linha quando a exclusão é bloqueada por um vínculo', () => {
    const fixture = TestBed.createComponent(MarcaListComponent);
    fixture.detectChanges();
    const marca = { id: 5, nome: 'Marca vinculada', ativo: true };
    http
      .expectOne('http://localhost:8080/marcas?page=0&pageSize=10')
      .flush({ items: [marca], page: 0, pageSize: 10, totalItems: 1, totalPages: 1 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.excluir(marca);
    http
      .expectOne('http://localhost:8080/marcas/5')
      .flush(
        { detail: 'A marca possui mouses vinculados.' },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(fixture.componentInstance.registros()).toEqual([marca]);
    expect(fixture.componentInstance.excluindo()).toBeNull();
  });

  it('consulta o filtro por nome e reinicia na primeira página', () => {
    const fixture = TestBed.createComponent(MarcaListComponent);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/marcas?page=0&pageSize=10')
      .flush({ items: [], page: 0, pageSize: 10, totalItems: 0, totalPages: 0 });
    const input = document.createElement('input');
    input.value = 'Logitech';
    fixture.componentInstance.applyFilter({ target: input } as unknown as Event);
    const request = http.expectOne('http://localhost:8080/marcas/nome/Logitech?page=0&pageSize=10');
    request.flush({ items: [], page: 0, pageSize: 10, totalItems: 0, totalPages: 0 });
    expect(fixture.componentInstance.pageIndex()).toBe(0);
  });
});
