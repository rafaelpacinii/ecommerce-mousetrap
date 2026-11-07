import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ClienteFormComponent } from './cliente-form';
import { AuthService } from '../../../services/auth.service';
import { of } from 'rxjs';

const cep = {
  cep: '01001000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
};

describe('ClienteFormComponent', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClienteFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            paramMap: of(convertToParamMap({ secao: 'meus-dados' })),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const criar = () => TestBed.createComponent(ClienteFormComponent).componentInstance;
  it('creates the signed-in profile using /me without accepting an email in the payload', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = { selfService: true };
    const auth = TestBed.inject(AuthService);
    auth.nome.set('Meu nome');
    auth.email.set('conta@example.com');
    const c = criar();
    c.salvar();
    http
      .expectOne('http://localhost:8080/clientes/me')
      .flush({}, { status: 404, statusText: 'Not found' });
    expect(c.form.controls.email.value).toBe('conta@example.com');
    c.form.patchValue({ cep: '01001000', numero: '10' });
    c.consultarCep();
    http.expectOne('http://localhost:8080/ceps/01001000').flush(cep);
    c.form.controls.email.setValue('forjado@example.com');
    c.salvar();
    const request = http.expectOne('http://localhost:8080/clientes/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.email).toBeUndefined();
    expect(request.request.body.id).toBeUndefined();
    request.flush({ id: 4 });
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([]);
  });
  it('blocks profile writes when loading fails and offers a retry', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = { selfService: true };
    const c = criar();
    http
      .expectOne('http://localhost:8080/clientes/me')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(c.erroPerfil()).not.toBe('');
    c.salvar();
    http.expectNone((request) => request.method === 'PUT');
    c.carregarPerfil();
    http
      .expectOne('http://localhost:8080/clientes/me')
      .flush({}, { status: 404, statusText: 'Not found' });
    expect(c.erroPerfil()).toBe('');
  });
  it('rejects invalid required address fields', () => {
    const c = criar();
    c.form.patchValue({ nome: ' ', email: 'invalido', cep: '123' });
    c.salvar();
    c.consultarCep();
    expect(c.form.invalid).toBe(true);
    expect(c.form.controls.cep.touched).toBe(true);
    http.expectNone((req) => true);
  });
  it('preenche endereço, normaliza CEP e envia cadastro', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const c = criar();
    c.form.patchValue({
      nome: ' Cliente ',
      email: 'CLIENTE@example.com',
      cep: '01001-000',
      numero: '10',
    });
    c.salvar();
    http.expectNone('http://localhost:8080/clientes');
    c.consultarCep();
    http.expectOne('http://localhost:8080/ceps/01001000').flush(cep);
    expect(c.municipio()).toBe('São Paulo');
    expect(c.estado()).toBe('SP');
    c.salvar();
    const req = http.expectOne('http://localhost:8080/clientes');
    expect(req.request.body.cep).toBe('01001000');
    expect(req.request.body.email).toBe('cliente@example.com');
    req.flush({ id: 1 });
  });
  it('cancels stale lookup and preserves entered address when postcode changes', () => {
    const c = criar();
    c.form.controls.cep.setValue('01001000');
    c.consultarCep();
    const anterior = http.expectOne('http://localhost:8080/ceps/01001000');
    c.form.controls.cep.setValue('77001000');
    expect(anterior.cancelled).toBe(true);
    expect(c.cepConfirmado()).toBe('');
    expect(c.consultando()).toBe(false);
    c.consultarCep();
    http
      .expectOne('http://localhost:8080/ceps/77001000')
      .flush({ ...cep, cep: '77001000', localidade: 'Palmas', uf: 'TO' });
    expect(c.municipio()).toBe('Palmas');
    c.form.controls.cep.setValue('12345678');
    expect(c.municipio()).toBe('Palmas');
    expect(c.form.controls.logradouro.value).toBe('Praça da Sé');
  });
  it('trata CEP inexistente e exige endereço para CEP genérico', () => {
    const c = criar();
    c.form.controls.cep.setValue('99999999');
    c.consultarCep();
    http
      .expectOne('http://localhost:8080/ceps/99999999')
      .flush(
        { errors: [{ message: 'CEP não encontrado.' }] },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(c.erroCep()).toBe('CEP não encontrado.');
    expect(c.cepConfirmado()).toBe('');
    c.form.controls.cep.setValue('01001000');
    c.consultarCep();
    http
      .expectOne('http://localhost:8080/ceps/01001000')
      .flush({ ...cep, logradouro: '', bairro: '' });
    expect(c.form.controls.logradouro.invalid).toBe(true);
    expect(c.form.controls.bairro.invalid).toBe(true);
  });
  it('loads an existing address and sends its local municipality without a postcode lookup', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = {
      cliente: {
        id: 7,
        nome: 'Cliente',
        email: 'cliente@example.com',
        cep: '01001000',
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        numero: '10',
        complemento: '',
        municipio: {
          id: 1,
          nome: 'São Paulo',
          codigoIbge: '3550308',
          estado: { id: 1, nome: 'São Paulo', sigla: 'SP' },
        },
      },
    };
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ClienteFormComponent);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/localidades/estados')
      .flush([{ id: 1, nome: 'São Paulo', sigla: 'SP' }]);
    http
      .expectOne('http://localhost:8080/localidades/estados/SP/municipios')
      .flush([TestBed.inject(ActivatedRoute).snapshot.data['cliente'].municipio]);
    expect(fixture.nativeElement.textContent).toContain('Salvar Alterações');
    fixture.componentInstance.salvar();
    const req = http.expectOne('http://localhost:8080/clientes/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.municipio).toBeUndefined();
    expect(req.request.body.codigoIbge).toBe('3550308');
    http.expectNone((r) => r.url.includes('/ceps/'));
    req.flush({ id: 7 });
  });
  it('saves a manually completed address after lookup failure without losing entered data', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const c = criar();
    c.form.patchValue({
      nome: 'Manual',
      email: 'manual@example.com',
      cep: '88888-888',
      logradouro: 'Rua preenchida',
      bairro: 'Centro',
      numero: 'S/N',
      codigoIbge: '1721000',
    });
    c.consultarCep();
    http
      .expectOne('http://localhost:8080/ceps/88888888')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(c.form.controls.logradouro.value).toBe('Rua preenchida');
    c.salvar();
    const save = http.expectOne('http://localhost:8080/clientes');
    expect(save.request.body.codigoIbge).toBe('1721000');
    expect(save.request.body.cep).toBe('88888888');
    save.flush({ id: 8 });
  });

  it('allows manual registration without ever querying the postcode service', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const c = criar();
    c.form.patchValue({
      nome: 'Manual',
      email: 'manual@example.com',
      cep: '88888888',
      logradouro: 'Rua',
      bairro: 'Centro',
      numero: '10',
    });
    c.salvar();
    http.expectNone((r) => r.method === 'POST');
    c.form.controls.codigoIbge.setValue('1721000');
    c.salvar();
    http.expectNone((r) => r.url.includes('/ceps/'));
    http.expectOne('http://localhost:8080/clientes').flush({ id: 8 });
  });

  it('cancels autofill when manual entry starts or the user edits a street', () => {
    const c = criar();
    c.form.controls.cep.setValue('01001000');
    c.consultarCep();
    const pending = http.expectOne('http://localhost:8080/ceps/01001000');
    c.form.controls.logradouro.setValue('Minha rua');
    expect(pending.cancelled).toBe(true);
    expect(c.consultando()).toBe(false);
    expect(c.form.controls.logradouro.value).toBe('Minha rua');
    c.consultarCep();
    const second = http.expectOne('http://localhost:8080/ceps/01001000');
    c.preencherManualmente();
    expect(second.cancelled).toBe(true);
  });

  it('cancels a saved-address lookup when switching to another address', () => {
    const c = criar();
    c.iniciarNovoEndereco();
    c.formEndereco.controls.cep.setValue('01001000');
    c.consultarCepEndereco();
    const pending = http.expectOne('http://localhost:8080/ceps/01001000');
    c.cancelarEdicaoEndereco();
    expect(pending.cancelled).toBe(true);
    c.iniciarNovoEndereco();
    expect(c.formEndereco.controls.codigoIbge.value).toBe('');
  });

  it('gerencia endereços salvos do cliente autenticado (/clientes/me/enderecos)', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = { selfService: true };
    const c = criar();
    http.expectOne('http://localhost:8080/clientes/me').flush({
      id: 4,
      nome: 'Cliente',
      email: 'conta@example.com',
      cep: '01001000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      numero: '10',
      complemento: '',
      municipio: {
        id: 1,
        nome: 'São Paulo',
        codigoIbge: '3550308',
        estado: { id: 1, nome: 'São Paulo', sigla: 'SP' },
      },
    });
    const enderecoInicial = {
      id: 11,
      apelido: 'Principal',
      destinatario: 'Cliente',
      cep: '01001000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      numero: '10',
      complemento: '',
      principal: true,
      municipio: {
        id: 1,
        nome: 'São Paulo',
        codigoIbge: '3550308',
        estado: { id: 1, nome: 'São Paulo', sigla: 'SP' },
      },
    };
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([enderecoInicial]);
    expect(c.enderecos().length).toBe(1);

    c.iniciarNovoEndereco();
    c.formEndereco.patchValue({
      apelido: 'Trabalho',
      destinatario: 'Cliente',
      cep: '01001-000',
      numero: '200',
      principal: false,
    });
    c.consultarCepEndereco();
    http.expectOne('http://localhost:8080/ceps/01001000').flush(cep);
    c.salvarEndereco();
    const postReq = http.expectOne('http://localhost:8080/clientes/me/enderecos');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.apelido).toBe('Trabalho');
    postReq.flush({ ...enderecoInicial, id: 12, apelido: 'Trabalho', principal: false });

    const segundo = { ...enderecoInicial, id: 12, apelido: 'Trabalho', principal: false };
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([enderecoInicial, segundo]);

    c.definirPrincipal(segundo);
    const putPrincipal = http.expectOne('http://localhost:8080/clientes/me/enderecos/12/principal');
    expect(putPrincipal.request.method).toBe('PUT');
    putPrincipal.flush({ ...segundo, principal: true });
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([
      { ...segundo, principal: true },
      { ...enderecoInicial, principal: false },
    ]);

    c.removerEndereco(enderecoInicial);
    const delReq = http.expectOne('http://localhost:8080/clientes/me/enderecos/11');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null, { status: 204, statusText: 'No Content' });
    http
      .expectOne('http://localhost:8080/clientes/me/enderecos')
      .flush([{ ...segundo, principal: true }]);
  });
});
