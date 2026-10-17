import { Frete } from './cliente.model';
export interface OpcaoPedido {
  id: number;
  label: string;
}
export interface ItemCheckout {
  idMouse: number;
  quantidade: number;
  precoEsperado?: number;
}
export interface CriarPedido {
  chaveCheckout: string;
  idEndereco: number;
  itens: ItemCheckout[];
  freteEsperado: number;
}
export interface CriarPagamento {
  chaveIdempotencia: string;
  forma: number;
  resultadoSimulado: number;
}
export interface EntregaPedido {
  destinatario: string;
  cep: string;
  logradouro: string;
  bairro: string;
  numero: string;
  complemento?: string;
  municipio: string;
  uf: string;
}
export interface ItemPedido {
  idMouse: number;
  sku: string;
  nome: string;
  marca: string;
  cor: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}
export interface Pagamento {
  id: number;
  chaveIdempotencia: string;
  forma: OpcaoPedido;
  status: OpcaoPedido;
  valor: number;
  processadoEm?: string;
}
export interface Pedido {
  id: number;
  chaveCheckout: string;
  status: OpcaoPedido;
  criadoEm: string;
  expiraEm: string;
  endereco: EntregaPedido;
  itens: ItemPedido[];
  subtotal: number;
  frete: number;
  prazoDiasUteis: number;
  total: number;
  pagamentos: Pagamento[];
}
export interface RevisaoPedido {
  endereco: EntregaPedido;
  itens: ItemPedido[];
  subtotal: number;
  frete: Frete;
  total: number;
}
export interface TentativaCheckout {
  criacao: CriarPedido;
  forma: number;
  pedidoId?: number;
  pagamento?: CriarPagamento;
}
