import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, forkJoin, map, Observable, of, tap, throwError } from 'rxjs';
import { ProdutoCatalogo } from '../models/catalogo.model';
import { ItemCarrinho } from '../models/carrinho.model';
import { Frete } from '../models/cliente.model';
import { CatalogoService } from './catalogo.service';
import { mensagemErro } from './erro-api';

const STORAGE_CARRINHO = 'mousetrap.carrinho';
const STORAGE_FRETE = 'mousetrap.frete';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private readonly catalogoService = inject(CatalogoService);

  private comprasConfirmadas: string[] = [];

  readonly avisos = signal<string[]>([]);
  readonly revalidando = signal(false);
  readonly erroRevalidacao = signal('');
  readonly itens = signal<ItemCarrinho[]>(this.carregarItens());
  readonly frete = signal<Frete | null>(this.carregarFrete());

  readonly quantidadeTotal = computed(() =>
    this.itens().reduce((soma, item) => soma + item.quantidade, 0),
  );

  readonly itensDisponiveis = computed(() =>
    this.itens().filter((item) => !item.indisponivel && item.quantidadeEstoque > 0),
  );

  readonly possuiIndisponiveis = computed(() =>
    this.itens().some((item) => !!item.indisponivel || item.quantidadeEstoque <= 0),
  );

  readonly subtotal = computed(() =>
    this.itensDisponiveis().reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0),
  );

  readonly valorFrete = computed(() =>
    this.itensDisponiveis().length > 0 ? (this.frete()?.valorFrete ?? 0) : 0,
  );

  readonly totalEstimado = computed(() => this.subtotal() + this.valorFrete());

  adicionar(produto: ProdutoCatalogo, quantidade = 1): boolean {
    const qtdAdicionar = Math.floor(quantidade);
    if (!produto?.id || produto.quantidadeEstoque <= 0 || qtdAdicionar < 1) {
      return false;
    }
    const capa = [...(produto.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0] ?? null;
    const lista = [...this.itens()];
    const indice = lista.findIndex((i) => i.idMouse === produto.id);

    if (indice >= 0) {
      const atual = lista[indice];
      const novaQuantidade = Math.min(atual.quantidade + qtdAdicionar, produto.quantidadeEstoque);
      lista[indice] = {
        idMouse: produto.id,
        nome: produto.nome,
        marca: produto.marca.nome,
        cor: produto.cor,
        precoUnitario: produto.preco,
        quantidade: novaQuantidade,
        quantidadeEstoque: produto.quantidadeEstoque,
        imagem: capa,
        indisponivel: false,
      };
    } else {
      lista.push({
        idMouse: produto.id,
        nome: produto.nome,
        marca: produto.marca.nome,
        cor: produto.cor,
        precoUnitario: produto.preco,
        quantidade: Math.min(qtdAdicionar, produto.quantidadeEstoque),
        quantidadeEstoque: produto.quantidadeEstoque,
        imagem: capa,
        indisponivel: false,
      });
    }
    this.atualizarItens(lista);
    return true;
  }

  atualizarQuantidade(idMouse: number, quantidade: number): void {
    const qtd = Math.floor(quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      this.remover(idMouse);
      return;
    }
    const lista = this.itens().map((item) => {
      if (item.idMouse !== idMouse) return item;
      const teto = item.quantidadeEstoque > 0 ? item.quantidadeEstoque : qtd;
      return { ...item, quantidade: Math.min(qtd, teto) };
    });
    this.atualizarItens(lista);
  }

  remover(idMouse: number): void {
    this.atualizarItens(this.itens().filter((item) => item.idMouse !== idMouse));
  }

  removerIndisponiveis(): void {
    this.atualizarItens(
      this.itens().filter((item) => !item.indisponivel && item.quantidadeEstoque > 0),
    );
  }

  limpar(): void {
    this.avisos.set([]);
    this.erroRevalidacao.set('');
    this.atualizarItens([]);
  }

  definirFrete(cotacao: Frete | null): void {
    this.frete.set(cotacao);
    try {
      if (cotacao) {
        localStorage.setItem(STORAGE_FRETE, JSON.stringify(cotacao));
      } else {
        localStorage.removeItem(STORAGE_FRETE);
      }
    } catch {
      // Storage indisponível
    }
  }

  revalidar(): Observable<void> {
    const atuais = this.itens();
    this.erroRevalidacao.set('');
    if (atuais.length === 0) {
      this.avisos.set([]);
      return of(void 0);
    }
    this.revalidando.set(true);
    const novosAvisos: string[] = [];

    const consultas = atuais.map((item) =>
      this.catalogoService.findById(item.idMouse).pipe(
        map((produto): ItemCarrinho => {
          const capa = [...(produto.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0] ?? null;
          if (Math.abs(produto.preco - item.precoUnitario) >= 0.005) {
            novosAvisos.push(
              `O preço de ${produto.nome} foi atualizado de ${formatarMoeda(item.precoUnitario)} para ${formatarMoeda(produto.preco)}.`,
            );
          }
          if (produto.quantidadeEstoque <= 0) {
            novosAvisos.push(`${produto.nome} está sem estoque no momento.`);
            return {
              ...item,
              nome: produto.nome,
              marca: produto.marca.nome,
              cor: produto.cor,
              precoUnitario: produto.preco,
              quantidadeEstoque: 0,
              imagem: capa,
              indisponivel: true,
            };
          }
          let quantidade = item.quantidade;
          if (quantidade > produto.quantidadeEstoque) {
            quantidade = produto.quantidadeEstoque;
            novosAvisos.push(
              `A quantidade de ${produto.nome} foi ajustada para ${quantidade} conforme o estoque disponível.`,
            );
          }
          return {
            idMouse: produto.id ?? item.idMouse,
            nome: produto.nome,
            marca: produto.marca.nome,
            cor: produto.cor,
            precoUnitario: produto.preco,
            quantidade,
            quantidadeEstoque: produto.quantidadeEstoque,
            imagem: capa,
            indisponivel: false,
          };
        }),
        catchError((erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 404) {
            novosAvisos.push(`${item.nome} não está mais disponível no catálogo.`);
            return of<ItemCarrinho>({
              ...item,
              quantidadeEstoque: 0,
              indisponivel: true,
            });
          }
          return throwError(() => erro);
        }),
      ),
    );

    return forkJoin(consultas).pipe(
      tap({
        next: (revalidados) => {
          this.atualizarItens(revalidados);
          this.avisos.set(novosAvisos);
        },
        error: (erro: unknown) => {
          this.erroRevalidacao.set(mensagemErro(erro));
        },
      }),
      map(() => void 0),
      finalize(() => this.revalidando.set(false)),
    );
  }

  confirmarCompra(
    chave: string,
    itens: ReadonlyArray<{ idMouse: number; quantidade: number }>,
  ): void {
    const atuais = this.carregarItens();
    if (this.comprasConfirmadas.includes(chave)) {
      this.itens.set(atuais);
      return;
    }
    const comprados = new Map(itens.map((item) => [item.idMouse, item.quantidade]));
    const restantes = atuais
      .map((item) => ({
        ...item,
        quantidade: Math.max(0, item.quantidade - (comprados.get(item.idMouse) ?? 0)),
      }))
      .filter((item) => item.quantidade > 0);
    const confirmacoes = [...this.comprasConfirmadas, chave].slice(-100);
    // One storage write records the cart and its receipt together, so a repeated response cannot subtract twice.
    localStorage.setItem(
      STORAGE_CARRINHO,
      JSON.stringify({ itens: restantes, comprasConfirmadas: confirmacoes }),
    );
    this.comprasConfirmadas = confirmacoes;
    this.itens.set(restantes);
  }

  private salvarEstado(itens: ItemCarrinho[]): void {
    if (this.comprasConfirmadas.length) {
      localStorage.setItem(
        STORAGE_CARRINHO,
        JSON.stringify({ itens, comprasConfirmadas: this.comprasConfirmadas }),
      );
    } else if (itens.length) {
      localStorage.setItem(STORAGE_CARRINHO, JSON.stringify(itens));
    } else {
      localStorage.removeItem(STORAGE_CARRINHO);
    }
  }

  private atualizarItens(lista: ItemCarrinho[]): void {
    this.itens.set(lista);
    try {
      this.salvarEstado(lista);
    } catch {
      // Storage indisponível
    }
  }

  private carregarItens(): ItemCarrinho[] {
    this.comprasConfirmadas = [];
    try {
      const bruto = localStorage.getItem(STORAGE_CARRINHO);
      if (!bruto) return [];
      let parseado: unknown = JSON.parse(bruto);
      if (parseado && typeof parseado === 'object' && !Array.isArray(parseado)) {
        const estado = parseado as Record<string, unknown>;
        if (Array.isArray(estado['itens']) && Array.isArray(estado['comprasConfirmadas'])) {
          this.comprasConfirmadas = estado['comprasConfirmadas']
            .filter((v): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v))
            .slice(-100);
          parseado = estado['itens'];
        }
      }
      if (!Array.isArray(parseado)) {
        localStorage.removeItem(STORAGE_CARRINHO);
        this.avisos.set(['Os dados salvos do carrinho eram inválidos e foram reiniciados.']);
        return [];
      }
      const mapa = new Map<number, ItemCarrinho>();
      let descartouInvalido = false;

      for (const entrada of parseado) {
        if (!entrada || typeof entrada !== 'object') {
          descartouInvalido = true;
          continue;
        }
        const registro = entrada as Record<string, unknown>;
        const idMouse = Number(registro['idMouse']);
        const quantidade = Math.floor(Number(registro['quantidade']));
        const precoUnitario = Number(registro['precoUnitario']);
        const quantidadeEstoque = Number(registro['quantidadeEstoque'] ?? 99);
        const nome = typeof registro['nome'] === 'string' ? registro['nome'].trim() : '';
        const marca = typeof registro['marca'] === 'string' ? registro['marca'].trim() : '';
        const cor = typeof registro['cor'] === 'string' ? registro['cor'].trim() : '';

        if (
          !Number.isInteger(idMouse) ||
          idMouse <= 0 ||
          !Number.isFinite(quantidade) ||
          quantidade < 1 ||
          !Number.isFinite(precoUnitario) ||
          precoUnitario < 0 ||
          !nome
        ) {
          descartouInvalido = true;
          continue;
        }

        const existente = mapa.get(idMouse);
        const estoqueSeguro =
          Number.isFinite(quantidadeEstoque) && quantidadeEstoque >= 0
            ? Math.floor(quantidadeEstoque)
            : quantidade;
        const teto = estoqueSeguro > 0 ? estoqueSeguro : quantidade;

        if (existente) {
          existente.quantidade = Math.min(existente.quantidade + quantidade, teto);
        } else {
          mapa.set(idMouse, {
            idMouse,
            nome,
            marca: marca || 'MouseTrap',
            cor,
            precoUnitario,
            quantidade: Math.min(quantidade, teto),
            quantidadeEstoque: estoqueSeguro,
            imagem:
              registro['imagem'] && typeof registro['imagem'] === 'object'
                ? (registro['imagem'] as ItemCarrinho['imagem'])
                : null,
            indisponivel: Boolean(registro['indisponivel']),
          });
        }
      }

      const resultado = [...mapa.values()];
      if (descartouInvalido) {
        this.avisos.set([
          'Alguns itens inválidos salvos anteriormente foram removidos do carrinho.',
        ]);
        this.salvarEstado(resultado);
      }
      return resultado;
    } catch {
      try {
        localStorage.removeItem(STORAGE_CARRINHO);
      } catch {
        // Ignora erro de escrita
      }
      this.avisos.set(['Não foi possível ler o carrinho salvo anteriormente.']);
      return [];
    }
  }

  private carregarFrete(): Frete | null {
    try {
      const bruto = localStorage.getItem(STORAGE_FRETE);
      if (!bruto) return null;
      const parseado = JSON.parse(bruto) as Partial<Frete>;
      if (
        typeof parseado?.cep === 'string' &&
        /^[0-9]{8}$/.test(parseado.cep) &&
        typeof parseado?.localidade === 'string' &&
        typeof parseado?.uf === 'string' &&
        typeof parseado?.valorFrete === 'number' &&
        Number.isFinite(parseado.valorFrete) &&
        parseado.valorFrete >= 0 &&
        typeof parseado?.prazoDiasUteis === 'number'
      ) {
        return parseado as Frete;
      }
      localStorage.removeItem(STORAGE_FRETE);
      return null;
    } catch {
      return null;
    }
  }
}
