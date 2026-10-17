import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { CatalogoService } from '../services/catalogo.service';
import { Produto } from '../models/catalogo.model';

export interface ResultadoProduto {
  produto: Produto | null;
  status: number;
}
export const produtoResolver: ResolveFn<ResultadoProduto> = (route) => {
  const raw = route.paramMap.get('id') ?? '';
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(id))
    return of({ produto: null, status: 404 });
  return inject(CatalogoService)
    .findById(id)
    .pipe(
      map((produto) => ({ produto, status: 200 })),
      catchError((erro: HttpErrorResponse) => of({ produto: null, status: erro.status })),
    );
};
