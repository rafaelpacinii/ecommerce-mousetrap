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
  versao?: number;
  transportadora?: string;
  codigoRastreio?: string;
  enviadoEm?: string;
  entregueEm?: string;
  eventos?: EventoPedido[];
}
export interface RevisaoPedido {
  endereco: EntregaPedido;
  itens: ItemPedido[];
  subtotal: number;
  frete: Frete;
  total: number;
}
export interface TentativaCheckout {
  criacao?: CriarPedido;
  forma: number;
  pedidoId?: number;
  pagamento?: CriarPagamento;
}

export interface EventoPedido {
  status: OpcaoPedido;
  ocorridoEm: string;
  descricao: string;
}
export interface ResumoPedido {
  id: number;
  cliente: string;
  email: string;
  criadoEm: string;
  status: OpcaoPedido;
  total: number;
}
export interface PedidoAdmin {
  pedido: Pedido;
  idCliente: number;
  cliente: string;
  email: string;
}
export interface IndicadoresPedido {
  faturamentoMes: number;
  pedidosPendentes: number;
  mousesAtivos: number;
  clientesCadastrados: number;
  inicioMes: string;
  fimMes: string;
}
export const STATUS_PEDIDO = [
  { id: 1, label: 'Aguardando pagamento' },
  { id: 2, label: 'Pago' },
  { id: 3, label: 'Enviado' },
  { id: 4, label: 'Entregue' },
  { id: 5, label: 'Cancelado' },
  { id: 6, label: 'Expirado' },
];
export function dataPedido(value?: string): string {
  return value
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '—';
}
