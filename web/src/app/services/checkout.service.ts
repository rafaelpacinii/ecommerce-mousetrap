import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AuthService } from './auth.service';
import { CarrinhoService } from './carrinho.service';
import { ItemCheckout, Pedido, RevisaoPedido, TentativaCheckout } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly carrinho = inject(CarrinhoService);
  private readonly url = `${inject(APP_SETTINGS).apiUrl}/pedidos`;
  private readonly memoria = signal({ subject: this.auth.subject(), value: this.ler() });
  readonly tentativa = computed(() =>
    this.memoria().subject === this.auth.subject() ? this.memoria().value : this.ler(),
  );

  configuracao() {
    return this.http.get<{ simulacaoHabilitada: boolean; prazoPagamentoMinutos: number }>(
      `${this.url}/configuracao`,
    );
  }
  revisar(idEndereco: number, itens: ItemCheckout[]) {
    return this.daConta(
      this.http.post<RevisaoPedido>(`${this.url}/revisao`, { idEndereco, itens }),
    );
  }

  confirmar(revisao: RevisaoPedido, idEndereco: number, forma: number): Observable<Pedido> {
    if (!this.tentativa())
      this.salvar({
        criacao: {
          chaveCheckout: crypto.randomUUID(),
          idEndereco,
          freteEsperado: revisao.frete.valorFrete,
          itens: revisao.itens.map((i) => ({
            idMouse: i.idMouse,
            quantidade: i.quantidade,
            precoEsperado: i.precoUnitario,
          })),
        },
        forma,
      });
    return this.recuperar();
  }

  retomarPedido(id: number): Observable<Pedido> {
    return this.daConta(this.http.get<Pedido>(`${this.url}/${id}`)).pipe(
      tap((pedido) => {
        const atual = this.tentativa();
        if (atual?.pedidoId === pedido.id) return;
        if (atual?.pagamento || (atual && !atual.pedidoId))
          throw new Error('Recupere a tentativa atual antes de abrir outro pedido.');
        this.salvar({
          pedidoId: pedido.id,
          forma: pedido.pagamentos.find((p) => p.status.id === 1)?.forma.id ?? 1,
        });
      }),
    );
  }
  recuperar(): Observable<Pedido> {
    const subject = this.auth.subject();
    const tentativa = this.tentativa();
    if (!tentativa) return throwError(() => new Error('Não há uma compra para recuperar.'));
    const request = tentativa.pedidoId
      ? this.http.get<Pedido>(`${this.url}/${tentativa.pedidoId}`)
      : this.http.post<Pedido>(this.url, tentativa.criacao);
    return this.daConta(request).pipe(
      tap((pedido) => {
        this.salvar({ ...tentativa, pedidoId: pedido.id });
        if (tentativa.criacao) this.carrinho.confirmarCompra(pedido.chaveCheckout, pedido.itens);
      }),
      catchError((erro) => {
        if (subject === this.auth.subject() && !tentativa.pedidoId && this.rejeicaoDefinitiva(erro))
          this.salvar(null);
        return throwError(() => erro);
      }),
    );
  }

  pagar(
    pedido: Pedido,
    resultado: number,
    forma = this.tentativa()?.forma ?? 1,
  ): Observable<Pedido> {
    const subject = this.auth.subject();
    const tentativa = this.tentativa();
    if (!tentativa?.pedidoId || tentativa.pedidoId !== pedido.id)
      return throwError(() => new Error('Recupere seu pedido antes de pagar.'));
    const pagamento = tentativa.pagamento ?? {
      chaveIdempotencia: crypto.randomUUID(),
      forma,
      resultadoSimulado: resultado,
    };
    this.salvar({ ...tentativa, forma: pagamento.forma, pagamento });
    return this.daConta(
      this.http.post<Pedido>(`${this.url}/${pedido.id}/pagamentos`, pagamento),
    ).pipe(
      tap((atualizado) => {
        // A failed or completed response is definitive; a network failure keeps the original payment key.
        if (
          atualizado.pagamentos.some((p) => p.chaveIdempotencia === pagamento.chaveIdempotencia) ||
          atualizado.status.id !== 1
        )
          this.salvar({ ...this.tentativa()!, pagamento: undefined });
      }),
      catchError((erro) => {
        if (subject === this.auth.subject() && this.rejeicaoDefinitiva(erro))
          this.salvar({ ...this.tentativa()!, pagamento: undefined });
        return throwError(() => erro);
      }),
    );
  }
  simular(pedidoId: number, pagamentoId: number, resultado: number) {
    return this.daConta(
      this.http.post<Pedido>(`${this.url}/${pedidoId}/pagamentos/${pagamentoId}/simular`, {
        resultado,
      }),
    );
  }
  cancelar(id: number) {
    return this.daConta(this.http.post<Pedido>(`${this.url}/${id}/cancelamento`, {}));
  }
  prepararCompra(): void {
    const atual = this.tentativa();
    if (this.carrinho.itens().length && atual?.pedidoId && !atual.pagamento) this.salvar(null);
  }

  private daConta<T>(request: Observable<T>): Observable<T> {
    const subject = this.auth.subject();
    return request.pipe(
      tap(() => {
        if (!subject || subject !== this.auth.subject())
          throw new Error('A conta mudou. Reabra o checkout para continuar.');
      }),
    );
  }

  private rejeicaoDefinitiva(erro: unknown): boolean {
    return erro instanceof HttpErrorResponse && [400, 404, 409, 422].includes(erro.status);
  }
  private chave(): string {
    const subject = this.auth.subject();
    if (!subject) throw new Error('Entre novamente para continuar sua compra.');
    return `mousetrap.checkout.${encodeURIComponent(subject)}`;
  }
  private salvar(tentativa: TentativaCheckout | null): void {
    try {
      if (tentativa) localStorage.setItem(this.chave(), JSON.stringify(tentativa));
      else localStorage.removeItem(this.chave());
    } catch {
      throw new Error(
        'Permita o armazenamento neste navegador para manter sua tentativa de compra e repeti-la com segurança.',
      );
    }
    this.memoria.set({ subject: this.auth.subject(), value: tentativa });
  }
  private ler(): TentativaCheckout | null {
    if (!this.auth.subject()) return null;
    try {
      const value = JSON.parse(
        localStorage.getItem(this.chave()) ?? 'null',
      ) as TentativaCheckout | null;
      if (!value) return null;
      const uuid = (v: unknown) =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const criacaoInvalida =
        value.criacao &&
        (!uuid(value.criacao.chaveCheckout) ||
          !Number.isSafeInteger(value.criacao.idEndereco) ||
          value.criacao.idEndereco < 1 ||
          !Array.isArray(value.criacao.itens) ||
          !value.criacao.itens.length ||
          value.criacao.itens.length > 100 ||
          !value.criacao.itens.every(
            (i) =>
              Number.isSafeInteger(i.idMouse) &&
              i.idMouse > 0 &&
              Number.isInteger(i.quantidade) &&
              i.quantidade > 0 &&
              i.quantidade <= 999 &&
              typeof i.precoEsperado === 'number' &&
              Number.isFinite(i.precoEsperado) &&
              i.precoEsperado > 0,
          ) ||
          !Number.isFinite(value.criacao.freteEsperado) ||
          value.criacao.freteEsperado < 0);
      if (
        criacaoInvalida ||
        (!value.criacao && !value.pedidoId) ||
        ![1, 2].includes(value.forma) ||
        (value.pedidoId != null && (!Number.isSafeInteger(value.pedidoId) || value.pedidoId < 1)) ||
        (value.pagamento &&
          (!uuid(value.pagamento.chaveIdempotencia) ||
            ![1, 2].includes(value.pagamento.forma) ||
            ![1, 2, 3].includes(value.pagamento.resultadoSimulado)))
      )
        return null;
      return value;
    } catch {
      return null;
    }
  }
}
