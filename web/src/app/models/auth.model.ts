export interface UsuarioAutenticado {
  subject: string;
  nome: string;
  email: string;
  roles: string[];
  perfilCompleto: boolean;
}

export interface SessaoAuthResponse {
  accessToken: string;
  expiresIn: number;
  usuario: UsuarioAutenticado;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface CadastroPayload {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  codigoIbge?: string;
}
