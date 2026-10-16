import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mouse, MouseDTO } from '../models/mouse.model';

@Injectable({ providedIn: 'root' })
export class MouseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string = 'http://localhost:8080/mouses';

  findAll(): Observable<Mouse[]> {
    return this.http.get<Mouse[]>(this.apiUrl);
  }

  findById(id: number): Observable<Mouse> {
    return this.http.get<Mouse>(`${this.apiUrl}/${id}`);
  }

  create(entity: MouseDTO): Observable<Mouse> {
    return this.http.post<Mouse>(this.apiUrl, entity);
  }

  update(id: number, entity: MouseDTO): Observable<Mouse> {
    return this.http.put<Mouse>(`${this.apiUrl}/${id}`, entity);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
