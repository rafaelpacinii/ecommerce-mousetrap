import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

export function numeroCartao(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  const digits = value.replace(/[ -]/g, '');
  return /^[\d -]+$/.test(value) && /^\d{13,19}$/.test(digits) ? null : { numeroCartao: true };
}

export function validadeCartao(control: AbstractControl): ValidationErrors | null {
  const match = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.exec(String(control.value ?? ''));
  if (!match) return { validadeCartao: true };
  const year = Number(match[2]) + (match[2].length === 2 ? 2000 : 0);
  const now = new Date();
  return year * 12 + Number(match[1]) >= now.getFullYear() * 12 + now.getMonth() + 1
    ? null
    : { validadeCartao: true };
}

export function criarFormularioCartao() {
  return new FormGroup({
    numero: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, numeroCartao],
    }),
    titular: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(100),
        (control) =>
          /^[\p{L}\p{M}][\p{L}\p{M} '.-]{2,99}$/u.test(control.value.trim())
            ? null
            : { titular: true },
      ],
    }),
    validade: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validadeCartao],
    }),
    cvv: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{3,4}$/)],
    }),
  });
}

export type FormularioCartao = ReturnType<typeof criarFormularioCartao>;
