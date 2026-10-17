import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tap, finalize } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AuthService } from './auth.service';
import { Produto } from '../models/catalogo.model';
import { PagedResponse } from '../models/page-response.model';
import { mensagemErro } from './erro-api';
export interface Desejo {
  produto: Produto;
  disponivel: boolean;
}
@Injectable({ providedIn: 'root' })
export class DesejoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly url = `${inject(APP_SETTINGS).apiUrl}/desejos`;
  private readonly estado = signal<{ subject: string; ids: number[] }>({ subject: '', ids: [] });
  readonly ids = computed(() =>
    this.estado().subject === this.auth.subject() ? this.estado().ids : [],
  );
  private readonly idsCarregados = signal(false);
  readonly pendentes = signal<number[]>([]);
  readonly carregando = signal(false);
  constructor() {
    effect((onCleanup) => {
      const subject = this.auth.subject();
      this.estado.set({ subject, ids: [] });
      this.idsCarregados.set(false);
      this.pendentes.set([]);
      this.carregando.set(!!subject);
      if (!subject) return;
      const request = this.http.get<number[]>(`${this.url}/ids`).subscribe({
        next: (ids) => {
          if (this.auth.subject() === subject) {
            this.estado.set({ subject, ids });
            this.idsCarregados.set(true);
            this.carregando.set(false);
          }
        },
        error: () => {
          if (this.auth.subject() === subject) this.carregando.set(false);
        },
      });
      onCleanup(() => request.unsubscribe());
    });
  }
  listar(page = 0, pageSize = 12) {
    const subject = this.auth.subject();
    return this.http.get<PagedResponse<Desejo>>(this.url, { params: { page, pageSize } }).pipe(
      tap((pagina) => {
        if (subject !== this.auth.subject()) throw new Error('A conta mudou. Reabra sua lista.');
        if (!this.idsCarregados())
          this.estado.update((s) => ({
            subject,
            ids: [...new Set([...s.ids, ...pagina.items.map((d) => d.produto.id)])],
          }));
      }),
    );
  }
  alternar(id: number) {
    const subject = this.auth.subject();
    if (!subject) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.carregando() || this.pendentes().includes(id)) return;
    const remover = this.ids().includes(id);
    this.pendentes.update((ids) => [...ids, id]);
    (remover ? this.http.delete(`${this.url}/${id}`) : this.http.put(`${this.url}/${id}`, {}))
      .pipe(
        finalize(() => {
          if (this.auth.subject() === subject)
            this.pendentes.update((ids) => ids.filter((v) => v !== id));
        }),
      )
      .subscribe({
        next: () => {
          if (this.auth.subject() !== subject) return;
          this.estado.update((s) => ({
            subject,
            ids: remover ? s.ids.filter((v) => v !== id) : [...s.ids, id],
          }));
          this.snack.open(
            remover
              ? 'Produto removido da lista de desejos.'
              : 'Produto salvo na lista de desejos.',
            'Fechar',
            { duration: 3000 },
          );
        },
        error: (e) => {
          if (this.auth.subject() === subject)
            this.snack.open(mensagemErro(e), 'Fechar', { duration: 5000 });
        },
      });
  }
}
