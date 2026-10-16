import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MouseFormComponent } from './mouse-form';

describe('MouseFormComponent', () => {
  let http: HttpTestingController;
  const marca = { id: 4, nome: 'Marca de teste', ativo: true };
  const mouse = {
    id: 9,
    sku: 'M-TESTE',
    nome: 'Mouse original',
    descricao: 'Descrição',
    cor: 'Preto',
    preco: 150,
    quantidadeEstoque: 4,
    dpiMaximo: 16000,
    quantidadeBotoes: 6,
    pesoGramas: 75,
    ativo: true,
    versao: 3,
    marca,
    tiposConexao: [{ id: 2, label: 'Bluetooth' }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MouseFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { mouse } } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mapeia marca e conexões na edição e envia IDs com a versão lida', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(MouseFormComponent);
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/marcas').flush([marca]);
    const form = fixture.componentInstance.form;
    expect(form.controls.idMarca.value).toBe(4);
    expect(form.controls.tiposConexao.value).toEqual([2]);
    form.controls.preco.setValue(175.5);
    fixture.componentInstance.salvar();
    expect(form.disabled).toBe(true);
    const req = http.expectOne('http://localhost:8080/mouses/9');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.idMarca).toBe(4);
    expect(req.request.body.tiposConexao).toEqual([2]);
    expect(req.request.body.versao).toBe(3);
    expect(req.request.body.marca).toBeUndefined();
    req.flush({ ...mouse, preco: 175.5, versao: 4 });
    expect(form.enabled).toBe(true);
  });

  it('impede envio sem marca disponível e permite nova tentativa após falha da API', () => {
    const fixture = TestBed.createComponent(MouseFormComponent);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/marcas')
      .flush('Falha', { status: 500, statusText: 'Erro' });
    expect(fixture.componentInstance.erroMarcas()).not.toBe('');
    fixture.componentInstance.salvar();
    http.expectNone('http://localhost:8080/mouses/9');
    fixture.componentInstance.carregarMarcas();
    http.expectOne('http://localhost:8080/marcas').flush([]);
    fixture.componentInstance.salvar();
    http.expectNone('http://localhost:8080/mouses/9');
    expect(fixture.componentInstance.carregandoMarcas()).toBe(false);
  });
});
