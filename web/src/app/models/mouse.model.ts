import { Marca } from './marca.model';

export interface TipoConexao {
  id: number;
  label: string;
}

export const TIPOS_CONEXAO: readonly TipoConexao[] = [
  { id: 1, label: 'USB' },
  { id: 2, label: 'Bluetooth' },
  { id: 3, label: 'Receptor USB sem fio' },
];

export interface Mouse {
  id?: number;
  sku: string;
  nome: string;
  descricao: string;
  cor: string;
  preco: number;
  quantidadeEstoque: number;
  dpiMaximo: number;
  quantidadeBotoes: number;
  pesoGramas: number;
  ativo: boolean;
  versao?: number;
  marca: Marca;
  tiposConexao: TipoConexao[];
}

export interface MouseDTO extends Omit<Mouse, 'marca' | 'tiposConexao' | 'id'> {
  idMarca: number;
  tiposConexao: number[];
}
