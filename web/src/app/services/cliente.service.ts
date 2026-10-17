import { APP_SETTINGS } from '../config/app-settings';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteDTO } from '../models/cliente.model';
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
  findAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
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
