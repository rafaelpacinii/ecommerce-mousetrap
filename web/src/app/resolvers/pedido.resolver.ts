import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PedidoService } from '../services/pedido.service';
import { Pedido, PedidoAdmin } from '../models/pedido.model';
import { mensagemErro } from '../services/erro-api';
export interface ResultadoPedido<T> {
  dados: T | null;
  erro: string;
}
export const pedidoResolver: ResolveFn<ResultadoPedido<Pedido>> = (route) =>
  inject(PedidoService)
    .meu(Number(route.paramMap.get('id')))
    .pipe(
      map((dados) => ({ dados, erro: '' })),
      catchError((e) => of({ dados: null, erro: mensagemErro(e) })),
    );
export const pedidoAdminResolver: ResolveFn<ResultadoPedido<PedidoAdmin>> = (route) =>
  inject(PedidoService)
    .admin(Number(route.paramMap.get('id')))
    .pipe(
      map((dados) => ({ dados, erro: '' })),
      catchError((e) => of({ dados: null, erro: mensagemErro(e) })),
    );
