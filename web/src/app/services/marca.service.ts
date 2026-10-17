import { APP_SETTINGS } from '../config/app-settings';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca } from '../models/marca.model';
import { PagedResponse } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string = `${inject(APP_SETTINGS).apiUrl}/marcas`;

  findAll(page = 0, pageSize = 10): Observable<PagedResponse<Marca>> {
    return this.http.get<PagedResponse<Marca>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  findByNome(nome: string, page = 0, pageSize = 10): Observable<PagedResponse<Marca>> {
    return this.http.get<PagedResponse<Marca>>(
      `${this.apiUrl}/nome/${encodeURIComponent(nome)}?page=${page}&pageSize=${pageSize}`,
    );
  }

  pesquisar(busca = '', ordenar = 'nome', page = 0, pageSize = 10) {
    return this.http.get<PagedResponse<Marca>>(`${this.apiUrl}/pagina`, {
      params: { busca, ordenar, page, pageSize },
    });
  }
  findById(id: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/${id}`);
  }

  create(entity: Marca): Observable<Marca> {
    return this.http.post<Marca>(this.apiUrl, entity);
  }

  update(id: number, entity: Marca): Observable<Marca> {
    return this.http.put<Marca>(`${this.apiUrl}/${id}`, entity);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
