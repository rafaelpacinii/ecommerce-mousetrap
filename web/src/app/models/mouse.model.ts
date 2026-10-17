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

export interface ImagemMouse {
  id?: number;
  url: string;
  textoAlternativo: string;
  ordem: number;
}
export interface EspecificacoesMouse {
  sensor?: string | null;
  pollingRate?: number | null;
  tipoSwitch?: TipoConexao | null;
  modeloSwitch?: string | null;
  pegadas: TipoConexao[];
}
export interface EspecificacoesMouseDTO extends Omit<
  EspecificacoesMouse,
  'tipoSwitch' | 'pegadas'
> {
  tipoSwitch?: number | null;
  pegadas: number[];
}

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
  especificacoes?: EspecificacoesMouse;
  imagens?: ImagemMouse[];
  marca: Marca;
  tiposConexao: TipoConexao[];
}

export interface MouseDTO extends Omit<Mouse, 'marca' | 'tiposConexao' | 'id' | 'especificacoes'> {
  especificacoes?: EspecificacoesMouseDTO;
  idMarca: number;
  tiposConexao: number[];
}
