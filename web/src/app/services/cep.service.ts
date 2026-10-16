import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cep } from '../models/cliente.model';
@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);
  consultar(cep: string): Observable<Cep> {
    return this.http.get<Cep>(`http://localhost:8080/ceps/${cep}`);
  }
}
