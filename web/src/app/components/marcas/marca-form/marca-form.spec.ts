import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MarcaFormComponent } from './marca-form';

describe('MarcaFormComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MarcaFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('impede cadastro com nome em branco e marca os campos', () => {
    const fixture = TestBed.createComponent(MarcaFormComponent);
    fixture.componentInstance.form.controls.nome.setValue('   ');
    fixture.componentInstance.salvar();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls.nome.touched).toBe(true);
    http.expectNone('http://localhost:8080/marcas');
  });

  it('preenche a edição pelo resolver e envia PUT preservando a situação inativa', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = {
      marca: { id: 7, nome: 'Marca original', ativo: false },
    };
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(MarcaFormComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Salvar Alterações');
    fixture.componentInstance.form.controls.nome.setValue('  Marca editada  ');
    fixture.componentInstance.salvar();
    const req = http.expectOne('http://localhost:8080/marcas/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nome: 'Marca editada', ativo: false });
    req.flush({ id: 7, ...req.request.body });
    expect(navegar).toHaveBeenCalledWith(['/marcas']);
  });
});
