import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';

@Injectable({ providedIn: 'root' })
export class ImagemUploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(APP_SETTINGS).apiUrl;

  enviar(destino: 'mouses' | 'marcas', arquivo: File) {
    const dados = new FormData();
    dados.append('arquivo', arquivo);
    return this.http.post<{ url: string }>(`${this.apiUrl}/imagens/${destino}`, dados);
  }
}
