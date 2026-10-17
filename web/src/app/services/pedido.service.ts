import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { APP_SETTINGS } from '../config/app-settings';
import { Pedido, PedidoAdmin, ResumoPedido, IndicadoresPedido } from '../models/pedido.model';
import { PagedResponse } from '../models/page-response.model';
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(APP_SETTINGS).apiUrl;
  meus(page = 0, pageSize = 5) {
    return this.http.get<PagedResponse<Pedido>>(`${this.url}/pedidos/me`, {
      params: { page, pageSize },
    });
  }
  meu(id: number) {
    return this.http.get<Pedido>(`${this.url}/pedidos/${id}`);
  }
  listar(busca = '', status: number | null = null, ordenar = 'recentes', page = 0, pageSize = 10) {
    let params = new HttpParams()
      .set('busca', busca)
      .set('ordenar', ordenar)
      .set('page', page)
      .set('pageSize', pageSize);
    if (status !== null) params = params.set('status', status);
    return this.http.get<PagedResponse<ResumoPedido>>(`${this.url}/admin/pedidos`, { params });
  }
  admin(id: number) {
    return this.http.get<PedidoAdmin>(`${this.url}/admin/pedidos/${id}`);
  }
  indicadores() {
    return this.http.get<IndicadoresPedido>(`${this.url}/admin/pedidos/indicadores`);
  }
  decidir(id: number, pagamentoId: number, versao: number, resultado: number) {
    return this.http.post<PedidoAdmin>(
      `${this.url}/admin/pedidos/${id}/pagamentos/${pagamentoId}/decisao`,
      { versao, resultado },
    );
  }
  enviar(id: number, versao: number, transportadora: string, codigoRastreio: string) {
    return this.http.post<PedidoAdmin>(`${this.url}/admin/pedidos/${id}/envio`, {
      versao,
      transportadora,
      codigoRastreio,
    });
  }
  entregar(id: number, versao: number) {
    return this.http.post<PedidoAdmin>(`${this.url}/admin/pedidos/${id}/entrega`, { versao });
  }
  cancelar(id: number, versao: number) {
    return this.http.post<PedidoAdmin>(`${this.url}/admin/pedidos/${id}/cancelamento`, { versao });
  }
}
