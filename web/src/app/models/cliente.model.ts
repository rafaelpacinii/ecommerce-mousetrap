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
