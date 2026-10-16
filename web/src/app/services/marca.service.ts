import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca } from '../models/marca.model';

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string = 'http://localhost:8080/marcas';

  findAll(): Observable<Marca[]> {
    return this.http.get<Marca[]>(this.apiUrl);
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
