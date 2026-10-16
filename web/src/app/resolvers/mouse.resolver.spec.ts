import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Mouse } from '../models/mouse.model';
import { mouseResolver } from './mouse.resolver';

describe('mouseResolver', () => {
  it('redireciona para a lista quando o cadastro não existe, sem abrir um formulário vazio', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const route = { paramMap: convertToParamMap({ id: '999' }) } as ActivatedRouteSnapshot;
    const resultado = TestBed.runInInjectionContext(() =>
      mouseResolver(route, {} as RouterStateSnapshot),
    ) as Observable<Mouse | RedirectCommand>;
    let destino: Mouse | RedirectCommand | undefined;
    resultado.subscribe((value) => (destino = value));
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('http://localhost:8080/mouses/999')
      .flush({ detail: 'Mouse não encontrado.' }, { status: 404, statusText: 'Not Found' });
    expect(destino).toBeInstanceOf(RedirectCommand);
    expect(TestBed.inject(Router).serializeUrl((destino as RedirectCommand).redirectTo)).toBe(
      '/mouses',
    );
    http.verify();
  });
});
