import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LocalidadeSelectComponent } from './localidade-select';

const api = 'http://localhost:8080/localidades';
const sp = { id: 1, nome: 'São Paulo', sigla: 'SP' };
const to = { id: 2, nome: 'Tocantins', sigla: 'TO' };
const saoPaulo = { id: 1, nome: 'São Paulo', codigoIbge: '3550308', estado: sp };
const palmas = { id: 2, nome: 'Palmas', codigoIbge: '1721000', estado: to };

describe('LocalidadeSelectComponent', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LocalidadeSelectComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function create(uf = '') {
    const fixture = TestBed.createComponent(LocalidadeSelectComponent);
    const codigo = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    fixture.componentRef.setInput('codigo', codigo);
    fixture.componentRef.setInput('uf', uf);
    fixture.componentInstance.ufChange.subscribe((value) =>
      fixture.componentRef.setInput('uf', value),
    );
    fixture.detectChanges();
    return { fixture, codigo };
  }

  it('selects a municipality from the local API and clears it when the state changes', () => {
    const { fixture, codigo } = create('SP');
    http.expectOne(`${api}/estados`).flush([sp, to]);
    http.expectOne(`${api}/estados/SP/municipios`).flush([saoPaulo]);
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll(
      'select',
    ) as NodeListOf<HTMLSelectElement>;
    selects[1].value = '3550308';
    selects[1].dispatchEvent(new Event('change'));
    expect(codigo.value).toBe('3550308');
    selects[0].value = 'TO';
    selects[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(codigo.invalid).toBe(true);
    http.expectOne(`${api}/estados/TO/municipios`).flush([palmas]);
    fixture.detectChanges();
    expect(selects[1].textContent).toContain('Palmas');
    expect(selects[1].textContent).not.toContain('São Paulo');
  });

  it('cancels stale municipality requests and offers a retry after a local API error', () => {
    const { fixture } = create('SP');
    http.expectOne(`${api}/estados`).flush([sp, to]);
    const previous = http.expectOne(`${api}/estados/SP/municipios`);
    fixture.componentRef.setInput('uf', 'TO');
    fixture.detectChanges();
    expect(previous.cancelled).toBe(true);
    http
      .expectOne(`${api}/estados/TO/municipios`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const retry = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(retry.textContent).toContain('Recarregar municípios');
    retry.click();
    http.expectOne(`${api}/estados/TO/municipios`).flush([palmas]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Palmas');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('retries loading states without needing the external postcode service', () => {
    const { fixture } = create();
    http.expectOne(`${api}/estados`).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne(`${api}/estados`).flush([sp, to]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select').textContent).toContain('Tocantins');
  });
});
