import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CatalogoFacetas, CatalogoFiltro, Produto } from '../models/catalogo.model';
import { PagedResponse } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8080/catalogo';

  findAll(filtro: CatalogoFiltro = {}) {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries({ page: 0, pageSize: 12, ...filtro })) {
      if (valor === undefined || valor === null || valor === '') continue;
      if (Array.isArray(valor))
        valor.forEach((item) => {
          params = params.append(chave, item);
        });
      else params = params.set(chave, String(valor));
    }
    return this.http.get<PagedResponse<Produto>>(`${this.api}/mouses`, { params });
  }

  findById(id: number) {
    return this.http.get<Produto>(`${this.api}/mouses/${id}`);
  }
  facetas() {
    return this.http.get<CatalogoFacetas>(`${this.api}/filtros`);
  }
}
