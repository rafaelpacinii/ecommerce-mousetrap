import { Municipio } from './municipio.model';
export interface ClienteDTO {
  nome: string;
  email: string;
  cep: string;
  logradouro: string;
  bairro: string;
  numero: string;
  complemento: string;
}
export interface Cliente extends ClienteDTO {
  id?: number;
  municipio: Municipio;
}
export interface Cep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
}
export interface Frete {
  cep: string;
  localidade: string;
  uf: string;
  valorFrete: number;
  prazoDiasUteis: number;
}
export interface EnderecoDTO {
  apelido: string;
  destinatario?: string;
  cep: string;
  logradouro: string;
  bairro: string;
  numero: string;
  complemento: string;
  principal?: boolean;
}
export interface Endereco extends EnderecoDTO {
  id: number;
  destinatario: string;
  principal: boolean;
  municipio: Municipio;
}

