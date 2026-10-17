import { PagedResponse } from '../models/page-response.model';
import { APP_SETTINGS } from '../config/app-settings';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteDTO, Endereco, EnderecoDTO } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string = `${inject(APP_SETTINGS).apiUrl}/clientes`;

  findMe(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/me`);
  }

  saveMe(cliente: Omit<ClienteDTO, 'email'>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/me`, cliente);
  }

  listarMeusEnderecos(): Observable<Endereco[]> {
    return this.http.get<Endereco[]>(`${this.apiUrl}/me/enderecos`);
  }

  criarMeuEndereco(endereco: EnderecoDTO): Observable<Endereco> {
    return this.http.post<Endereco>(`${this.apiUrl}/me/enderecos`, endereco);
  }

  atualizarMeuEndereco(id: number, endereco: EnderecoDTO): Observable<Endereco> {
    return this.http.put<Endereco>(`${this.apiUrl}/me/enderecos/${id}`, endereco);
  }

  definirMeuEnderecoPrincipal(id: number): Observable<Endereco> {
    return this.http.put<Endereco>(`${this.apiUrl}/me/enderecos/${id}/principal`, {});
  }

  removerMeuEndereco(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/enderecos/${id}`);
  }

  findAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  pesquisar(busca = '', ordenar = 'nome', page = 0, pageSize = 10) {
    return this.http.get<PagedResponse<Cliente>>(`${this.apiUrl}/pagina`, {
      params: { busca, ordenar, page, pageSize },
    });
  }
  findById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  create(cliente: ClienteDTO): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  update(id: number, cliente: ClienteDTO): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
