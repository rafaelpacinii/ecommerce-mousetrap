import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function mensagemErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0)
      return 'Não foi possível conectar à API. Verifique se ela está em execução.';
    const problema = erro.error;
    if (problema?.errors?.length) {
      return problema.errors.map((item: { message: string }) => item.message).join(' ');
    }
    if (typeof problema?.detail === 'string') return problema.detail;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function textoObrigatorio(controle: AbstractControl): ValidationErrors | null {
  return typeof controle.value === 'string' && controle.value.trim().length > 0
    ? null
    : { required: true };
}
