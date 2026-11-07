import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_SETTINGS } from '../config/app-settings';
import { Estado } from '../models/estado.model';
import { Municipio } from '../models/municipio.model';

@Injectable({ providedIn: 'root' })
export class LocalidadeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(APP_SETTINGS).apiUrl;

  estados() {
    return this.http.get<Estado[]>(`${this.apiUrl}/localidades/estados`);
  }

  municipios(uf: string) {
    return this.http.get<Municipio[]>(
      `${this.apiUrl}/localidades/estados/${encodeURIComponent(uf)}/municipios`,
    );
  }
}
