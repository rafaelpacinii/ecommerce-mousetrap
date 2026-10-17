import { Mouse } from './mouse.model';
import { Marca } from './marca.model';

export type Produto = Omit<Mouse, 'ativo' | 'versao'>;
export type ProdutoCatalogo = Produto;
export interface CatalogoFiltro {
  nome?: string;
  marca?: number[];
  sensor?: string;
  conexao?: number[];
  pegada?: number[];
  pollingRateMin?: number;
  tipoSwitch?: number;
  pesoMax?: number;
  precoMin?: number;
  precoMax?: number;
  emEstoque?: boolean;
  ordenar?: string;
  page?: number;
  pageSize?: number;
}
export interface OpcaoCatalogo {
  id: number;
  label: string;
}
export interface CatalogoFacetas {
  marcas: Marca[];
  sensores: string[];
  pollingRates: number[];
  conexoes: OpcaoCatalogo[];
  pegadas: OpcaoCatalogo[];
  tiposSwitch: OpcaoCatalogo[];
}
export const PEGADAS: OpcaoCatalogo[] = [
  { id: 1, label: 'Palm' },
  { id: 2, label: 'Claw' },
  { id: 3, label: 'Fingertip' },
];
export const TIPOS_SWITCH: OpcaoCatalogo[] = [
  { id: 1, label: 'Óptico' },
  { id: 2, label: 'Mecânico' },
];
export const POLLING_RATES = [125, 250, 500, 1000, 2000, 4000, 8000];
export const ORDENACOES = [
  { valor: 'nome', label: 'Nome: A a Z' },
  { valor: 'menor-preco', label: 'Menor preço' },
  { valor: 'maior-preco', label: 'Maior preço' },
  { valor: 'menor-peso', label: 'Menor peso' },
  { valor: 'maior-dpi', label: 'Maior DPI' },
  { valor: 'recentes', label: 'Mais recentes' },
];
