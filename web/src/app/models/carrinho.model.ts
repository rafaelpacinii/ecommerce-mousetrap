import { ImagemMouse } from './mouse.model';

export interface ItemCarrinho {
  idMouse: number;
  nome: string;
  marca: string;
  cor: string;
  precoUnitario: number;
  quantidade: number;
  quantidadeEstoque: number;
  imagem?: ImagemMouse | null;
  indisponivel?: boolean;
}

