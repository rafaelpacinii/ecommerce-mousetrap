import { APP_SETTINGS } from '../config/app-settings';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cep } from '../models/cliente.model';
@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(APP_SETTINGS).apiUrl;
  consultar(cep: string): Observable<Cep> {
    return this.http.get<Cep>(`${this.apiUrl}/ceps/${cep}`);
  }
}
